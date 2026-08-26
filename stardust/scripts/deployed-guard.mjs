import { chromium } from 'playwright';
const url = process.argv[2] || 'https://main--rwe--paolomoz.aem.page/';
const width = +(process.argv[3] || 1440);
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width, height: 900 } })).newPage();
const errors = [];
p.on('pageerror', (e) => errors.push(e.message));
await p.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
await p.waitForTimeout(2500);
const total = await p.evaluate(() => document.body.scrollHeight);
for (let y = 0; y < total + 900; y += 600) { await p.evaluate((v) => window.scrollTo(0, v), y); await p.waitForTimeout(120); }
await p.evaluate(() => window.scrollTo(0, 0));
await p.waitForTimeout(800);
const res = await p.evaluate(() => {
  const out = { sections: document.querySelectorAll('main .section').length, blocks: [], brokenImgs: 0, h1: document.querySelectorAll('h1').length, height: document.body.scrollHeight };
  document.querySelectorAll('[data-block-name]').forEach((el) => {
    const cs = getComputedStyle(el);
    out.blocks.push({ name: el.dataset.blockName, status: el.dataset.blockStatus, display: cs.display, h: el.getBoundingClientRect().height });
  });
  document.querySelectorAll('img').forEach((i) => { if (i.complete && i.naturalWidth === 0 && i.getBoundingClientRect().width > 5) out.brokenImgs += 1; });
  const flexChecks = ['.cards .card-list', '.press .cols', '.columns .cols', '.responsibility .teaser-row', '.footer .f-cols'];
  out.flex = flexChecks.map((s) => { const el = document.querySelector(s); return { s, display: el ? getComputedStyle(el).display : 'MISSING' }; });
  return out;
});
console.log(JSON.stringify(res, null, 1));
console.log('pageerrors:', errors.length, errors.slice(0, 3));
await p.screenshot({ path: `/tmp/rwe-deployed-${width}.png`, fullPage: true });
await b.close();
