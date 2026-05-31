# resume-ci

Build PDF resumes from YAML with [Typst](https://typst.app).

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Write your resume content in YAML, version it with Git, and generate polished PDFs locally or through GitHub Actions. Fork or use this as a template repository — your content stays in plain text, your PDFs are always one command away.

## Quick Start

```bash
cp resumes/resume-en.example.yml resumes/resume-en.yml
make setup
make build
```

PDFs are written to `build/`.

## Requirements

`make setup` handles everything: it installs Bun (if missing), Typst, and Font Awesome fonts into `lib/bin/`. The following system tools must already be present:

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
| `make setup` | Install all dependencies |
| `make build` | Build every resume in `resumes/` |
| `make build ARGS="resumes/resume-en.yml"` | Build a single resume |
| `make watch` | Watch all resumes and templates, rebuild on change |
| `make sync` | Sync fork with upstream, keeping `resumes/` untouched |
| `bun lib/src/resume-ci.ts --watch resumes/resume-en.yml` | Watch a single resume |
| `bun lib/src/resume-ci.ts --output-dir dist` | Use a custom output directory |

## YAML Structure

Start from an example:

```bash
cp resumes/resume-en.example.yml resumes/resume-en.yml
```

```yaml
meta:
  template: default
  font: New Computer Modern
  output_filename: resume_alex_morgan_en
  section_titles:
    experience: Experience
    projects: Projects
    education: Education
    skills: Technical Skills

personal:
  name: Alex Morgan
  title: Full Stack Developer
  email: alex.morgan@example.com
  phone: "+1 555 000 0000"                              # optional
  location: "City, State"                               # optional
  linkedin_url: https://linkedin.com/in/alex-morgan     # optional
  github_url: https://github.com/alex-morgan             # optional

summary: Short profile text.                            # optional

experience:
  - company: Example Corp
    role: Full Stack Developer
    period: { from: Jan 2022, to: Present }
    url: https://example.com                            # optional
    bullets:
      - Built **REST APIs** with **Node.js** and **PostgreSQL**.

projects: []        # same shape as experience; company = project name
certifications: []  # list of plain strings

education:
  - institution: State University
    degree: Bachelor of Science in Computer Science
    location: City, State
    period: { from: Aug 2018, to: May 2022 }

skills:
  - label: Backend
    items: TypeScript, Node.js, PostgreSQL
```

Set any list section to `[]` to hide it from the PDF.

### Field Reference

| Field | Required | Notes |
|---|---|---|
| `meta.template` | no | Template name without `.typ`; defaults to `default` |
| `meta.font` | no | Typst font family name; defaults to `New Computer Modern` |
| `meta.output_filename` | yes | Letters, digits, `_`, and `-` only |
| `meta.section_titles` | no | Section label overrides; each field defaults to English |
| `summary` | no | Short profile summary shown below the header |
| `experience` | yes | Work history entries |
| `projects` | no | Defaults to `[]` |
| `certifications` | no | Defaults to `[]` |
| `education` | yes | Education entries |
| `skills` | yes | Grouped skill rows |

### Bullet Formatting

Bullets and text fields support a small Markdown subset:

| Syntax | Output |
|---|---|
| `**text**` | bold |
| `_text_` | italic |

## Templates

Templates are single Typst files in `templates/`. Select one from your YAML:

```yaml
meta:
  template: my-template  # resolves to templates/my-template.typ
```

> [!NOTE]
> `meta.font` must be a Typst font family name.

## GitHub Actions

The workflow runs on pushes to `main` when resume, template, or builder files change.

Every push creates a GitHub Release tagged `build-<run_number>` with the generated PDFs attached.

## Pulling Updates

```bash
make sync
```

Merges upstream changes into your fork while keeping `resumes/` untouched.
