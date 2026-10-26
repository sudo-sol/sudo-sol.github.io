![sudo-sol — Build. Break. Understand.](assets/readme-banner.svg)

# The workbench

A small personal site for infrastructure, reliability, experiments, and the notes worth keeping.

**Status:** an early playground. Project rows are clearly labeled ideas; there are no invented projects, results, or production metrics. This is separate from my resume for now.

[GitHub profile](https://github.com/sudo-sol) · [Repository](https://github.com/sudo-sol/sudo-sol.github.io)

## What is here

- A responsive homepage with dark and light themes.
- An interactive traffic simulation: toggle instances and change incoming load.
- Expandable spaces for future projects and a starting point for field notes.
- A custom 404 page, SVG favicon, and this README banner.
- Static HTML, CSS, and JavaScript. No installation, framework, build step, external fonts, analytics, or API keys.

The simulation runs entirely in the browser. Each online instance contributes **40 req/s** of capacity; served traffic is `min(incoming traffic, capacity)`. It illustrates a simplified capacity model, not a real service or a full load-balancing algorithm.

## Preview locally

From this repository, run:

```sh
python -m http.server 4173 --bind 127.0.0.1
```

Open **http://127.0.0.1:4173**. Stop the server with `Ctrl+C`.

Opening `index.html` directly also works for the homepage. A local server better reflects deployed paths, especially for the custom 404 page. Preview that page at `/404.html`; Python's basic server does not automatically use it for missing routes.

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
| `index.html` | Intro copy, navigation, project rows, and notes |
| `styles.css` | Colors, typography, spacing, and responsive layouts |
| `app.js` | Theme preference and the interactive simulation |
| `404.html` | Missing-page copy and home link |
| `assets/` | Favicon and README banner |

### Add the first real project

1. Turn an idea row in `index.html` into an actual project entry.
2. Give it a clear title and a short problem/contribution/outcome description.
3. Replace the `IDEA` badge with an accurate status and link to the real repository or write-up.
4. Add a screenshot or diagram if it helps explain the work.

### Add a field note

Create a plain HTML page under `notes/`, then link it from the notes section. No blog framework is required. A useful first entry can cover one problem, the options you considered, and what you learned.

### Styling

Theme tokens are at the top of `styles.css`. The default is dark green with a lime accent. The theme button remembers a visitor's choice locally when browser storage is available. Reduced-motion preferences are respected; navigation and project disclosures work without JavaScript.

## Structure

```text
.
├── index.html
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
