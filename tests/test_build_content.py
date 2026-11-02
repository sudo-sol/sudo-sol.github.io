"""Local content refresh, ownership, link validation and packaging contracts."""
import shutil
import importlib.util
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class ContentBuildTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        for folder in ['scripts', 'templates', 'src']:
            shutil.copytree(ROOT / folder, self.root / folder,
                            ignore=shutil.ignore_patterns('__pycache__', 'linkedIn', 'linkedIn_history'))

    def run_script(self, name, *args, success=True):
        result = subprocess.run([sys.executable, str(self.root / 'scripts' / name), *map(str, args)],
                                cwd=self.root, capture_output=True, text=True)
        if success:
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        else:
            self.assertNotEqual(result.returncode, 0)
        return result

    def refresh(self, *args, success=True):
        return self.run_script('refresh_content.py', *args, success=success)

    def add_fixtures(self):
        for folder in ['notes', 'workbench']:
            shutil.copytree(ROOT / 'tests/fixtures/content' / folder, self.root / 'src' / folder, dirs_exist_ok=True)

    def snapshot(self):
        return {p.relative_to(self.root): p.read_bytes() for p in (self.root / 'src').rglob('*') if p.is_file()}

    def test_refresh_creates_updates_and_is_idempotent(self):
        self.add_fixtures()
        before = self.snapshot()
        self.refresh('--check', success=False)
        self.assertEqual(before, self.snapshot())
        self.refresh()
        note = (self.root / 'src/notes/test-note/index.html').read_text()
        self.assertIn('<strong>bold</strong>', note)
        self.assertIn('<table>', note)
        self.assertIn('href="#the-example"', note)
        self.assertIn('open the-example', note)
        archive = (self.root / 'src/notes/index.html').read_text()
        self.assertLess(archive.index('href="/notes/test-note/"'), archive.index('href="/notes/tf-access-map/"'))
        workbench = (self.root / 'src/workbench/index.html').read_text()
        self.assertIn('href="/notes/test-note/"', workbench)
        self.assertIn('id="access-map"', workbench)
        before = self.snapshot()
        self.refresh()
        self.refresh('--check')
        self.assertEqual(before, self.snapshot())
        md = self.root / 'src/notes/test-note/note.md'
        md.write_text(md.read_text().replace('Test note', 'Updated note'))
        self.refresh('--check', success=False)
        self.refresh()
        self.assertIn('Updated note', (md.parent / 'index.html').read_text())

    def test_delete_removes_generated_pages_cards_years_and_preserves_assets(self):
        self.add_fixtures()
        md = self.root / 'src/notes/test-note/note.md'
        md.write_text(md.read_text().replace('2026-', '2025-'))
        self.refresh()
        asset = md.parent / 'diagram.svg'
        asset_before = asset.read_bytes()
        md.unlink()
        (self.root / 'src/workbench/test-project/project.md').unlink()
        self.refresh()
        self.assertFalse((md.parent / 'index.html').exists())
        self.assertEqual(asset.read_bytes(), asset_before)
        self.assertNotIn('y-2025', (self.root / 'src/notes/index.html').read_text())
        self.assertNotIn('id="test-project"', (self.root / 'src/workbench/index.html').read_text())
        self.assertTrue((self.root / 'src/notes/tf-access-map/index.html').exists())
        self.refresh('--check')

    def test_draft_removes_public_page_and_link(self):
        md = self.root / 'src/notes/cloudflare-domain-github-pages/note.md'
        md.write_text(md.read_text().replace('status: "publish"', 'status: "draft"'))
        self.refresh()
        self.assertFalse((md.parent / 'index.html').exists())
        archive = (self.root / 'src/notes/index.html').read_text()
        self.assertIn('class="post-item draft"', archive)
        self.assertNotIn('href="/notes/cloudflare-domain-github-pages/"', archive)
        self.assertNotIn('open cloudflare-domain-github-pages', archive)

    def test_rename_updates_routes_and_archive(self):
        folder = self.root / 'src/notes/cloudflare-domain-github-pages'
        folder.rename(folder.with_name('renamed-guide'))
        self.refresh()
        self.assertFalse((folder.with_name('renamed-guide') / 'index.html').read_text().count('/notes/cloudflare-domain-github-pages/'))
        self.assertIn('href="/notes/renamed-guide/"', (self.root / 'src/notes/index.html').read_text())
        self.refresh('--check')

    def test_broken_authored_reference_blocks_deletion_without_writes(self):
        self.add_fixtures()
        self.refresh()
        (self.root / 'src/notes/test-note/note.md').unlink()
        before = self.snapshot()
        result = self.refresh(success=False)
        self.assertIn('broken content link /notes/test-note/', result.stderr)
        self.assertEqual(before, self.snapshot())

    def test_project_deletion_with_authored_anchor_link_is_blocked(self):
        self.add_fixtures()
        md = self.root / 'src/notes/test-note/note.md'
        md.write_text(md.read_text() + '\n[Project](/workbench/#test-project)\n')
        self.refresh()
        (self.root / 'src/workbench/test-project/project.md').unlink()
        before = self.snapshot()
        self.assertIn('broken content link /workbench/#test-project', self.refresh(success=False).stderr)
        self.assertEqual(before, self.snapshot())

    def test_invalid_source_and_manual_collision_do_not_write(self):
        self.add_fixtures()
        note = self.root / 'src/notes/test-note/note.md'
        note.write_text(note.read_text().replace('## The example', 'No heading'))
        before = self.snapshot()
        self.refresh(success=False)
        self.assertEqual(before, self.snapshot())
        shutil.copyfile(ROOT / 'tests/fixtures/content/notes/test-note/note.md', note)
        (note.parent / 'index.html').write_text('<!doctype html><p>Hand-written page</p>')
        before = self.snapshot()
        self.refresh(success=False)
        self.assertEqual(before, self.snapshot())

    def test_content_shared_chrome_follows_template_and_assets(self):
        header = self.root / 'templates/header.html'
        header.write_text(header.read_text().replace('<header class="site-header">', '<header class="site-header"><!-- probe -->'))
        self.refresh()
        self.assertIn('<!-- probe -->', (self.root / 'src/notes/cloudflare-domain-github-pages/index.html').read_text())
        self.refresh('--check')

    def test_multiple_title_accents_keep_metadata_plain_and_remove_top_back_link(self):
        self.refresh()
        page = (self.root / 'src/notes/cloudflare-domain-github-pages/index.html').read_text()
        self.assertIn('From a <span class="terminal-em">Cloudflare</span> domain to <span class="terminal-em">GitHub</span> Pages</h1>', page)
        self.assertIn('<title>From a Cloudflare domain to GitHub Pages / sudo-sol</title>', page)
        self.assertIn('content="From a Cloudflare domain to GitHub Pages / sudo-sol"', page)
        archive = (self.root / 'src/notes/index.html').read_text()
        self.assertIn('data-term-item="cloudflare-domain-github-pages">From a Cloudflare domain to GitHub Pages</a>', archive)
        for path in (self.root / 'src/notes').glob('*/index.html'):
            self.assertNotIn('← ~/notes', path.read_text())
        self.assertIn('← all notes', page)
        self.refresh('--check')

    def test_title_emphasis_escapes_content_supports_single_and_repeated_phrases(self):
        spec = importlib.util.spec_from_file_location('content_renderer', ROOT / 'scripts/build_content.py')
        renderer = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(renderer)
        self.assertEqual(renderer.title_html('GitHub & GitHub <script>', 'GitHub'),
                         '<span class="terminal-em">GitHub</span> &amp; <span class="terminal-em">GitHub</span> &lt;script&gt;')
        self.assertEqual(renderer.title_html('<b>&</b>', ['<b>']),
                         '<span class="terminal-em">&lt;b&gt;</span>&amp;&lt;/b&gt;')
        self.assertEqual(renderer.title_html('Plain & safe'), 'Plain &amp; safe')
        self.assertEqual(renderer.title_html('Plain & safe', []), 'Plain &amp; safe')

    def test_invalid_title_emphasis_blocks_refresh_without_writes(self):
        md = self.root / 'src/notes/cloudflare-domain-github-pages/note.md'
        source = md.read_text()
        for value in ['["Missing"]', '["GitHub", "GitHub Pages"]', '[""]', '42', '["github"]']:
            with self.subTest(value=value):
                import re
                md.write_text(re.sub(r'emphasis:.*?(?=summary:)', 'emphasis: ' + value + '\n', source, flags=re.S))
                before = self.snapshot()
                self.assertIn('emphasis', self.refresh(success=False).stderr)
                self.assertEqual(before, self.snapshot())

    def test_project_status_changes_and_missing_status_group(self):
        self.add_fixtures()
        md = self.root / 'src/workbench/test-project/project.md'
        self.refresh()
        md.write_text(md.read_text().replace('status: building', 'status: shipped'))
        self.refresh()
        output = (self.root / 'src/workbench/index.html').read_text()
        self.assertEqual(output.count('id="test-project"'), 1)
        self.assertGreater(output.index('id="test-project"'), output.index('id="home-server"'))
        # New content must work even when no legacy card has this status.
        base = self.root / 'templates/workbench-index.html'
        base.write_text(base.read_text().replace('data-status="building"', 'data-status="planned"'))
        md.write_text(md.read_text().replace('status: shipped', 'status: building'))
        self.refresh()
        output = (self.root / 'src/workbench/index.html').read_text()
        self.assertLess(output.index('id="test-project"'), output.index('id="ascend"'))

    def test_package_copies_prepared_html_without_rendering_or_private_sources(self):
        self.add_fixtures()
        self.refresh()
        source = self.root / 'src'
        (source / 'experience/linkedIn_history').write_text('local reference only')
        legacy = source / 'experience/linkedIn'
        legacy.mkdir()
        (legacy / 'history.txt').write_text('local reference only')
        before = self.snapshot()
        output = self.root / 'site'
        # Packaging must not regenerate HTML, even when Markdown has changed.
        md = source / 'notes/test-note/note.md'
        md.write_text('invalid Markdown source')
        self.run_script('build_content.py', '--output', output)
        for excluded in ['experience/linkedIn_history', 'experience/linkedIn', 'notes/anatomy-of-a-note']:
            self.assertFalse((output / excluded).exists())
        self.assertFalse(list(output.rglob('*.md')))
        self.assertEqual((output / 'notes/test-note/index.html').read_bytes(), before[Path('src/notes/test-note/index.html')])
        self.assertTrue((output / 'notes/test-note/diagram.svg').exists())
        self.assertTrue((output / 'assets/resume.pdf').exists())
        self.assertTrue((source / 'experience/linkedIn_history').exists())
        self.assertIn('already exists', self.run_script('build_content.py', '--output', output, success=False).stderr)


if __name__ == '__main__':
    unittest.main()
