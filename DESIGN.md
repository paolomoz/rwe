---
_provenance:
  writtenBy: stardust:replica
  mode: bounded-single
  synthesizedFrom:
    - stardust/current/pages/index.json
    - stardust/replica/lift-1440.json
    - stardust/replica/lift-360.json
colors:
  navy: "#1D4477"        # rgb(29,68,119) — body text, headings on light
  teal: "#00A19F"        # rgb(0,161,159) — h2, primary buttons, accents
  surface: "#E8E8E4"     # rgb(232,232,228) — grey band sections
  white: "#FFFFFF"
  footerGradient: "linear-gradient(45deg, #1D4477 22%, #00A19F)"
typography:
  body: "regular (RWE Sans Regular), Trebuchet MS, Tahoma, sans-serif — 18px/27px, #1D4477"
  h1: "bold (RWE Sans Bold) 68px/74px, white on hero"
  h2: "bold 32px/38px, #00A19F"
  h3: "bold 18px/30px, #1D4477"
  h4: "regular @700 18px/27px, #1D4477"
  nav: "medium 15px/27px"
rounded: "5px (buttons); cards square"
spacing: "container 1170px centered; 12px grid gutters (bootstrap col-md-*); grey bands ~padding per lift"
components: "hero stage carousel (900px), spotlight ticker, quote band, full-width photo teasers with video bg, teaser card grids (3-col), icon band, gradient footer with accordion columns (mobile)"
---

# DESIGN.md — rwe.com current state (replica target)

Values lifted from the live site's own CSS (stardust/replica/lift-1440.json,
lift-360.json, source-css/). This file records; it never invents.

- **Fonts:** RWE Sans self-hosted at /fonts/ with family names `light`,
  `regular`, `medium`, `bold` (font-weight declared per face); icon fonts
  `rwe-iconfont` + `RWE_Icon_Font`. Captured woff2 in
  stardust/current/assets/fonts/. Proprietary corporate face — RWE's own;
  self-hosting in the replica of RWE's own site is licence-consistent.
- **Container:** `.container` max-width 1170px, centered (135px margins at
  1440). Grid: `col-md-*` percentage columns with 12px side paddings.
- **Header:** absolute, transparent over hero, height 130px, white text;
  utility row (Menu, Contact, Apps & Tools / RWE Global, Search, English)
  + centered RWE logo.
- **Buttons:** `.btn` teal `#00A19F` bg (gradient class), white text 18px,
  padding 8px 24px, border 2px solid teal, radius 5px. Text-CTA
  "affordance" variant: teal text + icon, no box.
- **Sections:** alternating white / `#E8E8E4` grey bands (class
  `color-background-2 energy-waves-grid` — subtle wave-pattern background
  images at the band edges).
- **Footer:** 45° gradient navy→teal, white text, ~884px tall at 1440;
  link columns + social icon rows; legal bar at bottom.
- **Body base:** body font-size 22px but content p = 18px/27px;
  text-rendering auto, -webkit-font-smoothing auto, font-synthesis default.
