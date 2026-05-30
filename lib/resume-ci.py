#!/usr/bin/env python3

import argparse
import json
import re
import shutil
import subprocess
import sys
import time
from pathlib import Path
from urllib.parse import urlparse

import yaml
from jsonschema import Draft202012Validator, FormatChecker

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "resumes"
BUILD_DIR = ROOT / "build"
TEMPLATE = ROOT / "templates" / "default.typ"
FONT_DIR = ROOT / "bin" / "fonts"

TITLES = {
    "summary": "Professional Summary",
    "experience": "Experience",
    "projects": "Projects",
    "certifications": "Certifications",
    "education": "Education",
    "skills": "Technical Skills",
}

RICH_RE = re.compile(r"\*\*(.+?)\*\*|_(.+?)_")
SCHEMA = Draft202012Validator(
    json.loads((ROOT / "lib" / "resume.schema.json").read_text()),
    format_checker=FormatChecker(),
)


def parse_args():
    parser = argparse.ArgumentParser(description="Build resume PDFs from YAML files.")
    parser.add_argument("resumes", nargs="*", type=Path)
    parser.add_argument("--template", type=Path, default=TEMPLATE)
    parser.add_argument("--output-dir", type=Path, default=BUILD_DIR)
    parser.add_argument("--watch", action="store_true")
    return parser.parse_args()


def paths(explicit):
    found = explicit or sorted(DATA_DIR.glob("*.yml"))
    if not found:
        print("No resume YAML files found.", file=sys.stderr)
        sys.exit(0)
    return found


def load(path):
    data = yaml.safe_load(path.read_text())
    if not isinstance(data, dict):
        raise ValueError(f"{path} must contain a YAML mapping")

    errors = sorted(SCHEMA.iter_errors(data), key=lambda error: list(error.path))
    if errors:
        error = errors[0]
        location = ".".join(str(part) for part in error.absolute_path) or "resume"
        raise ValueError(f"{location}: {error.message}")
    return data


def text(data, key, default=""):
    return (data.get(key) or default).strip()


def rich(value):
    parts = []
    pos = 0
    for match in RICH_RE.finditer(value):
        if match.start() > pos:
            parts.append({"text": value[pos:match.start()], "style": ""})
        parts.append({"text": match.group(1) or match.group(2), "style": "strong" if match.group(1) else "emph"})
        pos = match.end()
    if pos < len(value):
        parts.append({"text": value[pos:], "style": ""})
    return parts


def period(item):
    value = item.get("period") or {}
    start = text(value, "from")
    end = text(value, "to")
    return f"{start} -- {end}" if start and end else start or end


def domain(url):
    host = urlparse(url).hostname or ""
    parts = host.split(".")
    keep = 3 if re.search(r"\.(com|org|net|gov|edu)\.[a-z]{2}$", host) else 2
    return ".".join(parts[-keep:]) if len(parts) > keep else host


def username(url):
    path = urlparse(url).path.strip("/")
    return path.split("/")[-1] if path else re.sub(r"^https?://", "", url)


def contacts(personal):
    email = text(personal, "email")
    items = [{"icon": "envelope", "solid": True, "href": f"mailto:{email}", "text": email}]
    for key, icon, solid in (("phone", "phone", True), ("location", "", False)):
        if value := text(personal, key):
            items.append({"icon": icon, "solid": solid, "href": "", "text": value})
    for key, icon in (("linkedin_url", "linkedin"), ("github_url", "github")):
        if url := text(personal, key):
            items.append({"icon": icon, "solid": False, "href": url, "text": username(url)})
    return items


def role(item):
    url = text(item, "url")
    return {
        "company": rich(text(item, "company")),
        "period": period(item),
        "role": rich(text(item, "role")),
        "url": url,
        "domain": domain(url) if url else "",
        "bullets": [rich(bullet) for bullet in item.get("bullets", [])],
    }


def education(item):
    return {
        "institution": rich(text(item, "institution")),
        "period": period(item),
        "degree": rich(text(item, "degree")),
        "location": rich(text(item, "location")),
    }


def context(data):
    personal = data["personal"]
    return {
        "personal": {"name": rich(text(personal, "name")), "title": rich(text(personal, "title"))},
        "contact": contacts(personal),
        "summary": rich(text(data, "summary")),
        "font": text(data, "font", "New Computer Modern"),
        "section_titles": {**TITLES, **(data.get("section_titles") or {})},
        "experience": [role(item) for item in data.get("experience", [])],
        "projects": [role(item) for item in data.get("projects", [])],
        "certifications": [rich(item) for item in data.get("certifications", [])],
        "education": [education(item) for item in data.get("education", [])],
        "skills": [{"label": rich(text(item, "label")), "items": rich(text(item, "items"))} for item in data.get("skills", [])],
        "output_filename": data["output_filename"],
    }


def typst():
    for name in ("typst", "typst.exe"):
        path = ROOT / "bin" / name
        if path.exists():
            return str(path)
    if path := shutil.which("typst"):
        return path
    raise RuntimeError("typst not found. Run lib/setup.sh")


def root_path(path):
    return path.resolve().relative_to(ROOT).as_posix()


def build(path, template, output_dir):
    data = context(load(path))
    output_dir.mkdir(parents=True, exist_ok=True)
    pdf = output_dir / f"{data['output_filename']}.pdf"
    payload = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    subprocess.run([
        typst(), "compile",
        "--root", str(ROOT),
        "--font-path", str(FONT_DIR),
        "--input", f"data={payload}",
        root_path(template), str(pdf),
    ], check=True)
    return pdf


def build_all(resumes, template, output_dir):
    failed = False
    for path in resumes:
        try:
            print(f"PDF: {build(path, template, output_dir)}")
        except Exception as exc:
            print(f"FAILED {path}: {exc}", file=sys.stderr)
            failed = True
    return failed


def mtimes(files):
    return {file: file.stat().st_mtime for file in files}


def watch(resumes, template, output_dir):
    watched = [*resumes, template]
    last = None
    print("Watching for changes. Press Ctrl+C to stop.")
    while True:
        current = mtimes(watched)
        if current != last:
            build_all(resumes, template, output_dir)
            last = current
        time.sleep(0.5)


def main():
    args = parse_args()
    resumes = paths(args.resumes)
    if args.watch:
        try:
            watch(resumes, args.template, args.output_dir)
        except KeyboardInterrupt:
            print("\nStopped watching.")
            return
    sys.exit(build_all(resumes, args.template, args.output_dir))


if __name__ == "__main__":
    main()
