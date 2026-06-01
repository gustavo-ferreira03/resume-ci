#!/usr/bin/env bash
set -euo pipefail

# Paths owned by upstream. `make sync` overwrites these to match upstream and
# never touches anything else — your resumes/, custom templates, and docs stay
# exactly as you left them. Add a path to let sync manage it; remove one to take
# ownership yourself.
SYNC_PATHS=(
  lib
  .github
  Makefile
  templates/default.typ
)

upstream="https://github.com/gustavo-ferreira03/resume-ci.git"

cd "$(dirname "$0")/.."
root="$(pwd)"

git remote get-url upstream >/dev/null 2>&1 \
  || git remote add upstream "$upstream"

if ! git diff --quiet -- "${SYNC_PATHS[@]}" \
  || ! git diff --cached --quiet -- "${SYNC_PATHS[@]}"; then
  echo "error: commit or stash your changes in these paths before syncing:" >&2
  printf '  %s\n' "${SYNC_PATHS[@]}" >&2
  exit 1
fi

git -C "$root" fetch upstream

git -C "$root" rm -r --quiet --ignore-unmatch -- "${SYNC_PATHS[@]}"
git -C "$root" checkout upstream/main -- "${SYNC_PATHS[@]}"

if git -C "$root" diff --cached --quiet; then
  echo "Already up to date with upstream."
else
  echo "Synced from upstream. Review the staged changes and commit when ready:"
  git -C "$root" status --short -- "${SYNC_PATHS[@]}"
fi
