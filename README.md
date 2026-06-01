# resume-ci

> Simple resume generator built for developers.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Typst](https://img.shields.io/badge/Built%20with-Typst-239DAD.svg)](https://typst.app)
[![Bun](https://img.shields.io/badge/Runtime-Bun-black.svg)](https://bun.sh)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6.svg)](https://www.typescriptlang.org)
[![JSON Resume](https://img.shields.io/badge/Schema-JSON%20Resume-green.svg)](https://jsonresume.org)

Maintaining a resume in Word or Google Docs means fighting content and formatting at the same time. resume-ci keeps them separate: content in YAML files versioned in Git, layout in a Typst template. Run `make build` locally, or push to `main` and GitHub Actions builds the PDFs and publishes them to a release.

Ships with `CLAUDE.md` and `AGENTS.md` so AI agents know the schema and writing standards. Ask your favorite AI agent to rewrite a section and the PDF layout stays exactly as it should.

Content uses the [JSON Resume](https://jsonresume.org/schema) schema. A `meta` block controls rendering: template, font, locale, and section titles.

PDF examples are available in the [releases](https://github.com/gustavo-ferreira03/resume-ci/releases).

## Quick Start

To keep your resume private, create a private repository on GitHub, then:

```bash
git clone https://github.com/gustavo-ferreira03/resume-ci.git
cd resume-ci
git remote set-url origin <your-repo-url>
git push -u origin main
make setup
cp resumes/resume-en.example.yml resumes/resume-en.yml
```

To keep it public, fork this repository on GitHub, clone your fork, then:

```bash
make setup
cp resumes/resume-en.example.yml resumes/resume-en.yml
```

Edit `resumes/resume-en.yml` with your information, then:

```bash
make build
```

PDFs land in `build/`. Push to `main` and GitHub Actions builds and publishes them to a GitHub Release automatically.

To pull tooling and template updates later, commit or stash your changes, then:

```bash
make sync
```

Merges upstream changes without touching your resumes. If a conflict needs manual resolution, sync stops and tells you which files to fix before running:

```bash
git merge --continue
```

> [!TIP]
> See [`AGENTS.md`](AGENTS.md) for guidance on writing strong resume bullets: STAR structure, evidence standards, and AI-writing patterns to avoid.

## Requirements

`make setup` downloads Bun, Typst, and Font Awesome fonts into `lib/bin/` and installs dependencies.

Install these system packages first:

**macOS:**

```bash
brew install curl jq
```

**Ubuntu / Debian:**

```bash
sudo apt install curl jq tar unzip
```

## Commands

| Command | Description |
|---|---|
| `make setup` | Install local tooling |
| `make sync` | Merge upstream changes into your repo |
| `make schema` | Regenerate `lib/schema.json` for editor autocomplete |
| `make build` | Build every resume in `resumes/` |
| `make build ARGS="resumes/resume-en.yml"` | Build one resume |
| `make watch` | Watch all resumes and templates |
| `bun lib/src/resume-ci.ts --watch resumes/resume-en.yml` | Watch one resume |
| `bun lib/src/resume-ci.ts --output-dir dist` | Use a custom output directory |

## YAML Structure

Copy an example and edit it:

```bash
cp resumes/resume-en.example.yml resumes/resume-en.yml
```

Smallest useful shape:

```yaml
# yaml-language-server: $schema=../lib/schema.json

meta:
  template: default
  font: New Computer Modern
  output_filename: resume_john_doe_en
  locale: en
  section_titles:
    work: Experience
    projects: Projects
    education: Education
    skills: Technical Skills

basics:
  name: John Doe
  label: Full Stack Developer
  email: john.doe@example.invalid
  summary: Short profile text.
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
    url: https://company.example.invalid
    highlights:
      - Built **REST APIs** with **Node.js** and **PostgreSQL**.

projects: []
certificates: []
education: []
skills: []
languages: []
```

Use `[]` to hide any list-backed section. Omit `endDate` for current roles; the PDF shows the locale's present label.

## JSON Resume Compatibility

The YAML uses [JSON Resume](https://jsonresume.org/schema) field names:

| Field | Rendered as |
|---|---|
| `basics.name` | Header name |
| `basics.label` | Header title |
| `basics.email`, `phone`, `url`, `location`, `profiles` | Contact row |
| `basics.summary` | Summary section |
| `work[].name`, `position`, `highlights` | Experience entries |
| `volunteer[].organization`, `position`, `highlights` | Volunteer entries |
| `projects[].name`, `roles`, `highlights` | Project entries |
| `awards[].title`, `awarder` | Award entries |
| `certificates[].name`, `issuer` | Certification entries |
| `publications[].name`, `publisher` | Publication entries |
| `education[].institution`, `studyType`, `area` | Education entries |
| `skills[].name`, `keywords` | Skill groups |
| `languages[].language`, `fluency` | Language entries |
| `interests[].name`, `keywords` | Interest entries |
| `references[].name`, `reference` | Reference entries |

Dates use ISO-style format: `YYYY`, `YYYY-MM`, or `YYYY-MM-DD`.

Extra JSON Resume fields pass validation but may not render in the default template.

## Editor Autocomplete

Add this comment to the top of any resume file for inline validation and autocomplete in VS Code, Neovim, or any editor with a YAML language server:

```yaml
# yaml-language-server: $schema=../lib/schema.json
```

> [!NOTE]
> `lib/schema.json` is generated from `lib/src/schema.ts`. Do not edit it by hand. After changing the Zod schema, run `make schema`.

## `meta` Reference

`meta` extends JSON Resume's own `meta` object with build and presentation settings.

| Field | Default | Notes |
|---|---|---|
| `meta.template` | `default` | Template name without `.typ` |
| `meta.font` | `New Computer Modern` | Typst font family name |
| `meta.output_filename` | derived from `basics.name` | PDF filename without `.pdf` |
| `meta.locale` | `en` | BCP 47 locale for date formatting (`en`, `pt-BR`, `es`, …) |
| `meta.present_label` | derived from `locale` | Label for roles with no `endDate` (`Present`, `Atual`, `Actualidad`) |
| `meta.section_titles` | section defaults | Custom section labels |
| `meta.canonical`, `meta.version`, `meta.lastModified` | — | Standard JSON Resume metadata |

`meta.locale` formats dates across the PDF (`2024-09` renders as `Sep 2024` in `en` and `Set 2024` in `pt-BR`) and sets the default open-role label. Use `meta.present_label` to override it.

```yaml
meta:
  locale: pt-BR
  present_label: Atual
```

Section title keys use JSON Resume section names:

```yaml
meta:
  section_titles:
    summary: Professional Summary
    work: Experience
    projects: Projects
    certificates: Certifications
    education: Education
    skills: Technical Skills
```

## Bullet Formatting

Bullets and text fields support:

| Syntax | Output |
|---|---|
| `**text**` | bold |
| `_text_` | italic |

## Templates

Templates are single Typst files in `templates/`. Pick one in YAML:

```yaml
meta:
  template: my-template
```

`meta.font` must be a valid Typst font family name.

## GitHub Actions

The workflow triggers on pushes to `main` when resume, template, or builder files change. Each run creates a GitHub Release tagged `build-<run_number>` with the PDFs attached.
