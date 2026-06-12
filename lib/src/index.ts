import { spawn } from "node:child_process"
import { constants } from "node:fs"
import { access, mkdir, mkdtemp, readFile, rm, stat } from "node:fs/promises"
import { tmpdir } from "node:os"
import { basename, dirname, extname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { parse as parseYaml } from "yaml"
import { resumeSchema, type ResumeContext, type ResumeInput } from "./schema.js"
import {
  ResumeValidationError,
  TemplateNotFoundError,
  TypstCompileError,
  TypstNotFoundError,
} from "./errors.js"

export type { ResumeContext, ResumeInput } from "./schema.js"
export {
  ResumeCiError,
  ResumeValidationError,
  TemplateNotFoundError,
  TypstCompileError,
  TypstNotFoundError,
} from "./errors.js"

export type ResumeInputFormat = "object" | "yaml" | "json" | "file"

export interface ParseResumeOptions {
  inputFormat?: Exclude<ResumeInputFormat, "file">
}

export interface GenerateResumeOptions {
  inputFormat?: ResumeInputFormat
  template?: string
  templatePath?: string
  templatesDir?: string
  typstPath?: string
  fontDir?: string
  outputPath?: string
  cwd?: string
  keepTempFiles?: boolean
}

export interface GenerateResumeResult {
  pdf: Buffer
  context: ResumeContext
  filename: string
  outputPath?: string
}

const MODULE_DIR = dirname(fileURLToPath(import.meta.url))
const PACKAGE_ROOT = resolve(MODULE_DIR, "..")

export function parseResume(input: ResumeInput | string | unknown, options: ParseResumeOptions = {}): ResumeContext {
  const raw = parseRawInput(input, options.inputFormat ?? inferInlineFormat(input))
  const result = resumeSchema.safeParse(raw)

  if (!result.success) {
    throw new ResumeValidationError(result.error.issues.map(issue => ({
      path: issue.path.map(part => typeof part === "symbol" ? part.toString() : part),
      message: issue.message,
    })))
  }

  return result.data
}

export async function generateResume(
  input: ResumeInput | ResumeContext | string | unknown,
  options: GenerateResumeOptions = {},
): Promise<GenerateResumeResult> {
  const context = await resolveContext(input, options)
  const templateName = options.template ?? context.meta.template
  const templatePath = await resolveTemplatePath(templateName, options)
  const typstPath = await resolveTypstPath(options.typstPath, options.cwd)
  const fontDir = await optionalExistingPath(options.fontDir ?? join(PACKAGE_ROOT, "bin", "fonts"))
  const cwd = resolve(options.cwd ?? process.cwd())
  const outputPath = options.outputPath ? resolve(options.cwd ?? process.cwd(), options.outputPath) : undefined
  const tempDir = outputPath ? undefined : await createTempDir(cwd)
  const pdfPath = outputPath ?? join(tempDir!, `${context.meta.output_filename}.pdf`)

  try {
    await mkdir(dirname(pdfPath), { recursive: true })
    await compileTypst({ context, fontDir, outputPath: pdfPath, templatePath, typstPath })
    const pdf = await readFile(pdfPath)

    return {
      pdf,
      context,
      filename: basename(pdfPath),
      ...(outputPath ? { outputPath: pdfPath } : {}),
    }
  } finally {
    if (tempDir && !options.keepTempFiles) await rm(tempDir, { recursive: true, force: true })
  }
}

async function resolveContext(input: ResumeInput | ResumeContext | string | unknown, options: GenerateResumeOptions) {
  if (isResumeContext(input)) return withTemplateOverride(input, options.template)

  if (options.inputFormat === "file") {
    if (typeof input !== "string") {
      throw new ResumeValidationError([{ path: [], message: "File input must be a path string" }])
    }

    const path = resolve(options.cwd ?? process.cwd(), input)
    const text = await readFile(path, "utf8")
    const format = extname(path).toLowerCase() === ".json" ? "json" : "yaml"
    return withTemplateOverride(parseResume(text, { inputFormat: format }), options.template)
  }

  return withTemplateOverride(parseResume(input, { inputFormat: options.inputFormat }), options.template)
}

function parseRawInput(input: ResumeInput | string | unknown, format: Exclude<ResumeInputFormat, "file">) {
  if (format === "object") return input

  if (typeof input !== "string") {
    throw new ResumeValidationError([{ path: [], message: `${format.toUpperCase()} input must be a string` }])
  }

  try {
    return format === "json" ? JSON.parse(input) : parseYaml(input)
  } catch (err) {
    throw new ResumeValidationError([{ path: [], message: `Invalid ${format.toUpperCase()}: ${(err as Error).message}` }])
  }
}

function inferInlineFormat(input: unknown): Exclude<ResumeInputFormat, "file"> {
  return typeof input === "string" ? "yaml" : "object"
}

function isResumeContext(input: unknown): input is ResumeContext {
  if (!input || typeof input !== "object") return false
  const value = input as Record<string, unknown>
  return "meta" in value && "personal" in value && "contact" in value && "summary" in value
}

function withTemplateOverride(context: ResumeContext, template?: string): ResumeContext {
  if (!template) return context
  return { ...context, meta: { ...context.meta, template } }
}

async function resolveTemplatePath(template: string, options: GenerateResumeOptions): Promise<string> {
  const candidates = options.templatePath
    ? [resolve(options.cwd ?? process.cwd(), options.templatePath)]
    : [
        ...(options.templatesDir ? [join(resolve(options.cwd ?? process.cwd(), options.templatesDir), `${template}.typ`)] : []),
        join(PACKAGE_ROOT, "templates", `${template}.typ`),
        join(PACKAGE_ROOT, "..", "templates", `${template}.typ`),
      ]

  for (const candidate of candidates) {
    if (await exists(candidate)) return candidate
  }

  throw new TemplateNotFoundError(options.templatePath ?? template)
}

async function resolveTypstPath(explicit?: string, cwd = process.cwd()): Promise<string> {
  const candidates = [
    ...(explicit ? [resolve(cwd, explicit)] : []),
    ...pathCandidates(process.platform === "win32" ? "typst.exe" : "typst"),
    ...(process.platform === "win32" ? pathCandidates("typst") : []),
  ]

  for (const candidate of candidates) {
    if (await isExecutable(candidate)) return candidate
  }

  throw new TypstNotFoundError()
}

function pathCandidates(binary: string): string[] {
  return (process.env.PATH ?? "")
    .split(process.platform === "win32" ? ";" : ":")
    .filter(Boolean)
    .map(dir => join(dir, binary))
}

async function optionalExistingPath(path: string): Promise<string | undefined> {
  return await exists(path) ? path : undefined
}

async function createTempDir(cwd: string): Promise<string> {
  try {
    return await mkdtemp(join(cwd, ".resume-ci-"))
  } catch {
    return await mkdtemp(join(tmpdir(), "resume-ci-"))
  }
}

async function exists(path: string): Promise<boolean> {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}

async function isExecutable(path: string): Promise<boolean> {
  try {
    await access(path, process.platform === "win32" ? constants.F_OK : constants.X_OK)
    return true
  } catch {
    return false
  }
}

async function compileTypst(options: {
  context: ResumeContext
  fontDir?: string
  outputPath: string
  templatePath: string
  typstPath: string
}): Promise<void> {
  const root = dirname(options.templatePath)
  const args = [
    "compile",
    "--root",
    root,
    ...(options.fontDir ? ["--font-path", options.fontDir] : []),
    "--input",
    `data=${JSON.stringify(options.context)}`,
    options.templatePath,
    options.outputPath,
  ]
  const stderr = await run(options.typstPath, args, root)

  if (stderr.exitCode !== 0) throw new TypstCompileError(stderr.text)
}

function run(command: string, args: string[], cwd: string): Promise<{ exitCode: number | null; text: string }> {
  return new Promise((resolvePromise, reject) => {
    const proc = spawn(command, args, { cwd, stdio: ["ignore", "ignore", "pipe"] })
    let text = ""

    proc.stderr.setEncoding("utf8")
    proc.stderr.on("data", chunk => { text += chunk })
    proc.on("error", reject)
    proc.on("close", exitCode => resolvePromise({ exitCode, text }))
  })
}
