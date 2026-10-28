#!/usr/bin/env bash
# =====================================================================
# RepoGuard Desktop Installation Script for Pop!_OS / Linux
# Installs application menu entry and high-res icons (no sudo required)
# =====================================================================

set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "=== Installing RepoGuard Desktop Application ==="

# 1. Ensure scripts are executable
chmod +x "${PROJECT_ROOT}"/scripts/*.sh
echo "✓ Ensured scripts in scripts/ are executable."

# 2. Generate or verify PNG icons
if [[ ! -f "${PROJECT_ROOT}/frontend/public/icons/icon-512.png" ]]; then
  echo "Generating application icons..."
  python3 "${PROJECT_ROOT}/scripts/generate_png_icons.py"
fi

# 3. Build production frontend assets
echo "Verifying production frontend build..."
(cd "${PROJECT_ROOT}/frontend" && npm run build)
echo "✓ Production frontend assets ready in frontend/dist."

# 4. Prepare local XDG directories (user space, zero sudo required)
APPS_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/applications"
ICONS_512_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/icons/hicolor/512x512/apps"
ICONS_SCALABLE_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/icons/hicolor/scalable/apps"
STATE_DIR="${XDG_STATE_HOME:-$HOME/.local/state}/repoguard"

mkdir -p "${APPS_DIR}" "${ICONS_512_DIR}" "${ICONS_SCALABLE_DIR}" "${STATE_DIR}"

# 5. Copy icons to system icon themes
cp -f "${PROJECT_ROOT}/frontend/public/icons/icon-512.png" "${ICONS_512_DIR}/repoguard.png"
cp -f "${PROJECT_ROOT}/frontend/public/icons/icon.svg" "${ICONS_SCALABLE_DIR}/repoguard.svg"
echo "✓ Installed application icons to ~/.local/share/icons/hicolor/."

# 6. Generate and install .desktop entry
DESKTOP_FILE="${APPS_DIR}/repoguard.desktop"
cat <<EOF > "${DESKTOP_FILE}"
[Desktop Entry]
Version=1.0
Type=Application
Name=RepoGuard
GenericName=AI Code Reviewer
Comment=Local-first AI code review assistant powered by Ollama
Exec=${PROJECT_ROOT}/scripts/launch.sh
Icon=repoguard
Terminal=false
Categories=Development;Utility;
StartupWMClass=repoguard
Keywords=code;review;git;diff;ai;ollama;
Actions=Stop;Status;

[Desktop Action Stop]
Name=Stop RepoGuard Service
Exec=${PROJECT_ROOT}/scripts/stop.sh

[Desktop Action Status]
Name=Check RepoGuard Status
Exec=${PROJECT_ROOT}/scripts/status.sh
EOF

chmod +x "${DESKTOP_FILE}"
# Keep a repository copy as well
cp -f "${DESKTOP_FILE}" "${PROJECT_ROOT}/scripts/repoguard.desktop"
echo "✓ Installed desktop entry to ${DESKTOP_FILE}."

# 7. Update desktop database caches if available
if command -v update-desktop-database >/dev/null 2>&1; then
  update-desktop-database "${APPS_DIR}" >/dev/null 2>&1 || true
fi

if command -v gtk-update-icon-cache >/dev/null 2>&1; then
  gtk-update-icon-cache -f -t "${XDG_DATA_HOME:-$HOME/.local/share}/icons/hicolor" >/dev/null 2>&1 || true
fi

echo ""
echo "🎉 RepoGuard is now installed in your Pop!_OS Applications menu!"
echo ""
echo "How to use:"
echo "  • Open from Pop!_OS Applications menu: Search 'RepoGuard'"
echo "  • Or launch from terminal:           ${PROJECT_ROOT}/scripts/launch.sh"
echo "  • Check service status:              ${PROJECT_ROOT}/scripts/status.sh"
echo "  • Stop service:                      ${PROJECT_ROOT}/scripts/stop.sh"
echo "  • Uninstall launcher:                ${PROJECT_ROOT}/scripts/uninstall-desktop.sh"
echo ""
