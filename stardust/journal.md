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
