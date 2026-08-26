# EDS conversion log — rwe.com replica (home page)

Single-page conversion (naming self-evident — no cross-page reuse questions).
Source of truth: stardust/prototypes/index-proposed.html (gated replica:
1440 = 1.68% px / Δ1 / 0 red; 360 = 8.02% / Δ0 / 0 red).

## Locked block inventory + decode tiers

| Block | Sections | Tier | Notes |
|---|---|---|---|
| `hero` | stage carousel | template-slotted | 1 row per slide: [picture][h1/h2 + h3 subhead + CTA]. Slide box style inferred from CTA emphasis (strong→light box, em→gradient box — mirrors live). Only slide 1 is `<h1>` (#57). Carousel JS from replica.js. |
| `spotlight` | news ticker | reconstructive | 1 row per item: [h3 + p + link][picture]. Ticker JS. |
| `columns` | strategy band (D11 collection name) | template-slotted | 1 row: [p, p, strong CTA][poster img + mp4 link]. Video = external canto mp4, click-to-play. |
| `responsibility` | wald video teaser + "Information for…" sidebar | template-slotted | row1: teaser [h3+p+link]; row2: sidebar [h3 + link list]. webm from repo /media/ (#103). |
| `cards` | 6 color cards; energy 3-up; career 3-up; contact icons | reconstructive | ONE block, variants: `color` (text cards on white), `media` (image top + white body), `media grey` (grey body), `contact` (icon + centered). 1 row per card. |
| `banner` | trading full-bleed; jobs teaser | template-slotted | variants `trading` (scrim ::before) / `jobs` (gradient caption + imprint). webm from repo /media/. |
| `press` | press releases | reconstructive | 1 row per release: [date `<time>` text][h3 title][link]. data-short month rendering in CSS. |
| `share-price` | euroland ticker | template-slotted | 1 row: euroland URL as plain link → block renders gradient box + iframe. |
| `breadcrumb` | navy bar above footer | template-slotted | 1 row: page trail ("RWE"). |
| header/footer | chrome | template-slotted | content/nav.html + content/footer.html; blocks carry replica chrome CSS. |

## Default content (D1 triage)
- "Our energy for a sustainable life" band, "Our expertise…" band-tail, quote-band heading, working intro (h2+2p+strong), media intro, contact heading — all authored as default content with section style `centered`.
- Grey ground bands: section style `grey` (shared surface across default content + blocks in the same section; loosefield decorations are decorative → CSS backgrounds in the foundation). This is the Step-3 closed set: `centered`, `grey`.

## Media
- Editorial images → DA `/media/rwe/…`, authored as content.da.live `<img>`.
- Videos (3 webm) → committed to repo `/media/` (auth-gated content.da.live must not serve video, #103). Canto strategy mp4 stays an external URL.
- Decorative: loosefield pngs, combined-energy.png → repo `/img/`, CSS-referenced.
- Euroland share ticker → iframe from block JS (live data widget).

## Fonts
- RWE Sans (Light/Regular/Medium/Bold woff2) self-hosted in `fonts/`; icon fonts (RWE_Icon_Font.ttf, rwe-iconfont.woff2) too.
- ⚠ LICENSING: RWE Sans is RWE's proprietary corporate face. This is a migration of RWE's own site, so use on RWE properties is licence-consistent — but confirm webfont terms before publishing on a non-RWE domain. See fonts/LICENSING.md.
- Family names kept as live (`light`/`regular`/`medium`/`bold`); metric fallback `rwe-fallback` (Arial, metric-matched to RWE Sans Regular).

## Chrome
- Header is OVERLAY chrome (absolute, transparent over the hero) — `--nav-height: 0` reservation is intentional; the header block never pushes content (no CLS from late load).
- Breadcrumb bar is its own small block above the footer (page-scoped trail).

## Known deviations / hand-off notes
- Mega-menu, search overlay, language selector: inert triggers (live nav content was not captured in the bounded single-page run — site-scope item).
- Slick autoplay speed assumed 7s (not extractable from static DOM).
- Press releases / spotlight items / share price are live data on rwe.com; frozen at capture values here.
