#!/usr/bin/env sh
set -eu

python3 -m pip install -r lib/requirements.txt

root="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
bin="$root/bin"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

mkdir -p "$bin"

asset() {
  curl -fsSL "https://api.github.com/repos/$1/releases/latest" |
    python3 -c 'import json, re, sys; print(next(a["browser_download_url"] for a in json.load(sys.stdin)["assets"] if re.search(sys.argv[1], a["name"])))' "$2"
}

case "$(uname -sm)" in
  "Darwin arm64"|"Darwin aarch64") typst_target="aarch64-apple-darwin" ;;
  "Darwin "*) typst_target="x86_64-apple-darwin" ;;
  *" arm64"|*" aarch64") typst_target="aarch64-unknown-linux-musl" ;;
  *) typst_target="x86_64-unknown-linux-musl" ;;
esac

if [ ! -f "$bin/typst" ]; then
  curl -fsSL "$(asset typst/typst "$typst_target")" -o "$tmp/typst.tar.xz"
  tar -xf "$tmp/typst.tar.xz" -C "$tmp"
  mv "$tmp"/typst-*/typst "$bin/typst"
  chmod +x "$bin/typst"
fi

if [ ! -d "$bin/fonts" ]; then
  mkdir -p "$bin/fonts"
  curl -fsSL "$(asset FortAwesome/Font-Awesome '-desktop\.zip$')" -o "$tmp/fontawesome.zip"
  unzip -j "$tmp/fontawesome.zip" '*.otf' -d "$bin/fonts"
fi
