#!/usr/bin/env bash
# =====================================================================
# RepoGuard Desktop Uninstaller Script
# Removes .desktop launcher and icons from user application directories
# =====================================================================

set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "=== Uninstalling RepoGuard Desktop Launcher ==="

# 1. Stop any running background service
"${PROJECT_ROOT}/scripts/stop.sh" || true

# 2. Paths
APPS_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/applications"
ICONS_512="${XDG_DATA_HOME:-$HOME/.local/share}/icons/hicolor/512x512/apps/repoguard.png"
ICONS_SCALABLE="${XDG_DATA_HOME:-$HOME/.local/share}/icons/hicolor/scalable/apps/repoguard.svg"
DESKTOP_FILE="${APPS_DIR}/repoguard.desktop"

# 3. Remove desktop entry and icons
if [[ -f "${DESKTOP_FILE}" ]]; then
  rm -f "${DESKTOP_FILE}"
  echo "✓ Removed ${DESKTOP_FILE}"
fi

if [[ -f "${ICONS_512}" ]]; then
  rm -f "${ICONS_512}"
  echo "✓ Removed ${ICONS_512}"
fi

if [[ -f "${ICONS_SCALABLE}" ]]; then
  rm -f "${ICONS_SCALABLE}"
  echo "✓ Removed ${ICONS_SCALABLE}"
fi

# 4. Refresh desktop database
if command -v update-desktop-database >/dev/null 2>&1; then
  update-desktop-database "${APPS_DIR}" >/dev/null 2>&1 || true
fi

echo "✓ Uninstalled RepoGuard launcher from Applications menu."
echo "Note: Your project code and git repository at ${PROJECT_ROOT} remain intact."
