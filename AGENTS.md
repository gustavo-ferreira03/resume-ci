# AGENTS.md

Instructions for agents creating or editing resumes in this repository.

## Project Context

- Resume content lives in `resumes/*.yml`.
- The builder CLI lives in `lib/src/resume-ci.ts`.
- The Zod schema lives in `lib/src/schema.ts`.
- Shared rich-text and formatting helpers live in `lib/src/utils.ts`.
- Templates are single Typst files: `templates/<name>.typ`.
- Setup scripts install Bun dependencies, Typst, and Font Awesome desktop fonts into `lib/bin/`.
- GitHub Actions builds PDFs on push and uploads them as workflow artifacts; manual workflow runs also create a GitHub Release.

## YAML Rules

- Use the shape from `resumes/*.example.yml`.
- Keep top-level keys stable: `meta`, `personal`, `summary`, `experience`, `projects`, `certifications`, `education`, `skills`.
- Put build and presentation settings under `meta`.
- Use `meta.template` for the template name without `.typ`; default is `default`.
- Use a real Typst font name in `meta.font`; default examples use `New Computer Modern`.
- Use only letters, digits, `_`, and `-` in `meta.output_filename`.
- Use `meta.section_titles` for translated or customized section labels.
- Use `[]` to hide any list-backed section; keep required keys present unless the schema supplies a default.
- Do not add unsupported fields unless `lib/src/schema.ts` and the relevant template are updated together.
- Preserve Markdown-style emphasis only where useful: `**bold**` and `_italic_`.

## STAR Method

Every meaningful experience or project bullet must be grounded in STAR:

- Situation: what problem, product, team, system, customer, or constraint existed.
- Task: what the candidate owned or was expected to solve.
- Action: what the candidate personally did, including tools, decisions, and methods.
- Result: what changed after the work.

Final bullets should usually follow this pattern:

```text
Action verb + specific work + context or scope + measurable or observable result.
```

Good:

```yaml
- Refactored payment reconciliation jobs in **Python** and **PostgreSQL**, reducing daily manual review time from 3 hours to 40 minutes.
```

Weak:

```yaml
- Worked on backend improvements and helped the team become more efficient.
```

If the source material does not contain a real result, do not invent one. Ask for the missing evidence or write an honest scope-based bullet.

## Evidence Standards

- Prefer outcomes over responsibilities.
- Prefer concrete scope over generic seniority claims.
- Use metrics when they are real: percentages, time saved, revenue, cost, latency, adoption, volume, team size, tickets, users, requests, or error reduction.
- If exact metrics are unavailable, ask for a defensible approximation.
- If no metric exists, use an observable result without pretending it is quantified.
- Never fabricate employers, dates, titles, tools, projects, metrics, or credentials.

Acceptable non-metric result:

```yaml
- Standardized onboarding documentation for the support team, replacing scattered notes with a single process used for new analyst training.
```

## Anti-AI Writing Rules

Resume prose must sound specific, human, and confirmable.

Avoid:

- Generic summaries such as "results-driven professional" or "proven track record".
- Inflated language such as "visionary", "dynamic", "world-class", or "best-in-class".
- Corporate filler such as "leveraged synergies", "stakeholder ecosystem", or "cross-functional excellence".
- Passive responsibility bullets starting with "Responsible for", "Tasked with", or "Involved in".
- Vague verbs such as "helped", "supported", "handled", or "worked on" unless the contribution was truly secondary.
- AI-style constructions such as "not only X but also Y", "in today's fast-paced environment", "the ability to", and "the ever-evolving world of".

Prefer:

- Direct verbs: built, shipped, led, migrated, automated, reduced, increased, designed, launched, consolidated, analyzed, mentored.
- Plain language that a former manager would recognize.
- Specific nouns: product name, system type, customer segment, process, team, market, repository, service, dashboard, workflow.
- Short bullets with one clear claim each.

## Resume Content Workflow

1. Identify the target role, language, geography, seniority, and resume length.
2. Extract evidence from the user-provided material before rewriting.
3. Ask targeted questions only for missing facts that block strong STAR bullets.
4. Rewrite bullets to show action, scope, and result without exaggeration.
5. Remove AI tells, filler, repeated claims, and unsupported adjectives.
6. Keep the strongest and most relevant evidence near the top.
7. Validate the YAML and run the builder when changing resume files.

## Commands

Run setup first if `lib/bin/typst` or `lib/bin/fonts` are missing:

```bash
make setup
```

Build all resumes:

```bash
make build
```

Build one resume:

```bash
make build ARGS="resumes/my-resume.yml"
```

Watch all resumes:

```bash
make watch
```

Watch one resume:

```bash
bun lib/src/resume-ci.ts --watch resumes/my-resume.yml
```

Use a non-default template by setting it in YAML:

```yaml
meta:
  template: my-template
```

## Builder And Template Boundaries

- `lib/src/resume-ci.ts` owns orchestration: finding resume files, loading YAML, resolving templates, and calling Typst.
- `lib/src/schema.ts` owns input validation and normalization into the Typst JSON context.
- `templates/<name>.typ` owns presentation only: page size, margins, spacing, typography, sections, lists, links, and icons.
- The builder passes normalized data to Typst through `sys.inputs.data`.
- Do not make Typst templates load YAML directly.
- Do not duplicate schema or normalization logic inside Typst templates.
- When adding a field, update `lib/src/schema.ts`, the relevant `templates/<name>.typ`, examples, and docs together.

## Section Guidance

- `meta`: keep template, font, output filename, and section labels accurate.
- `personal`: keep contact fields accurate and complete.
- `summary`: keep concise and specific; avoid generic positioning language.
- `experience`: prioritize 3-6 strong bullets per role when possible.
- `projects`: include projects only when they add relevant proof not already covered by experience.
- `certifications`: include only credentials that matter for the target role.
- `education`: keep concise unless the credential is central to the target role.
- `skills`: group real skills by category; do not keyword-stuff tools the candidate cannot discuss.

## Final Review Checklist

Before finishing a resume edit, verify:

- YAML is valid against `lib/src/schema.ts`.
- `make build` succeeds without warnings or errors.
- Every major bullet can be traced to STAR.
- No metric or claim was invented.
- Bullets start with strong action verbs.
- The language is plain and specific.
- No obvious AI writing patterns remain.
- The target role is clear from the title, summary if present, and top bullets.
- `meta.output_filename` is valid.
