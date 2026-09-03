# Learnings ledger — rwe.com replica + deploy (2026-08-26)

Status: HARVESTED 2026-08-28 into adobe/skills stardust 0.18.3 (merged to
main 2026-08-29, PR adobe/skills#313, per the improvement plan
`plugins/stardust/notes/improvement-plan-2026-08-rwe-centene.md`): items 1, 3
(stitch-shot freeze: video pause + timer clear + slick-dot t=0, ported from
this repo's `scripts/replica/stitch-shot.mjs`), 4 (crawl.mjs consent
text-match fallback), 5 (extract bot-wall asset note), 6–7 (deploy Step 3:
block-`<header>` warning #107, overlay chrome #108), 9 (brief-template
variant specificity #109), 10 (gate no-op-fix check), 11 (gate.sh identity
assertion + port-verify doc lines), 12 (recreation-procedure residual
classes), and 13–14 (motion parity: `motion-observe.mjs` ported from this
repo's `scripts/replica/motion-observe.mjs` + `--hover`; § Interaction
parity rewritten around the observe-don't-infer evidence rule; motion
inventory a required gate output — per the spec in this repo's
`stardust/plugin-improvements/replica-motion-parity.md`, also copied into
the plugin's notes/). DEFERRED with rationale in the plan: item 2
(`--fullpage` — this repo's reference implementation stands by for a second
seam-corruption session) and item 8 (shared-classifier separators — global
diff-key change, needs its own validation protocol).

## Capture instrument (stitch-shot / crawl) — upstream candidates

1. **Freeze must also stop videos and JS timers.** The CSS animation freeze
   stops neither `<video>` playback nor slick-style autoplay timers — every
   capture grabs different frames/slides. Fix: after settle, pause every
   video + seek t=0, then clear all timeouts/intervals. (~20% of this page
   was video noise without it.)
2. **`--fullpage` escape hatch, with three bundled mitigations.** Chunked
   stitching reproducibly corrupted the last chunk here (scroll-state header
   baked into the seam + 720px horizontal wrap). fullPage fixes it but needs:
   (a) force entrance-animation final state (`[class*="-animation"]
   {opacity:1;animation:none}`) — sites that drop the animate class off-view
   render below-fold sections blank at full height; (b) lock iframe heights —
   responsive embeds re-measure on the viewport resize (euroland grew +125px
   mid-capture); (c) force `img.decode()` — the documented gray-placeholder
   trap bites authored `<img>`s.
3. **Carousel t=0 determinism.** Autoplay advances during settle, so slide
   identity is arbitrary per capture. Generic symmetric fix: click the first
   slick-convention dot after the freeze (transitions already frozen →
   instant reset on both sides). Residual 4% → 0.8%.
4. **Consent text-match fallback.** crawl.mjs's selector list missed RWE's
   custom dialog; a visible-button text match (Accept all / Allow all /
   Alle akzeptieren) is cheap and generic.
5. **Assets usually bypass the bot wall.** Cloudflare challenge was
   page-level only; media/CSS/fonts returned 200 to a browser-UA curl — say
   so in the harvest docs before reaching for in-page-fetch machinery.

## Deploy skill — reference additions

6. **Boilerplate `header { height: var(--nav-height) }` collapses every
   block-internal `<header>`.** Blocks that emit semantic `<header>` (natural
   when porting prototypes) all broke silently at once — text gates stayed
   green. Step 3 should scope the reservation (and visibility rules) to
   `body > header`, or warn against `<header>` in block DOM.
7. **Overlay chrome is an uncovered #81 case.** Transparent header floating
   over the hero → `--nav-height: 0` + absolute header, no reservation
   needed (CLS measured 0.0004 with this pattern).
8. **Whitespace-join classifier keys from JS-built DOM.** `append()`ed
   elements concatenate textContent with no separators, so
   content-diff/roundtrip keys mismatch live HTML that has newlines
   ("...MediaLinkedIn..."). Fix best in the shared classifier (separator at
   element boundaries) — it manufactured 13 false reds here.
9. **Mobile-override specificity trap for variant blocks.** A generic mobile
   rule (`.cards .card-list`) loses to a desktop variant rule
   (`.cards.color .card-list`) regardless of the media query — mobile
   overrides must match variant specificity. Add to the block-brief template.
10. **Verify a CSS fix changed the render before counting an iteration.** A
    byte-identical differing-pixel count after a "fix" means the rule was a
    no-op (a padding that matched the value already carried by the EDS
    section wrapper). Cheap guard, saves a burned gate round.

## Process guards

11. **Never trust localhost ports.** A stale server from another stardust
    project held :8791 (the port every skill doc suggests) and one gate round
    silently measured a foreign site (73% diff read as "prototype broke").
    Guard: grep a page-specific marker before gating; prefer per-project
    ports; `lsof -nP -iTCP:<port> -sTCP:LISTEN` names the owner.
12. **Two new permanent-residual classes for recreation-procedure.md:**
    decorative elements with randomized inline positions per page load
    (energy-field line art), and live-data embeds — where the winning move is
    loading the SAME live embed on both sides so the data cancels out,
    rather than freezing a snapshot.
13. **Motion parity is a per-archetype gate step, not a canon-page
    afterthought — and it is liftable, not guessable.** The static pixel
    gate passes while every scroll-entrance animation, header scroll-morph,
    hover transition, and secondary carousel is missing (all invisible at
    t=0); the user notices immediately. `recreation-procedure.md`
    § Interaction parity already exists but was only run on the first
    archetype; parallel-agent briefs skipped it → all five archetypes
    shipped static. Skill fixes: (a) make the interaction-parity pass a
    REQUIRED gate output per archetype (hover diff + behavior diff + a
    motion inventory), like content-diff; (b) the whole motion contract
    lifts mechanically from the source site: `@keyframes` + trigger classes
    from source CSS, per-element inventory via one live DOM probe
    (`querySelectorAll('[class*="-animation"]')` + text snippets to map
    elements to prototype counterparts), `:hover` rules by parsing source
    CSS for `:hover` selectors with transform/color declarations, scroll
    chrome via a scripted scroll probe reading header classes/computed
    styles at top/down/up; (c) implement as ONE shared motion layer
    (motion.css + motion.js) reusing the LIVE class names — that keeps
    capture instruments symmetric (stitch-shot's animation-forcing already
    keys on `*-animation`) and makes the layer gate-neutral by
    construction (entrance classes only animate once `.animate` is added
    on intersection, mirroring live; live has no pre-animate hidden
    state); (d) after adding motion, re-run pixel-compare once per touched
    archetype to prove t=0 is unchanged (rwe: press-hub 1.01→1.06%,
    locations 0.82→0.88% — noise). Candidate for a bundled
    `motion-probe.mjs` next to stitch-shot.
14. **CORRECTION to #13 — static CSS lifting INVENTS motion; the only
    trustworthy source is runtime observation.** User review caught three
    invented behaviors that the static-lift method produced: (a) elements
    carrying `*-animation` classes on live whose animations NEVER fire
    (live's JS never adds the `.animate` trigger to them — on rwe.com the
    majority of tagged captions are dead: press-hub interest cards,
    group-landing/content-page/job-search captions, home media-cards —
    only 2 of 8 caption-class families actually animate); (b) hover rules
    lifted from CSS whose scope conditions don't match at runtime (home
    full-width teaser headers had a plausible scale rule that never
    applies); (c) a scroll-chrome mechanism (cloned fixed bar) that
    approximated the visible effect but allowed a double-render state
    impossible on live, which morphs its SINGLE header in place (fixed
    compact when scrolled, full in-flow only at exactly y=0, no layout
    compensation). The method that works — now scripted as
    `scripts/replica/motion-observe.mjs` (plugin candidate next to
    stitch-shot): instrument the live page with `animationstart` /
    `transitionstart` capture listeners + a MutationObserver on class
    attributes, auto-scroll the full page down AND up while sampling the
    header's computed state per scroll position, poke widgets and sample
    frames — then implement ONLY what fired, with the recorded durations/
    mechanics. Complement with a per-module hover-diff (hover, wait, read
    computed transform/colors) instead of trusting `:hover` rules' scopes.
    Static CSS remains the source for exact keyframe/duration VALUES; the
    runtime trace decides WHAT runs and WHERE. Verified: after replacing
    inference with observation, press-hub returned to its exact gated
    pixel number (1.01%).
15. **Experience Workspace (da.live) inline editing is a DECODE contract, and
    stardust's decode guidance violates it.** Verified against da.live
    `blocks/canvas/editor-utils/editor-utils.js` and da-nx
    `nx/public/plugins/quick-edit/*`: the workspace stamps `data-prose-index`
    on every outermost `h1-h6/p/ol/ul/pre/blockquote` of the source, swaps
    the instrumented HTML into `document.body`, re-runs the page's own
    `loadPage()`, then `querySelector('[data-prose-index="N"]').replaceWith(
    editor)` for each index. A text is editable iff exactly one element still
    carries its index after `decorate()` — nothing else is repaired (only
    `data-block-index`, by class name). So `textContent`/`innerHTML` copies,
    retagging, and synthesized `<p>`s are dead; `cloneNode(true)` happens to
    work (the clone keeps the attribute — that is why `columns` worked while
    `hero`/`spotlight` did not), and duplicated clones attach the editor to
    the first copy in DOM order (hidden carousel loop slides). Home page
    measured 14/102 editable texts before, 40/102 after converting only
    hero+spotlight+columns (25/25 for those three, 0 px visual diff at 1440).
    Pattern that passes AND survives the editor swap: MOVE the authored
    element into a generated wrapper that carries the layout class; style it
    with wrapper-descendant selectors (`.headline :is(h1,h2)`), because the
    editor re-renders the same TAG without classes/spans; move the CTA `<p>`
    (the index is on the paragraph) and repaint the button look in edit mode
    from the `<strong>/<em>` marks under `.prosemirror-editor`; strip
    instrumentation from presentational clones. Probe:
    `stardust/scripts/ew-editability-probe.mjs` (instrument → decorate →
    count; `--simulate-editor` measures edit-mode style drift). Plugin spec:
    `stardust/plugin-improvements/experience-workspace-editability.md`.
16. **Round 2 of the Experience Workspace conversion (17 more blocks) —
    what the first pass got wrong, now rules.** (a) The workspace's
    instrumented HTML keeps a `<p>` inside EVERY block cell (prose2aem copies
    cell innerHTML), while the published pipeline unwraps single-paragraph
    cells to bare text — decode sees a `<p>` in both cases (runtime
    `wrapTextNodes`), but any gate must stamp bare-text cells too or it
    under-counts (accordion titles, icon-tile labels, quote were invisible
    to the first probe). (b) Do NOT `font: inherit` the moved heading by
    default — it relied on the global `h3` type; rewrite the old
    element-class rule `h3.headline {…}` as `.headline :is(h2, h3, h4) {…}`
    (same specificity, same cascade, and it still matches the editor's
    re-rendered `<h3>`). Only when the old rule itself set the type (hero)
    does the wrapper carry it. (c) The editor inserts two wrapper divs above
    the authored element, so NO child combinators or positional
    pseudo-classes on the path to it (`.affordance > p`, `header > p`,
    `:first-child`); exclude a moved CTA paragraph from a lede rule with
    `p:where(:not(.affordance p))`, never with `>`. (d) Classes a block adds
    to authored elements (`ul.icon-list-items`, `a.link-download`,
    `a.button.primary`) vanish while editing — style by element/attribute
    (`.icon-list ul`, `a[href*=".pdf"]`) and repaint buttons from the
    `<strong>/<em>` marks. (e) A `<button>` cannot host the inline editor:
    accordion titles move into a sibling div, the row takes the click
    handler, the button becomes chevron-only. (f) When moving nodes while
    walking siblings, capture `nextElementSibling` BEFORE `append()`
    (companies subsidiaries silently dropped otherwise). (g) Two exempt
    categories exist and must be declared: index/API-driven blocks whose
    authored rows are fallback/config (press-list, job-list, form,
    locations-map) and derived text (dates split into day/month); a third —
    one paragraph rendered as N list items (breadcrumb) — needs an ENCODE
    change (author a `<ul>`). (h) Pixel-gating tall blocks: hide
    `body > header` in the harness (sticky header lands in the element
    screenshot) and expect live-widget iframes (share ticker) to differ.
    Result on the 29-page covering sample: 841 → 1416 of 1452 authored texts
    editable; the 36 left are all declared exemptions; every converted
    block is pixel-identical at 1440 and shows no edit-mode style drift
    except the hero's 8px per-line span gap.

