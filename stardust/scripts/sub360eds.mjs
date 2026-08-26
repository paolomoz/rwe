import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 360, height: 800 } })).newPage();
await p.goto('https://main--rwe--paolomoz.aem.page/', { waitUntil: 'networkidle', timeout: 60000 });
await p.waitForTimeout(2000);
const out = await p.evaluate(() => {
  const r = [];
  const g = (sel) => document.querySelectorAll(sel).forEach((el) => {
    const bx = el.getBoundingClientRect();
    r.push(`${sel} y${Math.round(bx.top + scrollY)} h${Math.round(bx.height)} w${Math.round(bx.width)}`);
  });
  g('.responsibility .resp-video-teaser'); g('.responsibility .info-for');
  g('.cards.color .card'); g('.cards.media:not(.grey) .card'); g('.responsibility-container .default-content-wrapper');
  g('.banner.trading .banner-teaser'); g('.columns .video-wrap');
  return r.join('\n');
});
console.log(out);
await b.close();
