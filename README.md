# resume-ci

Build PDF resumes from YAML. Write once, push to GitHub, download from Releases.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

You write your content in `resumes/*.yml`. The design lives in `template.tex`. GitHub Actions builds the PDFs automatically.

## What You Get

- Resume content in plain YAML
- One LaTeX template for the design
- Automatic builds for every `.yml` file in `resumes/`
- English, Spanish, and Portuguese (BR) examples
- Text-extractable PDFs that work better with ATS parsers

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

Then add your resume:

```bash
cp resumes/resume-en.example.yml resumes/resume-en.yml
```

Edit `resumes/resume-en.yml`, push to `main`, and grab the PDF from the latest release on the Releases tab.

## Pulling Updates

When this template changes:

```bash
git fetch upstream
git merge upstream/main
```

Your own resume files shouldn't conflict with upstream unless you edit the same example or template files.

## How It Works

```text
resumes/*.yml + template.tex
        |
        v
lib/resume-ci.py  validates YAML and writes build/*.tex
        |
        v
Tectonic       compiles build/*.tex to PDF
        |
        v
GitHub Releases        publishes each PDF as a downloadable asset
```

The workflow validates each resume file, renders a `.tex` file into `build/`, and compiles it with Tectonic.

You do not need TeX Live. `lib/setup.sh` (Linux/macOS) or `lib/setup.ps1` (Windows) installs Tectonic when it is missing, and Tectonic fetches missing TeX packages automatically.

## Repository Structure

```text
resumes/
  resume-en.example.yml       English example
  resume-es.example.yml       Spanish example
  resume-ptbr.example.yml     Portuguese (BR) example
template.tex                  LaTeX layout
lib/
  resume-ci.py                YAML to TEX/PDF builder
  setup.sh                      Local/CI setup script (Linux/macOS)
  setup.ps1                     Local setup script (Windows)
  requirements.txt            Python dependencies
.github/
  workflows/build.yml         GitHub Actions workflow
```

## Multiple Resumes

Add one YAML file per version. The workflow compiles every `*.yml` file in `resumes/`.

```text
resumes/resume-en.yml    ->  resume_your_name_en.pdf
resumes/resume-es.yml    ->  curriculum_su_nombre_es.pdf
resumes/resume-ptbr.yml  ->  curriculo_seu_nome_ptbr.pdf
```

Use separate files for languages, job targets, or resume lengths. Each file builds on its own.

## YAML Reference

Start with one of the example files in [`resumes/`](resumes/). These are the main fields:

| Field | What it controls |
|---|---|
| `personal` | Name, title, email, phone, location, LinkedIn URL, and GitHub URL |
| `summary` | Optional short profile summary |
| `font` | Font preset; defaults to `lmodern` |
| `section_titles` | Section labels, useful for non-English resumes |
| `experience` | Roles with company, period, URL, and bullets |
| `projects` | Same shape as `experience`; set it to `[]` to hide the section |
| `certifications` | Optional list of certifications |
| `education` | Institution, degree, location, and period |
| `skills` | List of `label` and `items` pairs |
| `output_filename` | PDF file name without the `.pdf` extension |

Use only letters, digits, `_`, and `-` in `output_filename`.

## Bullet Formatting

The builder supports two Markdown-style markers inside resume bullets:

| Marker | PDF output |
|---|---|
| `**text**` | bold text |
| `_text_` | italic text |

## Customizing The Layout

Edit `template.tex` to change margins, colors, font sizes, or section order.

The template uses simple `{{placeholder}}` tags. There is no template framework to learn.

## Running Locally

Local builds need Python 3.10+. The setup script installs Python dependencies and Tectonic if missing.

```bash
# Linux / macOS
lib/setup.sh
lib/resume-ci.py

# Windows (PowerShell)
lib/setup.ps1
lib/resume-ci.py
```

Use `--watch` to rebuild automatically when you edit the YAML or template:

```bash
lib/resume-ci.py --watch resumes/your-resume.yml
```

Generated PDFs are written to `build/`.
