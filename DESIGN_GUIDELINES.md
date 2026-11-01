# sudo-sol design and authoring guidelines

This is the design contract for current and future pages. Read it before changing layout, typography, navigation or shared components. Experience is the visual reference. Keep the site personal and playful: terminal terminology, the working shell and linked tabs, Play interface type, the Solarpunk/Cyberpunk identities, and the two word effects belong to this site.

## Source of truth

The base site is plain, checked-in HTML/CSS/JavaScript inside `src/`. `scripts/build_content.py` can add Markdown notes and workbench entries to a separate site output; see the README for content authoring and build commands. Templates and tooling stay at the repository root. It needs no application server, package install or runtime template engine. Author shared code in the following sources, then run:

```sh
python3 scripts/sync_site.py
python3 scripts/sync_site.py --check
python3 -m unittest discover -s tests -v
```

Authoring requires a Git checkout and Python 3; the content builder and regression suite additionally need `requirements-content.txt`. The sync tool only reads local sources; it never publishes or fetches data. From `src/`, preview with the README's `python3 -m http.server 4173 --bind 127.0.0.1` command.

| Concern | Edit here |
| --- | --- |
| Type, spacing, measurements and default palette | `src/assets/styles/tokens.css` |
| Reset, focus, body type and default headings | `src/assets/styles/base.css` |
| Page shell, header/footer, navigation and theme-control geometry | `src/assets/styles/layout.css` |
| Shared intro, buttons, filters, window chrome, labels and source peek | `src/assets/styles/components.css` |
| Content-specific layouts | `src/assets/styles/home.css`, `experience.css`, `workbench.css`, `notes.css`, `about.css`, `labs.css` |
| Header and footer markup | `templates/header.html`, `templates/footer.html` |
| Theme picker SVG/markup | `templates/theme-picker.html` |
| Routes, active navigation, shortcut letters and registered pages | `templates/site.json` |
| Common asset links and versions | `templates/assets.html` and the sync tool |
| Public profile data and its native source view | `src/about.json`, `templates/source-peek.html` |
| Build's letter bloom | `src/assets/themes.css`, `src/assets/scripts/home.js` |
| Shared DOM/toast helpers | `src/assets/scripts/common.js` |
| Keyboard navigation and shortcuts dialog | `src/assets/scripts/navigation.js` |
| Typing, bloom/glitch lifecycle and source-peek Escape handling | `src/assets/scripts/home.js` |
| Table of contents and retained contact form | `src/assets/scripts/about.js` |
| Data-driven filters and read time | `src/assets/scripts/content.js` |
| Hidden traffic simulation | `src/assets/scripts/traffic.js` |
| Theme state/persistence | `src/assets/theme.js` |
| Working terminal service and its own interface styling | `src/assets/term.js`, `src/assets/term.css` |
| Theme-specific colour, background and effects | `src/assets/cyber.css`, `src/assets/themes.css` |
| Shared Cyberpunk trail lifecycle | `src/assets/scripts/backgrounds.js`, registered in `templates/site.json` |

`src/styles.css` and `src/app.js` are generated, readable concatenations with source comments. Shared HTML regions are marked `shared:*`. Edit their source, not the generated output. Page-specific content and SEO metadata stay directly editable outside those regions. Avoid adding an override at the bottom of a file to defeat another module; change the component that owns the rule.

The sync tool updates shared regions, bundles authored modules, and content-versions every common asset. It also renders the profile fallback from the same public JSON file. Its read-only check fails if generated output is stale, a public page is unregistered, or an ordinary page skips the shared title/prompt/lead structure. Explicit page-kind exceptions preserve Home, About’s manual, the utility page and the hidden demo; they do not define alternate ordinary header sizes. Header navigation is the single route source for ordinary links, keyboard shortcuts and terminal tabs.

## Ordinary page introductions

Use this structure for an ordinary page header, including Workbench, Notes and note articles:

```html
<header class="page-intro" aria-labelledby="page-title">
  <p class="prompt" aria-hidden="true"><span class="u">~/page</span>$ command<span class="cursor"></span></p>
  <h1 class="page-title" id="page-title">Plain title <span class="terminal-em">upright emphasis</span></h1>
  <p class="lede">The introduction belongs directly below the title.</p>
</header>
```

- Use one left edge and a stacked prompt, heading and description. Do not put the description in a separate right-hand column.
- The shared top padding is 56px on desktop and 43px on small phones. Prompt-to-title gap is 18px; title-to-description gap is 27px; the lead's bottom margin is 28px. These values come from Experience and are common named tokens.
- Page title: Play, weight 700, `clamp(48px, 5.4vw, 72px)`; at 560px and below, `clamp(36px, 9vw, 50px)`. Leading is 1.08. Emphasis is upright at .82em in the theme accent. No decorative italics.
- Prompt: 14px monospace. Lead: 18px body face, 1.75 leading, maximum 700px. Match these values across pages; do not shrink individual intros to make a particular sentence fit.
- Let titles wrap naturally. Do not insert manual line breaks to create a different page layout. Very long article titles may need additional phone lines; keep their readability and shared size rather than forcing the gallery's arbitrary line limit.
- Article back links and publication metadata may add rows while preserving the shared inner type/spacing. Actions, filters and metadata follow the intro in normal reading order. Their content can change header height; do not force equal-height empty header boxes.

Home uses the same title/prompt scale across the full content width, with `.home-overview` below it. Its intro/actions and git-log card are two top-aligned columns above 900px and stack below that. The three headline words stay working links, and Build uses the reference letter bloom: glyphs lift within stable character boxes and decorative leaf sprouts stay absolute and pointer-inert. Keep the native project link and its accessible label.

## Type and spacing by role

| Role | Current shared value |
| --- | --- |
| Page title | Fluid 48–72px; phone 36–50px |
| Title emphasis | .82 of its parent; same Play face and upright |
| Lead paragraph | 18px / 1.75, max 700px |
| Ordinary body | 16px / 1.6 |
| Reading prose (src/notes/manual) | 17px; phone article prose 16px |
| Content/card heading | 26px; compact list title 20px |
| Section labels such as Timeline/Toolbox and terminal heading | 14px monospace (previously 12px) |
| Notes archive year | 16px Play (previously 14px) |
| Main navigation | 15px Play; 14px at 560px and below |
| Metadata | Existing 12–13px compact/code roles |

Small terminal/window chrome and the hidden simulation retain purpose-specific density. They are not page-intro references. About retains its man-page composition and sidebar. Its prompt must sit in `.page-intro.man-intro`, sharing the same `--intro-top` and prompt margin as Experience; the manual exception permits a hidden h1 and manual body, not independent top spacing. Only the intro’s bottom padding is removed to meet the manual bar; its section labels share the 14px flow-label token. Article body headings retain their reading hierarchy rather than becoming giant page titles.

Use named spacing tokens for shared relationships. The page shell is 1320px maximum, with 56px desktop gutters, 32px below 1050px and 21px below 560px. Do not create a second page shell or unique gutter for one page. Exact SVG coordinates, local card geometry and intentional timeline/logo measurements belong to their specific component modules.

## Header, themes and controls

Both themes use the same dimensions and type scale. Theme layers may change colour, background, case, texture and effects, not page-intro font sizes or navigation sizing.

The theme pill uses 44×44px interactive targets, 22px icons, 1px padding and a 2px gap: 48px high overall. Active fills stay circular; only the icon animates. Do not reduce the targets to make the pill look smaller. Keep visible keyboard focus, native button activation and Left/Right/Home/End behavior.

Solarpunk is `light`; Cyberpunk is `cyber`. Preserve saved-choice migration, the `t` shortcut and terminal aliases. Break's glitch is Cyberpunk-only; Build's bloom is Solarpunk-only: gently swaying letters lift and sprout leaves near the pointer or on keyboard focus, changing from green toward gold. Reduced motion shows static green text without sprouts; without JavaScript the original green link remains. Pause the loop when hidden or offscreen. Effects are enhancements: never delay a link, hide text awaiting JavaScript, intercept clicks with decoration, or move the headline's geometry. Reduced motion keeps the readable finished state without travel.

## Adding or changing a page

1. Copy a suitable existing public page and edit its unique metadata/content.
2. Register its path relative to `src/` in `templates/site.json`.
3. Use `.page-intro`, `.page-title`, `.prompt` and `.lede` for ordinary introductions. Reuse components and tokens before creating a page-specific rule.
4. Add navigation only when requested. Its `enabled`, `key`, `href`, label and terminal description live in the same config. Never enable Labs by inference.
5. Run the sync/check/test commands above. The generated HTML must contain the full header/footer and normal links without JavaScript.

Keep source-peek data public-safe. Do not copy private memory, employer details, project briefs or job-search inputs into templates or public assets. Preserve hidden Labs/contact behavior and existing download permissions. Do not introduce a framework, remote fonts/services, publication or a different visual identity during a consistency fix.

## Verification before handoff

- Check 1440px, 768px and 390px in both themes for representative ordinary, Home, reading and manual pages. Check actual header sizes/positions, wrapping and overflow; screenshots are required for visible changes.
- Compare the intro's prompt/title/lead geometry against Experience. Home's two column tops must align on desktop. Check Notes year=16px and section labels=14px.
- Check navigation/active state, filters, shortcuts, source-peek Enter/Escape, terminal commands/tabs, theme persistence and effects, article read time/TOC and hidden-form state. Do not submit a contact form as a visual test.
- Run `sync_site.py --check`, the regression suite, appropriate JavaScript syntax checks, and the repository completion workflow. Keep README and this guide aligned with actual commands and contracts.
- Preserve the site's deliberate terminal identity when using Taste Skill. Its generic bans on monospace, prompt labels, compact UI, panel lines and text-led pages are not reasons to redesign the approved site. Record retained style findings and genuine regressions separately.

Article images, including plain Markdown images outside figures, must fit their reading column with `max-width:100%` and proportional height. Wide tables and code blocks scroll inside their own containers.

Markdown notes are authored in `src/notes/<slug>/note.md` with adjacent images, starting from `src/notes/_template.md`. Use the content builder for full-site previews; generated note routes are not registered as checked-in HTML in `templates/site.json`. No separate drafts directory is used.

## Theme backgrounds

Solarpunk uses the approved generated `src/assets/solarpunk-landscape.webp` illustration. Its image, wash and responsive focal position are CSS properties in `src/assets/themes.css`. Keep the ivory wash strong enough for reading content. The previous repeated trellis has been removed.

Cyberpunk grid spacing and trail tuning live together in `src/assets/cyber.css`: `--cyber-grid-size` and `--cyber-trail-*`. The shared background module reads these settings rather than maintaining a separate grid definition. Its single noninteractive canvas stays behind content, caps density and frame rate, and stops for reduced motion, forced colours, hidden documents and the other theme. Trails may cross the whole viewport at equal brightness; shared CSS properties control their count (five) and original 220-pixel tail length. Use the existing behaviors configuration and sync command; do not add per-page background implementations.

The shared header terminal button uses a solid theme surface, 2px accent border and bold symbol for contrast over background imagery. Its hover state uses the higher surface token and text-coloured edge; retain its native button action and visible keyboard focus.
