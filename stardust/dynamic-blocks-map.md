# Dynamic blocks map — rwe.com replica (Phase 4.5)

_provenance: stardust:prepare-migration dynamic-blocks gate, 2026-08-27.
Evidence: stardust/migration/survey.json (21-page typed survey)._

Rule of the gate: every block that LISTS other pages reads an EDS
query-index; the metadata each listing needs must be emitted by every page's
metadata block AT AUTHOR TIME (Tier 2) — retrofitting is a second migration.

## Dynamic listings

### 1. `press-list` — press / statements / brand hubs (~15 hub pages)
- Reads index: **`press`** (see helix-query.yaml)
- Live behavior replicated: date-range + company + topic filters, pagination,
  result rows (date box, title, teaser, link) — the same block the home page's
  static press rows can later adopt.
- Metadata contract per press/statement page (Tier 2, in the page's
  `metadata` block):
  - `publishdate` (ISO yyyy-mm-dd)
  - `company` (rwe-ag | rwe-renewables | rwe-offshore-wind | … — from URL segment)
  - `topics` (comma list, optional)
  - `teaser` (≤160 chars; falls back to Description)
- Tier 1 from DOM: title (h1), image (og:image), path.

### 2. `ir-publications-list` — financial calendar & publications hub
- Reads index: **`ir-publications`**
- Filters: date range, category; groups by year; row = date + title + PDF/CTA.
- Metadata contract per IR publication page:
  - `publishdate` (ISO)
  - `category` (report | ad-hoc | managers-transactions | event | agm)
  - PDF link: Tier 1 (authored link in page body).

### 3. `stories-list` — #TeamRWE hub
- Reads index: **`stories`**
- Metadata contract per story page: `category` (role/area), `person`,
  image via og:image (Tier 1).

### 4. `locations-map` — countries-and-locations
- Reads index: **`locations`**
- Map + facet filters (country, technology) + location cards.
- Metadata contract per location page: `lat`, `long`, `country`,
  `technology` (onshore-wind | offshore-wind | solar | gas | hydro | …),
  `status` (operating | construction | planned).
- Map library/tiles vendor: confirm during A5 spike (live uses a custom
  htm01-embedded map).

## Static (recorded decisions)

- **Download centre** — Tier 3: the listed items are DOCUMENTS (PDFs), not
  indexed pages. Stays a static/authored block until a documents index model
  is chosen (options: DA sheet → JSON, or index stub pages per document).
  Decision recorded, not faked.
- **Related/contact rails (con01)** on detail pages — authored fragments
  (small, page-curated), not index-driven.
- **Home spotlight ticker + home press rows** — editorial/static in wave 1;
  optional later switch to the `press` index (enhancement, zero content
  change thanks to identical row shape).

## Import-order consequence

`helix-query.yaml` must be live on main BEFORE bulk import (P3), and every
imported A1 page must carry its Tier-2 metadata rows from day one — the
deploy-batch content generator derives them from the URL (`publishdate`,
`company`) and the captured page (topics/teaser).

## Config caveat

This repo's AGENTS.md states `helix-query.yaml` is retired in favor of
config at tools.aem.live for newer setups. The file is authored here as the
contract-of-record; verify at P2 (first listing block) whether this project's
config service consumes it or the indexes must be registered at
tools.aem.live — same fields either way.
