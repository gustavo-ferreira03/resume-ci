#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"
root="$(cd .. && pwd)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

if ! command -v bun >/dev/null 2>&1; then
  curl -fsSL https://bun.sh/install | bash
  export PATH="$HOME/.bun/bin:$PATH"
fi

bun install

asset() {
  curl -fsSL "https://api.github.com/repos/$1/releases/latest" |
    jq -r --arg p "$2" '.assets[] | select(.name | test($p)) | .browser_download_url'
}

if ! command -v typst >/dev/null 2>&1; then
  case "$(uname -sm)" in
    "Darwin arm64"|"Darwin aarch64")  target="aarch64-apple-darwin" ;;
    "Darwin "*)                       target="x86_64-apple-darwin" ;;
    *" arm64"|*" aarch64")            target="aarch64-unknown-linux-musl" ;;
    *)                                target="x86_64-unknown-linux-musl" ;;
  esac
  curl -fsSL "$(asset typst/typst "$target")" -o "$tmp/typst.tar.xz"
  tar -xf "$tmp/typst.tar.xz" -C "$tmp"
  if [ -w "/usr/local/bin" ]; then
    install -m 0755 "$tmp"/typst-*/typst "/usr/local/bin/typst"
  elif command -v sudo >/dev/null 2>&1; then
    sudo install -m 0755 "$tmp"/typst-*/typst "/usr/local/bin/typst"
  else
    mkdir -p "$HOME/.local/bin"
    install -m 0755 "$tmp"/typst-*/typst "$HOME/.local/bin/typst"
    export PATH="$HOME/.local/bin:$PATH"
    echo "Installed typst to $HOME/.local/bin. Add it to PATH if your shell cannot find typst." >&2
  fi
fi

if [ ! -d "bin/fonts" ]; then
  mkdir -p "bin/fonts"
  curl -fsSL "$(asset FortAwesome/Font-Awesome '-desktop\.zip$')" -o "$tmp/fa.zip"
  unzip -j "$tmp/fa.zip" '*.otf' -d "bin/fonts"
fi
