#!/usr/bin/env bash
# =====================================================================
# RepoGuard Desktop Launcher for Pop!_OS / Linux
# Launches the FastAPI production backend & opens dedicated app window
# =====================================================================

set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

STATE_DIR="${XDG_STATE_HOME:-$HOME/.local/state}/repoguard"
LOG_DIR="${STATE_DIR}"
PID_FILE="${STATE_DIR}/repoguard.pid"
LOG_FILE="${LOG_DIR}/repoguard.log"

mkdir -p "${STATE_DIR}" "${LOG_DIR}"

VENV_UVICORN="${PROJECT_ROOT}/.venv/bin/uvicorn"
VENV_PYTHON="${PROJECT_ROOT}/.venv/bin/python3"

# 1. Check Python virtual environment
if [[ ! -x "${VENV_UVICORN}" ]]; then
  echo "[RepoGuard] Error: Virtual environment not found at ${PROJECT_ROOT}/.venv"
  echo "            Please set up the environment first:"
  echo "            python3 -m venv ${PROJECT_ROOT}/.venv && source ${PROJECT_ROOT}/.venv/bin/activate && pip install -r ${PROJECT_ROOT}/backend/requirements.txt"
  exit 1
fi

# 2. Check if frontend dist build exists
if [[ ! -d "${PROJECT_ROOT}/frontend/dist" || ! -f "${PROJECT_ROOT}/frontend/dist/index.html" ]]; then
  echo "[RepoGuard] Building production frontend assets..."
  (cd "${PROJECT_ROOT}/frontend" && npm run build >> "${LOG_FILE}" 2>&1)
fi

# 3. Check Ollama availability (Advisory check, RepoGuard has Demo fallback)
if curl -s -f --connect-timeout 2 http://127.0.0.1:11434/api/tags >/dev/null 2>&1; then
  echo "[RepoGuard] Ollama service detected on 127.0.0.1:11434 (Ready for live AI reviews)."
else
  echo "[RepoGuard] Notice: Ollama service not detected on 127.0.0.1:11434."
  echo "            RepoGuard will run with Deterministic Demo Mode available."
  echo "            (Start Ollama with 'ollama serve' anytime for on-device AI reviews)."
fi

# 4. Check if backend is already running and healthy
IS_RUNNING=0
if curl -s -f --connect-timeout 2 http://127.0.0.1:8000/api/health >/dev/null 2>&1; then
  echo "[RepoGuard] Backend service is already running on http://127.0.0.1:8000."
  IS_RUNNING=1
fi

if [[ ${IS_RUNNING} -eq 0 ]]; then
  # Check if port 8000 is occupied by an alien process
  PORT_OCCUPIED=0
  if command -v lsof >/dev/null 2>&1; then
    if lsof -i :8000 -sTCP:LISTEN >/dev/null 2>&1; then
      PORT_OCCUPIED=1
    fi
  elif command -v ss >/dev/null 2>&1; then
    if ss -tulpn | grep -q ':8000 '; then
      PORT_OCCUPIED=1
    fi
  fi

  if [[ ${PORT_OCCUPIED} -eq 1 ]]; then
    echo "[RepoGuard] Error: Port 8000 is already in use by another non-RepoGuard process."
    echo "            Please free port 8000 before launching RepoGuard."
    exit 1
  fi

  echo "[RepoGuard] Starting RepoGuard backend service on 127.0.0.1:8000..."
  setsid "${VENV_UVICORN}" backend.app.main:app --host 127.0.0.1 --port 8000 </dev/null >> "${LOG_FILE}" 2>&1 &
  BACKEND_PID=$!
  disown "${BACKEND_PID}" 2>/dev/null || true
  echo "${BACKEND_PID}" > "${PID_FILE}"

  # 5. Wait for readiness
  READY=0
  for i in {1..20}; do
    if curl -s -f http://127.0.0.1:8000/api/health >/dev/null 2>&1; then
      READY=1
      break
    fi
    sleep 0.5
  done

  if [[ ${READY} -ne 1 ]]; then
    echo "[RepoGuard] Error: Service failed to start within 10 seconds."
    echo "--- Last 20 lines of log (${LOG_FILE}) ---"
    tail -n 20 "${LOG_FILE}" || true
    exit 1
  fi

  echo "[RepoGuard] Service successfully initialized (PID: ${BACKEND_PID})."
fi

# 6. Launch Dedicated Desktop App Window
APP_URL="http://127.0.0.1:8000"
BROWSER_LAUNCHED=0

# Check Chromium-based browsers for standalone app window mode
CANDIDATE_BROWSERS=(
  "google-chrome-stable"
  "google-chrome"
  "chromium"
  "chromium-browser"
  "brave-browser"
  "brave"
  "microsoft-edge-stable"
  "microsoft-edge"
)

for b in "${CANDIDATE_BROWSERS[@]}"; do
  BIN_PATH=$(which "${b}" 2>/dev/null || true)
  if [[ -n "${BIN_PATH}" && -x "${BIN_PATH}" ]]; then
    echo "[RepoGuard] Opening standalone app window via ${b}..."
    setsid "${BIN_PATH}" --app="${APP_URL}" --name="RepoGuard" --class="repoguard" </dev/null >/dev/null 2>&1 &
    BROWSER_PID=$!
    disown "${BROWSER_PID}" 2>/dev/null || true
    BROWSER_LAUNCHED=1
    break
  fi
done

# Fallback to standard system browser via xdg-open
if [[ ${BROWSER_LAUNCHED} -eq 0 ]]; then
  if command -v xdg-open >/dev/null 2>&1; then
    echo "[RepoGuard] Opening in default web browser..."
    setsid xdg-open "${APP_URL}" </dev/null >/dev/null 2>&1 &
    BROWSER_PID=$!
    disown "${BROWSER_PID}" 2>/dev/null || true
    BROWSER_LAUNCHED=1
  else
    echo "[RepoGuard] Ready! Open ${APP_URL} in your browser."
  fi
fi

echo "[RepoGuard] Application launched successfully."
