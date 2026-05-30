.PHONY: build watch setup

BUN := $(shell command -v bun 2>/dev/null || printf "%s/.bun/bin/bun" "$$HOME")

build:
	$(BUN) lib/src/resume-ci.ts $(ARGS)

watch:
	$(BUN) lib/src/resume-ci.ts --watch $(ARGS)

setup:
	bash lib/setup.sh
