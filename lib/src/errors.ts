export interface ResumeValidationIssue {
  path: Array<string | number>
  message: string
}

export class ResumeCiError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message)
    this.name = new.target.name
  }
}

export class ResumeValidationError extends ResumeCiError {
  constructor(readonly issues: ResumeValidationIssue[]) {
    const first = issues[0]
    const path = first?.path.length ? first.path.join(".") : "resume"
    super(first ? `${path}: ${first.message}` : "Invalid resume", "RESUME_VALIDATION_ERROR")
  }
}

export class TemplateNotFoundError extends ResumeCiError {
  constructor(readonly template: string) {
    super(`Template not found: ${template}`, "TEMPLATE_NOT_FOUND")
  }
}

export class TypstNotFoundError extends ResumeCiError {
  constructor() {
    super("typst not found. Install typst globally or pass typstPath", "TYPST_NOT_FOUND")
  }
}

export class TypstCompileError extends ResumeCiError {
  constructor(readonly stderr: string) {
    super(stderr.trim() || "typst compile failed", "TYPST_COMPILE_ERROR")
  }
}
