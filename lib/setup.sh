#!/usr/bin/env sh
set -eu

python3 -m pip install -r lib/requirements.txt

root="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"

if [ -f "$root/bin/tectonic" ]; then
  exit 0
fi

mkdir -p "$root/bin"
tmp="$(mktemp -d)"
(cd "$tmp" && curl -fsSL https://drop-sh.fullyjustified.net | sh)
mv "$tmp/tectonic" "$root/bin/tectonic"
chmod +x "$root/bin/tectonic"
