import fs from 'fs';
import { chromium } from 'playwright';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const b = await chromium.launch();
const ctx = await b.newContext({ userAgent: UA, viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
await p.goto('https://www.rwe.com/en/', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(6000);

// record open animation: sample panel transform/opacity over time
await p.evaluate(() => {
  window.__samples = [];
  const btn = document.querySelector('li.menu button');
  btn.click();
  const t0 = performance.now();
  const tick = () => {
    const panel = document.querySelector('.meme__list[data-meme-lvl="0"]')?.closest('nav, div[class*="meme"], [class*="navigation"]');
    const el = panel || document.querySelector('[class*="meme"]');
    if (el) {
      const cs = getComputedStyle(el);
      window.__samples.push({ t: Math.round(performance.now() - t0), tr: cs.transform, op: cs.opacity, h: el.getBoundingClientRect().height, cls: el.className.toString().slice(0, 60) });
    }
    if (performance.now() - t0 < 900) requestAnimationFrame(tick);
  };
  tick();
});
await p.waitForTimeout(1400);
const anim = await p.evaluate(() => window.__samples.filter((s, i) => i % 6 === 0));
console.log('OPEN ANIM:', JSON.stringify(anim.slice(0, 8)));

const detail = await p.evaluate(() => {
  const st = (el, props) => { if (!el) return null; const c = getComputedStyle(el); return Object.fromEntries(props.map((k) => [k, c[k]])); };
  // inactive rail item
  const items = [...document.querySelectorAll('.meme__list[data-meme-lvl="0"] > .meme__list-item > .meme__link-wrapper')];
  const inactive = items.find((w) => !w.className.includes('active'));
  // leaf link inside active flyout (a child WITHOUT its own sub)
  const flyout = document.querySelector('.meme__lvl-wrapper--active') || document.querySelector('.meme__lvl-wrapper--first-lvl');
  const leafLi = flyout ? [...flyout.querySelectorAll('.meme__list-item')].find((li) => !li.querySelector('.meme__lvl-wrapper') && li.querySelector('a') && !li.className.includes('back')) : null;
  const headLi = flyout ? [...flyout.querySelectorAll('.meme__list-item')].find((li) => li.querySelector(':scope > .meme__lvl-wrapper')) : null;
  // menu button state when open
  const menuBtn = document.querySelector('li.menu button');
  // backdrop
  const backdrop = [...document.querySelectorAll('body > *')].find((el) => { const c = getComputedStyle(el); return c.position === 'fixed' && parseFloat(c.opacity) > 0 && /rgba?\(/.test(c.backgroundColor) && el.getBoundingClientRect().height > 800; });
  // does hover switch sections?
  return {
    inactiveRail: st(inactive ? inactive.querySelector('a') : null, ['color', 'fontFamily', 'fontSize']),
    leaf: st(leafLi ? leafLi.querySelector('a') : null, ['color', 'fontFamily', 'fontSize', 'lineHeight', 'margin', 'padding']),
    head2: st(headLi ? headLi.querySelector('a') : null, ['color', 'fontFamily', 'fontSize']),
    menuBtnOpen: { cls: menuBtn.className, text: menuBtn.textContent.trim(), icon: getComputedStyle(menuBtn.querySelector('[class*=icon]') || menuBtn, '::before').content },
    backdrop: backdrop ? { cls: backdrop.className.toString().slice(0, 60), bg: getComputedStyle(backdrop).backgroundColor } : null,
    bodyOverflow: getComputedStyle(document.body).overflow,
    triggerHtml: (document.querySelector('.meme__trigger') || {}).outerHTML?.slice(0, 200),
    newsboxHtml: (document.querySelector('.meme__newsbox') || {}).outerHTML?.replace(/\s+/g, ' ').slice(0, 600),
  };
});
console.log('DETAIL:', JSON.stringify(detail, null, 1));

// hover the second rail item — does the flyout switch?
const secondSel = '.meme__list[data-meme-lvl="0"] > .meme__list-item:nth-child(2) .meme__link-wrapper';
await p.hover(secondSel);
await p.waitForTimeout(800);
const afterHover = await p.evaluate(() => document.querySelector('.meme__lvl-wrapper--active')?.closest('.meme__list-item')?.querySelector('a')?.textContent.trim());
console.log('after hover 2nd item, active section:', afterHover);
await p.click(secondSel);
await p.waitForTimeout(800);
const afterClick = await p.evaluate(() => document.querySelector('.meme__lvl-wrapper--active')?.closest('.meme__list-item')?.querySelector('a')?.textContent.trim());
console.log('after click 2nd item, active section:', afterClick);
await p.screenshot({ path: 'stardust/migration/megamenu-2nd-live.png' });

// ---- search overlay ----
await p.keyboard.press('Escape');
await p.waitForTimeout(800);
await p.click('li.search button, button.icon-search');
await p.waitForTimeout(1200);
const search = await p.evaluate(() => {
  const st = (el, props) => { if (!el) return null; const c = getComputedStyle(el); return Object.fromEntries(props.map((k) => [k, c[k]])); };
  const input = document.querySelector('input[type="search"]:not([name="search"]), [class*="search"] input[type="search"], input[placeholder*="search" i]');
  const vis = [...document.querySelectorAll('input')].find((i) => i.getBoundingClientRect().height > 40 && i.getBoundingClientRect().width > 600);
  const inp = vis || input;
  const wrap = inp ? inp.closest('div, form') : null;
  const overlay = [...document.querySelectorAll('body *')].find((el) => { const r = el.getBoundingClientRect(); const c = getComputedStyle(el); return r.width > 1400 && r.height > 700 && (c.backdropFilter !== 'none' || /rgba/.test(c.backgroundColor)) && c.position === 'fixed'; });
  const close = [...document.querySelectorAll('button')].find((btn) => { const r = btn.getBoundingClientRect(); return r.y < 260 && r.x > 1200 && r.width > 20; });
  return {
    input: inp ? { ...st(inp, ['width', 'height', 'fontSize', 'fontFamily', 'border', 'borderRadius', 'background', 'color', 'padding']), rect: { x: inp.getBoundingClientRect().x, y: inp.getBoundingClientRect().y, w: inp.getBoundingClientRect().width, h: inp.getBoundingClientRect().height }, placeholder: inp.placeholder } : null,
    wrap: st(wrap, ['background', 'borderRadius', 'border', 'boxShadow', 'padding']),
    overlay: overlay ? { cls: overlay.className.toString().slice(0, 60), ...st(overlay, ['background', 'backgroundColor', 'backdropFilter', 'opacity']) } : null,
    close: close ? { text: close.textContent.trim().slice(0, 10), ...st(close, ['color', 'fontSize']), x: close.getBoundingClientRect().x, y: close.getBoundingClientRect().y } : null,
  };
});
console.log('SEARCH:', JSON.stringify(search, null, 1));
await p.screenshot({ path: 'stardust/migration/search-open-live.png' });
await b.close();
