# Pitfall: parameter-personalized pages are invisible to sitemap-driven migration

_Found on rwe.com, 2026-09-02, during P4/P5 of the replica migration._

## Symptom

`/en/contact-services/contact-form?c=<hash>` rendered a generic form on the
migrated origin while live renders a per-recipient page (personalized
headline, photo/role/phone contact rail). A second instance,
`/en/rwe-careers-portal/contact-form?c={GUID}`, was missed entirely — the
bare path is not in the sitemap; the page is only reachable through
parameterized links.

## Root cause (general, not site-specific)

The extract/discovery pipeline enumerates sitemap/BFS URLs **stripped of
query strings**, and typing, capture, gating and import all operate on the
bare path. Pages whose server rendering depends on a query parameter are
therefore captured in exactly one state (the bare-path default) — or missed
entirely when the bare path isn't in the sitemap. The fidelity gates then
pass on the bare state while every real entry link lands on a degraded page.
Nothing in the pipeline fails loudly: this is a silent coverage gap.

## Fix applied here

- Enumerated every internal href carrying a query string across the imported
  estate; clustered by path.
- For the two config-driven form pages: scraped all 31 referenced `?c=`
  configs from live (headline, recipient name/role/photo/phones), froze them
  as a config map in the block (`blocks/form/dcf-configs.json`), and made the
  block personalize at decorate time from the URL param, with a generic
  fallback for unknown hashes.
- Remaining parameterized links are filter-state deep-links (jobs `?ci=`,
  products `?kundengruppe=`, experts `?expertise=`, locations
  `?locationType=`) — pages render fully; the pre-filter belongs to each
  listing's facet integration.

## Suggested plugin improvement

During extract's link-graph pass, additionally collect internal hrefs **with
query strings**, cluster by bare path, and flag any path where
(a) parameterized references exist at meaningful volume, or
(b) the bare path is absent from the sitemap.
Surface these as "parameterized page states" in the prep summary /
dynamic-blocks map so they get an explicit strategy (config freeze, API
wiring, or per-state capture) instead of silently shipping the bare state.

## Secondary trap hit while fixing

The RWE media CDN 403s bare curl requests for some assets (referer-gated).
Downloading through the live browser session (in-page `fetch` → base64)
works. The capture-state policy already documents CDN-403 images; the same
applies to any scripted asset download during config freezing.
