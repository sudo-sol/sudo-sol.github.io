![sudo-sol / Build. Break. Understand.](src/assets/readme-banner.svg)

# sudo-sol

Addy's personal site: experience, projects, notes, and the person behind the terminal.

[Live site](https://sudo-sol.github.io/) · [GitHub profile](https://github.com/sudo-sol) · [LinkedIn](https://www.linkedin.com/in/asriniva/)

## What is here

- **Home:** a short intro, a working Build / Break / Understand headline, a public `src/about.json` source peek, the experience "git log" card, and an interactive terminal.
- **Experience:** a git-graph timeline of roles, outcomes, and a toolbox, with a logo slot per company. Public-safe: outcomes only, with no incident or security specifics.
- **About:** a man-page-styled page (`man addy`) with the story, how I work, skills, interests, known bugs & features, and a contact form.
- **Workbench:** project cards (status, problem, approach, outcome, stack, links) with a status filter.
- **Notes:** the blog. A year-grouped archive with topic filters. New Markdown notes can be built locally (see [Build Markdown content locally](#build-markdown-content-locally)); existing HTML entries remain in place.
- **Labs (hidden for now):** `src/labs/` still exists, but its shared navigation entry is disabled. See [Bring labs back](#bring-labs-back).
- **Two themes:** Solarpunk (light) and Cyberpunk. A leaf/circuit icon pill shows both choices and highlights the selected one. The choice is remembered; `t` alternates them. An old saved Dark preference migrates to Solarpunk.
- **A terminal on every page.** Press `/` or the `>_` logo. See [The terminal](#the-terminal).
- Static HTML, CSS, and JavaScript. No runtime framework, third-party font requests, analytics, or API keys. A local Python sync command maintains checked-in shared outputs. Play is self-hosted for headings and interface labels; terminal commands remain monospace.

The traffic simulation runs entirely in the browser. Each online instance contributes **40 req/s** of capacity; served traffic is `min(incoming traffic, capacity)`. It illustrates a simplified capacity model, not a real service.

## Shared design and authoring

Read [DESIGN_GUIDELINES.md](DESIGN_GUIDELINES.md) before visual or layout changes. It defines the Experience-based intro, type/spacing tokens, navigation scale, components, page-specific exceptions and required checks. About keeps its manual frame and hidden h1, while its `man addy` prompt shares the same intro start spacing as the other pages.

From a Git checkout with Python 3 and the dependencies in `requirements-content.txt`, after editing shared templates, CSS/JS sources or public profile data, run:

```sh
python3 scripts/sync_site.py
python3 scripts/sync_site.py --check
python3 -m unittest discover -s tests -v
```

Edit unique page content in `src/`, and shared code in `src/assets/styles/`, `src/assets/scripts/` and `templates/`. `src/styles.css`, `src/app.js` and marked shared HTML regions are generated and checked in; the sync command bundles the small modules and versions asset URLs. No package installation or runtime templating is needed to serve the site. The contents of `src/` are the checked-in static site; a content build adds Markdown-authored entries to a separate output. The resulting site requires no runtime framework.

Navigation in `templates/site.json` drives the header, keyboard destinations and terminal tabs. `templates/header.html`, `footer.html` and `theme-picker.html` own repeated chrome. Home's public JSON peek is also generated from its single source. Unique page content and SEO metadata remain directly editable.

## Preview locally

From the repository root, run:

```sh
cd src
python3 -m http.server 4173 --bind 127.0.0.1
```

Open **http://127.0.0.1:4173**. Stop the server with `Ctrl+C`.

Run the server inside `src/`, so the site root contains only public files. Keep sync, test and completion commands at the repository root (stop the server and `cd ..` if using the same terminal). Use the local server so root-relative assets and directory routes resolve correctly. Each route is a directory with its own `index.html`, so GitHub Pages serves `/experience/`, `/workbench/`, `/notes/`, `/notes/<slug>/`, and `/about/` (plus the hidden `/labs/`) without a router or build step. Preview that page at `/404.html`; Python's basic server does not automatically use it for missing routes.

## Set up GitHub Actions for Pages

The Pages workflow builds on pushes to every branch, pull requests, and manual runs. Each successful build uploads the generated site as a seven-day Actions artifact named `site-preview-<run-id>-<attempt>`; branch pushes and pull requests do not publish the site. Only a push to `main` deploys to GitHub Pages after the build and checks pass. GitHub Pages was set to use Actions on 2026-10-31. Push the workflow with the branch to run its checks and generate a preview.

The workflow is in [`.github/workflows/pages.yml`](.github/workflows/pages.yml). Open the successful run in **Actions → Build and deploy Pages** and download its `site-preview` artifact to inspect the generated HTML before merging. After the change is merged to `main`, the push runs the same checks and deploys the generated site. The Actions workflow artifact is a preview download; the Pages deployment artifact is published only from `main`.

To check or restore this setting, open **Settings → Pages → Build and deployment → Source** in the GitHub repository and select **GitHub Actions**. In **Actions**, open the workflow run to check the build and deployment; if required, approve the `github-pages` environment deployment. The workflow must be pushed to GitHub before it can run. For a manual preview run, open **Actions → Build and deploy Pages → Run workflow** and choose a branch; manual runs build and upload an artifact but do not publish. This publishes the generated `_site` contents, including the checked-in `src/` site and Markdown-generated entries. It does not commit generated HTML back to the repository. The separate `.github/workflows/documentation.yml` continues to check pull request documentation and does not publish. See GitHub's [Pages source settings](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) and [custom Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Make it yours

| File | What it holds |
| --- | --- |
| `src/index.html` | Home: intro, experience card, inline terminal; browser tab title `Home / sudo-sol` |
| `src/experience/index.html` | Experience-based intro reference, timeline, stats and toolbox |
| `src/about/index.html` | About (man-page frame) and the contact form |
| `src/workbench/index.html` | Project cards |
| `src/labs/index.html`, `src/labs/traffic/index.html` | Lab gallery and the traffic simulation (hidden for now) |
| `src/notes/index.html` | Notes archive (the blog) |
| `src/notes/anatomy-of-a-note/index.html` | Sample post and the template for new ones |
| `src/notes/cloudflare-domain-github-pages/` | Markdown guide and images; the builder generates its public page |
| `src/notes/<slug>/note.md`, `src/workbench/<slug>/project.md` | Markdown sources for generated entries |
| `scripts/build_content.py`, `requirements-content.txt` | Content builder and its Python dependencies |
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

`src/assets/term.js` is progressive enhancement over normal links. Remove its `<script>` tag and the site still works.

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

The content builder adds Markdown entries to a **separate** copy of the static site. Existing HTML notes and workbench cards remain in place. It needs Python 3 and the dependencies in `requirements-content.txt`:

```sh
python3 -m pip install -r requirements-content.txt
python3 scripts/build_content.py --output /tmp/sudo-sol-content-build
```

The output directory must not already exist. Preview it by running `python3 -m http.server 4173 --bind 127.0.0.1 --directory /tmp/sudo-sol-content-build` from the repository root. Use a different output directory for each build, or remove an old output you no longer need. The build does not deploy or update checked-in HTML. GitHub Actions runs this build on every branch and provides a downloadable preview; only a push to `main` deploys. The workflow must first be pushed to GitHub.

For a note, copy `src/notes/_template.md` to `src/notes/<slug>/note.md` and put its images alongside it. Use the front matter shown in `tests/fixtures/content/notes/test-note/note.md`: title, summary, date (YYYY-MM-DD), comma-separated tags, status (`publish` or `draft`) and tldr. Begin the body with a `##` heading; each heading becomes a section and table-of-contents link. A draft gets an unlinked archive entry and no page. Use a relative image path such as `diagram.svg` in the Markdown image syntax. Image files are copied alongside the generated page. The source Markdown remains in the repository and is public when committed.

For a workbench card, create `src/workbench/<slug>/project.md` with title, summary and status (`building`, `planned`, or `shipped`) in front matter. Start each card detail with a `##` heading. Add links directly in Markdown, for example `[case study →](/notes/example/)`. See `tests/fixtures/content/workbench/test-project/project.md`. Images alongside the project are copied to `/workbench/<slug>/`; use that absolute path in the card. The builder rejects slugs that collide with existing HTML pages or cards. Existing HTML entries are still edited by hand until migrated.

Each run reads the current Markdown sources and builds into a new directory. Adding a source adds an entry; editing it updates the generated entry; removing its Markdown file omits the entry and its generated assets from the next fresh build. Existing output directories are not changed, and the currently published site changes only after a successful deployment. Existing hand-written HTML under `src/` is copied as-is and must be edited or removed separately. The builder does not check or update links elsewhere when an entry is renamed or deleted; check those links yourself. An existing HTML page or card with the same slug prevents a Markdown entry from being generated.

The builder supports standard Markdown, fenced code and tables. Keep images directly in the entry folder. Test fixtures are examples and are not included in normal builds. To build them instead, use `python3 scripts/build_content.py --content tests/fixtures/content --output /tmp/sudo-sol-content-test` and preview that output directory.

### Edit a hand-written project

For the existing HTML cards, copy an `<article class="proj">` in `src/workbench/index.html`. Set `data-status` to `building`, `planned`, or `shipped` (it drives the badge and the filter), fill in problem, approach, outcome, and next, and give it a unique `id` and `data-term-item`. Keep entries ordered building → planned → shipped.

### Sample content

Entries marked with a dashed **SAMPLE** tag (and an `<!-- SAMPLE -->` comment) are placeholders. Replace or delete them before publishing.

### Company logos

Each experience entry has a `.co-logo` tile with a monogram. To use a real logo, add it to `src/assets/logos/` and replace the monogram with `<img src="/assets/logos/<name>.svg" alt="">`.

### Bring labs back

Only on explicit instruction, enable the Labs entry in `templates/site.json`, restore the About SEE ALSO link and run the sync command. Header, keyboard destinations and terminal tabs derive from that shared entry; do not add a separate route map in JavaScript.

### Styling

Canonical tokens are in `src/assets/styles/tokens.css`; the generated `src/styles.css` bundles shared and page-specific modules. Cyber overrides live in `src/assets/cyber.css`, and Solarpunk/effect refinements live in `src/assets/themes.css`. The header and theme-control geometry are shared in `src/assets/styles/layout.css`. The preference is stored in `localStorage` under `sudo-sol-theme` as `light` or `cyber`. Solarpunk uses the botanical trellis and a green fill growing upward inside Build’s letters; Cyberpunk keeps the grid and Break glitch. The selector's leaf unfolds in Solarpunk and its circuit icon jitters briefly in Cyberpunk. Both selected highlights remain circular and fitted inside the pill; only the icon animates. Theme CSS/animation script URLs carry content versions so markup and styles refresh together. Build fills once on load or entering Solarpunk, and replays on pointer entry or keyboard focus over 1.2 seconds before staying green. It uses the actual link text, with no decorative overlay or geometry changes. Without JavaScript or text-clip support it remains solid green; reduced-motion preferences show that finished state immediately.

## Structure

- `src/`: checked-in public pages, note images, assets, public profile and generated CSS/JS; this is the base site and its direct preview root. A content build makes a separate publication directory.
- `templates/`: shared authoring fragments and site-relative route configuration; kept outside the public root.
- `scripts/` and `tests/`: local synchronization, Markdown content building and regression tooling; kept at the workspace root.
- `src/notes/<slug>/note.md` and `src/workbench/<slug>/project.md`: optional Markdown content sources and adjacent images for the content builder.
- `.github/`: quality checks, completion tracking and the Pages deployment workflow.

All authoring and verification instructions are repository-local. Disposable Python caches are ignored.

[STRUCTURE.md](STRUCTURE.md) is the generated source-file inventory, including new notes, assets and repository quality checks. The **Make it yours** table above explains the main source owners. Refresh the inventory as part of each structural change; see [change completion](.github/README.md).

Small enough to understand. Open enough to grow.

[Change completion](.github/README.md) · [Generated source structure](STRUCTURE.md).

The Cloudflare guide is now Markdown-owned in `src/notes/cloudflare-domain-github-pages/`; its page and archive entry are generated at build time. Direct `src/` preview omits Markdown-owned pages: build the full site to preview them. There is no separate drafts directory; `status: draft` creates an unlinked archive entry, but committed Markdown is public in the repository.

Local AI agent instructions and state are ignored by Git. Repository build and authoring instructions remain in this README, DESIGN_GUIDELINES.md and .github/README.md.
