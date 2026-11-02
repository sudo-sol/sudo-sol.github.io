"""Regression checks for shared authoring, cache versions and progressive HTML output."""
from pathlib import Path
import hashlib
import html
import json
import re
import shutil
import subprocess
import tempfile
import unittest

SOURCE = Path(__file__).resolve().parents[1]


class SharedSiteTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix='sudo-sol-sync-')
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        for folder in ['templates', 'src/assets/styles', 'src/assets/scripts', 'scripts']:
            shutil.copytree(SOURCE / folder, self.root / folder)
        for path in ['about.json', 'styles.css', 'app.js', 'assets/term.css', 'assets/cyber.css', 'assets/themes.css', 'assets/theme.js', 'assets/term.js']:
            target = self.root / 'src' / path
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(SOURCE / 'src' / path, target)
        self.config = json.loads((SOURCE / 'templates/site.json').read_text())
        for path in self.config['pages']:
            target = self.root / 'src' / path
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(SOURCE / 'src' / path, target)
        for folder in ['notes', 'workbench']:
            shutil.copytree(SOURCE / 'src' / folder, self.root / 'src' / folder, dirs_exist_ok=True)
        self.run_command(['git', 'init', '-q'])

    def run_command(self, command, success=True):
        result = subprocess.run(command, cwd=self.root, text=True, capture_output=True)
        if success:
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        return result

    def sync(self, *options, success=True):
        return self.run_command(['python3', 'scripts/sync_site.py', *options], success)

    def test_template_propagation_preserves_page_content_and_active_navigation(self):
        self.sync('--check')
        before = (self.root / 'src/notes/tf-access-map/index.html').read_text()
        path = self.root / 'templates/header.html'
        path.write_text(path.read_text().replace('<header class="site-header">', '<header class="site-header"><!-- shared-probe -->'))
        result = self.sync('--check', success=False)
        self.assertNotEqual(result.returncode, 0)
        self.sync()
        self.sync('--check')
        after = (self.root / 'src/notes/tf-access-map/index.html').read_text()
        strip = lambda text: re.sub(r'<!-- shared:header:start -->.*?<!-- shared:header:end -->', '', text, flags=re.S)
        self.assertEqual(strip(before), strip(after))
        self.assertIn('href="/notes/" aria-current="page"', after)
        for page in self.config['pages']:
            output = (self.root / 'src' / page).read_text()
            self.assertIn('<!-- shared-probe -->', output)
            self.assertNotIn('href="/labs/" data-term-desc', output)
        snapshot = {page: (self.root / 'src' / page).read_bytes() for page in self.config['pages']}
        self.sync()
        self.assertEqual(snapshot, {page: (self.root / 'src' / page).read_bytes() for page in self.config['pages']})

    def test_public_profile_is_escaped_and_matches_native_source_peek(self):
        path = self.root / 'src/about.json'
        profile = json.loads(path.read_text())
        profile['known_bug'] = '<b>public text, not markup</b>'
        path.write_text(json.dumps(profile, indent=2))
        self.assertNotEqual(self.sync('--check', success=False).returncode, 0)
        self.sync()
        output = (self.root / 'src/index.html').read_text()
        region = re.search(r'<!-- shared:profile:start -->(.*?)<!-- shared:profile:end -->', output, re.S)[1]
        code = re.search(r'<code>(.*?)</code>', region, re.S)[1]
        self.assertEqual(json.loads(html.unescape(code)), profile)
        self.assertNotIn('<b>public text', region)
        self.assertIn('<details class="source-peek">', region)

    def test_module_change_invalidates_output_and_versions_every_page(self):
        for source, output in [('assets/scripts/common.js', 'app.js'), ('assets/styles/tokens.css', 'styles.css')]:
            path = self.root / 'src' / source
            path.write_text(path.read_text() + '\n/* cache-version probe */\n')
            self.assertNotEqual(self.sync('--check', success=False).returncode, 0)
            self.sync()
            version = hashlib.sha256((self.root / 'src' / output).read_bytes()).hexdigest()[:12]
            for page in self.config['pages']:
                self.assertIn('/' + output + '?v=' + version, (self.root / 'src' / page).read_text())
        self.sync('--check')

    def test_unregistered_page_is_rejected_without_writing_outputs(self):
        page = self.root / 'src/new/index.html'
        page.parent.mkdir()
        shutil.copyfile(self.root / 'src/experience/index.html', page)
        before = (self.root / 'src/styles.css').read_bytes()
        result = self.sync(success=False)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('Register public HTML pages', result.stdout + result.stderr)
        self.assertEqual(before, (self.root / 'src/styles.css').read_bytes())

    def test_ordinary_page_cannot_skip_shared_title_contract(self):
        page = self.root / 'src/experience/index.html'
        page.write_text(page.read_text().replace('class="page-title"', '', 1))
        result = self.sync('--check', success=False)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('h1.page-title', result.stdout + result.stderr)

    def test_manual_layout_exception_still_requires_shared_prompt_intro(self):
        self.sync('--check')  # The manual's hidden h1 remains supported.
        page = self.root / 'src/about/index.html'
        page.write_text(page.read_text().replace('class="page-intro man-intro"', 'class="man-intro"', 1))
        result = self.sync('--check', success=False)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('manual pages require their prompt inside the shared page-intro', result.stdout + result.stderr)


if __name__ == '__main__':
    unittest.main()
