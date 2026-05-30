import { z } from "zod"

export const role = z.object({
  company: z.string().min(1),
  role:    z.string().min(1),
  bullets: z.array(z.string()),
  period:  z.object({ from: z.string().min(1), to: z.string().min(1) }).optional(),
  url:     z.url().optional(),
})

export const education = z.object({
  institution: z.string().min(1),
  degree:      z.string().min(1),
  location:    z.string().min(1),
  period:      z.object({ from: z.string().min(1), to: z.string().min(1) }).optional(),
})

export const resumeSchema = z.object({
  summary:        z.string().min(1).optional(),
  font:           z.string().default("New Computer Modern"),
  section_titles: z.object({
    summary:        z.string().min(1).optional(),
    experience:     z.string().min(1).optional(),
    projects:       z.string().min(1).optional(),
    certifications: z.string().min(1).optional(),
    education:      z.string().min(1).optional(),
    skills:         z.string().min(1).optional(),
  }).optional(),
  personal: z.object({
    name:         z.string().min(1),
    title:        z.string().min(1),
    email:        z.email(),
    phone:        z.string().min(1).optional(),
    location:     z.string().min(1).optional(),
    linkedin_url: z.url().optional(),
    github_url:   z.url().optional(),
  }),
  experience:      z.array(role),
  projects:        z.array(role).default([]),
  certifications:  z.array(z.string()).default([]),
  education:       z.array(education),
  skills:          z.array(z.object({ label: z.string().min(1), items: z.string().min(1) })),
  output_filename: z.string().regex(/^[A-Za-z0-9_-]+$/),
})

export type Resume = z.infer<typeof resumeSchema>
