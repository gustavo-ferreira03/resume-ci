# resume-ci

Write your resume in YAML, keep it in Git, and build PDFs with [Typst](https://typst.app) locally or in CI.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Resume content follows the [JSON Resume](https://jsonresume.org/schema) shape: `basics`, `work`, `education`, `skills`, `projects`, and the other standard sections. Use `meta` for resume-ci settings such as the template, font, output name, and section titles.

## Quick Start

```bash
git clone https://github.com/gustavo-ferreira03/resume-ci.git my-resume
cd my-resume
cp resumes/resume-en.example.yml resumes/resume-en.yml
make setup
```

Edit `resumes/resume-en.yml` with your information, then:

```bash
make build
```

PDFs are written to `build/`.

## Requirements

`make setup` installs Bun if needed, installs the Bun dependencies, downloads Typst, and places the Font Awesome fonts under `lib/bin/`.

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
| `make sync` | Pull upstream tooling/template updates, leaving your resumes untouched |
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

Use `[]` to hide a list-backed section. For current roles, omit `endDate`; the PDF will show `Present`.

> Writing the resume content? [`AGENTS.md`](AGENTS.md) covers strong, honest bullets: STAR structure, evidence standards, and AI-writing tells to avoid.

## JSON Resume Compatibility

The YAML uses JSON Resume field names:

| JSON Resume field | Rendered as |
|---|---|
| `basics.name` | Header name |
| `basics.label` | Header title |
| `basics.email`, `phone`, `url`, `location`, `profiles` | Contact row |
| `basics.summary` | Summary section |
| `work` | Experience section |
| `work[].name` | Company |
| `work[].position` | Role |
| `work[].highlights` | Bullets |
| `volunteer` | Volunteer section |
| `projects` | Projects section |
| `projects[].name` | Project name |
| `projects[].roles` | Project role line |
| `projects[].highlights` | Bullets |
| `awards` | Awards section |
| `certificates` | Certifications section |
| `publications` | Publications section |
| `education` | Education section |
| `skills[].name` | Skill group label |
| `skills[].keywords` | Skill list |
| `languages` | Languages section |
| `interests` | Interests section |
| `references` | References section |

Dates must use JSON Resume's ISO-style format: `YYYY`, `YYYY-MM`, or `YYYY-MM-DD` for `startDate`, `endDate`, `date`, and similar fields.

Extra JSON Resume fields pass validation, but the default template only renders fields it knows about.

## Editor Autocomplete

Keep this comment at the top of each resume to get autocomplete and inline validation in editors with a YAML language server, such as VS Code or Neovim:

```yaml
# yaml-language-server: $schema=../lib/schema.json
```

`lib/schema.json` is generated from `lib/src/schema.ts`. Do not edit it by hand. If you change the Zod schema, run `make schema`.

## `meta` Extension

`meta` holds build and presentation settings. JSON Resume already allows `meta`, so resume-ci adds its own keys there.

| Field | Required | Notes |
|---|---|---|
| `meta.template` | no | Template name without `.typ`; defaults to `default` |
| `meta.font` | no | Typst font family name; defaults to `New Computer Modern` |
| `meta.output_filename` | no | PDF file name without `.pdf`; generated from `basics.name` if omitted |
| `meta.locale` | no | BCP 47 locale for date formatting (e.g. `en`, `pt-BR`, `es`); defaults to `en` |
| `meta.present_label` | no | Label for ongoing roles with no `endDate`; derived from `locale` if omitted (`Present`, `Atual`, `Actualidad`) |
| `meta.section_titles` | no | Custom section labels |
| `meta.canonical`, `meta.version`, `meta.lastModified` | no | JSON Resume metadata fields |

`meta.locale` controls how dates are formatted throughout the PDF. `2024-09` becomes `Sep 2024` in English, `Set 2024` in Portuguese, and `Sep 2024` in Spanish — month name taken from the locale, year appended. It also sets the default label for ongoing roles: `Present`, `Atual`, or `Actualidad`. Override that label with `meta.present_label` if needed.

```yaml
meta:
  locale: pt-BR          # Sep 2024 → Set 2024, omitted endDate → Atual
  present_label: Atual   # explicit override (optional when locale is set)
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

Bullets and text fields support two Markdown-style markers:

| Syntax | Output |
|---|---|
| `**text**` | bold |
| `_text_` | italic |

## Templates

Templates are single Typst files in `templates/`. Pick one in YAML:

```yaml
meta:
  template: my-template  # resolves to templates/my-template.typ
```

`meta.font` must be a Typst font family name.

## GitHub Actions

The workflow runs on pushes to `main` when resume, template, or builder files change.

Each push creates a GitHub Release tagged `build-<run_number>` with the generated PDFs attached.

## Syncing With Upstream

Commit or stash your changes, then run:

```bash
make sync
```

Merges the latest upstream changes into your fork. Deleted files (such as the example resumes) stay deleted. If a conflict can't be resolved automatically, sync stops and tells you which files to fix before running `git merge --continue`.
