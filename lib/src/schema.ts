import { z } from "zod"
import { rich, periodStr, formatIsoDate, resolvePresentLabel, extractDomain, extractUsername } from "./utils.js"

const isoDate = z.string().regex(
  /^([1-2][0-9]{3}-[0-1][0-9]-[0-3][0-9]|[1-2][0-9]{3}-[0-1][0-9]|[1-2][0-9]{3})$/,
  "Use YYYY, YYYY-MM, or YYYY-MM-DD",
)

const profile = z.looseObject({
  network: z.string().optional(),
  username: z.string().optional(),
  url: z.url().optional(),
})

const location = z.looseObject({
  address: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  countryCode: z.string().optional(),
  region: z.string().optional(),
})

const sectionKey = z.enum([
  "summary", "work", "volunteer", "projects", "awards", "certificates",
  "publications", "education", "skills", "languages", "interests", "references",
])
type SectionKey = z.infer<typeof sectionKey>

const DEFAULT_SECTION_ORDER: SectionKey[] = [
  "summary", "work", "volunteer", "projects", "awards", "certificates",
  "publications", "education", "skills", "languages", "interests", "references",
]

const DEFAULT_SECTION_TITLES: Record<SectionKey, string> = {
  summary: "Professional Summary",
  work: "Experience",
  volunteer: "Volunteer",
  projects: "Projects",
  awards: "Awards",
  certificates: "Certifications",
  publications: "Publications",
  education: "Education",
  skills: "Technical Skills",
  languages: "Languages",
  interests: "Interests",
  references: "References",
}

const sections = z.partialRecord(sectionKey, z.string().min(1).nullable()).prefault({})

const meta = z.looseObject({
  template: z.string().default("default"),
  font: z.string().trim().min(1).default("New Computer Modern"),
  output_filename: z.string().regex(/^[A-Za-z0-9_-]+$/).optional(),
  sections,
  locale: z.string().default("en"),
  present_label: z.string().optional(),
  canonical: z.url().optional(),
  version: z.string().optional(),
  lastModified: z.string().optional(),
}).prefault({})

const basics = z.looseObject({
  name: z.string().optional(),
  label: z.string().optional(),
  image: z.string().optional(),
  email: z.email().optional(),
  phone: z.string().optional(),
  url: z.url().optional(),
  summary: z.string().optional(),
  location: location.optional(),
  profiles: z.array(profile).default([]),
}).prefault({})

const datedEntry = z.looseObject({
  url: z.url().optional(),
  startDate: isoDate.optional(),
  endDate: isoDate.optional(),
  summary: z.string().optional(),
  highlights: z.array(z.string()).default([]),
})

const workEntry = datedEntry.extend({
  name: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  position: z.string().optional(),
})

const projectEntry = datedEntry.extend({
  name: z.string().optional(),
  description: z.string().optional(),
  keywords: z.array(z.string()).default([]),
  roles: z.array(z.string()).default([]),
  entity: z.string().optional(),
  type: z.string().optional(),
})

const volunteerEntry = datedEntry.extend({
  organization: z.string().optional(),
  position: z.string().optional(),
})

const educationEntry = z.looseObject({
  institution: z.string().optional(),
  url: z.url().optional(),
  area: z.string().optional(),
  studyType: z.string().optional(),
  startDate: isoDate.optional(),
  endDate: isoDate.optional(),
  score: z.string().optional(),
  courses: z.array(z.string()).default([]),
  location: z.string().optional(),
})

const certificateEntry = z.looseObject({
  name: z.string().optional(),
  date: isoDate.optional(),
  issuer: z.string().optional(),
  url: z.url().optional(),
})

const awardEntry = z.looseObject({
  title: z.string().optional(),
  date: isoDate.optional(),
  awarder: z.string().optional(),
  summary: z.string().optional(),
})

const publicationEntry = z.looseObject({
  name: z.string().optional(),
  publisher: z.string().optional(),
  releaseDate: isoDate.optional(),
  url: z.url().optional(),
  summary: z.string().optional(),
})

const skillEntry = z.looseObject({
  name: z.string().optional(),
  level: z.string().optional(),
  keywords: z.array(z.string()).default([]),
})

const languageEntry = z.looseObject({
  language: z.string().optional(),
  fluency: z.string().optional(),
})

const interestEntry = z.looseObject({
  name: z.string().optional(),
  keywords: z.array(z.string()).default([]),
})

const referenceEntry = z.looseObject({
  name: z.string().optional(),
  reference: z.string().optional(),
})

export const resumeInputSchema = z.looseObject({
  meta,
  basics,
  work: z.array(workEntry).default([]),
  volunteer: z.array(volunteerEntry).default([]),
  education: z.array(educationEntry).default([]),
  awards: z.array(awardEntry).default([]),
  certificates: z.array(certificateEntry).default([]),
  publications: z.array(publicationEntry).default([]),
  skills: z.array(skillEntry).default([]),
  languages: z.array(languageEntry).default([]),
  interests: z.array(interestEntry).default([]),
  references: z.array(referenceEntry).default([]),
  projects: z.array(projectEntry).default([]),
})

type Location = z.infer<typeof location>
type WorkEntry = z.infer<typeof workEntry>
type ProjectEntry = z.infer<typeof projectEntry>
type VolunteerEntry = z.infer<typeof volunteerEntry>
type EducationEntry = z.infer<typeof educationEntry>
type CertificateEntry = z.infer<typeof certificateEntry>
type AwardEntry = z.infer<typeof awardEntry>
type PublicationEntry = z.infer<typeof publicationEntry>
type SkillEntry = z.infer<typeof skillEntry>
type LanguageEntry = z.infer<typeof languageEntry>
type InterestEntry = z.infer<typeof interestEntry>
type ReferenceEntry = z.infer<typeof referenceEntry>

function cleanFilename(value: string): string {
  const slug = value.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "_").replace(/^_+|_+$/g, "")
  return slug || "resume"
}

function locationText(value?: Location): string {
  if (!value) return ""
  return [value.city, value.region, value.countryCode].filter(Boolean).join(", ")
}

function profileIcon(network = "") {
  const n = network.toLowerCase()
  if (n.includes("linkedin")) return "linkedin"
  if (n.includes("github")) return "github"
  return ""
}

function dateRange(startDate?: string, endDate?: string, locale = "en", present = "Present"): string {
  if (!startDate && !endDate) return ""
  const from = startDate ? formatIsoDate(startDate, locale) : ""
  const to = endDate ? formatIsoDate(endDate, locale) : present
  return periodStr({ from, to })
}

function degreeText(item: EducationEntry): string {
  if (item.studyType && item.area) return `${item.studyType} in ${item.area}`
  return item.studyType ?? item.area ?? ""
}

export const resumeSchema = resumeInputSchema.transform(data => {
  const b = data.basics
  const locale = data.meta.locale
  const present = resolvePresentLabel(locale, data.meta.present_label)
  const filename = data.meta.output_filename ?? cleanFilename(b.name ?? "resume")

  const profileContacts = b.profiles.flatMap(item => {
    if (!item.url) return []
    return [{
      icon: profileIcon(item.network),
      solid: false,
      href: item.url,
      text: item.username ?? extractUsername(item.url),
    }]
  })

  const contact = [
    ...(b.email ? [{ icon: "envelope", solid: true, href: `mailto:${b.email}`, text: b.email }] : []),
    ...(b.phone ? [{ icon: "phone", solid: true, href: "", text: b.phone }] : []),
    ...(locationText(b.location) ? [{ icon: "", solid: false, href: "", text: locationText(b.location) }] : []),
    ...(b.url ? [{ icon: "globe", solid: true, href: b.url, text: extractDomain(b.url) }] : []),
    ...profileContacts,
  ]

  const toWork = (item: WorkEntry) => {
    const u = item.url ?? ""
    return {
      title: rich(item.name ?? ""),
      company: rich(item.name ?? ""),
      period: dateRange(item.startDate, item.endDate, locale, present),
      subtitle: rich(item.position ?? ""),
      role: rich(item.position ?? item.description ?? ""),
      description: rich(item.description ?? ""),
      location: rich(item.location ?? ""),
      summary: rich(item.summary ?? ""),
      url: u,
      domain: u ? extractDomain(u) : "",
      bullets: item.highlights.map(rich),
    }
  }

  const toProject = (item: ProjectEntry) => {
    const u = item.url ?? ""
    return {
      title: rich(item.name ?? ""),
      company: rich(item.name ?? ""),
      period: dateRange(item.startDate, item.endDate, locale, present),
      subtitle: rich(item.roles.join(", ") || item.type || item.entity || ""),
      role: rich(item.roles.join(", ") || item.type || item.entity || ""),
      summary: rich(item.description ?? ""),
      keywords: rich(item.keywords.join(", ")),
      entity: rich(item.entity ?? ""),
      type: rich(item.type ?? ""),
      url: u,
      domain: u ? extractDomain(u) : "",
      bullets: item.highlights.map(rich),
    }
  }

  const toVolunteer = (item: VolunteerEntry) => {
    const u = item.url ?? ""
    return {
      title: rich(item.organization ?? ""),
      company: rich(item.organization ?? ""),
      period: dateRange(item.startDate, item.endDate, locale, present),
      subtitle: rich(item.position ?? ""),
      role: rich(item.position ?? ""),
      summary: rich(item.summary ?? ""),
      url: u,
      domain: u ? extractDomain(u) : "",
      bullets: item.highlights.map(rich),
    }
  }

  const toEducation = (item: EducationEntry) => {
    const u = item.url ?? ""
    return {
      title: rich(item.institution ?? ""),
      institution: rich(item.institution ?? ""),
      period: dateRange(item.startDate, item.endDate, locale, present),
      subtitle: rich(degreeText(item)),
      degree: rich(degreeText(item)),
      location: rich(item.location ?? ""),
      score: rich(item.score ?? ""),
      courses: item.courses.map(rich),
      url: u,
      domain: u ? extractDomain(u) : "",
    }
  }

  const toCertificate = (item: CertificateEntry) => {
    const u = item.url ?? ""
    return {
      title: rich(item.name ?? ""),
      period: item.date ? formatIsoDate(item.date, locale) : "",
      subtitle: rich(item.issuer ?? ""),
      url: u,
      domain: u ? extractDomain(u) : "",
    }
  }

  const toAward = (item: AwardEntry) => ({
    title: rich(item.title ?? ""),
    period: item.date ? formatIsoDate(item.date, locale) : "",
    subtitle: rich(item.awarder ?? ""),
    summary: rich(item.summary ?? ""),
  })

  const toPublication = (item: PublicationEntry) => {
    const u = item.url ?? ""
    return {
      title: rich(item.name ?? ""),
      period: item.releaseDate ? formatIsoDate(item.releaseDate, locale) : "",
      subtitle: rich(item.publisher ?? ""),
      summary: rich(item.summary ?? ""),
      url: u,
      domain: u ? extractDomain(u) : "",
    }
  }

  const toSkill = (item: SkillEntry) => ({
    label: rich(item.name ?? ""),
    level: rich(item.level ?? ""),
    items: rich(item.keywords.join(", ")),
  })

  const toLanguage = (item: LanguageEntry) => ({
    label: rich(item.language ?? ""),
    items: rich(item.fluency ?? ""),
  })

  const toInterest = (item: InterestEntry) => ({
    label: rich(item.name ?? ""),
    items: rich(item.keywords.join(", ")),
  })

  const toReference = (item: ReferenceEntry) => ({
    name: rich(item.name ?? ""),
    reference: rich(item.reference ?? ""),
  })

  const work = data.work.map(toWork)
  const volunteer = data.volunteer.map(toVolunteer)
  const projects = data.projects.map(toProject)
  const certificates = data.certificates.map(toCertificate)
  const education = data.education.map(toEducation)
  const awards = data.awards.map(toAward)
  const publications = data.publications.map(toPublication)
  const skills = data.skills.map(toSkill)
  const languages = data.languages.map(toLanguage)
  const interests = data.interests.map(toInterest)
  const references = data.references.map(toReference)

  const listedKeys = Object.keys(data.meta.sections) as SectionKey[]
  const remainingKeys = DEFAULT_SECTION_ORDER.filter(key => !listedKeys.includes(key))
  const section_order = [...listedKeys, ...remainingKeys].map(key => {
    const custom = data.meta.sections[key]
    return { key, title: custom == null ? DEFAULT_SECTION_TITLES[key] : custom }
  })

  return {
    meta: {
      ...data.meta,
      output_filename: filename,
      section_order,
    },
    personal: { name: rich(b.name ?? ""), title: rich(b.label ?? ""), image: b.image ?? "" },
    contact,
    summary: rich(b.summary ?? ""),
    work,
    experience: work,
    volunteer,
    projects,
    awards,
    certificates,
    certifications: certificates,
    publications,
    education,
    skills,
    languages,
    interests,
    references,
  }
})

export type ResumeContext = z.infer<typeof resumeSchema>
export type ResumeInput = z.input<typeof resumeInputSchema>
