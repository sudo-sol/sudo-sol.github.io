import importlib.util
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class ContentBuildTests(unittest.TestCase):
    def test_build_excludes_local_history_and_template(self):
        spec = importlib.util.spec_from_file_location('build_content', ROOT / 'scripts/build_content.py')
        builder = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(builder)
        with tempfile.TemporaryDirectory() as tmp:
            source = Path(tmp) / 'source'
            shutil.copytree(ROOT / 'src', source)
            (source / 'experience/linkedIn_history').write_text('local reference only')
            legacy = source / 'experience/linkedIn'
            legacy.mkdir(exist_ok=True)
            (legacy / 'history.txt').write_text('local reference only')
            output = Path(tmp) / 'site'
            builder.build(source, ROOT / 'tests/fixtures/content', output)
            self.assertFalse((output / 'experience/linkedIn_history').exists())
            self.assertFalse((output / 'experience/linkedIn').exists())
            self.assertFalse((output / 'notes/anatomy-of-a-note').exists())
            self.assertTrue((output / 'notes/test-note/index.html').exists())
            self.assertTrue((output / 'assets/resume.pdf').exists())
            self.assertTrue((source / 'experience/linkedIn_history').exists())

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
