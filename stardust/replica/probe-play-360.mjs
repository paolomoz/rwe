import { chromium } from 'playwright';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 360, height: 800 }, userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36' });
const p = await ctx.newPage();
await p.goto('https://www.rwe.com/en/', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(8000);
const r = await p.evaluate(() => {
  const play = document.querySelector('.vjs-big-play-button');
  if (!play) return null;
  const pr = play.getBoundingClientRect();
  const vid = play.closest('.video-js') || play.parentElement;
  const vr = vid.getBoundingClientRect();
  const cs = getComputedStyle(play);
  return { w: Math.round(pr.width), h: Math.round(pr.height), cx: Math.round(pr.left + pr.width / 2 - vr.left), cy: Math.round(pr.top + pr.height / 2 - vr.top), vidW: Math.round(vr.width), vidH: Math.round(vr.height), fs: cs.fontSize, border: cs.borderWidth, bg: cs.backgroundColor, color: cs.color, shadow: cs.boxShadow };
});
console.log(JSON.stringify(r));
await b.close();
