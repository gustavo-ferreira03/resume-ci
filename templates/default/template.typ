#import "@preview/fontawesome:0.6.1": fa-icon

#let data = json(bytes(sys.inputs.at("data", default: "{}")))

#let rich(parts) = {
  for part in parts {
    let text = part.at("text", default: "")
    let style = part.at("style", default: "")
    if style == "strong" {
      strong(text)
    } else if style == "emph" {
      emph(text)
    } else {
      text
    }
  }
}

#let sep() = [#h(0.45em)|#h(0.45em)]
#let icon(name, solid: false) = fa-icon(name, solid: solid, size: 10pt, top-edge: "baseline")

#let contact(items) = {
  let first = true
  for item in items {
    if not first { sep() }
    first = false

    let icon-name = item.at("icon", default: "")
    let href = item.at("href", default: "")
    let label = item.at("text", default: "")
    let visible-label = if href != "" { underline(offset: 4pt, label) } else { label }
    let body = [
      #if icon-name != "" [#icon(icon-name, solid: item.at("solid", default: false))]
      #visible-label
    ]
    if href != "" {
      link(href)[#body]
    } else {
      body
    }
  }
}

#let maybe-link(url, body) = {
  if url == "" { body } else { link(url)[#body] }
}

#let section(name) = {
  v(3pt)
  text(size: 14pt, weight: "bold")[#name]
  v(2pt)
  line(length: 100%, stroke: 0.4pt)
  v(2pt)
}

#let bullet-list(items) = [
  #set list(spacing: 6pt)
  #for item in items [
    - #rich(item)
  ]
]

#let role-entry(item) = {
  let url = item.at("url", default: "")
  grid(
    columns: (1fr, auto),
    column-gutter: 0.5em,
    strong(maybe-link(url, rich(item.at("company", default: ())))),
    align(right)[#strong(item.at("period", default: ""))],
  )
  grid(
    columns: (1fr, auto),
    column-gutter: 0.5em,
    emph(rich(item.at("role", default: ()))),
    emph(align(right)[#if url != "" { link(url)[#item.at("domain", default: "")] }]),
  )
  v(4pt)
  bullet-list(item.at("bullets", default: ()))
  v(6pt)
}

#let education-entry(item) = {
  grid(
    columns: (1fr, auto),
    column-gutter: 0.5em,
    strong(rich(item.at("institution", default: ()))),
    align(right)[#strong(item.at("period", default: ""))],
  )
  grid(
    columns: (1fr, auto),
    column-gutter: 0.5em,
    emph(rich(item.at("degree", default: ()))),
    align(right)[#rich(item.at("location", default: ()))],
  )
  v(2pt)
}

#set page(width: 210mm, height: auto, margin: (left: 0.7cm, top: 0.5cm, right: 0.7cm, bottom: 0.5cm))
#set text(font: data.at("font", default: "New Computer Modern"), size: 10pt, fill: rgb("000000"))
#set par(leading: 0.48em, spacing: 0.35em, justify: false)
#show link: set text(fill: rgb("000000"))

#let personal = data.at("personal", default: (:))
#let titles = data.at("section_titles", default: (:))

#align(center)[
  #text(size: 24pt, weight: "bold")[#rich(personal.at("name", default: ()))] \
  #v(8pt)
  #text(size: 12pt)[#rich(personal.at("title", default: ()))] \
  #v(8pt)
  #text(size: 10pt)[#contact(data.at("contact", default: ())) ]
]

#v(10pt)

#if data.at("summary", default: ()).len() > 0 [
  #section(titles.at("summary", default: "Professional Summary"))
  #rich(data.summary)
  #v(2pt)
]

#if data.at("experience", default: ()).len() > 0 [
  #section(titles.at("experience", default: "Experience"))
  #for item in data.experience { role-entry(item) }
]

#if data.at("projects", default: ()).len() > 0 [
  #section(titles.at("projects", default: "Projects"))
  #for item in data.projects { role-entry(item) }
]

#if data.at("certifications", default: ()).len() > 0 [
  #section(titles.at("certifications", default: "Certifications"))
  #v(4pt)
  #bullet-list(data.certifications)
  #v(2pt)
]

#if data.at("education", default: ()).len() > 0 [
  #section(titles.at("education", default: "Education"))
  #for item in data.education { education-entry(item) }
]

#if data.at("skills", default: ()).len() > 0 [
  #section(titles.at("skills", default: "Technical Skills"))
  #for item in data.skills [
    #strong(rich(item.at("label", default: ()))): #rich(item.at("items", default: ())) \
  ]
]

#context {
  let pos = here().position()
  v(calc.max(0pt, 297mm - 0.5cm - pos.y))
}
