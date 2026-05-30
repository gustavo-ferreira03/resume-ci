import { z } from "zod"
import { rich, periodStr, extractDomain, extractUsername } from "../../lib/utils.ts"

const nonEmpty = z.string().regex(/\S/, "must not be blank")
const urlString = z.string().url().min(1)

const periodSchema = z.object({
  from: nonEmpty,
  to: nonEmpty,
})

const roleEntry = z.object({
  company: nonEmpty,
  role: nonEmpty,
  bullets: z.array(z.string()),
  period: periodSchema.optional(),
  url: urlString.optional(),
}).strict()

const educationEntry = z.object({
  institution: nonEmpty,
  degree: nonEmpty,
  location: nonEmpty,
  period: periodSchema.optional(),
}).strict()

const skillEntry = z.object({
  label: nonEmpty,
  items: nonEmpty,
}).strict()

export const schema = z.object({
  personal: z.object({
    name: nonEmpty,
    title: nonEmpty,
    email: z.string().email().min(1),
    phone: nonEmpty.optional(),
    location: nonEmpty.optional(),
    linkedin_url: urlString.optional(),
    github_url: urlString.optional(),
  }).strict(),
  summary: nonEmpty.optional(),
  font: z.string().min(1).default("New Computer Modern"),
  section_titles: z.object({
    summary: nonEmpty.optional(),
    experience: nonEmpty.optional(),
    projects: nonEmpty.optional(),
    certifications: nonEmpty.optional(),
    education: nonEmpty.optional(),
    skills: nonEmpty.optional(),
  }).strict().optional(),
  experience: z.array(roleEntry),
  projects: z.array(roleEntry).default([]),
  certifications: z.array(z.string()).default([]),
  education: z.array(educationEntry),
  skills: z.array(skillEntry),
  output_filename: z.string().regex(/^[A-Za-z0-9_-]+$/).min(1),
}).strict()

type Input = z.infer<typeof schema>

type ContactItem = { icon: string; solid: boolean; href: string; text: string }

const SECTION_TITLES = {
  summary: "Professional Summary",
  experience: "Experience",
  projects: "Projects",
  certifications: "Certifications",
  education: "Education",
  skills: "Technical Skills",
}

function buildContacts(personal: Input["personal"]): ContactItem[] {
  return [
    { icon: "envelope",  solid: true,  href: `mailto:${personal.email}`, text: personal.email },
    personal.phone        && { icon: "phone",    solid: true,  href: "", text: personal.phone },
    personal.location     && { icon: "",         solid: false, href: "", text: personal.location },
    personal.linkedin_url && { icon: "linkedin", solid: false, href: personal.linkedin_url, text: extractUsername(personal.linkedin_url) },
    personal.github_url   && { icon: "github",   solid: false, href: personal.github_url,   text: extractUsername(personal.github_url) },
  ].filter((x): x is ContactItem => !!x)
}

function buildRole(item: z.infer<typeof roleEntry>) {
  const url = item.url ?? ""
  return {
    company: rich(item.company),
    period: periodStr(item.period),
    role: rich(item.role),
    url,
    domain: url ? extractDomain(url) : "",
    bullets: item.bullets.map(rich),
  }
}

function buildEducation(item: z.infer<typeof educationEntry>) {
  return {
    institution: rich(item.institution),
    period: periodStr(item.period),
    degree: rich(item.degree),
    location: rich(item.location),
  }
}

export function buildContext(data: Input): Record<string, unknown> {
  return {
    personal: {
      name: rich(data.personal.name),
      title: rich(data.personal.title),
    },
    contact: buildContacts(data.personal),
    summary: rich(data.summary ?? ""),
    font: data.font,
    section_titles: { ...SECTION_TITLES, ...(data.section_titles ?? {}) },
    experience: data.experience.map(buildRole),
    projects: data.projects.map(buildRole),
    certifications: data.certifications.map(rich),
    education: data.education.map(buildEducation),
    skills: data.skills.map(item => ({
      label: rich(item.label),
      items: rich(item.items),
    })),
    output_filename: data.output_filename,
  }
}
