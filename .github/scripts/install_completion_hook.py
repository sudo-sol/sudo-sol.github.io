#!/usr/bin/env python3
"""Managed completion gate: install a local hook without overwriting another hook."""
from pathlib import Path
import subprocess
import sys
root = Path(subprocess.check_output(['git', 'rev-parse', '--show-toplevel'], text=True).strip())
custom = subprocess.run(['git', 'config', '--get', 'core.hooksPath'], capture_output=True, text=True)
if custom.returncode == 0:
    sys.exit('Existing core.hooksPath configured; integrate completion check there explicitly.')
directory = Path(subprocess.check_output(['git', 'rev-parse', '--absolute-git-dir'], text=True).strip()) / 'hooks'
directory.mkdir(exist_ok=True)
hook = directory / 'pre-commit'
content = '#!/bin/sh\n# Managed completion gate\nexec python3 .github/scripts/check_completion.py check --staged\n'
if hook.exists() and hook.read_text() != content:
    sys.exit('Existing pre-commit hook left unchanged; integrate completion check explicitly.')
hook.write_text(content)
hook.chmod(0o755)
print('Installed local completion hook:', hook)
