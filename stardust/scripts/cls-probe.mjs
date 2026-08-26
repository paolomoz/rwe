import { chromium } from 'playwright';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
// delay woff2 + nav fetches to reproduce slow-network swap
await p.route('**/*.woff2', async (route) => { await new Promise((r) => setTimeout(r, 1500)); route.continue(); });
await p.route('**/nav.plain.html', async (route) => { await new Promise((r) => setTimeout(r, 1200)); route.continue(); });
await p.addInitScript(() => {
  window.__cls = 0;
  new PerformanceObserver((list) => {
    list.getEntries().forEach((e) => { if (!e.hadRecentInput) window.__cls += e.value; });
  }).observe({ type: 'layout-shift', buffered: true });
});
await p.goto('https://main--rwe--paolomoz.aem.page/', { waitUntil: 'networkidle', timeout: 60000 });
await p.waitForTimeout(4000);
console.log('CLS:', await p.evaluate(() => window.__cls));
await b.close();
