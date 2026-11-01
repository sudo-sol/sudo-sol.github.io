import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class ContentBuildTests(unittest.TestCase):
    def test_fixture_build_preserves_existing_content_and_links(self):
        with tempfile.TemporaryDirectory() as tmp:
            output = Path(tmp) / 'site'
            command = [sys.executable, str(ROOT / 'scripts/build_content.py'), '--content', str(ROOT / 'tests/fixtures/content'), '--output', str(output)]
            subprocess.run(command, check=True, capture_output=True, text=True)
            note = (output / 'notes/test-note/index.html').read_text()
            archive = (output / 'notes/index.html').read_text()
            workbench = (output / 'workbench/index.html').read_text()
            self.assertIn('<strong>bold</strong>', note)
            self.assertIn('<table>', note)
            self.assertIn('href="#the-example"', note)
            self.assertTrue((output / 'notes/test-note/diagram.svg').exists())
            self.assertLess(archive.index('/notes/test-note/'), archive.index('/notes/tf-access-map/'))
            self.assertIn('href="/notes/test-note/"', workbench)
            self.assertIn('id="access-map"', workbench)
            self.assertFalse(list(output.rglob('*.md')))
            second = subprocess.run(command, capture_output=True, text=True)
            self.assertNotEqual(second.returncode, 0)
            self.assertIn('already exists', second.stderr)


if __name__ == '__main__':
    unittest.main()
