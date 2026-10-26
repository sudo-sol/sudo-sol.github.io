![sudo-sol / Build. Break. Understand.](assets/readme-banner.svg)

# The workbench

A small personal site for infrastructure, reliability, experiments, and the notes worth keeping.

**Status:** an early playground. Project rows are clearly labeled ideas; there are no invented projects, results, or production metrics. This is separate from my resume for now.

[GitHub profile](https://github.com/sudo-sol) · [Repository](https://github.com/sudo-sol/sudo-sol.github.io)

## What is here

- A personal homepage with LinkedIn/GitHub icons and dark and light themes.
- Separate Workbench, Labs, Notes, and About pages with a shared navigation.
- A Labs gallery that opens individual experiments; the traffic lab is the first.
- Expandable future-project ideas, a field-notes placeholder, and an About page under construction.
- A custom 404 page, SVG favicon, and this README banner.
- Static HTML, CSS, and JavaScript. No installation, framework, build step, external fonts, analytics, or API keys.

The simulation runs entirely in the browser. Each online instance contributes **40 req/s** of capacity; served traffic is `min(incoming traffic, capacity)`. It illustrates a simplified capacity model, not a real service or a full load-balancing algorithm.

## Preview locally

From this repository, run:

```sh
python -m http.server 4173 --bind 127.0.0.1
```

Open **http://127.0.0.1:4173**. Stop the server with `Ctrl+C`.

Use the local server so root-relative assets and directory routes resolve correctly. Each route is a directory with its own `index.html`, so GitHub Pages serves `/workbench/`, `/labs/`, `/labs/traffic/`, `/notes/`, and `/about/` without a router or build step. Preview that page at `/404.html`; Python's basic server does not automatically use it for missing routes.

## Publish later with GitHub Pages

The files are ready for branch-based Pages hosting. Nothing in this starter pushes, publishes, or runs a deployment automatically.

When you are ready:

1. Review the files, commit them, and push to this repository's `main` branch.
2. In the repository, open **Settings → Pages**.
3. Choose **Deploy from a branch**, then **main** and **/(root)**, and save.
4. Wait for GitHub's Pages deployment to finish. The expected address for this repository is **https://sudo-sol.github.io/**.

The empty `.nojekyll` file lets GitHub serve these static files without Jekyll processing. There is no custom domain configuration or deployment workflow to maintain.

Official references: [Create a GitHub Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site) and [configure the publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Make it yours

| File | What to change |
| --- | --- |
| `index.html` | Short introduction and social icons; page navigation stays in the header |
| `workbench/index.html` | Project ideas and future repositories |
| `labs/index.html` | Gallery of playable labs |
| `labs/traffic/index.html` | Interactive traffic simulation |
| `notes/index.html` | Notes index |
| `about/index.html` | About placeholder and construction visual |
| `styles.css` | Colors, typography, spacing, and responsive layouts |
| `app.js` | Theme preference and the interactive simulation |
| `404.html` | Missing-page copy and home link |
| `assets/` | Favicon and README banner |

### Add the first real project

1. Turn an idea row in `workbench/index.html` into an actual project entry.
2. Give it a clear title and a short problem/contribution/outcome description.
3. Replace the `IDEA` badge with an accurate status and link to the real repository or write-up.
4. Add a screenshot or diagram if it helps explain the work.

### Add a field note

Create a plain HTML page under `notes/`, then link it from `notes/index.html`. No blog framework is required. A useful first entry can cover one problem, the options you considered, and what you learned.

### Add a lab

Create `labs/<slug>/index.html` with the shared navigation, stylesheet, and script. Add a linked card to `labs/index.html`. Keep simulations explicitly labeled, and only list playable experiments. The shared script exits after theme setup on pages without the traffic slider.

### Styling

Theme tokens are at the top of `styles.css`. The default is dark green with a lime accent. The theme button remembers a visitor's choice locally when browser storage is available. Reduced-motion preferences are respected; navigation and project disclosures work without JavaScript.

## Structure

```text
.
├── index.html
├── workbench/index.html
├── labs/index.html
├── labs/traffic/index.html
├── notes/index.html
├── about/index.html
├── styles.css
├── app.js
├── 404.html
├── .nojekyll
├── .editorconfig
├── .gitattributes
├── .gitignore
├── README.md
└── assets/
    ├── favicon.svg
    └── readme-banner.svg
```

Small enough to understand. Open enough to grow.
