#!/usr/bin/env python3
"""Build Markdown notes and projects into a separate static-site directory."""
import argparse
import datetime as dt
import html
from html.parser import HTMLParser
import math
from pathlib import Path
import re
import shutil
import sys

import markdown
import yaml

ROOT = Path(__file__).resolve().parents[1]
ESC = html.escape
SLUG = re.compile(r'^[a-z0-9]+(?:-[a-z0-9]+)*$')


class ReadingText(HTMLParser):
    BLOCKS = {'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'pre', 'blockquote',
              'tr', 'th', 'td', 'ul', 'ol', 'section', 'aside', 'div', 'br'}

    def __init__(self):
        super().__init__()
        self.parts = []

    def handle_data(self, data):
        self.parts.append(data)

    def handle_starttag(self, tag, attrs):
        if tag in self.BLOCKS:
            self.parts.append(' ')

    def handle_endtag(self, tag):
        if tag in self.BLOCKS:
            self.parts.append(' ')


def read_entry(path, kind):
    text = path.read_text(encoding='utf-8')
    parts = re.split(r'^---\s*$', text, maxsplit=2, flags=re.M)
    if len(parts) != 3 or parts[0].strip():
        raise ValueError(f'{path}: expected YAML front matter between --- lines')
    meta = yaml.safe_load(parts[1])
    if not isinstance(meta, dict):
        raise ValueError(f'{path}: front matter must be a mapping')
    required = ('title', 'summary', 'date', 'tags', 'tldr') if kind == 'note' else ('title', 'summary', 'status')
    for key in required:
        if not meta.get(key):
            raise ValueError(f'{path}: missing {key}')
    slug = path.parent.name
    if not SLUG.fullmatch(slug):
        raise ValueError(f'{path}: folder name must be a lowercase URL slug')
    if kind == 'note':
        try:
            meta['date'] = dt.date.fromisoformat(str(meta['date']))
        except ValueError as exc:
            raise ValueError(f'{path}: date must be YYYY-MM-DD') from exc
        tags = meta['tags']
        if isinstance(tags, str):
            tags = [x.strip() for x in tags.split(',')]
        if not isinstance(tags, list) or not tags or any(not isinstance(t, str) or not SLUG.fullmatch(t) for t in tags):
            raise ValueError(f'{path}: tags must be lowercase slugs')
        meta['tags'] = tags
        if meta.get('status', 'publish') not in ('publish', 'draft'):
            raise ValueError(f'{path}: status must be publish or draft')
    elif meta['status'] not in ('building', 'planned', 'shipped'):
        raise ValueError(f'{path}: status must be building, planned or shipped')
    return slug, meta, parts[2].strip()


def render_md(text):
    return markdown.markdown(text, extensions=['fenced_code', 'tables', 'sane_lists'])


def note_html(template, slug, meta, body):
    title, summary, date = map(str, (meta['title'], meta['summary'], meta['date']))
    url = f'https://sudosol.dev/notes/{slug}/'
    replacements = {
        r'<meta name="description" content="[^"]*">': f'<meta name="description" content="{ESC(summary, quote=True)}">',
        r'<meta property="og:title" content="[^"]*">': f'<meta property="og:title" content="{ESC(title, quote=True)} / sudo-sol">',
        r'<meta property="og:description" content="[^"]*">': f'<meta property="og:description" content="{ESC(summary, quote=True)}">',
        r'<meta property="og:url" content="[^"]*">': f'<meta property="og:url" content="{url}">',
        r'<meta property="article:published_time" content="[^"]*">': f'<meta property="article:published_time" content="{date}">',
        r'<link rel="canonical" href="[^"]*">': f'<link rel="canonical" href="{url}">',
        r'<title>.*?</title>': f'<title>{ESC(title)} / sudo-sol</title>',
    }
    for pattern, replacement in replacements.items():
        template, count = re.subn(pattern, lambda _: replacement, template, count=1)
        if count != 1:
            raise ValueError(f'note template is missing {pattern}')
    blocks = re.split(r'^##\s+(.+?)\s*$', body, flags=re.M)
    if blocks[0].strip() or len(blocks) < 3:
        raise ValueError(f'{slug}: body must start with a ## heading')
    sections, links, ids = [], [], set()
    for heading, content in zip(blocks[1::2], blocks[2::2]):
        anchor = re.sub(r'[^a-z0-9]+', '-', heading.lower()).strip('-')
        if not anchor or anchor in ids:
            raise ValueError(f'{slug}: headings must have unique URL-friendly names')
        ids.add(anchor)
        rendered = render_md(content)
        rendered = re.sub(r'<table>', '<div class="table-wrap"><table>', rendered)
        rendered = re.sub(r'</table>', '</table></div>', rendered)
        sections.append(f'<section id="{anchor}" data-term-item="{anchor}"><h2>{ESC(heading)}</h2>{rendered}</section>')
        links.append(f'<a href="#{anchor}">{ESC(heading)}</a>')
    tags = ''.join(f'<span>#{ESC(t)}</span>' for t in meta['tags'])
    # Match the browser estimate: rendered words at 225 words/minute.
    reading_html = 'tl;dr ' + render_md(str(meta['tldr'])) + ''.join(sections)
    reading_text = ReadingText()
    reading_text.feed(reading_html)
    mins = max(1, math.floor(len(''.join(reading_text.parts).split()) / 225 + 0.5))
    main = f'''<main id="main"><article class="post" aria-labelledby="post-title">
<header class="post-head page-intro"><a class="back-link" href="/notes/">← ~/notes</a><p class="prompt" aria-hidden="true"><span class="u">~/notes</span>$ cat {slug}.md<span class="cursor"></span></p><h1 class="page-title" id="post-title">{ESC(title)}</h1><p class="lede">{ESC(summary)}</p><p class="post-meta"><time datetime="{date}">{meta['date'].strftime('%b %d, %Y')}</time><span data-read-time>{mins} min read</span>{tags}</p></header>
<div class="post-layout"><div class="post-body"><aside class="takeaway" aria-label="Key takeaway"><b>tl;dr</b>{render_md(str(meta['tldr']))}</aside>{''.join(sections)}</div><nav class="toc" aria-label="On this page">{''.join(links)}</nav></div>
<footer class="post-foot"><a href="/notes/">← all notes</a></footer></article></main>'''
    template, count = re.subn(r'<main id="main">.*?</main>', lambda _: main, template, count=1, flags=re.S)
    if count != 1:
        raise ValueError('note template missing main element')
    return template, mins


def build(source, content, output):
    if output == source or output in source.parents or source in output.parents or output == ROOT or output in ROOT.parents:
        raise ValueError('output must be outside the source site and must not contain the repository')
    if output.exists():
        raise ValueError(f'{output}: output already exists; choose a new directory')
    notes = [read_entry(p, 'note') + (p,) for p in sorted((content / 'notes').glob('*/note.md'))]
    projects = [read_entry(p, 'project') + (p,) for p in sorted((content / 'workbench').glob('*/project.md'))]
    # Construct everything in memory before creating output, so validation cannot damage the source site.
    template = (source / 'notes/anatomy-of-a-note/index.html').read_text()
    archive = (source / 'notes/index.html').read_text()
    workbench = (source / 'workbench/index.html').read_text()
    generated = []
    for slug, meta, body, path in notes:
        if (source / 'notes' / slug / 'index.html').exists():
            raise ValueError(f'{path}: conflicts with an existing note page')
        page, mins = note_html(template, slug, meta, body)
        generated.append((slug, meta, page, mins, path))
    for slug, meta, body, path in projects:
        if re.search(r'\bid=["\']' + re.escape(slug) + r'["\']', workbench):
            raise ValueError(f'{path}: conflicts with an existing workbench item')
        sections = re.split(r'^##\s+(.+?)\s*$', body, flags=re.M)
        if sections[0].strip() or len(sections) < 3:
            raise ValueError(f'{path}: project body must start with a ## heading')
        facts = ''.join(f'<dt>{ESC(h)}</dt><dd>{render_md(c)}</dd>' for h, c in zip(sections[1::2], sections[2::2]))
        card = f'<article class="proj" id="{slug}" data-status="{meta["status"]}" data-term-item="{slug}"><header class="proj-head"><p class="proj-meta"><span class="status">{meta["status"]}</span></p><h2>{ESC(str(meta["title"]))}</h2><p class="proj-sum">{ESC(str(meta["summary"]))}</p></header><dl class="proj-facts">{facts}</dl></article>'
        # Place new entries before the first existing item of the same status.
        match = re.search(r'<article class="proj"[^>]*data-status="' + meta['status'] + r'"', workbench)
        if not match:
            raise ValueError(f'{path}: no existing {meta["status"]} insertion point')
        workbench = workbench[:match.start()] + card + '\n' + workbench[match.start():]
    for slug, meta, page, mins, path in sorted(generated, key=lambda x: x[1]['date']):
        date = meta['date']; tags = meta['tags']; draft = meta.get('status', 'publish') == 'draft'
        title = ESC(str(meta['title'])); summary = ESC(str(meta['summary']))
        link = title if draft else f'<a href="/notes/{slug}/" data-term-item="{slug}">{title}</a>'
        when = '<span class="when">draft</span>' if draft else f'<time datetime="{date}">{date.strftime("%b %d")}</time>'
        item = f'<li class="post-item{" draft" if draft else ""}" data-tags="{" ".join(tags)}">{when}<div><h3>{link}</h3><p>{summary}</p><p class="post-meta"><span>{"in the works" if draft else str(mins) + " min read"}</span>{"".join(f"<span>#{t}</span>" for t in tags)}</p></div></li>'
        year = str(date.year)
        match = re.search(r'<section class="year" data-filter-group aria-labelledby="y-' + year + r'">.*?<ol class="posts">', archive, flags=re.S)
        if match:
            # Insert by date among existing dated entries, ahead of undated drafts.
            tail = archive[match.end():]
            end_list = tail.index('</ol>')
            entry_pattern = re.compile(r'<li class="post-item[^\"]*"[^>]*>\s*(?:<time datetime="([^\"]+)"|<span class="when">)')
            insert = next((entry for entry in entry_pattern.finditer(tail, 0, end_list)
                           if not entry.group(1) or entry.group(1) <= date.isoformat()), None)
            pos = match.end() + (insert.start() if insert else end_list)
            archive = archive[:pos] + item + '\n' + archive[pos:]
        else:
            section = f'<section class="year" data-filter-group aria-labelledby="y-{year}"><h2 class="year-label" id="y-{year}">{year}</h2><ol class="posts">{item}</ol></section>'
            years = list(re.finditer(r'<section class="year" data-filter-group aria-labelledby="y-(\d{4})">', archive))
            later = next((m for m in years if int(m.group(1)) < date.year), None)
            pos = later.start() if later else (archive.index('</section>', years[-1].end()) + len('</section>') if years else archive.index('<div id="posts">') + len('<div id="posts">'))
            archive = archive[:pos] + section + archive[pos:]
    # Authoring references and the note template must never enter a deployment,
    # even when building from a working tree containing ignored local files.
    excluded = {'experience/linkedIn', 'experience/linkedIn_history', 'notes/anatomy-of-a-note'}
    def ignore_source(directory, names):
        relative = Path(directory).relative_to(source)
        return [name for name in names if name.endswith('.md') or (relative / name).as_posix() in excluded]
    shutil.copytree(source, output, ignore=ignore_source)
    (output / 'notes/index.html').write_text(archive)
    (output / 'workbench/index.html').write_text(workbench)
    for slug, meta, page, mins, path in generated:
        if meta.get('status', 'publish') == 'draft':
            continue
        dest = output / 'notes' / slug
        dest.mkdir(parents=True, exist_ok=True)
        for asset in path.parent.iterdir():
            if asset.is_file() and asset.suffix.lower() != '.md':
                shutil.copy2(asset, dest / asset.name)
        (dest / 'index.html').write_text(page)
    for slug, meta, body, path in projects:
        assets = [p for p in path.parent.iterdir() if p.is_file() and p.suffix.lower() != '.md']
        if assets:
            dest = output / 'workbench' / slug
            dest.mkdir(parents=True, exist_ok=True)
            for asset in assets:
                shutil.copy2(asset, dest / asset.name)
    print(f'Built {len(notes)} notes and {len(projects)} projects into {output}')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--content', type=Path, default=ROOT / 'src')
    parser.add_argument('--output', type=Path, required=True, help='new output directory (must not already exist)')
    args = parser.parse_args()
    try:
        build((ROOT / 'src').resolve(), args.content.resolve(), args.output.resolve())
    except (ValueError, OSError, yaml.YAMLError) as exc:
        print(f'Build failed: {exc}', file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
