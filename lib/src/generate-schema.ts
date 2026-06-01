#!/usr/bin/env bun

import { join, resolve } from "node:path"
import { z } from "zod"
import { resumeInputSchema } from "./schema.ts"

const ROOT = resolve(import.meta.dir, "../..")

const schema = z.toJSONSchema(resumeInputSchema, {
  target: "draft-7",
  io: "input",
}) as Record<string, unknown>

const {
  $schema: _schema,
  $id: _id,
  title: _title,
  description: _description,
  ...rest
} = schema

const generated = {
  $schema: "http://json-schema.org/draft-07/schema#",
  $id: "https://github.com/gustavo-ferreira03/resume-ci/lib/schema.json",
  title: "resume-ci JSON Resume Schema",
  description: "Generated from lib/src/schema.ts. Do not edit manually.",
  ...rest,
}

await Bun.write(join(ROOT, "lib", "schema.json"), `${JSON.stringify(generated, null, 2)}\n`)
