# AGENTS.md

Instructions for agents creating or editing resumes in this repository.

## Project Context

- Resume content lives in `resumes/*.yml`.
- The CLI builder lives in `lib/resume-ci.ts` (Bun/TypeScript).
- Each template is a folder `templates/<name>/` containing `template.typ` and `schema.ts`.
- `schema.ts` owns the Zod input schema, data-normalization helpers, and `buildContext`.
- `make setup` (Linux/macOS) or `lib/setup.ps1` (Windows) installs Bun, npm dependencies, Typst, and Font Awesome desktop fonts into `lib/bin/`.
- Keep resume YAML files compatible with the schema and examples.

## YAML Rules

- Use the existing shape from `resumes/*.example.yml`.
- Keep keys stable: `personal`, `summary`, `font`, `section_titles`, `experience`, `projects`, `certifications`, `education`, `skills`, `output_filename`.
- Use a real Typst font name in `font`; default examples use `New Computer Modern`.
- Use `[]` to hide any list-backed section; keep required keys present even when empty.
- Use only letters, digits, `_`, and `-` in `output_filename`.
- Do not add unsupported fields unless the schema and builder are updated together.
- Preserve Markdown-style emphasis in bullets only where useful: `**bold**` and `_italic_`.

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

Run setup first if `lib/bin/typst` or `lib/bin/fonts` are missing:

```bash
# Linux / macOS
make setup

# Windows (PowerShell)
lib/setup.ps1
```

Useful build command:

```bash
make build
```

Preview while editing:

```bash
make watch                                                # watches all resumes/
bun lib/src/resume-ci.ts --watch resumes/my-resume.yml    # watch a single file
```

Use a non-default template:

```bash
make build --template my-template
```

## Builder And Template Boundaries

- `lib/resume-ci.ts` owns orchestration: finding files, loading the template module, and calling Typst.
- `templates/<name>/schema.ts` owns what each template accepts (Zod `schema`) and how to transform it (`buildContext`).
- `templates/<name>/template.typ` owns presentation: page size, margins, spacing, typography, sections, lists, links, and icons.
- The builder passes normalized data to Typst as JSON through `sys.inputs.data`.
- Do not make Typst templates load YAML directly or duplicate normalization logic from `schema.ts`.
- When adding a field, update `schema.ts` (Zod + `buildContext`) and `template.typ` together.

## Section Guidance

- `personal`: keep contact fields accurate and complete.
- `experience`: prioritize 3-6 strong bullets per role when possible.
- `projects`: include projects only when they add relevant proof not already covered by experience.
- `education`: keep concise unless the credential is central to the target role.
- `skills`: group real skills by category; do not keyword-stuff tools the candidate cannot discuss.
- `section_titles`: translate section labels consistently when writing non-English resumes.

## Final Review Checklist

Before finishing a resume edit, verify:

- YAML is valid against the template's Zod schema (`templates/default/schema.ts`).
- Every major bullet can be traced to STAR.
- No metric or claim was invented.
- Bullets start with strong action verbs.
- The language is plain and specific.
- No obvious AI writing patterns remain.
- The target role is clear from the title, summary if present, and top bullets.
- The output file name is valid.
