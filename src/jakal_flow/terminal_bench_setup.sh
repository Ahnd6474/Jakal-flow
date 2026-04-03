#!/bin/bash
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

repo_url="${JAKAL_FLOW_GIT_URL:-https://github.com/Ahnd6474/Jakal-flow.git}"
repo_ref="${JAKAL_FLOW_GIT_REF:-main}"
install_root="/opt/jakal-flow"
use_local_source="false"

if [ -d "${repo_url}" ] && [ -f "${repo_url}/pyproject.toml" ]; then
  use_local_source="true"
fi

need_apt_update="false"
apt_packages=()

if ! command -v curl >/dev/null 2>&1; then
  apt_packages+=(curl)
fi

if [ "${use_local_source}" != "true" ] && ! command -v git >/dev/null 2>&1; then
  apt_packages+=(git)
fi

if [ "${#apt_packages[@]}" -gt 0 ]; then
  apt-get update
  apt-get install -y "${apt_packages[@]}"
  need_apt_update="true"
fi

if ! command -v node >/dev/null 2>&1; then
  if [ "${need_apt_update}" != "true" ]; then
    apt-get update
  fi
  apt-get install -y ca-certificates gnupg apt-transport-https
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi

if ! command -v codex >/dev/null 2>&1; then
  npm install -g @openai/codex
fi

rm -rf "${install_root}"
if [ "${use_local_source}" = "true" ]; then
  cp -a "${repo_url}" "${install_root}"
  python3 -m pip install --break-system-packages -e "${install_root}"
else
  git clone --depth 1 --branch "${repo_ref}" "${repo_url}" "${install_root}"
  python3 -m pip install --break-system-packages -e "${install_root}"
fi
