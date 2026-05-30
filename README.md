# resume-ci

Build PDF resumes from YAML with Typst.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Write resume content in `resumes/*.yml`. Keep the layout in `templates/default.typ`. Push to `main`, and GitHub Actions publishes the PDFs as release assets.

## What This Does

- Stores resume content in plain YAML
- Validates YAML against `lib/resume.schema.json`
- Builds every `resumes/*.yml` file into a PDF
- Keeps the template in Typst, not LaTeX
- Includes English, Spanish, and Portuguese (BR) examples
- Produces text-extractable PDFs for ATS parsing

## Quick Start

Public repo: [fork this repository](../../fork).

Private repo: create an empty private repository on GitHub, then run:

```bash
git clone https://github.com/gustavo-ferreira03/resume-ci.git
cd resume-ci
git remote rename origin upstream
git remote add origin <PRIVATE_REPO_URL>
git push -u origin main
```

Create your own resume from an example:

```bash
cp resumes/resume-en.example.yml resumes/resume-en.yml
```

Edit `resumes/resume-en.yml`, push to `main`, and download the PDF from the latest release.

## Local Build

Local builds need Python 3.10+, `curl`, `tar`, `unzip`, and a POSIX shell. The setup script installs Python dependencies, Typst, and the Font Awesome desktop fonts used by the default template.

```bash
lib/setup.sh
lib/resume-ci.py
```

Generated PDFs are written to `build/`.

For live preview, use `--watch`:

```bash
lib/resume-ci.py --watch resumes/resume-en.yml
```

The watch mode is handled by Python. It rebuilds when the selected YAML file or the Typst template changes.

## How It Works

```text
resumes/*.yml
        |
        v
lib/resume-ci.py  validates and normalizes resume data
        |
        v
templates/default.typ  formats the normalized data
        |
        v
Typst  writes build/*.pdf
```

Python owns data work: schema validation, defaults, periods, contact labels, domains, and `**bold**` / `_italic_` parsing.

Typst owns presentation work: page size, spacing, typography, sections, lists, links, and icons.

The builder passes normalized data to Typst as JSON through `sys.inputs.data`. The template should not load or normalize YAML directly.

## Repository Structure

```text
resumes/
  resume-en.example.yml       English example
  resume-es.example.yml       Spanish example
  resume-ptbr.example.yml     Portuguese (BR) example
templates/
  default.typ                 Default Typst layout
lib/
  resume-ci.py                YAML validator and Typst runner
  setup.sh                    Local/CI setup script
  requirements.txt            Python dependencies
  resume.schema.json          Resume YAML schema
.github/
  workflows/build.yml         GitHub Actions workflow
```

## Multiple Resumes

Add one YAML file per resume version. The workflow compiles every `*.yml` file in `resumes/`.

```text
resumes/resume-en.yml    ->  resume_your_name_en.pdf
resumes/resume-es.yml    ->  curriculum_su_nombre_es.pdf
resumes/resume-ptbr.yml  ->  curriculo_seu_nome_ptbr.pdf
```

Use separate files for languages, job targets, or resume lengths. Each file builds independently.

## YAML Reference

Start with one of the example files in [`resumes/`](resumes/). These are the main fields:

| Field | What it controls |
|---|---|
| `personal` | Name, title, email, phone, location, LinkedIn URL, and GitHub URL |
| `summary` | Optional short profile summary |
| `font` | Typst font name; defaults to `New Computer Modern` |
| `section_titles` | Section labels for non-English resumes |
| `experience` | Roles with company, period, URL, and bullets |
| `projects` | Same shape as `experience` |
| `certifications` | Optional list of certifications |
| `education` | Institution, degree, location, and period |
| `skills` | List of `label` and `items` pairs |
| `output_filename` | PDF file name without `.pdf` |

Use only letters, digits, `_`, and `-` in `output_filename`.

Set any list-backed section to `[]` to hide it. Required list fields such as `experience`, `education`, and `skills` should stay in the YAML even when empty. Optional lists such as `projects` and `certifications` can be omitted or set to `[]`.

## Bullet Formatting

Bullets support two Markdown-style markers:

| Marker | PDF output |
|---|---|
| `**text**` | bold text |
| `_text_` | italic text |

The Python builder parses these markers before sending data to Typst.

## Templates

Edit `templates/default.typ` to change margins, fonts, spacing, section order, or contact styling.

Use `--template` to build with another Typst file:

```bash
lib/resume-ci.py --template templates/another.typ resumes/resume-en.yml
```

Keep templates focused on layout. If a value needs to be derived from YAML, do it in `lib/resume-ci.py`.

## Pulling Updates

If you forked this repo and want upstream changes:

```bash
git fetch upstream
git merge upstream/main
```

Your resume files should not conflict unless you changed the same examples or templates.

## Notes

This project no longer uses LaTeX, TeX Live, or Tectonic.

The default template uses Font Awesome icons. `lib/setup.sh` downloads the desktop fonts into `bin/fonts` so local builds and CI render the same icons.
