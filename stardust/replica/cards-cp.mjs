import { chromium } from 'playwright';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 360, height: 800 }, userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36' });
const p = await ctx.newPage();
await p.goto('https://www.rwe.com/en/responsibility-and-sustainability/environmental-protection/climate/', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(9000);
const r = await p.evaluate(() => {
  const all = [...document.querySelectorAll('main h2, main article, main a[class*=card], main div[class*=teaser]')];
  return {
    h2s: [...document.querySelectorAll('main h2')].map((h) => `${Math.round(h.getBoundingClientRect().top + window.scrollY)}: ${h.textContent.trim().slice(0, 40)}`),
    articles: [...document.querySelectorAll('main article')].map((a) => { const r2 = a.getBoundingClientRect(); const cs = getComputedStyle(a); return `y${Math.round(r2.top + window.scrollY)} h${Math.round(r2.height)} mb${cs.marginBottom} cls:${a.className.slice(0, 30)}`; }),
  };
});
console.log(JSON.stringify(r, null, 1));
await b.close();
