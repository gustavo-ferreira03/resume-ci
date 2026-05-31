.PHONY: build watch setup sync

BUN := $(shell command -v bun 2>/dev/null || printf "%s/.bun/bin/bun" "$$HOME")
UPSTREAM ?= https://github.com/gustavo-ferreira03/resume-ci.git

build:
	$(BUN) lib/src/resume-ci.ts $(ARGS)

watch:
	$(BUN) lib/src/resume-ci.ts --watch $(ARGS)

setup:
	bash lib/setup.sh

# Sync fork with upstream, keeping resumes/ untouched.
# Override upstream URL: make sync UPSTREAM=https://github.com/owner/resume-ci.git
sync:
	@if ! git diff --quiet || ! git diff --cached --quiet; then \
		echo "ERROR: commit or stash your changes before syncing."; exit 1; \
	fi
	@echo "==> Saving resumes/..."
	@cp -r resumes /tmp/_resume_ci_backup
	@if ! git remote get-url upstream 2>/dev/null; then \
		if [ -z "$(UPSTREAM)" ]; then \
			echo "ERROR: set the upstream URL: make sync UPSTREAM=https://github.com/owner/resume-ci.git"; exit 1; \
		fi; \
		git remote add upstream $(UPSTREAM); \
	fi
	@echo "==> Fetching upstream..."
	@git fetch upstream
	@echo "==> Merging upstream/main (-X theirs: upstream wins on conflicts)..."
	@git merge upstream/main -X theirs --no-edit
	@echo "==> Restoring resumes/..."
	@rm -rf resumes
	@mv /tmp/_resume_ci_backup resumes
	@git add resumes/
	@git diff --cached --quiet \
		|| git commit -m "chore: restore resumes/ after upstream sync"
	@echo "==> Sync complete. Run 'make build' to verify."
