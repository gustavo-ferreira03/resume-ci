<div align="center">

# resume-ci

*Version-controlled resumes, clean Typst PDFs, automated GitHub releases.*

[![Build](https://img.shields.io/github/actions/workflow/status/gustavo-ferreira03/resume-ci/build.yml?style=flat-square&label=Build)](https://github.com/gustavo-ferreira03/resume-ci/actions)
[![Typst](https://img.shields.io/badge/Typst-239DAD?style=flat-square&logo=typst&logoColor=white)](https://typst.app)
[![JSON Resume](https://img.shields.io/badge/JSON%20Resume-compatible-green?style=flat-square)](https://jsonresume.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-blue?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Bun](https://img.shields.io/badge/Bun-black?style=flat-square&logo=bun&logoColor=white)](https://bun.sh)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

[Features](#features) | [Getting Started](#getting-started) | [Usage](#usage) | [Programmatic API](#programmatic-api) | [Resume Format](#resume-format) | [Templates](#templates) | [Automation](#automation)

</div>

`resume-ci` keeps resume content, layout, and publishing separate. You write your resume as YAML, validate it against a JSON Resume-compatible schema, render it with a Typst template, and let GitHub Actions publish fresh PDFs whenever you push changes.

It is built for developers who want their resume to be versioned, reviewable, easy to edit with an AI agent, and reproducible on any machine.

> [!TIP]
> PDF examples are published in the [GitHub Releases](https://github.com/gustavo-ferreira03/resume-ci/releases) for this repository.

## Features

- **YAML-first resume content** using familiar JSON Resume field names.
- **Typst PDF rendering** with a clean default template and support for custom templates.
- **Schema validation and editor autocomplete** from `lib/schema.json`.
- **Locale-aware dates** for English, Brazilian Portuguese, Spanish, and any BCP 47 locale supported by your runtime.
- **Automated releases** that attach generated PDFs to a GitHub Release on every relevant push to `main`.
- **AI-agent friendly guidance** in `AGENTS.md` and `CLAUDE.md` for STAR-based resume bullets and evidence standards.

## Getting Started

### Prerequisites

- [Git](https://git-scm.com/downloads)
- `bash`, `curl`, `jq`, `tar`, and `unzip` on macOS/Linux
- PowerShell on Windows
- `typst` available on `PATH`

`make setup` installs Bun dependencies, ensures `typst` is available globally, and downloads Font Awesome into `lib/bin/fonts`.

Install the system packages first if needed:

```bash
# macOS
brew install curl jq

# Ubuntu / Debian
sudo apt install curl jq tar unzip
```

### Create Your Resume Repository

For a private resume, create an empty private repository on GitHub, then run:

```bash
git clone https://github.com/gustavo-ferreira03/resume-ci.git
cd resume-ci
git remote set-url origin <your-private-repo-url>
git push -u origin main
```

For a public resume, fork this repository and clone your fork:

```bash
git clone <your-fork-url>
cd resume-ci
```

### Build Your First PDF

```bash
make setup
cp resumes/resume-en.example.yml resumes/resume-en.yml
make build ARGS="resumes/resume-en.yml"
```

Edit `resumes/resume-en.yml` with your information. The generated PDF lands in `build/`.

> [!NOTE]
> The example resumes are intentionally complete. Delete sections you do not need or set list-backed sections to `[]` to hide them.

### Windows Setup

Use the PowerShell setup script instead of `make setup`:

```powershell
.\lib\setup.ps1
Copy-Item resumes\resume-en.example.yml resumes\resume-en.yml
bun .\lib\src\resume-ci.ts resumes\resume-en.yml
```

## Usage

| Command | Description |
| --- | --- |
| `make setup` | Install local tooling and dependencies |
| `make build` | Build every `*.yml` resume in `resumes/` |
| `make build ARGS="resumes/resume-en.yml"` | Build one resume |
| `make watch` | Watch all resumes and templates, rebuilding on change |
| `make watch ARGS="resumes/resume-en.yml"` | Watch one resume and all templates |
| `make schema` | Regenerate `lib/schema.json` from `lib/src/schema.ts` |
| `make sync` | Pull upstream tooling and template updates into your fork |
| `bun lib/src/resume-ci.ts --output-dir dist` | Build to a custom output directory |

## Programmatic API

`resume-ci` can also be used as a Bun-first SDK from another application. The published package exposes `parseResume` for validation/normalization and `generateResume` for PDF rendering.

Install it in your application:

```bash
bun add resume-ci
# or
npm install resume-ci
```

Make sure `typst` is installed globally and available on `PATH` before generating PDFs.

```ts
import { generateResume, parseResume, ResumeValidationError } from "resume-ci"

try {
  const resume = parseResume({
    meta: {
      output_filename: "resume_jane_doe",
    },
    basics: {
      name: "Jane Doe",
      label: "Software Engineer",
      email: "jane@example.invalid",
    },
    work: [],
  })

  const result = await generateResume(resume, {
    outputPath: "dist/resume_jane_doe.pdf",
  })

  console.log(result.filename)
  console.log(result.pdf) // Buffer
} catch (err) {
  if (err instanceof ResumeValidationError) console.error(err.issues)
  else throw err
}
```

You can also generate from YAML or a YAML file:

```ts
await generateResume("resumes/resume-en.yml", {
  inputFormat: "file",
  outputPath: "dist/resume.pdf",
})
```

Useful `generateResume` options include `template`, `templatePath`, `templatesDir`, `typstPath`, `fontDir`, `outputPath`, and `keepTempFiles`.

> [!NOTE]
> The SDK does not download Typst automatically. It uses `typstPath` when provided, then falls back to `typst` on `PATH`. The npm package includes the Font Awesome fonts required by the default template, and `fontDir` can override them.

## Resume Format

Resume YAML follows the [JSON Resume](https://jsonresume.org/schema) shape, with an extra `meta` block for rendering options.

```yaml
# yaml-language-server: $schema=../lib/schema.json

meta:
  template: default
  font: New Computer Modern
  output_filename: resume_john_doe_en
  locale: en
  section_titles:
    summary: Professional Summary
    work: Experience
    projects: Projects
    education: Education
    skills: Technical Skills

basics:
  name: John Doe
  label: Full Stack Developer
  email: john.doe@example.invalid
  summary: Full stack developer strongest in **TypeScript**, **React**, and **PostgreSQL**.
  profiles:
    - network: LinkedIn
      url: https://linkedin.example.invalid/in/john-doe
    - network: GitHub
      url: https://git.example.invalid/john-doe

work:
  - name: Example Corp
    position: Full Stack Developer
    startDate: 2022-01
    endDate: 2024-06
    highlights:
      - Built **REST APIs** with **Node.js** and **PostgreSQL** for internal reporting workflows.

projects: []
certificates: []
education: []
skills: []
languages: []
```

### Supported Sections

| YAML key | Rendered content |
| --- | --- |
| `basics` | Name, title, contact links, location, summary |
| `work` | Professional experience |
| `volunteer` | Volunteer experience |
| `projects` | Projects and portfolio work |
| `awards` | Awards and honors |
| `certificates` | Certifications |
| `publications` | Publications and articles |
| `education` | Education entries and courses |
| `skills` | Skill groups and keywords |
| `languages` | Languages and fluency |
| `interests` | Interests or focus areas |
| `references` | References or testimonials |

Extra JSON Resume fields are accepted by the schema, but the default Typst template may not render them.

### `meta` Reference

| Field | Default | Notes |
| --- | --- | --- |
| `meta.template` | `default` | Template name without `.typ` |
| `meta.font` | `New Computer Modern` | Must be a Typst-readable font family |
| `meta.output_filename` | Derived from `basics.name` | PDF filename without `.pdf`; use only letters, digits, `_`, and `-` |
| `meta.locale` | `en` | BCP 47 locale for date formatting |
| `meta.present_label` | Derived from locale | Override for open-ended roles |
| `meta.section_titles` | Built-in English labels | Custom section titles, useful for translations |
| `meta.canonical`, `meta.version`, `meta.lastModified` | None | Standard JSON Resume metadata |

Dates must use `YYYY`, `YYYY-MM`, or `YYYY-MM-DD`. Omit `endDate` for current roles.

```yaml
meta:
  locale: pt-BR
  present_label: Atual
```

`2024-09` renders as `Sep 2024` with `locale: en`, `Set 2024` with `locale: pt-BR`, and `Sept 2024` with `locale: es` depending on your runtime locale data.

### Rich Text

Most text fields and bullets support a small Markdown-style subset:

| Syntax | Output |
| --- | --- |
| `**text**` | Bold |
| `_text_` | Italic |

## Editor Autocomplete

Add this comment to the top of any resume YAML file:

```yaml
# yaml-language-server: $schema=../lib/schema.json
```

This enables validation and autocomplete in VS Code, Neovim, and other editors with YAML language server support.

> [!IMPORTANT]
> `lib/schema.json` is generated from `lib/src/schema.ts`. If you change the Zod schema, run `make schema` instead of editing the JSON Schema by hand.

## Templates

Templates are regular Typst files in `templates/`. Pick a template from YAML:

```yaml
meta:
  template: default
```

To create a new template, add `templates/<name>.typ` and set `meta.template` to `<name>`. The builder passes the validated resume data to Typst as the `data` input.

The default template uses Font Awesome icons for common contact methods and profile links. `make setup` downloads the required fonts to `lib/bin/fonts`.

## Automation

The GitHub Actions workflow runs on pushes to `main` when resume, template, workflow, Makefile, or builder files change. It builds PDFs and publishes them to a GitHub Release tagged `build-<run_number>`.

To publish a new resume version:

```bash
git add resumes/resume-en.yml
git commit -m "Update resume"
git push origin main
```

To pull future improvements from the upstream template repository:

```bash
make sync
```

`make sync` requires a clean working tree. If Git reports conflicts, resolve them and continue with `git merge --continue`.

### npm Package Publishing

The `Publish npm Package` workflow publishes the SDK from `lib/` to the public npm registry as `resume-ci`. It uses npm Trusted Publishing, runs tests, verifies the npm tarball with `npm pack --dry-run`, then runs `npm publish --access public --provenance`.

Set the repository as a trusted publisher for `resume-ci` in npm before using this workflow. No `NPM_TOKEN` secret is required.

You can publish in either of these ways:

- Run the workflow manually from the GitHub Actions tab.
- Publish a GitHub Release whose tag starts with `npm-v`, for example `npm-v0.1.0`.

> [!NOTE]
> Regular resume PDF releases use tags like `build-<run_number>` and do not trigger npm publishing.

### GitHub Packages Publishing

The `Publish GitHub Package` workflow publishes the same SDK to GitHub Packages as `@gustavo-ferreira03/resume-ci`. GitHub Packages requires scoped npm package names, so the workflow changes the package name only inside CI before publishing to `https://npm.pkg.github.com`.

You can publish in either of these ways:

- Run the workflow manually from the GitHub Actions tab.
- Publish a GitHub Release whose tag starts with `github-v`, for example `github-v0.1.3`.

Install from GitHub Packages with an authenticated npm client:

```bash
npm install @gustavo-ferreira03/resume-ci --registry=https://npm.pkg.github.com
```

## AI Agent Guidance

This repository includes [`AGENTS.md`](AGENTS.md) and [`CLAUDE.md`](CLAUDE.md) so AI agents know how to edit resume content safely.

The guidance emphasizes:

- STAR-based experience bullets.
- Evidence-backed metrics and outcomes.
- Plain language over generic resume filler.
- No fabricated employers, dates, credentials, tools, or results.
- Building the resume after content changes.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| `typst not found. Install typst globally or pass typstPath` | Run `make setup`, install Typst globally, or pass `typstPath` to the SDK |
| Missing Font Awesome icons | Delete `lib/bin/fonts` and rerun setup |
| YAML validation error | Check the reported field path and compare with `resumes/*.example.yml` |
| Template not found | Confirm `meta.template` matches a file in `templates/` without `.typ` |
| No PDF generated in CI | Check the `Build Resumes` workflow logs and repository Actions permissions |
| Sync refuses to run | Commit or stash local changes before `make sync` |

## Resources

- [Typst documentation](https://typst.app/docs/)
- [JSON Resume schema](https://jsonresume.org/schema)
- [Bun documentation](https://bun.sh/docs)
- [GitHub Actions documentation](https://docs.github.com/actions)
