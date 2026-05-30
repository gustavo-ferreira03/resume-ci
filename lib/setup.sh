#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")"
root="$(cd .. && pwd)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

if ! command -v bun >/dev/null 2>&1; then
  curl -fsSL https://bun.sh/install | sh
  export PATH="$HOME/.bun/bin:$PATH"
fi

bun install

asset() {
  curl -fsSL "https://api.github.com/repos/$1/releases/latest" |
    jq -r --arg p "$2" '.assets[] | select(.name | test($p)) | .browser_download_url'
}

if [ ! -f "bin/typst" ]; then
  case "$(uname -sm)" in
    "Darwin arm64"|"Darwin aarch64")  target="aarch64-apple-darwin" ;;
    "Darwin "*)                       target="x86_64-apple-darwin" ;;
    *" arm64"|*" aarch64")            target="aarch64-unknown-linux-musl" ;;
    *)                                target="x86_64-unknown-linux-musl" ;;
  esac
  mkdir -p "bin"
  curl -fsSL "$(asset typst/typst "$target")" -o "$tmp/typst.tar.xz"
  tar -xf "$tmp/typst.tar.xz" -C "$tmp"
  mv "$tmp"/typst-*/typst "bin/typst"
  chmod +x "bin/typst"
fi

if [ ! -d "bin/fonts" ]; then
  mkdir -p "bin/fonts"
  curl -fsSL "$(asset FortAwesome/Font-Awesome '-desktop\.zip$')" -o "$tmp/fa.zip"
  unzip -j "$tmp/fa.zip" '*.otf' -d "bin/fonts"
fi
