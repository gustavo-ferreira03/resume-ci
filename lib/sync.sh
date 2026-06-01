#!/usr/bin/env bash
set -euo pipefail

upstream="https://github.com/gustavo-ferreira03/resume-ci.git"

cd "$(dirname "$0")/.."

git remote get-url upstream >/dev/null 2>&1 \
  || git remote add upstream "$upstream"

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "error: commit or stash your changes before syncing." >&2
  exit 1
fi

git fetch upstream
git merge --no-commit upstream/main || true

if [ ! -f .git/MERGE_HEAD ]; then
  echo "Already up to date."
  exit 0
fi

while IFS= read -r f; do
  git rm -q -- "$f"
done < <(git status --porcelain | awk '/^DU / { print $2 }')

while IFS= read -r f; do
  git checkout --theirs -- "$f"
  git add -- "$f"
done < <(git status --porcelain | awk '/^AA / { print $2 }' | grep -E '^(lib/|\.github/|Makefile)')

remaining=$(git diff --name-only --diff-filter=U)
if [ -n "$remaining" ]; then
  echo "Conflicts to resolve manually:" >&2
  printf '  %s\n' $remaining >&2
  echo "Fix them, then: git merge --continue" >&2
  exit 1
fi

git commit --no-edit
