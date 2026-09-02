import fs from 'fs';
import { chromium } from 'playwright';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const b = await chromium.launch();
const ctx = await b.newContext({ userAgent: UA, viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
await p.goto('https://www.rwe.com/en/', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(5000);
await p.click('li.search button, button.icon-search');
await p.waitForTimeout(1200);
const r = await p.evaluate(() => {
  // what paints the teal gauze? stack at a point in the content area
  const els = document.elementsFromPoint(400, 700).slice(0, 6).map((el) => {
    const c = getComputedStyle(el);
    return { tag: el.tagName, cls: el.className.toString().slice(0, 50), bg: c.background.slice(0, 120), op: c.opacity, pos: c.position, z: c.zIndex };
  });
  // search magnifier btn inside wrap
  const inp = [...document.querySelectorAll('input')].find((i) => i.getBoundingClientRect().height > 40 && i.getBoundingClientRect().width > 600);
  const wrap = inp.closest('div');
  const btn = wrap.querySelector('button') || wrap.parentElement.querySelector('button');
  const wr = wrap.getBoundingClientRect();
  return {
    stack: els,
    wrapRect: { x: wr.x, y: wr.y, w: wr.width, h: wr.height },
    wrapOuter: wrap.parentElement ? getComputedStyle(wrap.parentElement).cssText ? null : { cls: wrap.parentElement.className.toString().slice(0, 60) } : null,
    btnBefore: btn ? getComputedStyle(btn, '::before').content : null,
    btnStyles: btn ? (({ width, height, background, color, fontSize }) => ({ width, height, background: background.slice(0, 60), color, fontSize }))(getComputedStyle(btn)) : null,
    closeX: (() => { const c = [...document.querySelectorAll('button, [class*="close"]')].find((el) => { const rr = el.getBoundingClientRect(); return rr.y > 130 && rr.y < 300 && rr.x > 1700 - 600 && rr.width < 90 && /close|✕|×/i.test(el.className + el.getAttribute('aria-label')); }); return c ? { cls: c.className.toString().slice(0, 50), x: c.getBoundingClientRect().x, y: c.getBoundingClientRect().y } : null; })(),
  };
});
console.log(JSON.stringify(r, null, 1));
await b.close();

// mobile drawer
const b2 = await chromium.launch();
const ctx2 = await b2.newContext({ userAgent: UA, viewport: { width: 360, height: 800 } });
const p2 = await ctx2.newPage();
await p2.goto('https://www.rwe.com/en/', { waitUntil: 'domcontentloaded' });
await p2.waitForTimeout(5000);
await p2.click('li.menu button, button.menu-button');
await p2.waitForTimeout(1200);
await p2.screenshot({ path: 'stardust/migration/megamenu-mobile-live.png' });
const m = await p2.evaluate(() => {
  const wrap = document.querySelector('.meme__wrapper');
  const c = wrap ? getComputedStyle(wrap) : null;
  const item = document.querySelector('.meme__list[data-meme-lvl="0"] > .meme__list-item .meme__link-wrapper a');
  const ic = item ? getComputedStyle(item) : null;
  const trig = document.querySelector('.meme__trigger--first-lvl');
  return {
    wrap: c ? { pos: c.position, w: wrap.getBoundingClientRect().width, h: wrap.getBoundingClientRect().height, bg: c.backgroundColor, transition: c.transition.slice(0, 80) } : null,
    item: ic ? { font: `${ic.fontFamily} ${ic.fontSize}/${ic.lineHeight}`, color: ic.color, textAlign: ic.textAlign, pad: ic.padding } : null,
    trigger: trig ? { content: getComputedStyle(trig, '::before').content || getComputedStyle(trig, '::after').content, w: trig.getBoundingClientRect().width } : null,
  };
});
console.log('MOBILE:', JSON.stringify(m, null, 1));
await b2.close();
