.PHONY: build watch setup

TEMPLATE ?= default
BUILD_ARGS = $(if $(TEMPLATE),--template $(TEMPLATE)) $(ARGS)

build:
	bun lib/src/resume-ci.ts $(BUILD_ARGS)

watch:
	bun lib/src/resume-ci.ts --watch $(BUILD_ARGS)

setup:
	lib/setup.sh
