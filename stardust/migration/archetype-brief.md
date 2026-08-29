# Shared archetype-recreation brief — rwe.com replica (A2–A6)

You are recreating ONE archetype of rwe.com as a standalone pixel-replica
prototype, then passing the source-fidelity gate. Two archetypes are already
gated and are your quality reference: `stardust/prototypes/index-proposed.html`
(home: 1.68%/Δ1 @1440) and `article-proposed.html` (3.92%/Δ0 @1440,
5.84%/Δ2 @360). Repo root: `/Users/paolo/stardust/2026-08/rwe/rwe` (work from here).

## Non-negotiables

- **This is recreation, not redesign.** Content strings verbatim from the live
  page; geometry/typography lifted from the live site's own CSS/computed
  styles; never DOM-copy wholesale, never "improve" anything.
- **Pass bar per breakpoint (1440 AND 360):** pixel diff ≤10%, |height Δ| ≤8px,
  content-diff 0 unjustified structural 🔴, visual-diff flags none/justified.
- **Do NOT** git commit/push, kill or restart servers, or edit shared files
  (`css/canon.css`, `css/index.css`, `css/article.css`, `js/replica.js`,
  `scripts/replica/*`, `scripts/diff/*`, `stardust/state.json`,
  `stardust/replica/progress.json`). If you find a bug in a shared file,
  record it in your result JSON under `sharedFileFindings` instead.
- Your files only: `stardust/prototypes/<slug>-proposed.html`,
  `stardust/prototypes/css/<slug>.css`, new assets in
  `stardust/prototypes/assets/media/` (prefix filenames with your slug if
  generic), probe scripts as `stardust/scripts/<slug>-*.mjs`, gate evidence in
  `stardust/replica/gates/<slug>-1440/` and `<slug>-360/`, and your result file
  `stardust/replica/gates/<slug>-result.json`.

## Environment facts (verified)

- Prototype server: `http://localhost:8797/` serving `stardust/prototypes/`.
  **Verify it serves YOUR file by grepping a marker string before every gate
  run** (a stale server from another project once hijacked port 8791 and a
  gate silently measured a foreign site). If the server is down, start it:
  `(cd stardust/prototypes && python3 -m http.server 8797 &)` — never a
  different port, never kill an existing one that serves our files.
- rwe.com is behind a Cloudflare managed challenge: ALL live page loads need
  **headed real Chrome** (`--headed` on the instruments; `chromium.launch({
  headless: false, channel: 'chrome' })` in ad-hoc probes). Static assets
  (images/CSS/fonts/videos) bypass the wall: plain `curl -A "<real-Chrome
  UA>"` works. **Pace live hits** (sequential, ~2s between; the site 429s
  bursts).
- Consent dialog: dismiss via visible-button text "Accept all" — BUT for the
  GATE reference capture use the **deny state**:
  `--consent 'button:has-text("Deny all")'` on stitch-shot. Accepting loads
  consent-gated third-party embeds (LinkedIn walls etc.) that are
  nondeterministic; the deny state matches what the EDS page shows. If your
  page renders a consent placeholder ("Currently you have not allowed the
  cookies …"), replicate that placeholder text verbatim (capture-state).

## Design tokens (lifted, in css/canon.css — import, don't redefine)

navy #1d4477 · teal #00a19f · mint #3ed8c3 · surface #e8e8e4 · sky #00b1eb ·
gradient `linear-gradient(45deg,#1d4477 22%,#00a19f)` · container 1170px ·
fonts: families literally named `light/regular/medium/bold` (RWE Sans,
self-hosted) + `RWE_Icon_Font`/`rwe-iconfont` icon fonts.
Type: html base 20px desktop / 15px mobile / 18px tablet (live uses rem);
p 18/27 (15/22 mobile); h2 32/38; h3 24/32; buttons: medium 18/22, pad 8/24,
radius 5, 2px teal border (primary solid teal, reverse transparent).
Useful icon codepoints: arrow-long-right \e914 (affordance after), arrow-long-left
\e913 (back), arrow-left/right \e911/\e918, arrow-up/down \e919/\e910, download
\e93d, eye \e93f, maximize \e916, burger \e924, contact \e993, add-app \e99a,
globe-bold \e996, magnifier-bold \e995.

## Page scaffold to copy (from the gated prototypes)

- Chrome: copy the `<header class="site-header site-header--solid">…` block +
  `<footer class="site-footer">…` + `<nav id="breadcrumb-bottom">` from
  `article-proposed.html` (solid gradient header is correct for ALL non-home
  pages; set the breadcrumb trail to your page's real trail from the live
  page). Import css: `canon.css`, `index.css`, `article.css`, then your own
  `<slug>.css` (new modules only).
- Grey bands: `.band.band--grey` pattern in index.css (loosefield art is
  randomized per live load — position yours from your capture, log as
  permanent residual).
- Sections use `.container` (1170 centered); **mobile trap: `.container`
  already pads 16px at ≤767px — do NOT add another 16 (the double-pad bug bit
  twice; live nested-container prose is 296 wide = pad 32, single-container
  content is 328 = pad 16).**

## Capture + recreation procedure (what worked)

1. Ground truth: `node scripts/replica/stitch-shot.mjs "<liveURL>"
   stardust/replica/gates/<slug>-1440/live.png --width 1440 --settle --headed
   --fullpage --consent 'button:has-text("Deny all")'` (and 360). The project
   stitch-shot already handles: video pause@t0, JS-timer clearing, carousel
   first-dot reset, entrance-animation final-state forcing, iframe height
   locking, img decode forcing. Trust it; never hand-roll captures for the gate.
2. Structure: copy + adapt `stardust/scripts/article-probe.mjs` (full-depth
   outline + computed styles, per width) and `stardust/scripts/lift.mjs`
   patterns. One navigation per width, paced.
3. Content: extract verbatim; **PRESERVE non-breaking spaces ( )** — they
   are load-bearing for line wraps (collapse only [ \t\r\n]). Preserve inline
   `<strong>/<em>/<a href>` semantics; drop live wrappers/classes.
4. Assets: `curl -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)
   AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"`
   direct download → `stardust/prototypes/assets/media/`. Background-image
   URLs live in computed styles (probe them); srcsets in the DOM.
5. Author `<slug>-proposed.html` + `css/<slug>.css`. Mirror live granularity:
   headings with inner `<span>` where live has them (hea01 pattern), hidden
   elements that count as content, carousel clone slides. Live widgets must
   be mirrored structurally; nondeterministic live data (tickers, feeds,
   result counts) → freeze captured values, log as permanent residual.
6. Gate loop (hard discipline, all fixes off instruments):
   - `node scripts/replica/pixel-compare.mjs <live.png> <proto.png> --out
     <diff.png>` — read bands top-down, fix first hot band.
   - `node scripts/replica/anchor.mjs` both sides (build side is free) for
     section heights.
   - **The convergence superweapon (from A1): per-zone vertical
     cross-correlation.** Python/PIL: for zones of ~400px, find the shift
     k∈[-60,60] minimizing the thresholded pixel-diff histogram between
     live.crop(y) and proto.crop(y+k). A zone with score≈0 at shift k means
     pixel-perfect-but-offset-by-k — fix the geometry ABOVE it. Uniform small
     offsets over text produce 10-15% bands; killing a 2px global offset took
     A1's body bands to literally 0.0%.
   - Live capture ONCE per breakpoint, reuse; prototype recaptures are free.
   - Cap ~3 measured live-gate rounds per breakpoint + free build-side
     rounds; then log residuals with causes in your result JSON.
7. Milestone probes (2 live hits total):
   `node scripts/diff/content-diff.mjs "<liveURL>"
   "http://localhost:8797/<slug>-proposed.html" --profile generic --width 1440
   --main main --dismiss --headed` and same for visual-diff (`--out
   stardust/replica/gates/<slug>-1440/vdiff`). Known justified red classes
   (cite, don't chase): (a) live inline `<style>` with per-load random
   data-image-id inside card links → MISSING CTA + matching EXTRA by href;
   (b) video.js internal UI strings; (c) h2>span role swaps (mirror the span
   instead when trivial).

## Known live-site facts that will bite

- Bootstrap-ish grid: `.container` 1170, `.row` margin 0 -12, cells pad 0 12
  (mobile: container pad 16, row -8, cells 8; nested grid-bas sections double
  the container → 296-wide prose at mobile).
- Grey band sections: `#e8e8e4`, pad 32 (16 mobile), centered default prose.
- Cards: 3-up `col-md-4`, image 3:2 (374×249 desktop / 328×219 single-container
  mobile / 296×197 nested), white or grey body pad 24 (16 mobile), h3 24/32,
  reverse-outline CTA or teal affordance.
- Live empty spacer `<p>`s inside flex card headers create fixed heights
  (A1: related header 222px) — measure, don't assume.
- Section heads: h2 centered ("tic02"), often `hea01` h2>span.
- Press-date boxes: day `bold` + `<span data-short="Aug'26">August</span>`
  with 1px/transparent text + ::before attr(data-short) 16px.
- `.link--download` after-icon \e93d; `bnv01` back-link before-icon \e913.
- Listing pages (blanko-overview) have filter forms + pagination — replicate
  the RENDERED first-page state; filter dropdowns/inputs as styled inert
  controls; note interactions in the result JSON (delivery implements them
  against the query-index).
- Maps/job-search: replicate AS CAPTURED (static map snapshot region is NOT
  acceptable as an <img> of the screenshot — instead reproduce the visible
  DOM: tiles layer may be replicated as the captured tile images if they are
  plain <img>/CSS tiles; if the map is canvas-drawn, freeze policy: reproduce
  the container + controls, put the captured canvas region as the container's
  background image, and log it as an integration placeholder residual — the
  delivery phase wires the real map. Same for job-result cards: freeze the
  captured results verbatim.)

## Interaction/motion parity (REQUIRED — learned the hard way)

The static gate does not cover motion; a page can pass all four probes with
every animation missing. After the static gate passes, run the
interaction-parity pass and implement (never justify away).

**Evidence rule: motion is OBSERVED at runtime, never inferred from static
classes or CSS rules.** Live pages carry `*-animation` classes on elements
whose animations never fire, and `:hover` rules whose scopes never match —
implementing from those INVENTS motion (caught in user review). Run
`node scripts/replica/motion-observe.mjs "<liveURL>" <out.json> --consent
'button:has-text("Deny all")'` — it records `animationstart`/
`transitionstart` events, class mutations, and the header's computed state
per scroll position over a full down+up scroll. Tag ONLY elements whose
animation measurably fired; verify each hover with a hover-diff (hover the
live element, read computed transform/colors) before adding the rule.

- **Entrance animations**: live uses `.bottom-to-top-animation` /
  `.right-to-left-animation` / `.left-to-right-animation` + `.animate`
  (added on scroll-into-view) and `.wobble-animation-trigger`/`.wobble-animation`
  (staggered: 2nd child first, 0.5s steps, 1st child last). Keyframes +
  triggers live in `css/motion.css`; the observer + per-module tagging map
  in `js/motion.js` — EXTEND the map for your modules (runtime-fired only),
  don't fork it.
- **Header scroll morph**: the SINGLE header morphs in place (measured live
  contract): scrolled past 130px → fixed 64px (50 mobile) gradient +
  hidden; any scroll-up → compact bar slides in (.2s); full in-flow header
  restored only at y=0; no layout compensation (live's content jump is
  intentional). Global in motion.js; nothing to do beyond including the
  two files. Never implement as a cloned overlay bar — it double-renders.
- **Hovers**: cards scale(1.03) (0.2s), full-width teaser captions scale on
  their own hover, solid teal buttons → #007977, reverse → teal fill,
  white-on-media → teal text/border, download icons translateY(2px),
  affordance arrows +10px (canon), form fields → #edf1f7 (motion.css).
- **Carousels**: implement autoplay/arrows/dots per live slick config
  (`sli01--autoplay` = 7s). t=0 must equal the static gate state
  (stitch-shot clears timers, so gate captures are unaffected).
- Include `css/motion.css` + `js/motion.js` in the page, then re-run ONE
  pixel-compare round to prove t=0 unchanged (build-side, free).

## Result file (required): stardust/replica/gates/<slug>-result.json

```json
{
  "archetype": "<slug>", "liveUrl": "…", "prototype": "stardust/prototypes/<slug>-proposed.html",
  "gates": { "1440": {"pixelPct": 0, "heightDelta": 0, "iterations": 0, "pass": true},
              "360": {"pixelPct": 0, "heightDelta": 0, "iterations": 0, "pass": true} },
  "contentDiff": {"reds": 0, "verdict": "…"}, "visualDiff": "…",
  "newModules": ["…"], "integrations": ["…"], "captureState": ["…"],
  "residuals": [{"band": "…", "pct": 0, "cause": "…"}],
  "sharedFileFindings": ["…"], "notes": "…"
}
```

Return (as your final message): the result JSON content + a 5-line summary.
