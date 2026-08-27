# Learnings ledger — rwe.com replica + deploy (2026-08-26)

Status: pending harvest. Instrument fixes for items 1–3 are implemented and
commented in this repo's `scripts/replica/stitch-shot.mjs`.

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
