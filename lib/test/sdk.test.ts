import { expect, test } from "bun:test"
import { mkdtemp, readFile, rm, stat } from "node:fs/promises"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { generateResume, parseResume, ResumeValidationError } from "../src/index.js"

const LIB_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const ROOT = resolve(LIB_ROOT, "..")

const minimalResume = {
  meta: {
    output_filename: "sdk_test_resume",
    template: "default",
  },
  basics: {
    name: "SDK Test",
    label: "Software Engineer",
    email: "sdk-test@example.invalid",
  },
  work: [],
}

test("parseResume validates and normalizes object input", () => {
  const resume = parseResume(minimalResume)

  expect(resume.meta.output_filename).toBe("sdk_test_resume")
  expect(resume.personal.name[0]?.text).toBe("SDK Test")
  expect(resume.work).toEqual([])
})

test("parseResume accepts YAML strings", () => {
  const resume = parseResume(`
meta:
  output_filename: yaml_resume
basics:
  name: YAML Test
work: []
`, { inputFormat: "yaml" })

  expect(resume.meta.output_filename).toBe("yaml_resume")
  expect(resume.personal.name[0]?.text).toBe("YAML Test")
})

test("parseResume throws typed validation errors", () => {
  expect(() => parseResume({ basics: { email: "invalid" } })).toThrow(ResumeValidationError)
})

test("parseResume defaults section_order when meta is absent", () => {
  const resume = parseResume({ basics: { name: "No Meta" }, work: [] })

  expect(resume.meta.section_order.map(s => s.key)).toEqual([
    "summary", "work", "volunteer", "projects", "awards", "certificates",
    "publications", "education", "skills", "languages", "interests", "references",
  ])
  expect(resume.meta.section_order[0]).toEqual({ key: "summary", title: "Professional Summary" })
})

test("parseResume orders sections from YAML key order, with null keeping the default title", () => {
  const resume = parseResume(`
meta:
  sections:
    education: Studies
    summary:
work: []
`, { inputFormat: "yaml" })

  expect(resume.meta.section_order.map(s => s.key)).toEqual([
    "education", "summary", "work", "volunteer", "projects", "awards",
    "certificates", "publications", "skills", "languages", "interests", "references",
  ])
  expect(resume.meta.section_order[0]).toEqual({ key: "education", title: "Studies" })
  expect(resume.meta.section_order[1]).toEqual({ key: "summary", title: "Professional Summary" })
})

test("parseResume rejects unknown meta.sections keys", () => {
  expect(() => parseResume({ meta: { sections: { bogus: "x" } } })).toThrow(ResumeValidationError)
})

test("generateResume returns a PDF buffer and writes optional outputPath", async () => {
  const dir = await mkdtemp(join(LIB_ROOT, ".resume-ci-test-"))
  const outputPath = join(dir, "sdk-test.pdf")

  try {
    const result = await generateResume(minimalResume, {
      fontDir: join(LIB_ROOT, "bin", "fonts"),
      outputPath,
      templatesDir: join(ROOT, "templates"),
    })

    expect(result.filename).toBe("sdk-test.pdf")
    expect(result.outputPath).toBe(outputPath)
    expect(result.pdf.subarray(0, 4).toString()).toBe("%PDF")
    expect(result.pdf.length).toBeGreaterThan(1000)
    expect((await stat(outputPath)).size).toBe(result.pdf.length)
    expect((await readFile(outputPath)).subarray(0, 4).toString()).toBe("%PDF")
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test("generateResume returns a PDF buffer without outputPath", async () => {
  const result = await generateResume(minimalResume, {
    templatesDir: join(ROOT, "templates"),
  })

  expect(result.filename).toBe("sdk_test_resume.pdf")
  expect(result.outputPath).toBeUndefined()
  expect(result.pdf.subarray(0, 4).toString()).toBe("%PDF")
  expect(result.pdf.length).toBeGreaterThan(1000)
})

test("generateResume preserves default font assets", async () => {
  const withDefaultFonts = await generateResume(minimalResume, {
    templatesDir: join(ROOT, "templates"),
  })
  const withExplicitFonts = await generateResume(minimalResume, {
    fontDir: join(LIB_ROOT, "bin", "fonts"),
    templatesDir: join(ROOT, "templates"),
  })

  expect(withDefaultFonts.pdf.length).toBe(withExplicitFonts.pdf.length)
  expect(withDefaultFonts.pdf.subarray(0, 4).toString()).toBe("%PDF")
  expect(withExplicitFonts.pdf.subarray(0, 4).toString()).toBe("%PDF")
})

test("example resumes match reference PDF sizes when build artifacts exist", async () => {
  const examples = [
    ["resume-en.example.yml", "resume_john_doe_en.pdf"],
    ["resume-ptbr.example.yml", "curriculo_john_doe_ptbr.pdf"],
    ["resume-es.example.yml", "curriculum_john_doe_es.pdf"],
  ] as const

  for (const [resumeFile, pdfFile] of examples) {
    const reference = join(ROOT, "build", pdfFile)
    try { await stat(reference) } catch { return }

    const result = await generateResume(join(ROOT, "resumes", resumeFile), { inputFormat: "file" })
    expect(result.pdf.length).toBe((await stat(reference)).size)
  }
})
