#!/usr/bin/env bun

import { parseArgs } from "node:util"
import { mkdirSync, readdirSync, statSync } from "node:fs"
import { join, relative, resolve } from "node:path"
import { parse as parseYaml } from "yaml"
import { z } from "zod"
import { resumeSchema, role, education, type Resume } from "./schema.ts"
import { rich, periodStr, extractDomain, extractUsername } from "./utils.ts"

const ROOT      = resolve(import.meta.dir, "../..")
const DATA_DIR  = join(ROOT, "resumes")
const BUILD_DIR = join(ROOT, "build")
const FONT_DIR  = join(ROOT, "lib", "bin", "fonts")
const TEMPLATE  = join(ROOT, "templates", "default.typ")


const SECTION_TITLES = {
  summary: "Professional Summary", experience: "Experience", projects: "Projects",
  certifications: "Certifications", education: "Education", skills: "Technical Skills",
}

type ContactItem = { icon: string; solid: boolean; href: string; text: string }

function buildContacts(p: Resume["personal"]): ContactItem[] {
  return [
    { icon: "envelope",  solid: true,  href: `mailto:${p.email}`, text: p.email },
    p.phone        ? { icon: "phone",    solid: true,  href: "", text: p.phone } : null,
    p.location     ? { icon: "",         solid: false, href: "", text: p.location } : null,
    p.linkedin_url ? { icon: "linkedin", solid: false, href: p.linkedin_url, text: extractUsername(p.linkedin_url) } : null,
    p.github_url   ? { icon: "github",   solid: false, href: p.github_url,   text: extractUsername(p.github_url) } : null,
  ].filter((x): x is ContactItem => x !== null)
}

function buildRole(item: z.infer<typeof role>) {
  const u = item.url ?? ""
  return { company: rich(item.company), period: periodStr(item.period), role: rich(item.role), url: u, domain: u ? extractDomain(u) : "", bullets: item.bullets.map(rich) }
}

function buildContext(data: Resume): Record<string, unknown> {
  return {
    font:           data.font,
    section_titles: { ...SECTION_TITLES, ...(data.section_titles ?? {}) },
    personal:       { name: rich(data.personal.name), title: rich(data.personal.title) },
    contact:        buildContacts(data.personal),
    summary:        rich(data.summary ?? ""),
    experience:     data.experience.map(buildRole),
    projects:       data.projects.map(buildRole),
    certifications: data.certifications.map(rich),
    education:      data.education.map(item => ({
      institution: rich(item.institution), period: periodStr(item.period),
      degree: rich(item.degree), location: rich(item.location),
    })),
    skills:         data.skills.map(item => ({ label: rich(item.label), items: rich(item.items) })),
    output_filename: data.output_filename,
  }
}


class Builder {
  private constructor(
    private readonly templatePath: string,
    private readonly outputDir: string,
    private readonly paths: string[],
  ) {}

  static create(templatePath: string, outputDir: string, explicit: string[] | null) {
    try { statSync(templatePath) } catch {
      throw new Error(`Template not found: ${templatePath}`)
    }
    return new Builder(templatePath, outputDir, Builder.resolvePaths(explicit))
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
    const watched = [...this.paths, this.templatePath]
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

    const ctx = buildContext(result.data)
    mkdirSync(this.outputDir, { recursive: true })
    const pdf = join(this.outputDir, `${ctx.output_filename}.pdf`)

    const proc = Bun.spawn(
      [Builder.findTypst(), "compile", "--root", ROOT, "--font-path", FONT_DIR,
       "--input", `data=${JSON.stringify(ctx)}`, relative(ROOT, this.templatePath), pdf],
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
    template:     { type: "string",  default: TEMPLATE },
    "output-dir": { type: "string",  default: BUILD_DIR },
    watch:        { type: "boolean", default: false },
  },
  allowPositionals: true,
})

const builder = Builder.create(
  resolve(values.template as string),
  values["output-dir"] as string,
  positionals.length ? positionals.map(p => resolve(p)) : null,
)

if (values.watch) {
  await builder.watch()
} else {
  process.exit(await builder.buildAll() ? 1 : 0)
}
