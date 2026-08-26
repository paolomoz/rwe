import { chromium } from 'playwright';
const b = await chromium.launch({ headless: false, channel: 'chrome' });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, locale: 'en-US' })).newPage();
await p.goto('https://www.rwe.com/en/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForTimeout(3000);
await p.evaluate(() => { const h=[...document.querySelectorAll('button,a')].find(x=>/^\s*accept all\s*$/i.test(x.textContent||'')); if(h)h.click(); });
await p.waitForTimeout(1000);
await p.mouse.move(10, 890);
console.log('h after consent:', await p.evaluate(() => document.body.scrollHeight));
const total = await p.evaluate(() => document.body.scrollHeight);
for (let y = 0; y < total + 900; y += 540) { await p.evaluate(v => window.scrollTo(0, v), y); await p.waitForTimeout(200); }
await p.evaluate(() => window.scrollTo(0, 0));
await p.waitForTimeout(1500);
const h2 = await p.evaluate(() => document.body.scrollHeight);
console.log('h after scroll settle:', h2);
if (h2 > 8200) {
  const culprits = await p.evaluate(() => {
    const out = [];
    document.querySelectorAll('body *').forEach(el => {
      const r = el.getBoundingClientRect(); const top = r.top + scrollY;
      if (top > 7800 && r.height > 300 && !out.some(o => o.cls === el.className.toString().slice(0,80)))
        out.push({ tag: el.tagName, cls: el.className.toString().slice(0,80), top: Math.round(top), h: Math.round(r.height) });
    });
    return out.slice(0, 15);
  });
  console.log(JSON.stringify(culprits, null, 1));
  console.log('scrollX:', await p.evaluate(() => window.scrollX), 'bodyW:', await p.evaluate(() => document.body.scrollWidth));
}
await b.close();
