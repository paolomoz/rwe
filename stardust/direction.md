---
_provenance:
  writtenBy: stardust:replica
  writtenAt: 2026-08-26T16:20:00Z
  againstInput: https://www.rwe.com/
  readArtifacts:
    - stardust/current/pages/index.json
    - stardust/replica/lift-1440.json
    - stardust/replica/lift-360.json
---

# Direction — preserve mode (same-design migration)

Mode: PRESERVE. The target spec is the captured current state of
https://www.rwe.com/en/ (post-redirect origin of https://www.rwe.com/),
promoted mechanically (no `stardust:direct` invocation, no creative
decisions).

Synthesized (bounded-single): current/pages/index.json + Phase-3 CSS lift
→ PRODUCT.md · DESIGN.md · DESIGN.json (at 2026-08-26T16:20:00Z).
A bounded `--single` extract produced no current/PRODUCT.md to promote
verbatim; the spec is the minimal descriptive synthesis per
replica reference/preserve-direction.md § 1a. If this pilot grows to site
scope, re-run extract `--prep` and replace with verbatim promotion.

Permitted deltas: ONLY the entries of
stardust/replica/inconsistency-register.md (empty — pure replica).

Fidelity: ia verbatim · design verbatim · content verbatim.

Capture notes (measurement policy, not design decisions):
- rwe.com sits behind a Cloudflare managed challenge → all captures use
  headed real Chrome + stealth (recorded in _crawl-log.json).
- Custom consent dialog dismissed via text-match "Accept all".
- Hero stage is an autoplay carousel — freeze policy: recreate slide 1
  ("Energy for the Future") at t=0.
- Live/nondeterministic content (share price, press releases, Spotlight
  ticker) — replicate structure, freeze captured values, permanent residual.
