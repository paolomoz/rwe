import { chromium } from 'playwright';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36' });
const p = await ctx.newPage();
await p.goto('https://www.rwe.com/en/', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(8000);
const r = await p.evaluate(() => {
  const out = {};
  // header right group
  const right = document.querySelector('.navigation-list--right, [class*=navigation-list]:last-of-type');
  const nav = document.querySelector('nav[class*=navigation], .header-navigation');
  if (right && nav) {
    const rr = right.getBoundingClientRect(); const nr = nav.getBoundingClientRect();
    const cs = getComputedStyle(right); const ns = getComputedStyle(nav);
    out.header = {
      navW: Math.round(nr.width), navDisplay: ns.display, navJustify: ns.justifyContent,
      rightLeft: Math.round(rr.left), rightRight: Math.round(rr.right), rightW: Math.round(rr.width),
      rightMl: cs.marginLeft, rightCls: right.className,
      items: [...right.children].map((li) => `${li.textContent.trim().slice(0, 12)} x${Math.round(li.getBoundingClientRect().left)}`),
    };
  }
  // video big play button
  const play = document.querySelector('.vjs-big-play-button, [class*=big-play], [class*=play-button]');
  if (play) {
    const pr = play.getBoundingClientRect();
    const cs = getComputedStyle(play);
    const vid = play.closest('[class*=video], .video-js') || play.parentElement;
    const vr = vid.getBoundingClientRect();
    const before = getComputedStyle(play, '::before');
    const span = play.querySelector('span, .vjs-icon-placeholder');
    out.play = {
      cls: play.className.slice(0, 80),
      w: Math.round(pr.width), h: Math.round(pr.height),
      // position within video box
      cx: Math.round(pr.left + pr.width / 2 - vr.left), cy: Math.round(pr.top + pr.height / 2 - vr.top),
      vidW: Math.round(vr.width), vidH: Math.round(vr.height),
      border: cs.border, radius: cs.borderRadius, bg: cs.backgroundColor, font: cs.fontSize,
      beforeContent: before.content, beforeFF: before.fontFamily, beforeFS: before.fontSize, beforeLH: before.lineHeight,
      spanCls: span ? span.className : null,
      spanBefore: span ? (() => { const sb = getComputedStyle(span, '::before'); return `${sb.content} ${sb.fontFamily} ${sb.fontSize}`; })() : null,
      html: play.outerHTML.slice(0, 300),
    };
  }
  return out;
});
console.log(JSON.stringify(r, null, 1));
await b.close();
