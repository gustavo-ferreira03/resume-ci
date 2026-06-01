export interface RichPart { text: string; style: "" | "strong" | "emph" }

const RICH_RE = /\*\*(.+?)\*\*|_(.+?)_/g

export function rich(value: string): RichPart[] {
  const parts: RichPart[] = []
  let pos = 0
  for (const match of value.matchAll(RICH_RE)) {
    if (match.index! > pos)
      parts.push({ text: value.slice(pos, match.index), style: "" })
    parts.push({ text: (match[1] ?? match[2])!, style: match[1] !== undefined ? "strong" : "emph" })
    pos = match.index! + match[0].length
  }
  if (pos < value.length)
    parts.push({ text: value.slice(pos), style: "" })
  return parts
}

const PRESENT_LABELS: Record<string, string> = {
  en: "Present",
  "pt-BR": "Atual",
  pt: "Atual",
  es: "Actualidad",
}

export function resolvePresentLabel(locale: string, override?: string): string {
  return override ?? PRESENT_LABELS[locale] ?? "Present"
}

export function formatIsoDate(iso: string, locale: string): string {
  const [year, month] = iso.split("-")
  if (!month) return iso
  const name = new Intl.DateTimeFormat(locale, { month: "short" })
    .format(new Date(+year, +month - 1, 1))
    .replace(/\.$/, "")
    .replace(/^./, c => c.toUpperCase())
  return `${name} ${year}`
}

export function periodStr(period?: { from: string; to: string }): string {
  if (!period) return ""
  const from = period.from.trim()
  const to = period.to.trim()
  return from && to ? `${from} — ${to}` : from || to
}

export function extractDomain(url: string): string {
  try {
    const host = new URL(url).hostname
    const parts = host.split(".")
    const keep = /\.(com|org|net|gov|edu)\.[a-z]{2}$/.test(host) ? 3 : 2
    return parts.length > keep ? parts.slice(-keep).join(".") : host
  } catch { return "" }
}

export function extractUsername(url: string): string {
  try {
    const path = new URL(url).pathname.replace(/^\/|\/$/g, "")
    return path.split("/").at(-1) ?? url.replace(/^https?:\/\//, "")
  } catch { return url.replace(/^https?:\/\//, "") }
}
