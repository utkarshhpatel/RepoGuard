#!/usr/bin/env bash
# =====================================================================
# RepoGuard Status Diagnostic Script
# Reports status of the backend service, ports, and Ollama connection
# =====================================================================

STATE_DIR="${XDG_STATE_HOME:-$HOME/.local/state}/repoguard"
PID_FILE="${STATE_DIR}/repoguard.pid"
LOG_FILE="${STATE_DIR}/repoguard.log"

echo "=== RepoGuard System Status ==="

# 1. Process Check
if [[ -f "${PID_FILE}" ]]; then
  PID=$(cat "${PID_FILE}" 2>/dev/null || true)
  if [[ -n "${PID}" ]] && kill -0 "${PID}" 2>/dev/null; then
    echo "Service Status:  RUNNING (PID: ${PID})"
  else
    echo "Service Status:  STOPPED (Stale PID file: ${PID})"
  fi
else
  ORPHAN_PID=$(pgrep -f "uvicorn backend.app.main:app" 2>/dev/null | head -n 1 || true)
  if [[ -n "${ORPHAN_PID}" ]]; then
    echo "Service Status:  RUNNING without PID file (PID: ${ORPHAN_PID})"
  else
    echo "Service Status:  STOPPED"
  fi
fi

# 2. Port 8000 Health Check
if curl -s -f --connect-timeout 2 http://127.0.0.1:8000/api/health >/dev/null 2>&1; then
  echo "Backend API:     HEALTHY (http://127.0.0.1:8000)"
else
  echo "Backend API:     UNREACHABLE / OFFLINE"
fi

# 3. Ollama Connectivity Check
OLLAMA_RES=$(curl -s --connect-timeout 2 http://127.0.0.1:11434/api/tags 2>/dev/null || true)
if [[ -n "${OLLAMA_RES}" ]]; then
  echo "Ollama Service:  ONLINE (http://127.0.0.1:11434)"
else
  echo "Ollama Service:  OFFLINE (RepoGuard runs in Deterministic Demo Mode)"
fi

# 4. Log summary
if [[ -f "${LOG_FILE}" ]]; then
  echo "Log Location:    ${LOG_FILE}"
  echo "--- Recent Log Output ---"
  tail -n 5 "${LOG_FILE}"
fi
echo "==============================="
