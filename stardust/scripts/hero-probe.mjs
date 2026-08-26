import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto('http://localhost:3000/qa/page.html', { waitUntil: 'networkidle' });
await p.waitForTimeout(1500);
const r = await p.evaluate(() => {
  const tw = document.querySelector('.hero .slider-slide.active .teaser-width');
  const box = document.querySelector('.hero .slider-slide.active .stage-box');
  const cs = getComputedStyle(tw);
  return { twDisplay: cs.display, twPad: cs.padding, twJustify: cs.justifyContent, twAlign: cs.alignItems,
    boxRect: box.getBoundingClientRect(), boxDisplay: getComputedStyle(box).display, boxH: getComputedStyle(box).height };
});
console.log(JSON.stringify(r, null, 1));
await b.close();
