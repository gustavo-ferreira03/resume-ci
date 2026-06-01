# resume-ci

Write your resume in YAML, keep it in Git, and build PDFs with [Typst](https://typst.app) locally or in CI.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Resume content follows the [JSON Resume](https://jsonresume.org/schema) shape: `basics`, `work`, `education`, `skills`, `projects`, and the other standard sections. Use `meta` for resume-ci settings such as the template, font, output name, and section titles.

## Quick Start

```bash
cp resumes/resume-en.example.yml resumes/resume-en.yml
make setup
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
| `meta.section_titles` | no | Custom section labels |
| `meta.canonical`, `meta.version`, `meta.lastModified` | no | JSON Resume metadata fields |

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

If you started your resume from this repository, `make sync` pulls the latest tooling and template without disturbing your content:

```bash
make sync
```

It mirrors a small set of **upstream-owned** paths and leaves everything else alone:

| Path | Owner | On sync |
|---|---|---|
| `lib/`, `.github/`, `Makefile`, `templates/default.typ` | upstream | overwritten to match upstream (edits, additions, and deletions all propagate) |
| `resumes/`, your own `templates/*.typ`, the docs | you | never touched |

Because it copies paths rather than merging, it can't raise a conflict on your resumes or a customized template. Changes land **staged** for you to review with `git diff --cached` and commit when ready — nothing is committed automatically.

Two notes:

- `make sync` first adds an `upstream` remote pointing at this repository if you don't have one, then refuses to run if any upstream-owned path has uncommitted changes (so it never discards local engine edits). Resume edits never block it.
- To change what sync manages, edit the `SYNC_PATHS` list at the top of `lib/sync.sh` — add a path to let sync own it, or remove one to take ownership yourself.
