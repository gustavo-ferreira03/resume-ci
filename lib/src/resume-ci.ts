#!/usr/bin/env bun

import { parseArgs } from "node:util"
import { mkdirSync, readdirSync, statSync } from "node:fs"
import { join, relative, resolve } from "node:path"
import { parse as parseYaml } from "yaml"
import { resumeSchema } from "./schema.ts"

const ROOT = resolve(import.meta.dir, "../..")
const DATA_DIR = join(ROOT, "resumes")
const BUILD_DIR = join(ROOT, "build")
const FONT_DIR = join(ROOT, "lib", "bin", "fonts")
const TPL_DIR = join(ROOT, "templates")

class Builder {
  private constructor(
    private readonly outputDir: string,
    private readonly paths: string[],
  ) {}

  static create(outputDir: string, explicit: string[] | null) {
    return new Builder(outputDir, Builder.resolvePaths(explicit))
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
    const watched = [...this.paths, ...Builder.templatePaths()]
    let last: string | null = null

    process.on("SIGINT", () => { console.log("\nStopped watching."); process.exit(0) })
    console.log("Watching for changes. Press Ctrl+C to stop.")

    while (true) {
      const snapshot = JSON.stringify(watched.map(f => { try { return statSync(f).mtimeMs } catch { return 0 } }))
      if (snapshot !== last) { await this.buildAll(); last = snapshot }
      await Bun.sleep(500)
    }
  }

  private async compile(resumePath: string): Promise<string> {
    const raw = parseYaml(await Bun.file(resumePath).text())

    const result = resumeSchema.safeParse(raw)
    if (!result.success) {
      const issue = result.error.issues[0]
      const path = issue.path.join(".") || "resume"
      throw new Error(`${path}: ${issue.message}`)
    }

    const ctx = result.data
    const templatePath = join(TPL_DIR, `${ctx.meta.template}.typ`)
    try { statSync(templatePath) } catch {
      throw new Error(`Template not found: ${templatePath}`)
    }

    mkdirSync(this.outputDir, { recursive: true })
    const pdf = join(this.outputDir, `${ctx.meta.output_filename}.pdf`)

    const proc = Bun.spawn(
      [Builder.findTypst(), "compile", "--root", ROOT, "--font-path", FONT_DIR,
       "--input", `data=${JSON.stringify(ctx)}`, relative(ROOT, templatePath), pdf],
      { cwd: ROOT, stderr: "inherit" },
    )
    if (await proc.exited !== 0) throw new Error("typst compile failed")
    return pdf
  }

  private static resolvePaths(explicit: string[] | null): string[] {
    if (explicit) return explicit
    const files = readdirSync(DATA_DIR)
      .filter(f => f.endsWith(".yml") && !f.startsWith("."))
      .sort()
      .map(f => join(DATA_DIR, f))
    if (!files.length) { console.error("No resume YAML files found."); process.exit(0) }
    return files
  }

  private static templatePaths(): string[] {
    return readdirSync(TPL_DIR)
      .filter(f => f.endsWith(".typ"))
      .map(f => join(TPL_DIR, f))
  }

  private static findTypst(): string {
    for (const name of ["typst", "typst.exe"]) {
      const path = join(ROOT, "lib", "bin", name)
      try { statSync(path); return path } catch {}
    }
    const found = Bun.which("typst")
    if (found) return found
    throw new Error("typst not found. Run make setup")
  }
}


const { values, positionals } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    "output-dir": { type: "string",  default: BUILD_DIR },
    watch:        { type: "boolean", default: false },
  },
  allowPositionals: true,
})

const builder = Builder.create(
  values["output-dir"] as string,
  positionals.length ? positionals.map(p => resolve(p)) : null,
)

if (values.watch) {
  await builder.watch()
} else {
  process.exit(await builder.buildAll() ? 1 : 0)
}
