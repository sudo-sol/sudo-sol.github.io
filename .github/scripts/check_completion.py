#!/usr/bin/env python3
"""Portable documentation/completion gate. Reads Git; never executes document content."""
import argparse
from datetime import datetime, timezone
import fnmatch
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys
from urllib.parse import unquote, urlsplit

START = '<!-- source-inventory:start -->'
END = '<!-- source-inventory:end -->'
CONFIG = '.github/completion.json'


def git(root, *args, binary=False):
    return subprocess.check_output(['git', '-C', str(root), *args], text=not binary)


def matches(path, patterns):
    return any(fnmatch.fnmatchcase(path, pattern) for pattern in patterns)


class Gate:
    def __init__(self, root, staged=False, base='HEAD'):
        self.root = Path(root).resolve()
        self.staged, self.base = staged, base
        if staged and not self.exists(CONFIG):
            raise ValueError('Stage the installed .github quality files and source inventory before the first commit')
        self.config = json.loads(self.read(CONFIG))
        if self.config.get('schema_version') != 1:
            raise ValueError('Unsupported completion configuration')
        self.excludes = self.config.get('exclude', [])
        # Paths are repository-relative, even when the CLI starts in a subdirectory.
        tracked = git(self.root, 'ls-files', '-z').split('\0')
        if staged:
            paths = tracked
        else:
            paths = tracked + git(self.root, 'ls-files', '--others', '--exclude-standard', '-z').split('\0')
        self.paths = sorted({p for p in paths if p and not matches(p, self.excludes) and self.exists(p)})
        args = ['diff', '--name-only', '-z', '--no-renames']
        if staged:
            args += ['--cached', base]
        else:
            args += [base]
        changed = git(self.root, *args).split('\0')
        if not staged:
            changed += git(self.root, 'ls-files', '--others', '--exclude-standard', '-z').split('\0')
        self.changed = sorted({p for p in changed if p and not matches(p, self.excludes)})

    def safe(self, name):
        path = self.root / name
        if Path(name).is_absolute() or not path.resolve().is_relative_to(self.root):
            raise ValueError('Path leaves repository: ' + name)
        return path

    def exists(self, name):
        if self.staged:
            return subprocess.run(['git', '-C', str(self.root), 'cat-file', '-e', ':' + name],
                                  stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL).returncode == 0
        return self.safe(name).is_file()

    def read_bytes(self, name):
        if self.staged:
            return git(self.root, 'show', ':' + name, binary=True)
        return self.safe(name).read_bytes()

    def read(self, name):
        return self.read_bytes(name).decode('utf-8')

    def inventory_block(self):
        return START + '\n' + '\n'.join('- `' + p + '`' for p in self.paths) + '\n' + END

    def fingerprint(self):
        data = [(p, hashlib.sha256(self.read_bytes(p)).hexdigest()) for p in self.paths]
        # Includes deletions, base revision and branch: evidence cannot migrate to another change.
        payload = [git(self.root, 'rev-parse', self.base).strip(),
                   git(self.root, 'branch', '--show-current').strip(), data, self.changed]
        return hashlib.sha256(json.dumps(payload, ensure_ascii=False).encode()).hexdigest()

    def receipt_path(self):
        return Path(git(self.root, 'rev-parse', '--absolute-git-dir').strip()) / 'completion-review.json'

    def validate_structure_and_docs(self, documentation=''):
        errors = []
        inventory = self.config['inventory']
        text = self.read(inventory) if self.exists(inventory) else ''
        block = re.search(re.escape(START) + r'.*?' + re.escape(END), text, re.S)
        if not block or block.group() != self.inventory_block():
            errors.append('Source inventory is stale: run python3 .github/scripts/check_completion.py inventory --write')
        changed_set = set(self.changed)
        covered = set()
        for rule in self.config.get('rules', []):
            affected = [p for p in self.changed if matches(p, rule['patterns']) and
                        not p.lower().endswith(('.md', '.rst', '.txt'))]
            covered.update(affected)
            owners = rule['owners']
            if affected and not changed_set.intersection(owners):
                if not documentation.lower().startswith('no impact:') or len(documentation.strip()) < 35:
                    errors.append('Update ' + ' or '.join(owners) + ' for ' + ', '.join(affected[:4]) +
                                  '; a specific "No impact: ..." rationale is required for an exception')
        unowned = [p for p in self.changed if p not in covered and not p.lower().endswith(('.md', '.rst', '.txt'))]
        if unowned and 'README.md' not in changed_set:
            if not documentation.lower().startswith('no impact:') or len(documentation.strip()) < 35:
                errors.append('Document new/unmapped source ownership in README.md and completion.json: ' + ', '.join(unowned[:4]))
        # Check actual changed prose, including images, but not frozen history or code samples.
        for name in self.changed:
            if not name.endswith('.md') or not self.exists(name):
                continue
            text = re.sub(r'(?ms)^\s*(`{3,}|~{3,}).*?^\s*\1\s*$', '', self.read(name))
            for match in re.finditer(r'!?\[[^\]\n]*\]\((<[^>]+>|[^\s)]+)(?:\s+[^)]*)?\)', text):
                dest = unquote(match[1].strip('<>'))
                parts = urlsplit(dest)
                if parts.scheme or parts.netloc or dest.startswith(('#', '/')):
                    continue
                target = (Path(name).parent / parts.path).as_posix()
                resolved = self.safe(target).resolve()
                relative = resolved.relative_to(self.root).as_posix()
                if self.staged:
                    exists = self.exists(relative) or any(p.startswith(relative.rstrip('/') + '/') for p in self.paths)
                else:
                    exists = resolved.exists()
                if not exists:
                    errors.append(name + ': missing local link ' + dest)
        # Optional literal invariants keep critical commands synchronized with tested instructions.
        for item in self.config.get('required_text', []):
            if not self.exists(item['path']) or item['text'] not in self.read(item['path']):
                errors.append(item['path'] + ': required documented instruction missing: ' + item['text'])
        return errors


def parse_body(body):
    sections = {}
    for heading, content in re.findall(r'(?ms)^##\s+(Summary|Documentation|Verification|Tracking)\s*\n(.*?)(?=^##\s|\Z)', body):
        content = re.sub(r'<!--.*?-->', '', content, flags=re.S).strip()
        sections[heading.lower()] = content
    return sections


def evidence_errors(evidence):
    errors = []
    for key in ('summary', 'documentation', 'verification', 'tracking'):
        text = evidence.get(key, '').strip()
        if len(text) < 15 or text.lower() in ('todo', 'n/a', 'not applicable') or '<!--' in text:
            errors.append('Provide concrete ' + key + ' evidence (at least 15 characters)')
    tracking = evidence.get('tracking', '')
    if not re.search(r'https://github\.com/[^\s]+|pending:|not needed:', tracking, re.I):
        errors.append('Tracking needs the updated GitHub item URL, "Pending: reason", or "Not needed: reason"')
    return errors


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', default='.')
    commands = parser.add_subparsers(dest='command', required=True)
    inv = commands.add_parser('inventory')
    inv.add_argument('--write', action='store_true')
    review = commands.add_parser('review')
    for key in ('summary', 'documentation', 'verification', 'tracking'):
        review.add_argument('--' + key, required=True)
    check = commands.add_parser('check')
    check.add_argument('--base', default='HEAD')
    check.add_argument('--staged', action='store_true')
    check.add_argument('--pr-body')
    commands.add_parser('status')
    args = parser.parse_args()
    root = Path(git(Path(args.root), 'rev-parse', '--show-toplevel').strip())
    gate = Gate(root, getattr(args, 'staged', False), getattr(args, 'base', 'HEAD'))
    if args.command == 'inventory':
        block = gate.inventory_block()
        if args.write:
            path = gate.safe(gate.config['inventory'])
            path.parent.mkdir(parents=True, exist_ok=True)
            if path.exists():
                text = path.read_text()
            else:
                text = '# Source structure\n\nGenerated from tracked and non-ignored source paths. Do not edit the generated block.\n' + \
                       'Owning documents and verification rules: [.github/README.md](' + \
                       ('../' * len(Path(gate.config['inventory']).parent.parts)) + '.github/README.md).\n\n' + START + '\n' + END + '\n'
                # The new inventory must list itself on its first generation.
                gate.paths = sorted(set(gate.paths + [gate.config['inventory']]))
                block = gate.inventory_block()
            if START not in text or END not in text:
                raise ValueError('Inventory markers are missing; refusing to replace existing prose')
            text = re.sub(re.escape(START) + r'.*?' + re.escape(END), lambda _: block, text, flags=re.S)
            path.write_text(text)
            print('Updated ' + str(path))
        else:
            print(block)
        return
    if args.command == 'status':
        print(json.dumps({'changed': gate.changed, 'paths': len(gate.paths),
                          'receipt': str(gate.receipt_path()), 'fingerprint': gate.fingerprint()}, indent=2))
        return
    if args.command == 'review':
        evidence = {key: getattr(args, key) for key in ('summary', 'documentation', 'verification', 'tracking')}
        errors = evidence_errors(evidence) + gate.validate_structure_and_docs(evidence['documentation'])
        if errors:
            raise ValueError('\n'.join(errors))
        payload = {'recorded_at': datetime.now(timezone.utc).isoformat(),
                   'fingerprint': gate.fingerprint(), 'evidence': evidence}
        gate.receipt_path().write_text(json.dumps(payload, indent=2) + '\n')
        print('Recorded change-bound completion review. Evidence is an explicit report, not proof that commands ran.')
        return
    # Check structure even for no-op commits; only meaningful changes need a review receipt.
    evidence = {}
    errors = []
    if args.pr_body:
        evidence = parse_body(Path(args.pr_body).read_text())
        errors += evidence_errors(evidence)
    elif gate.changed:
        try:
            receipt = json.loads(gate.receipt_path().read_text())
            evidence = receipt['evidence']
            errors += evidence_errors(evidence)
            # A staged commit must have the reviewed bytes for every changed file.
            worktree = Gate(root)
            if receipt['fingerprint'] != worktree.fingerprint():
                errors.append('Completion review is missing or stale; review the final change again')
            if args.staged:
                for name in gate.changed:
                    if gate.exists(name) and (not worktree.exists(name) or gate.read_bytes(name) != worktree.read_bytes(name)):
                        errors.append('Staged content differs from reviewed working file: ' + name)
        except (OSError, KeyError, json.JSONDecodeError):
            errors.append('No completion review: run python3 .github/scripts/check_completion.py review --help')
    errors += gate.validate_structure_and_docs(evidence.get('documentation', ''))
    if errors:
        raise ValueError('\n'.join(errors))
    print('PASS: source inventory, changed Markdown links, documentation coverage and completion evidence (' + str(len(gate.changed)) + ' changed paths)')


if __name__ == '__main__':
    try:
        main()
    except (OSError, ValueError, KeyError, subprocess.CalledProcessError) as exc:
        sys.exit('ERROR: ' + str(exc))
