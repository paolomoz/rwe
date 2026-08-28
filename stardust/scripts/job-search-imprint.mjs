import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto('http://localhost:8797/job-search-proposed.html', { waitUntil: 'networkidle' });
await p.waitForTimeout(500);
const r = await p.evaluate(() => [...document.querySelectorAll('img.imprint')].map(e => { const x = e.getBoundingClientRect(); const cs = getComputedStyle(e); return { rect: [Math.round(x.left), Math.round(x.top + scrollY), Math.round(x.width), Math.round(x.height)], cssW: cs.width, cssH: cs.height }; }));
console.log(JSON.stringify(r));
await b.close();
