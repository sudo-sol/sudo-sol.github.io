# Experience timeline logos

Assets prepared on 2026-10-27 and served locally. Logos remain the property of
their respective organizations. Logo containers are transparent in every theme;
the original brand colors and shapes remain intact.

| File | Official source | Preparation |
| --- | --- | --- |
| `lululemon.png` | User-supplied `lululemon.jpg` | Used the built-in imagegen edit tool to remove the checkerboard background and produce a red logo with alpha transparency, then resized to 256 × 256 for the web. |
| `visier.png` | [Website brand icon](https://www.visier.com/favicon-512x512.png) | Original asset, unchanged. |
| `sfu.png` | [University website logo](https://www.sfu.ca/etc/designs/clf/clientlibs/clf4/default/img/sfu-logo-only@2x.png) | Original asset, unchanged. |
| `accenture.svg` | [Accenture website](https://www.accenture.com/en) | Extracted the self-contained purple symbol SVG from the header (`rad-global-nav__static-logo`), preserving its path and fill. |

## Lululemon image edit prompt

Edit target: the attached local lululemon.jpg. Make a faithful transparent-background
cutout of ONLY the existing red lululemon circular logo. Remove ALL black and
dark-gray checkerboard pixels, including inside every negative space in the symbol
and outside the outer circle, replacing them with real alpha transparency. Preserve
the exact red logo silhouette, proportions, flat red color, and cutouts from the
supplied reference; do not redesign or embellish the logo. No text, background,
checkerboard, white badge, glow, shadow, outline, texture, or new elements. Center
the intact logo on a square transparent canvas with a very small equal margin
(roughly 5% on each side). Clean antialiased edges, crisp at small website icon
sizes. Output PNG with actual transparent alpha.
