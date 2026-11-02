![sudo-sol / Build. Break. Understand.](src/assets/readme-banner.svg)

# sudo-sol

Addy's personal site: experience, projects, notes, and the person behind the terminal.

[Live site](https://sudosol.dev/) · [GitHub profile](https://github.com/sudo-sol) · [LinkedIn](https://www.linkedin.com/in/asriniva/)

## What is here

- **Home:** a short intro, a working Build / Break / Understand headline, a public `src/about.json` source peek, the experience "git log" card, and an interactive terminal.
- **Experience:** a git-graph timeline with role scope, selected contributions, supporting work, and a toolbox. All role details and the Simon Fraser University course list are visible without expanding sections. The timeline also includes the voluntary career break and the Anna University bachelor’s degree. Home’s git-log window mirrors the timeline’s company, education, and career-break entries with matching decorative commit hashes. Role summaries pair scope with selected, substantiated contributions from the supplied career history; SRE I and internship work retain distinct attribution. Keep dates and metrics aligned with that history, and link project stories only when approved public material exists. Company logos and career highlights support scanning; role context explains the progression from hands-on infrastructure work to technical leadership. Keep employer details public-safe: describe recovery and security work at the outcome level, without internal incident mechanisms or access configurations.
- **About:** a man-page-styled page (`man addy`) with the story, how I work, skills, interests, known bugs & features, and a contact form.
- **Workbench:** project cards (status, problem, approach, outcome, stack, links) with a status filter.
- **Notes:** the blog. A year-grouped archive with topic filters. Markdown notes are refreshed into checked-in HTML locally (see [Build Markdown content locally](#build-markdown-content-locally)); existing HTML entries remain in place.
- **Labs (hidden for now):** `src/labs/` still exists, but its shared navigation entry is disabled. See [Bring labs back](#bring-labs-back).
- **Two themes:** Solarpunk (light) and Cyberpunk. A leaf/circuit icon pill shows both choices and highlights the selected one. The choice is remembered; `t` alternates them. An old saved Dark preference migrates to Solarpunk.
- **A terminal on every page.** Press `/` or the `>_` logo. See [The terminal](#the-terminal).
- Static HTML, CSS, and JavaScript. No runtime framework, third-party font requests, analytics, or API keys. A local Python sync command maintains checked-in shared outputs. Play is self-hosted for headings and interface labels; terminal commands remain monospace.

The traffic simulation runs entirely in the browser. Each online instance contributes **40 req/s** of capacity; served traffic is `min(incoming traffic, capacity)`. It illustrates a simplified capacity model, not a real service.

## Shared design and authoring

Read [DESIGN_GUIDELINES.md](DESIGN_GUIDELINES.md) before visual or layout changes. It defines the Experience-based intro, type/spacing tokens, navigation scale, components, page-specific exceptions and required checks. About keeps its manual frame and hidden h1, while its `man addy` prompt shares the same intro start spacing as the other pages.

From a Git checkout with Python 3 and the dependencies in `requirements-content.txt`, after editing shared templates, CSS/JS sources, Markdown entries or public profile data, run:

```sh
python3 scripts/sync_site.py
python3 scripts/sync_site.py --check
python3 -m unittest discover -s tests -v
```

Edit unique page content in `src/`, and shared code in `src/assets/styles/`, `src/assets/scripts/` and `templates/`. `src/styles.css`, `src/app.js` and marked shared HTML regions are generated and checked in; the sync command bundles the small modules and versions asset URLs. No package installation or runtime templating is needed to serve the site. The contents of `src/` are the complete checked-in static site, including Markdown-generated HTML. Both the sync command and `scripts/refresh_content.py` refresh Markdown entries alongside shared output. The resulting site requires no runtime framework.

Navigation in `templates/site.json` drives the header, keyboard destinations and terminal tabs. `templates/header.html`, `footer.html` and `theme-picker.html` own repeated chrome. Home's public JSON peek is also generated from its single source. Unique page content and SEO metadata remain directly editable.

## Preview locally

From the repository root, run:

```sh
cd src
python3 -m http.server 4173 --bind 127.0.0.1
```

Open **http://127.0.0.1:4173**. Stop the server with `Ctrl+C`. If port 4173 is already in use, preserve the existing server and use `4174` in both the command and preview URL; this also applies to full-build previews.

Run the server inside `src/`, so the site root contains only public files. Keep sync, test and completion commands at the repository root (stop the server and `cd ..` if using the same terminal). Use the local server so root-relative assets and directory routes resolve correctly. Each route is a directory with its own `index.html`, so GitHub Pages serves `/experience/`, `/workbench/`, `/notes/`, `/notes/<slug>/`, and `/about/` (plus the hidden `/labs/`) without a router or build step. Preview that page at `/404.html`; Python's basic server does not automatically use it for missing routes.

## GitHub Actions for Pages

Content generation happens locally, before commit. The Pages workflow checks freshness and runs tests on branch pushes, pull requests and manual runs. It then packages the prepared `src/` files into `_site`, excluding Markdown and local authoring references. It never generates missing note HTML or commits files. A stale Markdown/HTML pair fails the check; run `python3 scripts/refresh_content.py` locally and commit the resulting files together.

The workflow is [`.github/workflows/pages.yml`](.github/workflows/pages.yml), named **Check and deploy prepared Pages**. Each successful run uploads a seven-day preview artifact named `site-preview-<run-id>-<attempt>`. Only a push to `main` publishes the prepared site to Pages; other branch pushes, pull requests and manual runs do not publish. The separate [documentation workflow](.github/workflows/documentation.yml) checks freshness, regression contracts and completion evidence without publishing.

The repository was configured to use GitHub Actions for Pages on 2026-10-31. Keep **Settings → Pages → Build and deployment → Source** set to **GitHub Actions**. This change retains that deployment mechanism and the existing `sudosol.dev` domain configuration. Workflow changes take effect after being pushed; no local refresh publishes the site. Live deployment must be verified separately after an authorized push/merge.

## Make it yours

| File | What it holds |
| --- | --- |
| `src/index.html` | Home: intro, experience card, inline terminal; browser tab title `Home / sudo-sol` |
| `src/experience/index.html` | Experience-based intro reference, timeline, stats and toolbox |
| `src/about/index.html` | About (man-page frame) and the contact form |
| `src/workbench/index.html` | Generated Workbench page; author existing cards in `templates/workbench-index.html` |
| `src/labs/index.html`, `src/labs/traffic/index.html` | Lab gallery and the traffic simulation (hidden for now) |
| `src/notes/index.html` | Generated Notes archive; author existing HTML entries in `templates/notes-index.html` |
| `src/notes/anatomy-of-a-note/index.html` | Local note template, excluded from deployment builds |
| `src/notes/cloudflare-domain-github-pages/` | Markdown guide and images; the builder generates its public page |
| `src/notes/<slug>/note.md`, `src/workbench/<slug>/project.md` | Markdown sources for generated entries |
| `scripts/refresh_content.py`, `scripts/build_content.py`, `requirements-content.txt` | Local refresh command, Markdown renderer/static packaging tool and dependencies |
| `src/notes/_template.md` | Copy to `src/notes/<slug>/note.md` to start a note |
| `src/404.html` | Missing-page copy |
| `src/styles.css` | Generated stylesheet; sources are in `src/assets/styles/` |
| `src/app.js` | Generated behavior bundle; guarded feature modules are in `src/assets/scripts/` |
| `src/assets/theme.js` | Solarpunk/Cyberpunk selection, persistence and legacy migration (loaded in `<head>` to avoid a flash) |
| `src/assets/cyber.css` | The cyber theme skin (purely visual) |
| `src/assets/term.js`, `src/assets/term.css` | The site-wide terminal |
| `src/assets/` | Also the favicon and README banner |

The shared component contract and type/spacing tokens live in `src/assets/styles/`; page-specific modules retain their reading, manual, timeline and project layouts. Theme state is in `src/assets/theme.js`; theme-specific visuals and growing-ink effect are in `src/assets/cyber.css` and `src/assets/themes.css`. The public profile in `src/about.json` renders into Home through the sync command. Play files and their licence are in `src/assets/fonts/`.

### The terminal

The header terminal button uses an opaque theme surface, a stronger accent border and a bold symbol so it stays visible over the background image. `src/assets/term.js` is progressive enhancement over normal links. Remove its `<script>` tag and the site still works.

- A tmux-style bar is pinned to the bottom of every page. The panel opens above it, never blocks the page, and only hides with `/`, `Esc`, `exit`, or the toggle. On the homepage it lives inline at `[data-term-dock]`.
- **Pages come from the header nav.** `cd`, `ls`, and the tmux windows read `header nav a` (link text = name, `data-term-desc` = description). Add a page to the nav and the terminal knows about it.
- **Page items are opt-in markup.** Add `data-term-item="name"` (plus optional `data-term-desc`) to a section, `<details>`, or link. `ls` lists them and `open name` scrolls to them, opens them, or follows the link.
- **Suggested commands:** set `data-term-chips="ls, open x, cd ~"` on `<body>`.
- A fresh terminal starts with only `systemctl status addy`. `cat now.txt` remains available when typed manually.
- Output, history, and open/closed state persist per browser tab (sessionStorage). Output is built with `textContent`; input is never parsed as HTML.

### Keyboard shortcuts

`/` terminal · `?` shortcuts panel · `t` Solarpunk/Cyberpunk · `g` then `h`/`e`/`w`/`n`/`a` to jump to a page. Shortcuts are ignored while typing in a field. The theme pill supports Tab, Enter/Space, Left/Right, Home and End. Terminal commands accept `theme light` / `theme cyber` and the aliases `theme solar`, `theme solarpunk` and `theme cyberpunk`; `theme dark` is no longer offered.

### Résumé download

Home and Experience offer a native download link to `src/assets/resume.pdf`; the terminal opens the same PDF with `open resume` or `open resume.pdf`. The website copy omits the phone number; the original document is kept separately.

To update it, replace `src/assets/resume.pdf` with the approved public PDF **without phone number or home address**, then check the download links and terminal command in local preview. Replacing this asset does not itself publish the website.

### Contact form

The About page currently offers LinkedIn as its working contact option and shows “Email form coming soon.” The unconfigured form is retained with `hidden` so visitors cannot fill it out before delivery is available. To connect it:

1. Create a [Formspree](https://formspree.io/) form, verify the receiving inbox, and copy its endpoint (`https://formspree.io/f/<id>`).
2. In `src/about/index.html`, set `data-endpoint="https://formspree.io/f/<id>"` on `#contact-form`.
3. Remove `hidden` and `aria-describedby="email-coming-soon"` from the form. Replace the coming-soon paragraph with accurate Formspree processing/privacy text and remove its unused ID.
4. Test delivery and reply handling before publishing. Keep the LinkedIn option available.

The `_gotcha` field is a honeypot for bots. Once connected, submissions go to Formspree, a third party.

### Add a page

1. Create `src/<slug>/index.html` by copying a suitable existing page; use the common page-intro structure from the design guide.
2. Register its path relative to `src/` in `templates/site.json` (for example `about/index.html`); add an enabled navigation entry and unique shortcut only when requested.
3. Optionally tag page items with `data-term-item`. Run the shared sync/check/test commands above. The tool creates the correct header/footer, active state, cache versions and shortcuts data.

### Build Markdown content locally

Keep **one Markdown file per entry**, with images alongside it:

- Notes: `src/notes/<slug>/note.md`; start from `src/notes/_template.md`.
- Workbench: `src/workbench/<slug>/project.md`; start from `src/workbench/_template.md`.

The renderer requires Python 3, Markdown 3.5.2 and PyYAML 6.0.1, pinned in `requirements-content.txt`. Check an existing installation with:

```sh
python3 -c 'import markdown, yaml; print(markdown.__version__, yaml.__version__)'
```

If either dependency is missing or has a different version, install the pinned versions using a Python installation with pip available:

```sh
python3 -m pip install -r requirements-content.txt
```

Some system Python installations lack pip and venv support. If the version check already prints `3.5.2 6.0.1`, no installation is needed; otherwise set up Python with pip before using the install command. A successful version check does not establish that pip works.

After adding, editing, renaming or deleting an entry, run from the repository root:

```sh
python3 scripts/refresh_content.py
python3 scripts/refresh_content.py --check
```

Refresh updates Notes and Workbench HTML directly in `src/`, along with shared chrome and asset versions. `python3 scripts/sync_site.py` performs the same refresh, so the existing shared-authoring procedure remains valid. The check option reports stale outputs without changing files. All entries, page structures and Notes/Workbench links are validated before output writes; invalid input leaves the prior HTML intact. A refresh has no network or deployment step.

Preview using the ordinary [local server](#preview-locally); a separate build is no longer needed to see Markdown content. Commit the Markdown, generated HTML and adjacent assets together. A new branch from a commit containing those files can serve the complete site immediately, without running a content generator.

For a note, use YAML front matter with title, summary, date (`YYYY-MM-DD`), tags (comma-separated slugs or a YAML list), status (`publish` or `draft`) and tldr. Begin the body with a `##` heading; these headings become sections and table-of-contents links. Published notes generate `src/notes/<slug>/index.html` and a dated archive entry. A draft creates an unlinked archive entry and removes its previously generated page. Draft Markdown and adjacent assets remain public when committed; draft status is not a privacy feature. Relative image paths such as `diagram.svg` work because the assets stay beside the generated page.

To accent one or more phrases in the note title, add optional `emphasis` front matter:

```yaml
title: "From a Cloudflare domain to GitHub Pages"
emphasis:
  - "Cloudflare"
  - "GitHub"
```

A single phrase also works: `emphasis: "GitHub Pages"`. Phrases match exact, case-sensitive text; every occurrence is accented. Missing, empty or overlapping phrases fail validation before output changes. Omit `emphasis` (or use `[]`) for a plain title. The renderer escapes all title text and adds the existing `terminal-em` class only to the selected phrases; archive titles, browser titles and social metadata stay plain text. Colours follow the active theme. Note articles have no top `← ~/notes` link; current templates and generated pages keep this consistent on future refreshes. The footer’s all-notes link remains available.

For a Workbench entry, use title, summary and status (`building`, `planned`, or `shipped`) in front matter. Start each detail with a `##` heading. It generates a card on `/workbench/#<slug>`, preserving the current card-based structure; it does not create a separate project detail page. Link related notes explicitly, for example `[case study →](/notes/example/)`. For project images, use `/workbench/<slug>/diagram.svg`. Fixtures in `tests/fixtures/content/` show both formats and are not included in normal refreshes.

Each refresh rebuilds archive entries, year groups and project cards from the current sources, retaining manually authored entries from the index templates. Topic/status filters and terminal items derive from the resulting markup. Note terminal suggestions use actual sections, and archive suggestions follow the current entries. Renaming an entry folder changes its URL. Deleting `note.md` removes only its owned generated HTML and archive entry; deleting `project.md` removes its card. Adjacent assets are author-owned and are never deleted by refresh. Remove them manually if they are no longer wanted. Hand-written HTML pages are preserved, and slug collisions are rejected.

Refresh validates links to Notes/Workbench pages, files and anchors throughout the prepared HTML, including authored Markdown links. A rename, deleted section, deletion or change to draft that would break a remaining reference blocks the refresh and identifies the link to fix. Update the authored Markdown, page or template and rerun; refresh does not guess replacements or rewrite prose. Other destinations and references in arbitrary JavaScript or external sites are outside this check. Generated pages carry an ownership comment; do not remove it or edit their HTML directly. Generated note routes are discovered automatically and do not go in `templates/site.json`.

### Package the prepared site

For a deployment-equivalent local copy, first check freshness, then package into a new directory:

```sh
python3 scripts/refresh_content.py --check
python3 scripts/build_content.py --output /tmp/sudo-sol-content-build
```

The output must not already exist. Use another directory for another package. `build_content.py` now copies prepared static files only; its old `--content` rendering option has been removed. It does not regenerate, deploy or modify source HTML. CI runs the freshness check before packaging.

Packaging excludes Markdown files, the local note template (`src/notes/anatomy-of-a-note/`) and temporary career-history references (`src/experience/linkedIn/` and `src/experience/linkedIn_history`). Git ignore rules alone do not protect files from copying; keep new private material outside `src/`. Preview the package with `python3 -m http.server 4173 --bind 127.0.0.1 --directory /tmp/sudo-sol-content-build` from the repository root; use `4174` if the normal preview already uses `4173`.

### Edit a hand-written project or archive entry

Existing hand-written project cards are owned by `templates/workbench-index.html`, and the existing HTML Notes archive entries are owned by `templates/notes-index.html`. Edit those templates and refresh; direct edits to the generated index pages are overwritten. Shared header/footer/assets still belong to their normal shared templates. The individual legacy note page remains directly authored in `src/notes/tf-access-map/`.

For a legacy project card, keep its unique `id` and `data-term-item`, and status `building`, `planned`, or `shipped`. Maintain building → planned → shipped ordering. Use Markdown for new entries. Migrating an existing entry requires removing its legacy template card/archive entry (and legacy page, for a note) before creating a Markdown source with the same slug; collisions fail rather than duplicate or overwrite authored content.

### Sample content

The Notes archive contains only real entries. The sample note remains a local authoring template and is excluded from deployment builds. Remove any new placeholder entries before publishing.

### Company logos

Experience organization and education entries use `.co-logo` tiles; the career break uses an original circular pause emblem. Logo provenance and preparation are documented in `src/assets/logos/README.md`. Each tile can hold a monogram. To use a real logo, add it to `src/assets/logos/` and replace the monogram with `<img src="/assets/logos/<name>.svg" alt="">`.

### Bring labs back

Only on explicit instruction, enable the Labs entry in `templates/site.json`, restore the About SEE ALSO link and run the sync command. Header, keyboard destinations and terminal tabs derive from that shared entry; do not add a separate route map in JavaScript.

### Styling

Canonical tokens are in `src/assets/styles/tokens.css`; the generated `src/styles.css` bundles shared and page-specific modules. Cyber overrides live in `src/assets/cyber.css`, and Solarpunk/effect refinements live in `src/assets/themes.css`. The header and theme-control geometry are shared in `src/assets/styles/layout.css`. The preference is stored in `localStorage` under `sudo-sol-theme` as `light` or `cyber`. Solarpunk uses the approved generated terraced-landscape illustration and a letter-by-letter bloom on Build; Cyberpunk uses the approved dark circuitry background with a faint grid and the Break glitch; moving background trails are removed. The selector's leaf unfolds in Solarpunk and its circuit icon jitters briefly in Cyberpunk. Both selected highlights remain circular and fitted inside the pill; only the icon animates. Theme CSS/animation script URLs carry content versions so markup and styles refresh together. Build follows the bloom reference: gentle idle letter sway, springy lift and scale near the pointer, a green-to-gold colour progression, and five growing leaf sprouts. Keyboard focus blooms the word too. Animation pauses outside Solarpunk, when the word is offscreen, or when the tab is hidden. Reduced motion shows static green text without leaves or movement; without JavaScript the original text and link remain usable.

## Structure

- `src/`: checked-in public pages, note images, assets, public profile and generated CSS/JS; this is the base site and its direct preview root. Local refresh includes Markdown entries in this same preview root; packaging makes a separate publication directory without rendering.
- `templates/`: shared authoring fragments, Notes/Workbench index sources and site-relative route configuration; kept outside the public root.
- `scripts/` and `tests/`: local synchronization, Markdown rendering, static packaging and regression tooling; kept at the workspace root.
- `src/notes/<slug>/note.md` and `src/workbench/<slug>/project.md`: Markdown content sources and adjacent images for local refresh.
- `.github/`: quality checks, completion tracking and the Pages deployment workflow.

All authoring and verification instructions are repository-local. Disposable Python caches are ignored.

[STRUCTURE.md](STRUCTURE.md) is the generated source-file inventory, including new notes, assets and repository quality checks. The **Make it yours** table above explains the main source owners. Refresh the inventory as part of each structural change; see [change completion](.github/COMPLETION.md).

Small enough to understand. Open enough to grow.

[Change completion](.github/COMPLETION.md) · [Generated source structure](STRUCTURE.md).

The Cloudflare guide is Markdown-owned in `src/notes/cloudflare-domain-github-pages/`; its page and archive entry are refreshed locally and checked in. Direct `src/` preview includes it. There is no separate drafts directory; `status: draft` creates an unlinked archive entry, but committed Markdown is public in the repository.

Local AI agent instructions and state are ignored by Git. Repository build and authoring instructions remain in this README, DESIGN_GUIDELINES.md and .github/COMPLETION.md.

### Shared theme backgrounds

The Solarpunk background is the approved generated illustration, optimized as `src/assets/solarpunk-landscape.webp` (about 172 KB). `src/assets/themes.css` owns its image, ivory wash and responsive focal position through `--solar-landscape`, `--solar-background-wash` and `--solar-background-position`. The retired trellis image is removed.

Cyberpunk uses the approved generated `src/assets/cyber-circuitry.webp` (about 30 KB), with subdued cyan/magenta edge circuitry and a dark centre for reading. `src/assets/cyber.css` owns `--cyber-circuitry` and `--cyber-background-wash`. The image fills a fixed viewport layer with a centred, proportional cover crop; narrower screens crop toward the quiet centre. Its faint embedded grid is backed by a static CSS grid fallback, with spacing controlled by `--cyber-grid-size`. There is no background trail canvas, animation loop or trail configuration. Other approved theme effects, including the wordmark and Break glitch, remain in their existing owners.

Note articles use the available desktop width with a fluid reading column and a wider table of contents on the right. At 900px and below, the TOC is hidden and the article fills one column. Current-page navigation uses pink-red holographic corner brackets, a burgundy fill and a bright label in Cyberpunk; Solarpunk uses an opaque sage tab, deep-green text and a vine with two leaves underneath. The bracket lock-on (380ms) and vine growth (550ms) play once when the state appears, with static highlights for reduced motion. Decorative pseudo-elements sit outside the text without widening the mobile navigation. Forced-colour mode uses an outline instead of the decorations.

The repository landing README lives at the root. Completion instructions are named `.github/COMPLETION.md` because GitHub prioritizes a README in `.github/` over a root README; see [GitHub’s README selection rules](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes). Keep completion links and `.github/completion.json` pointing to that document.
The root `CNAME` preserves the existing `sudosol.dev` domain record from `main`. Actions hosting uses the repository Pages settings; this file is outside the deployed `src/` tree. Keep it in the source inventory so pull-request merge checks see the same source files as the branch.
