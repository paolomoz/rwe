# rwe.com → EDS migration plan (replica, site scope)

_provenance: stardust:prepare-migration, 2026-08-27. Inputs: sitemap.xml
(5026 URLs), 21-page typed survey (stardust/migration/survey.json, headed
Playwright, screenshots in stardust/migration/survey/), home-page replica run
(gated + deployed 2026-08-26)._

## 1. Scope & URL inventory (tracked)

| Set | Count | Decision |
|---|---|---|
| Sitemap total | 5,026 | — |
| **`/en/` (pilot scope)** | **2,329** | migrate |
| Unprefixed (German locale, e.g. `/presse/…`) | 2,697 | **out of scope** for the pilot — a second-locale wave later (`/de` routing decision needed) |

Full tracked inventory: `stardust/migration/urls.json` (every `/en/` URL with
pattern-derived type + status). Status lifecycle: `discovered → extracted →
migrated → deployed` (state.json holds the captured/migrated subset;
urls.json is the full roster).

## 2. Page types → archetypes

Typing is grounded in the site's own `data-tpl` template vocabulary from the
survey (the CMS's real templates, not guesses). Three templates carry ~93% of
the site.

| # | Archetype | Live template signature | Pages | Representative |
|---|---|---|---|---|
| A0 | **home** ✅ gated + deployed | sli01 stage + teaser grids | 1 | `/en/` |
| A1 | **article-detail** | `detail-one-marginal-column` + bnv01 + sta02 | **1,807 (78%)** — press releases 890, IR publications 833, #TeamRWE stories 74, statements 10 | `/en/press/rwe-ag/2026-08-13-…` |
| A2 | **listing-hub** | `blanko-overview` + global-event-filter + form + pagination | ~20 — press hub + 12 brand hubs, statements hub, IR financial calendar & publications, #TeamRWE hub, download centre | `/en/press/` |
| A3 | **section-landing** | sli01/sta01 stage + tea01r/tea02r/tea03r grids + quo01 | 8 pillars (the-group, IR, R&D, our-energy, careers, contact, products, responsibility) | `/en/the-group/` |
| A4 | **content-page** | sta01/sta02 stage + prose + teaser/accordion/icon-list modules | ~490 — deep content 327, ir-content 96, location details 59, legal 9 | `/en/…/environmental-protection/climate/` |
| A5 | **locations-map** | blanko-overview + htm01 custom map + filters | 1 (+ feeds A4 location details) | `/en/the-group/countries-and-locations/` |
| A6 | **job-search** | jic01/jrc01/src01/sde01/tfb01/form-v2/v3 + CV-matcher | ~5 | `/en/rwe-careers-portal/job-offers/` |
| — | rwe-share | A4 + euroland embeds (blocks exist from home) | 1 | folded into A4 |
| — | ir-report (online-report) | needs inspection — likely report microsite | 2 | decide at A4 time |
| — | `/en/ect/` micro-section | 3 | fold into A4 |

**Standalone prototype order (replica cumulative-archetype contract — each
imports the home-gated canon CSS and iterates only its NEW modules):**

1. **A1 article-detail** — biggest coverage win (78% of pages), smallest new
   surface (detail stage sta02, byline bnv01, marginal column, contact rail con01).
2. **A2 listing-hub** (press hub) — unlocks the dynamic-listing machinery
   every hub reuses (filters, pagination, result cards).
3. **A3 section-landing** — mostly home modules + quo01/tea00n; cheap.
4. **A4 content-page** — sta02 stage + accordion acc01 + icon-list il01 + link
   lists; location-detail and rwe-share as variants.
5. **A5 locations-map** — bespoke (map + facet filters).
6. **A6 job-search** — bespoke integration stack, riskiest; needs the
   integrations spike below first.

Each archetype: full source-fidelity gate at 1440+360 vs its live page, then
sibling-tier migrate fan-out per type.

## 3. Dynamic blocks (see stardust/dynamic-blocks-map.md + helix-query.yaml)

| Listing | Verdict | Index | Key metadata (Tier 2, at author time) |
|---|---|---|---|
| Press / statements / brand hubs | **dynamic** | `press` | publishDate, company/brand, topic(s), teaser image, title |
| IR financial calendar & publications | **dynamic** | `ir-publications` | date, category (report / ad-hoc / managers-transactions / event), pdf link (Tier 1) |
| #TeamRWE stories hub | **dynamic** | `stories` | category, person/role, image |
| Locations map + facets | **dynamic** | `locations` | lat, long, country, technology, status |
| Download centre | **Tier-3 → static first** | — | documents aren't pages; needs a docs sheet/index model — record decision, don't fake it |
| Home press-release rows / spotlight | static (editorial) now | — | optional later enhancement: read `press` index |
| Related/contact rails (con01) | static / fragment | — | — |

## 4. Integrations register

| Integration | Where | Plan |
|---|---|---|
| **Euroland IR tools** (`tools.eurolandir.com`) — share ticker, charts | home, IR landing, rwe-share | embed blocks (share-price block exists); inventory the 3–4 widget variants |
| **Job search stack** — job listing/filter/detail (form-v2/v3, jrc01/sde01) + **CV matcher** (`prod-rwe-cv-matcher…amplifyapp.com`) | careers | integration spike: identify the jobs API (likely SuccessFactors behind the forms); CV-matcher stays an external embed |
| **Locations map** (htm01 custom map) | locations page | map block reading the `locations` query-index; confirm map library/tiles vendor during A5 |
| **Site search** (header overlay, search inputs on every page) | global | needs an endpoint decision: EDS-native index search vs. external service — not captured in home replica (inert trigger) |
| **Usercentrics consent** (`app.usercentrics.eu`) | global | drop-in script include (delayed phase) + consent-gating of analytics |
| **Analytics** — GTM + etracker | global | martech include in delayed phase |
| **Canto video CDN** (`rwe.canto.global`) | strategy film etc. | keep external URLs (already done on home) |
| **Forms** (contact, newsletter, dynamic-contact-form) | contact pages, footers | forms block + backend decision (existing endpoint vs. new) |
| **PDF/document assets** (`/-/media/…`) | IR pubs, download centre | bulk asset migration decision: rehost to DA vs. keep origin links during transition |

## 5. Phasing

1. **P0 (done):** EDS site, home replica gated + deployed, canon foundation.
2. **P1 — archetypes:** capture-per-archetype (`extract --refresh` per representative), recreate + gate A1–A4 (A5/A6 after spikes). Per-archetype typed extract feeds content later.
3. **P2 — dynamic plumbing:** helix-query.yaml live, listing blocks (A2) read indexes; metadata block contract enforced on every imported page.
4. **P3 — bulk migrate:** sibling-tier import per type (A1 first: 1,807 pages via deploy-batch driver + ledger), content-fidelity measured at import time.
5. **P4 — integrations:** job search, site search, consent/analytics, forms.
6. **P5 — rollout + QA:** `stardust:rollout` coverage/delivery gates, `stardust:qa` sweep, per-type published-origin gates.

## 6. Open decisions (need confirmation)

1. **Scope**: `/en/` only for the pilot (German locale = separate wave)?
2. **Volume**: import all 2,329, or cap the long tail (e.g. press archive
   pre-2022 → 404/redirect policy)? 1,723 of the 1,807 A1 pages are dated
   archive items.
3. **Download centre + PDF assets**: rehost documents in DA or keep
   `rwe.com/-/media/` origin links during transition?
4. **Job search**: replicate against the existing jobs backend (API spike) or
   embed/link out in the first wave?
5. **ir-report (online-report)**: in scope or external microsite?
