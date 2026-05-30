# resume-ci

Build PDF resumes from YAML with Typst.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Write resume content in `resumes/*.yml`. Push to `main` and GitHub Actions publishes the PDFs as release assets.

## Prerequisites

`curl`, `jq`, `tar`, `unzip` — Bun is installed automatically by `./setup.sh`.

## Quick Start

Public repo: [fork this repository](../../fork).

Private repo:

```bash
git clone https://github.com/gustavo-ferreira03/resume-ci.git
cd resume-ci
git remote rename origin upstream
git remote add origin <PRIVATE_REPO_URL>
git push -u origin main
```

Create your resume from the example:

```bash
cp resumes/resume-en.example.yml resumes/resume-en.yml
```

Edit `resumes/resume-en.yml`, push to `main`, and download the PDF from the latest release.

## Local Build

```bash
# Linux / macOS
make setup   # installs dependencies, Typst, and Font Awesome fonts
make build   # builds all resumes in resumes/

# Windows (PowerShell)
lib/setup.ps1
bun lib/src/resume-ci.ts
```

PDFs are written to `build/`.

Live preview while editing:

```bash
# Linux / macOS
make watch                # watches all resumes/
make build ARGS="--watch" # same as above

# Windows (PowerShell)
bun lib/src/resume-ci.ts --watch
```

## How It Works

```text
resumes/*.yml
      |
      v
lib/resume-ci.ts  validates and normalizes resume data
      |
      v
templates/default/schema.ts  defines the schema and Typst context
      |
      v
templates/default/template.typ  formats the data
      |
      v
Typst  writes build/*.pdf
```

The builder passes normalized data to Typst as JSON through `sys.inputs.data`. Templates should not load or normalize YAML directly.

## Repository Structure

```text
resumes/
  resume-en.example.yml       English example
templates/
  default/
    schema.ts                 Zod schema + data normalization
    template.typ              Typst layout
lib/
  resume-ci.ts                Builder CLI
  utils.ts                    Shared data helpers
  setup.sh                    Local/CI setup script
.github/
  workflows/build.yml         GitHub Actions workflow
```

## Multiple Resumes

Add one YAML file per resume version. The builder compiles every `*.yml` in `resumes/`.

```text
resumes/resume-en.yml    ->  resume_your_name_en.pdf
resumes/resume-es.yml    ->  curriculum_su_nombre_es.pdf
resumes/resume-ptbr.yml  ->  curriculo_seu_nome_ptbr.pdf
```

## YAML Reference

Start with [`resumes/resume-en.example.yml`](resumes/resume-en.example.yml). Main fields:

| Field | What it controls |
|---|---|
| `personal` | Name, title, email, phone, location, LinkedIn URL, GitHub URL |
| `summary` | Optional short profile summary |
| `font` | Typst font name; defaults to `New Computer Modern` |
| `section_titles` | Section label overrides for non-English resumes |
| `experience` | Roles with company, period, URL, and bullets |
| `projects` | Same shape as `experience` |
| `certifications` | Optional list of certifications |
| `education` | Institution, degree, location, and period |
| `skills` | List of `label` and `items` pairs |
| `output_filename` | PDF file name without `.pdf` (letters, digits, `_`, `-`) |

Set any list section to `[]` to hide it.

## Bullet Formatting

| Marker | PDF output |
|---|---|
| `**text**` | bold |
| `_text_` | italic |

## Custom Templates

Each template is a folder under `templates/` with two files:

- `schema.ts` — Zod input schema and `buildContext` function
- `template.typ` — Typst layout

To use a non-default template:

```bash
bun lib/resume-ci.ts --template my-template
```

## Pulling Updates

```bash
git fetch upstream
git merge upstream/main
```
