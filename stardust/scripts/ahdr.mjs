import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto('http://localhost:8797/article-proposed.html', { waitUntil: 'networkidle' });
const r = await p.evaluate(() => {
  const g = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); const cs = getComputedStyle(e); return { y: Math.round(b.top + scrollY), x: Math.round(b.left), w: Math.round(b.width), h: Math.round(b.height), pos: cs.position, disp: cs.display }; };
  return {
    header: g('.site-header'), nav: g('.site-header nav'), left: g('.navigation-list'), logo: g('.site-header .logo'), right: g('.navigation-list--right'),
    backnav: g('.back-nav'), h1: g('.article-stage h1'), stage: g('.article-stage'), colmain: g('.col-main'), summary: g('.summary'),
  };
});
console.log(JSON.stringify(r, null, 1));
await b.close();
