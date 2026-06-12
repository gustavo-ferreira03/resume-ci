#!/usr/bin/env node

import { mkdir, readdir, readFile, stat } from "node:fs/promises"
import { parseArgs } from "node:util"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { generateResume, parseResume } from "./index.js"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..")
const DATA_DIR = join(ROOT, "resumes")
const BUILD_DIR = join(ROOT, "build")
const FONT_DIR = join(ROOT, "lib", "bin", "fonts")
const TPL_DIR = join(ROOT, "templates")

class Builder {
  private constructor(
    private readonly outputDir: string,
    private readonly paths: string[],
  ) {}

  static async create(outputDir: string, explicit: string[] | null) {
    return new Builder(outputDir, await Builder.resolvePaths(explicit))
  }

  async buildAll(): Promise<boolean> {
    let failed = false
    for (const path of this.paths) {
      try { console.log(`PDF: ${await this.compile(path)}`) }
      catch (err) { console.error(`FAILED ${path}: ${(err as Error).message}`); failed = true }
    }
    return failed
  }

  async watch(): Promise<void> {
    const watched = [...this.paths, ...await Builder.templatePaths()]
    let last: string | null = null

    process.on("SIGINT", () => { console.log("\nStopped watching."); process.exit(0) })
    console.log("Watching for changes. Press Ctrl+C to stop.")

    while (true) {
      const snapshot = JSON.stringify(await Promise.all(watched.map(async f => {
        try { return (await stat(f)).mtimeMs } catch { return 0 }
      })))
      if (snapshot !== last) { await this.buildAll(); last = snapshot }
      await sleep(500)
    }
  }

  private async compile(resumePath: string): Promise<string> {
    const ctx = parseResume(await readFile(resumePath, "utf8"), { inputFormat: "yaml" })
    const pdf = join(this.outputDir, `${ctx.meta.output_filename}.pdf`)

    await mkdir(this.outputDir, { recursive: true })
    await generateResume(ctx, {
      fontDir: FONT_DIR,
      outputPath: pdf,
      templatesDir: TPL_DIR,
    })

    return pdf
  }

  private static async resolvePaths(explicit: string[] | null): Promise<string[]> {
    if (explicit) return explicit
    const files = (await readdir(DATA_DIR))
      .filter(f => f.endsWith(".yml") && !f.startsWith("."))
      .sort()
      .map(f => join(DATA_DIR, f))
    if (!files.length) { console.error("No resume YAML files found."); process.exit(0) }
    return files
  }

  private static async templatePaths(): Promise<string[]> {
    return (await readdir(TPL_DIR))
      .filter(f => f.endsWith(".typ"))
      .map(f => join(TPL_DIR, f))
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolveSleep => setTimeout(resolveSleep, ms))
}

const { values, positionals } = parseArgs({
  args: process.argv.slice(2),
  options: {
    "output-dir": { type: "string",  default: BUILD_DIR },
    watch:        { type: "boolean", default: false },
  },
  allowPositionals: true,
})

const builder = await Builder.create(
  values["output-dir"] as string,
  positionals.length ? positionals.map(p => resolve(p)) : null,
)

if (values.watch) {
  await builder.watch()
} else {
  process.exit(await builder.buildAll() ? 1 : 0)
}
