import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto('http://localhost:8797/job-search-proposed.html', { waitUntil: 'networkidle' });
const r = await p.evaluate(() => {
  const d = document.querySelector('.jrt__additional-info__workingTime');
  const cs = getComputedStyle(d, '::before');
  const range = document.createRange();
  range.selectNodeContents(d);
  const rects = [...range.getClientRects()].map(r => [Math.round(r.left), Math.round(r.width)]);
  return { beforeW: cs.width, beforeF: cs.fontSize, beforeD: cs.display, divW: d.getBoundingClientRect().width, textRects: rects };
});
console.log(JSON.stringify(r));
await b.close();
