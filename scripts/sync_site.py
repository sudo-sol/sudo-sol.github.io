#!/usr/bin/env python3
"""Sync shared static regions and concatenate small authored CSS/JS modules. No dependencies."""
import argparse
import hashlib
import html
from html.parser import HTMLParser
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / 'src'
TEMPLATES = ROOT / 'templates'
CONFIG = TEMPLATES / 'site.json'


def digest(content):
    return hashlib.sha256(content).hexdigest()[:12]


def render(name, values):
    text = (TEMPLATES / name).read_text()
    def value(match):
        key = match[1]
        if key not in values:
            raise ValueError(f'{name}: unknown placeholder {key}')
        return values[key]
    return re.sub(r'\{\{\s*(\w+)\s*\}\}', value, text).rstrip()


def region(text, name, replacement, legacy):
    pattern = rf'<!-- shared:{name}:start -->.*?<!-- shared:{name}:end -->'
    wrapped = f'<!-- shared:{name}:start -->\n{replacement}\n<!-- shared:{name}:end -->'
    if re.search(pattern, text, re.S):
        text, count = re.subn(pattern, lambda _: wrapped, text, flags=re.S)
    else:
        text, count = re.subn(legacy, lambda _: wrapped, text, flags=re.S)
    if count != 1:
        raise ValueError(f'Expected exactly one {name} region, got {count}')
    return text


def route(path):
    return '/' if path == 'index.html' else '/' + path.removesuffix('index.html')


class PageStructure(HTMLParser):
    VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'}

    def __init__(self):
        super().__init__()
        self.stack = []
        self.titles = 0
        self.page_titles = 0
        self.intro = set()
        self.classes = set()

    def handle_starttag(self, tag, attrs):
        classes = set(dict(attrs).get('class', '').split())
        self.classes.update(classes)
        inside = 'page-intro' in classes or any('page-intro' in c for _, c in self.stack)
        if tag == 'h1':
            self.titles += 1
            self.page_titles += 'page-title' in classes
            if inside and 'page-title' in classes:
                self.intro.add('title')
        if inside:
            self.intro.update(classes & {'prompt', 'lede'})
        if tag not in self.VOID:
            self.stack.append((tag, classes))

    def handle_endtag(self, tag):
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i][0] == tag:
                del self.stack[i:]
                break


def validate_page(path, text, kind):
    page = PageStructure()
    page.feed(text)
    if page.titles != 1 or (kind != 'manual' and page.page_titles != 1):
        raise ValueError(path + ': use exactly one h1.page-title (manual page may keep its hidden h1)')
    if kind == 'standard' and not {'title', 'prompt', 'lede'} <= page.intro:
        raise ValueError(path + ': ordinary pages require the shared page-intro title/prompt/lede structure')
    if kind == 'manual' and 'prompt' not in page.intro:
        raise ValueError(path + ': manual pages require their prompt inside the shared page-intro')
    if kind == 'home' and not {'home-overview', 'home-copy'} <= page.classes:
        raise ValueError(path + ': Home requires its shared title and overview composition')


def outputs():
    config = json.loads(CONFIG.read_text())
    pages = config['pages']
    kinds = config.get('page_kinds', {})
    if any(path not in pages or kind not in {'standard', 'home', 'manual', 'demo', 'utility'} for path, kind in kinds.items()):
        raise ValueError('Page-kind exceptions must name registered pages and supported structures')
    if len(pages) != len(set(pages)):
        raise ValueError('Duplicate page paths')
    for path in pages:
        if Path(path).is_absolute() or '..' in Path(path).parts or not path.endswith('.html'):
            raise ValueError('Invalid page path: ' + path)
    discovered = [p.relative_to(SITE).as_posix() for p in SITE.rglob('*.html')]
    unknown = sorted(p for p in discovered if p not in pages)
    if unknown:
        raise ValueError('Register public HTML pages in templates/site.json: ' + ', '.join(unknown))
    navigation = [item for item in config['navigation'] if item.get('enabled') is True]
    keys = ['h']
    for item in navigation:
        if not item['href'].startswith('/') or item['href'].startswith('//') or '..' in item['href']:
            raise ValueError('Navigation href must stay inside this site')
        if not re.fullmatch('[a-z]', item['key']) or item['key'] in keys:
            raise ValueError('Navigation shortcuts must be unique lower-case letters')
        keys.append(item['key'])

    def bundle(folder, names):
        parts = []
        for name in names:
            if not re.fullmatch('[a-z-]+', name):
                raise ValueError('Invalid module name: ' + name)
            suffix = 'css' if folder == 'styles' else 'js'
            path = f'assets/{folder}/{name}.{suffix}'
            parts.append(f'/* Source: src/{path} */\n' + (SITE / path).read_text().rstrip())
        return '\n\n'.join(parts)

    css = '@charset "UTF-8";\n/* Generated by scripts/sync_site.py; edit src/assets/styles/ sources. */\n' + bundle('styles', config['styles']) + '\n'
    js = '/* Generated by scripts/sync_site.py; edit src/assets/scripts/ sources. */\n(() => {\n  "use strict";\n' + bundle('scripts', config['behaviors'])
    js += '\n\n  initBackgrounds();\n  initNavigation();\n  initHome();\n  initAbout();\n  initContent();\n  initTraffic();\n})();\n'
    result = {'styles.css': css, 'app.js': js}
    values = {'styles_version': digest(css.encode()), 'app_version': digest(js.encode())}
    for key, path in {'term_css_version':'assets/term.css', 'cyber_version':'assets/cyber.css', 'themes_version':'assets/themes.css', 'theme_version':'assets/theme.js', 'terminal_version':'assets/term.js'}.items():
        values[key] = digest((SITE / path).read_bytes())
    assets = render('assets.html', values)
    picker = render('theme-picker.html', {})
    footer = render('footer.html', {})
    profile = (SITE / 'about.json').read_text().strip()
    json.loads(profile)  # Invalid public profile data must never silently reach the page.
    peek = render('source-peek.html', {'profile_json': html.escape(profile)})
    for path in pages:
        text = (SITE / path).read_text()
        links = []
        for item in navigation:
            current = ' aria-current="page"' if route(path).startswith(item['href']) else ''
            links.append('    <a href="' + html.escape(item['href'], quote=True) + '"' + current
                         + ' data-term-desc="' + html.escape(item['description'], quote=True)
                         + '" data-nav-key="' + item['key'] + '" data-nav-label="' + html.escape(item['label'], quote=True)
                         + '">' + html.escape(item['label']) + '</a>')
        header = render('header.html', {'navigation':'\n'.join(links), 'theme_picker':picker})
        text = region(text, 'assets', assets, r'  <link rel="stylesheet" href="/styles\.css[^\"]*">.*?<script[^>]*src="/assets/term\.js[^\"]*"[^>]*></script>')
        text = region(text, 'header', header, r'<header class="site-header">.*?</header>')
        text = region(text, 'footer', footer, r'<footer class="site-footer">.*?</footer>')
        if path == 'index.html':
            text = region(text, 'profile', peek, r'<details class="source-peek">.*?</details>')
            # Retire the old generated decoration without editing shared HTML by hand.
            text = re.sub(r'<!-- shared:vine:start -->.*?<!-- shared:vine:end -->', '', text, flags=re.S)
        validate_page(path, text, kinds.get(path, 'standard'))
        result[path] = text
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='Report stale outputs without changing files')
    args = parser.parse_args()
    changed = []
    for path, expected in outputs().items():
        target = SITE / path
        if not target.exists() or target.read_text() != expected:
            changed.append(path)
            if not args.check:
                target.write_text(expected)
    if args.check and changed:
        raise SystemExit('Stale shared output; run python3 scripts/sync_site.py: ' + ', '.join(changed))
    print('Shared site check PASS' if args.check else f'Synced {len(changed)} output file(s)')


if __name__ == '__main__':
    try:
        main()
    except (ValueError, KeyError, OSError) as error:
        raise SystemExit(str(error))
