import { chromium } from 'playwright';
const b = await chromium.launch({ headless: false, channel: 'chrome' });
const p = await (await b.newContext({ viewport: { width: 360, height: 800 }, locale: 'en-US' })).newPage();
await p.goto(process.argv[2], { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForTimeout(2500);
await p.evaluate(() => { const h=[...document.querySelectorAll('button,a')].find(x=>/^\s*accept all\s*$/i.test(x.textContent||'')); if(h)h.click(); });
await p.waitForTimeout(600);
const total = await p.evaluate(() => document.body.scrollHeight);
for (let y = 0; y < total + 800; y += 600) { await p.evaluate((v) => window.scrollTo(0, v), y); await p.waitForTimeout(100); }
await p.waitForTimeout(500);
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(1500);
const r = await p.evaluate(() => {
  const g = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return [Math.round(b.top + scrollY), Math.round(b.height), Math.round(b.width)]; };
  const fs = (s) => { const e = document.querySelector(s); return e ? getComputedStyle(e).fontSize + '/' + getComputedStyle(e).lineHeight : null; };
  const isLive = location.hostname.includes('rwe.com');
  if (isLive) {
    return { doc: document.body.scrollHeight,
      stageH1: g('main') ? null : null,
      h1: g('h1'), main: g('main'), colmain: g('.col-md-9'), aside: g('aside'),
      summaryUl: g('.col-md-9 ul'), firstP: g('.col-md-9 .content p'),
      zoomImg: g('.zoomable img'), contact1: g('aside figure'),
      rel: g('.partial'), fsP: fs('.col-md-9 .content p'), fsLi: fs('.col-md-9 ul li'), fsH1: fs('h1') };
  }
  return { doc: document.body.scrollHeight,
    h1: g('h1'), main: g('main'), colmain: g('.col-main'), aside: g('.col-aside'),
    summaryUl: g('.summary ul'), firstP: g('.body-copy p'),
    zoomImg: g('.zoomable img'), contact1: g('.contact-card figure'),
    rel: g('.related'), fsP: fs('.body-copy p'), fsLi: fs('.summary li'), fsH1: fs('h1') };
});
console.log(process.argv[3] || '', JSON.stringify(r));
await b.close();
