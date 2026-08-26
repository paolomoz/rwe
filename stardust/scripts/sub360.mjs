import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 360, height: 800 } })).newPage();
await p.goto('http://localhost:8797/index-proposed.html', { waitUntil: 'networkidle' });
const out = await p.evaluate(() => {
  const r = [];
  const g = (sel) => document.querySelectorAll(sel).forEach((el) => {
    const b = el.getBoundingClientRect();
    r.push(`${sel} y${Math.round(b.top + scrollY)} h${Math.round(b.height)}`);
  });
  g('.energy-band .media-card');
  g('.energy-band .media-cards');
  g('.working .tic02--centered'); g('.jobs-teaser'); g('.working .media-cards .media-card');
  g('.media-band .intro'); g('.media-band .col-press'); g('.press-item'); g('.share-box');
  g('.contact-band .contact-q'); g('.contact-band .cell');
  g('#breadcrumb-bottom');
  g('.site-footer .f-section'); g('.site-footer .legal'); g('.site-footer .f-links');
  g('.resp-video-teaser'); g('.info-for'); g('.card-grid'); g('.band-tail');
  return r.join('\n');
});
console.log(out);
await b.close();
