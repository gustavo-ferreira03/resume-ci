#!/usr/bin/env bun

import { parseArgs } from "node:util"
import { mkdirSync, readdirSync, statSync } from "node:fs"
import { join, relative, resolve } from "node:path"
import { parse as parseYaml } from "yaml"
import type { ZodSchema } from "zod"

const ROOT = resolve(import.meta.dir, "..")
const DATA_DIR = join(ROOT, "resumes")
const BUILD_DIR = join(ROOT, "build")
const TEMPLATES_DIR = join(ROOT, "templates")
const FONT_DIR = join(ROOT, "bin", "fonts")

type Template = {
  schema: ZodSchema
  buildContext: (data: unknown) => Record<string, unknown>
  templatePath: string
}

class Builder {
  private constructor(
    private readonly tmpl: Template,
    private readonly outputDir: string,
    private readonly paths: string[],
  ) {}

  static async create(templateName: string, outputDir: string, explicit: string[] | null) {
    return new Builder(
      await Builder.loadTemplate(templateName),
      outputDir,
      Builder.resolvePaths(explicit),
    )
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
    const watched = [...this.paths, this.tmpl.templatePath]
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
    if (typeof raw !== "object" || raw === null || Array.isArray(raw))
      throw new Error(`${resumePath}: must contain a YAML mapping`)

    const result = this.tmpl.schema.safeParse(raw)
    if (!result.success) {
      const { path, message } = result.error.issues[0]
      throw new Error(`${path.join(".") || "resume"}: ${message}`)
    }

    const ctx = this.tmpl.buildContext(result.data)
    mkdirSync(this.outputDir, { recursive: true })
    const pdf = join(this.outputDir, `${ctx.output_filename as string}.pdf`)

    const proc = Bun.spawn(
      [Builder.findTypst(), "compile", "--root", ROOT, "--font-path", FONT_DIR,
       "--input", `data=${JSON.stringify(ctx)}`, relative(ROOT, this.tmpl.templatePath), pdf],
      { cwd: ROOT, stderr: "inherit" },
    )
    if (await proc.exited !== 0) throw new Error("typst compile failed")
    return pdf
  }

  private static async loadTemplate(name: string): Promise<Template> {
    const dir = join(TEMPLATES_DIR, name)
    try { statSync(dir) } catch {
      throw new Error(`Template '${name}' not found`)
    }
    const { schema, buildContext } = await import(join(dir, "schema.ts"))
    if (typeof schema?.safeParse !== "function" || typeof buildContext !== "function")
      throw new Error(`${dir}/schema.ts must export 'schema' and 'buildContext'`)
    return { schema, buildContext, templatePath: join(dir, "template.typ") }
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

  private static findTypst(): string {
    for (const name of ["typst", "typst.exe"]) {
      const path = join(ROOT, "bin", name)
      try { statSync(path); return path } catch {}
    }
    const found = Bun.which("typst")
    if (found) return found
    throw new Error("typst not found. Run ./setup.sh")
  }
}

const { values, positionals } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    template:     { type: "string",  default: "default" },
    "output-dir": { type: "string",  default: BUILD_DIR },
    watch:        { type: "boolean", default: false },
  },
  allowPositionals: true,
})

const builder = await Builder.create(
  values.template as string,
  values["output-dir"] as string,
  positionals.length ? positionals.map(p => resolve(p)) : null,
)

if (values.watch) {
  await builder.watch()
} else {
  process.exit(await builder.buildAll() ? 1 : 0)
}
