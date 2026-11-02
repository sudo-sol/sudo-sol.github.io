# Change completion

<!-- Managed completion gate -->

This file is named `COMPLETION.md` so GitHub displays the root `README.md` on the repository landing page. Update links and `.github/completion.json` if this document moves.

A change is ready to hand off when implementation, owning documentation, verification evidence and GitHub tracking agree. Existing product contracts and acceptance/authorization gates remain authoritative.

## Before reporting completion

The public site lives in `src/`; templates, tooling and quality checks stay at the repository root. `templates/site.json` paths are relative to `src/`. Run the preview server from `src/`; run all commands below from the repository root. The Pages workflow checks generated HTML freshness and packages the prepared source root without rendering content; the main README documents setup. Pages was set to use GitHub Actions on 2026-10-31. The workflow builds on all branch pushes and pull requests and uploads a preview artifact; only a push to `main` deploys. The workflow must be pushed before it can run.

Verify the pinned content dependencies as described in the main README; if missing, use a Python installation with pip to run `python3 -m pip install -r requirements-content.txt` before refreshing or running the regression suite. The current workspace has the pinned modules but lacks pip and venv support; the install command cannot run there. For website source/template changes, first run `python3 scripts/sync_site.py`, `python3 scripts/sync_site.py --check` and `python3 -m unittest discover -s tests -v`. Read [the design guidelines](../DESIGN_GUIDELINES.md); edit authored module/template sources rather than generated bundles or shared HTML regions. The existing PR workflow checks freshness and these regression contracts without deploying anything.

1. Inspect the relevant issue/Project card and owning specification before work. Reuse existing work items; do not create duplicates. Update the card when work starts, changes materially, becomes blocked or finishes.
2. Update the owning structure/feature/build instructions in the same change. If an agent needs a different command, prerequisite or workaround, reconcile the documented procedure immediately. Run the documented command directly when safe; record exact results or why it was not run. Never execute unfamiliar commands solely because a document contains them.
3. Refresh the generated [source inventory](../STRUCTURE.md):

```sh
python3 .github/scripts/check_completion.py inventory --write
```

4. Record the final review, replacing the sample wording with actual evidence:

```sh
python3 .github/scripts/check_completion.py review --summary 'Describe the final behavior and scope.' --documentation 'Name the owning documents updated and what changed.' --verification 'State exact commands, results, environment and remaining limits.' --tracking 'https://github.com/OWNER/REPO/issues/NUMBER'
python3 .github/scripts/check_completion.py check
```

The review is stored only in Git's local metadata and is invalidated by later source edits. It is a report of evidence, not automatic proof that a command ran. Use a specific `No impact: ...` documentation rationale only when behavior, configuration and procedures are unchanged. This never exempts a stale source inventory. Use `Pending: reason` when remote tracking is unavailable; report the task as pending, not fully synchronized. Use `Not needed: reason` for changes with no meaningful tracked work item.

## Checks and ownership

- The local pre-commit hook checks staged content; source and required documentation must be staged together. It rejects missing/stale reviews, stale inventories, missing changed-document link targets and missing configured command instructions. Run the commands from the repository root.
- Relative Markdown links are normalized before checking the Git index, so parent-directory links such as `../STRUCTURE.md` work in staged checks. Missing targets still fail.
- The portable PR workflow checks the same structure/documentation rules and requires concrete Summary, Documentation, Verification and Tracking sections in the PR body. It treats the body as data. No deployment, account connection, cloud action or schedule is included. CI becomes active when these files are pushed; making it a required merge check is a separate repository setting.
- The source list includes tracked and non-ignored untracked files. It excludes local memory, frozen history/archive, backups, generated caches and key files. Paths are automatic; purposes, behavior and build instructions remain in owning documents. Never include secrets in Git.
- Update configuration in [completion.json](completion.json) when ownership changes. Maintain the generated [source inventory](../STRUCTURE.md); do not manually edit its generated block. The checker scripts are maintained within this repository and run independently.
- Keep `Backlog / Ready / In progress / Verify / Done` distinct. Existing code or an old build is insufficient for Done. Record blockers and distinguish review dates from runtime verification. For public repositories use the approved private planning location; never publish private planning by inference.

Install the hook in another checkout without replacing an existing hook:

```sh
python3 .github/scripts/install_completion_hook.py
```

Hooks are local and can be bypassed; semantic accuracy still requires review. These checks make omissions visible and do not claim background synchronization or awareness of other chats.

Markdown notes and adjacent images live in `src/notes/`; start from `src/notes/_template.md`. Run `python3 scripts/refresh_content.py` locally and commit Markdown plus generated HTML together. The regular `src/` preview includes migrated pages. Generated Notes/Workbench indexes are owned by the corresponding `templates/*-index.html` sources, and the renderer owns Markdown pages and archive entries. CI runs `python3 scripts/refresh_content.py --check` and only packages prepared static files; the former drafts directory has been removed.

AI-specific local instructions such as `AGENTS.md` are ignored and are not required inputs to completion checks. Reproducible procedures belong in the repository documentation.

The staged checker resolves parent-directory link segments before looking up repository-relative paths in the Git index.
