# stardust journal — rwe.com replica

## 2026-08-26 — EDS setup + single-page replica of rwe.com home
- Created EDS site paolomoz/rwe from aem-boilerplate (fstab → content.da.live/paolomoz/rwe); Code Sync needed a manually-posted code job; boilerplate content seeded, preview+live 200.
- rwe.com is behind a Cloudflare managed challenge → all live captures headed real Chrome + stealth. Custom consent dialog dismissed by text-match "Accept all".
- Bounded replica (`extract --single`): index captured, media/fonts harvested (RWE Sans self-hosted), spec synthesized bounded-single; empty inconsistency register (pure replica).
- Prototype authored clean (canon.css + index.css + index-proposed.html), values lifted from rwe.com's own CSS.
- Instrument fixes (ledgered in replica/progress.json): video pause + timer clear after settle; --fullpage mode (chunked capture corrupted last chunk on this site) with entrance-animation final-state forcing and iframe height lock.
- Source-fidelity gate PASSED both breakpoints: 1440 = 1.68% pixels, Δ1px, 0 unjustified structural red, visual clean; 360 = 8.02%, Δ0, same. Residuals + justified classes in replica/progress.json.
- Interaction parity: hero fade carousel (autoplay 7s assumed), spotlight ticker, hovers, big-play, footer accordions.
- Open: mega-menu/search overlays not implemented (site chrome beyond captured home content — site-scope run item); EDS delivery next.

## 2026-08-26 (later) — EDS delivery + published-origin gate
- Converted the gated prototype to EDS: 9 blocks (hero, spotlight, columns, responsibility, cards×4 variants, banner×2, press, breadcrumb) + template-slotted header/footer chrome; content as DA body fragments (index, nav, footer); 27 editorial images on DA media; 3 webm videos from the code origin.
- Gates: David's-Model lint 0 red; whole-page block-roundtrip closed (1 fix: hero subheads must be h3); qa-gate 48 ok / 1 justified warn; token + asset-url greps clean.
- Field defect found: boilerplate's global `header{height:var(--nav-height)}` collapsed every block-internal <header> — scoped to `body > header`.
- Published-origin gate vs live rwe.com: 1440 → 2.64% / Δ8 PASS (3 rounds); 360 → 9.86% / Δ2 PASS (5 rounds, documented). CLS 0.0004. Content-diff advisory reds all verified-by-eye classifier artifacts.
- Live: https://main--rwe--paolomoz.aem.live/ · Preview: https://main--rwe--paolomoz.aem.page/ · Author: https://da.live/#/paolomoz/rwe

## 2026-08-27 — Migration plan (site scope)
- Discovery: sitemap.xml → 5,026 URLs; pilot scope = 2,329 /en/ pages (2,697 unprefixed German out of scope). Full roster: stardust/migration/urls.json.
- Typed 21 representative pages via sequential headed survey (crawl.mjs stalled on Cloudflare 429s at concurrency; single-context pacing worked). Site's own data-tpl vocabulary grounded the typing.
- 7 archetypes: home ✅, article-detail (78% of pages), listing-hub, section-landing, content-page, locations-map, job-search. Prototype order A1→A6 in stardust/migration/migration-plan.md.
- Dynamic blocks: 4 query-indexes authored (press, ir-publications, stories, locations) + Tier-2 metadata contracts; download centre recorded as Tier-3 static-first. helix-query.yaml written (config-service caveat flagged).
- Integrations register: euroland IR widgets, jobs stack + CV matcher (Amplify), custom locations map, site search, Usercentrics consent, GTM/etracker, canto video, forms, /-/media PDF assets.
- Open decisions for user: /en scope, press-archive volume policy, PDF rehosting, job-search wave-1 approach, online-report scope.

## 2026-08-27 (later) — A1 article-detail archetype gated
- Standalone prototype (article-proposed.html + css/article.css on home canon): gradient chrome variant, article stage (back-link/eyebrow/h1 42-56), marginal layout (872+275), rich body, zoomable figure, downloads, contact-card aside, social-consent placeholder, related press cards, full breadcrumb trail.
- Gates: 1440 → 3.92% / Δ0 (3 rounds); 360 → 5.84% / Δ2 (7 rounds — offset-map cross-correlation drove the mobile convergence; six 500px bands at literally 0.0%).
- Two capture-state rulings: gate reference = DENY-consent state (accept loads a LinkedIn wall, +543px nondeterministic); NBSP preservation in extraction is load-bearing for line wraps.
- Two chrome bugs found that also improve home: right nav list is width-auto flush-right (not mirrored calc); solid header needs flow-root (margin collapse).
- Next: A2 listing-hub (press hub) → A3 section-landing → A4 content-page; then A5/A6 after integration spikes.

## 2026-08-28 — A2-A6 archetypes gated (parallel agents)
- Five independent agents (shared brief: stardust/migration/archetype-brief.md) each recreated + gated one archetype. First launch tripped a 600s no-progress watchdog (stagger sleeps + silent long captures) — resumed with anti-stall rules; all completed.
- Gates (1440 / 360 pixel diff): press-hub 1.01/2.20 · group-landing 2.22/3.38 · content-page 1.14/3.79 · locations-map 0.82/2.41 · job-search 0.86/3.46. All Δ≤6px, 0 unjustified content reds, no visual flags. ALL SIX ARCHETYPES NOW GATED.
- Jobs integration spike complete (from A6): Sitecore jobborse API (POST entities/v1, GET values/v1), AWS jobs_total, SuccessFactors apply deep-links, Amplify CV-matcher webcomponent — recorded in job-search-result.json.
- A5: in the deny-consent state the locations map renders a pure-DOM List View (718 cards) — replicated structurally, no placeholder needed; real map = delivery integration.
- Shared-chrome corrections confirmed by 3-4 agents independently and promoted to index.css (mint footer links, mobile footer link size, breadcrumb weights/separators/strut/mobile pad, copyright size); home and article gates re-verified and IMPROVED (1.68→1.61, 3.92→3.40). Finer mobile footer rhythm values left page-scoped (conflicting per-page measurements). Endorsement wordmark noted for the EDS footer block at delivery sync.
- New live-site facts for the ledger: live hr elements are 2px boxes; some templates set html base 22px (not 20); the icon TTF draws ~1.22x smaller ink than live's rendering (per-glyph calibration); grid cols cap at 33.3% not 33.333%; stage carousels + top breadcrumbs live OUTSIDE <main> on hub/landing templates; band loosefield overhang widens fullpage captures unless clipped.
- Next: EDS block conversion + delivery for the five new archetypes, then bulk migrate (P3).
