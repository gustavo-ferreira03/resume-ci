import { z } from "zod"
import { rich, periodStr, extractDomain, extractUsername } from "./utils.ts"

const role = z.object({
  company: z.string().min(1),
  role: z.string().min(1),
  bullets: z.array(z.string()),
  period: z.object({ from: z.string().min(1), to: z.string().min(1) }).optional(),
  url: z.url().optional(),
})

const education = z.object({
  institution: z.string().min(1),
  degree: z.string().min(1),
  location: z.string().min(1),
  period: z.object({ from: z.string().min(1), to: z.string().min(1) }).optional(),
})

export const resumeSchema = z.object({
  summary: z.string().min(1).optional(),
  meta: z.object({
    template: z.string().default("default"),
    font: z.string().trim().min(1).default("New Computer Modern"),
    output_filename: z.string().regex(/^[A-Za-z0-9_-]+$/),
    section_titles: z.object({
      summary:        z.string().min(1).default("Professional Summary"),
      experience:     z.string().min(1).default("Experience"),
      projects:       z.string().min(1).default("Projects"),
      certifications: z.string().min(1).default("Certifications"),
      education:      z.string().min(1).default("Education"),
      skills:         z.string().min(1).default("Technical Skills"),
    }).default({
      summary:        "Professional Summary",
      experience:     "Experience",
      projects:       "Projects",
      certifications: "Certifications",
      education:      "Education",
      skills:         "Technical Skills",
    }),
  }),
  personal: z.object({
    name: z.string().min(1),
    title: z.string().min(1),
    email: z.email(),
    phone: z.string().min(1).optional(),
    location: z.string().min(1).optional(),
    linkedin_url: z.url().optional(),
    github_url: z.url().optional(),
  }),
  experience: z.array(role),
  projects: z.array(role).default([]),
  certifications: z.array(z.string()).default([]),
  education: z.array(education),
  skills: z.array(z.object({ label: z.string().min(1), items: z.string().min(1) })),
}).transform(data => {
  const p = data.personal

  const toRole = (item: z.infer<typeof role>) => {
    const u = item.url ?? ""
    return {
      company: rich(item.company),
      period:  periodStr(item.period),
      role:    rich(item.role),
      url:     u,
      domain:  u ? extractDomain(u) : "",
      bullets: item.bullets.map(rich),
    }
  }

  const contact = [
    { icon: "envelope", solid: true,  href: `mailto:${p.email}`, text: p.email },
    ...(p.phone        ? [{ icon: "phone",    solid: true,  href: "",             text: p.phone }]                                        : []),
    ...(p.location     ? [{ icon: "",         solid: false, href: "",             text: p.location }]                                     : []),
    ...(p.linkedin_url ? [{ icon: "linkedin", solid: false, href: p.linkedin_url, text: extractUsername(p.linkedin_url) }]                : []),
    ...(p.github_url   ? [{ icon: "github",   solid: false, href: p.github_url,   text: extractUsername(p.github_url) }]                  : []),
  ]

  return {
    meta:          data.meta,
    personal:      { name: rich(p.name), title: rich(p.title) },
    contact,
    summary:       rich(data.summary ?? ""),
    experience:    data.experience.map(toRole),
    projects:      data.projects.map(toRole),
    certifications: data.certifications.map(rich),
    education:     data.education.map(item => ({
      institution: rich(item.institution),
      period:      periodStr(item.period),
      degree:      rich(item.degree),
      location:    rich(item.location),
    })),
    skills: data.skills.map(item => ({ label: rich(item.label), items: rich(item.items) })),
  }
})

export type ResumeContext = z.infer<typeof resumeSchema>
