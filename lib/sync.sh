#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"
root="$(cd .. && pwd)"

upstream="https://github.com/gustavo-ferreira03/resume-ci.git"

if ! git -C "$root" diff --quiet || ! git -C "$root" diff --cached --quiet; then
  echo "error: commit or stash your changes before syncing." >&2
  exit 1
fi

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
cp -r "$root/resumes" "$tmp/resumes"

git -C "$root" remote get-url upstream >/dev/null 2>&1 \
  || git -C "$root" remote add upstream "$upstream"

git -C "$root" fetch upstream
git -C "$root" merge upstream/main -X theirs --no-edit

rm -rf "$root/resumes"
mv "$tmp/resumes" "$root/resumes"
git -C "$root" add resumes/
git -C "$root" diff --cached --quiet \
  || git -C "$root" commit -m "chore: restore resumes/ after upstream sync"
