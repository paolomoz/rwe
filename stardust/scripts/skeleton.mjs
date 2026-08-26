// Recreation skeleton: compact annotated tree of the live page's visible
// structure (classes, geometry, key computed styles, media, text) per gate
// breakpoint. Inspection artifact — values feed the clean re-authoring.
import { chromium } from 'playwright';
import fs from 'node:fs';

const W = +(process.argv[2] || 1440);
const browser = await chromium.launch({ headless: false, channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: W, height: 900 }, locale: 'en-US', deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.goto('https://www.rwe.com/en/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(3000);
await page.evaluate(() => {
  const hit = [...document.querySelectorAll('button, a')].find((x) => /^\s*accept all\s*$/i.test(x.textContent || ''));
  if (hit) hit.click();
});
await page.waitForTimeout(800);
await page.mouse.move(2, 2);
const total = await page.evaluate(() => document.body.scrollHeight);
for (let y = 0; y < total + 900; y += 540) { await page.evaluate((v) => window.scrollTo(0, v), y); await page.waitForTimeout(150); }
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(1000);

const skel = await page.evaluate(() => {
  const KEY = ['display', 'position', 'flex-direction', 'justify-content', 'align-items', 'gap', 'grid-template-columns', 'width', 'max-width', 'height', 'min-height', 'padding', 'margin', 'background-color', 'background-image', 'background-size', 'background-position', 'color', 'font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing', 'text-align', 'text-transform', 'border', 'border-radius', 'box-shadow', 'opacity', 'z-index', 'overflow', 'object-fit', 'top', 'left', 'right', 'bottom', 'transform', 'text-decoration-line'];
  const vis = (el) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 || r.height > 0;
  };
  const walk = (el, depth) => {
    if (!el || el.nodeType !== 1) return null;
    if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'LINK', 'META'].includes(el.tagName)) return null;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const node = { t: el.tagName.toLowerCase() };
    const cls = (el.className && el.className.toString ? el.className.toString() : '').trim();
    if (cls) node.c = cls.slice(0, 120);
    node.r = [Math.round(r.left), Math.round(r.top + scrollY), Math.round(r.width), Math.round(r.height)];
    const hidden = cs.display === 'none' || cs.visibility === 'hidden';
    if (hidden) node.hidden = true;
    // key styles, only non-default-ish
    const s = {};
    for (const p of KEY) {
      const v = cs.getPropertyValue(p);
      if (!v || v === 'none' || v === 'normal' || v === 'auto' || v === 'rgba(0, 0, 0, 0)' || v === '0px' || v === 'static' || v === 'visible' || v === 'stretch' || v === 'flex-start' && p === 'justify-content') continue;
      s[p] = v.length > 150 ? v.slice(0, 150) + '…' : v;
    }
    node.s = s;
    if (el.tagName === 'IMG') { node.src = el.currentSrc || el.src; node.alt = el.alt; }
    if (el.tagName === 'VIDEO') { node.src = el.currentSrc || (el.querySelector('source') || {}).src; node.autoplay = el.autoplay; node.loop = el.loop; }
    if (el.tagName === 'A') node.href = el.getAttribute('href');
    if (el.tagName === 'IFRAME') node.src = el.src;
    // own text (not descendants')
    const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(' ').trim();
    if (own) node.text = own.slice(0, 200);
    if (depth > 0) {
      const kids = [...el.children].map((k) => walk(k, depth - 1)).filter(Boolean);
      if (kids.length) node.k = kids;
    }
    return node;
  };
  const out = { header: null, sections: [], footer: null };
  const header = document.querySelector('header, [class*="header"]');
  out.header = walk(header, 7);
  const secs = [...document.querySelectorAll('section')].filter((s) => !s.closest('footer') && vis(s) && s.getBoundingClientRect().height > 100);
  const top = secs.filter((s) => !secs.some((o) => o !== s && o.contains(s)));
  out.sections = top.map((s) => walk(s, 8));
  out.footer = walk(document.querySelector('footer') || document.querySelector('[class*="footer"]'), 8);
  out.scrollHeight = document.body.scrollHeight;
  return out;
});
fs.writeFileSync(`stardust/replica/skeleton-${W}.json`, JSON.stringify(skel, null, 1));
console.log(`skeleton-${W}.json: ${skel.sections.length} sections, scrollHeight ${skel.scrollHeight}, bytes ${fs.statSync(`stardust/replica/skeleton-${W}.json`).size}`);
await browser.close();
