.PHONY: build watch setup

build:
	bun lib/src/resume-ci.ts $(ARGS)

watch:
	bun lib/src/resume-ci.ts --watch $(ARGS)

setup:
	lib/setup.sh
