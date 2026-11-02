#!/usr/bin/env python3
"""Refresh checked-in Notes/Workbench HTML and shared assets; never publish."""
from sync_site import main
import yaml

if __name__ == '__main__':
    try:
        main()
    except (ValueError, KeyError, OSError, yaml.YAMLError) as error:
        raise SystemExit(str(error))
