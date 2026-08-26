# Font licensing

| File | Family | Foundry / owner | Status |
|---|---|---|---|
| RWESans-Light.woff2 | RWE Sans Light | RWE AG (proprietary corporate face) | ⚠ confirm webfont terms before non-RWE publication |
| RWESans-Regular.woff2 | RWE Sans Regular | RWE AG | ⚠ same |
| RWESans-Medium.woff2 | RWE Sans Medium | RWE AG | ⚠ same |
| RWESans-Bold.woff2 | RWE Sans Bold | RWE AG | ⚠ same |
| rwe-iconfont.woff2 | rwe-iconfont | RWE AG (site icon font) | ⚠ same |
| RWE_Icon_Font.ttf | RWE_Icon_Font | RWE AG (site icon font) | ⚠ same |

Context: this project is a replica migration of RWE's own site (rwe.com), so
use on RWE properties is licence-consistent; the fonts were captured from the
live site's own self-hosted /fonts/ directory. If licensing cannot be
confirmed for the target domain: delete the woff2/ttf files and their
`@font-face` rules in `styles/fonts.css` — all stacks fall back to
`rwe-fallback` (metric-matched Arial); icon glyphs will not render.
