#!/usr/bin/env bash
# =====================================================================
# RepoGuard Process Shutdown Script
# Gracefully stops running RepoGuard backend services
# =====================================================================

set -eo pipefail

STATE_DIR="${XDG_STATE_HOME:-$HOME/.local/state}/repoguard"
PID_FILE="${STATE_DIR}/repoguard.pid"

STOPPED=0

# 1. Stop by PID file
if [[ -f "${PID_FILE}" ]]; then
  PID=$(cat "${PID_FILE}" 2>/dev/null || true)
  if [[ -n "${PID}" ]] && kill -0 "${PID}" 2>/dev/null; then
    echo "[RepoGuard] Sending graceful termination signal to PID ${PID}..."
    kill -TERM "${PID}" 2>/dev/null || true

    # Wait up to 3 seconds
    for i in {1..6}; do
      if ! kill -0 "${PID}" 2>/dev/null; then
        break
      fi
      sleep 0.5
    done

    # Force kill if still running
    if kill -0 "${PID}" 2>/dev/null; then
      echo "[RepoGuard] Force terminating PID ${PID}..."
      kill -KILL "${PID}" 2>/dev/null || true
    fi
    STOPPED=1
  fi
  rm -f "${PID_FILE}"
fi

# 2. Safety check: Terminate any orphan uvicorn instances on port 8000
ORPHAN_PIDS=$(pgrep -f "uvicorn backend.app.main:app" 2>/dev/null || true)
if [[ -n "${ORPHAN_PIDS}" ]]; then
  for p in ${ORPHAN_PIDS}; do
    echo "[RepoGuard] Stopping process ${p}..."
    kill -TERM "${p}" 2>/dev/null || true
    sleep 0.5
    if kill -0 "${p}" 2>/dev/null; then
      kill -KILL "${p}" 2>/dev/null || true
    fi
    STOPPED=1
  done
fi

if [[ ${STOPPED} -eq 1 ]]; then
  echo "[RepoGuard] Service successfully stopped."
else
  echo "[RepoGuard] No running RepoGuard instances found."
fi
