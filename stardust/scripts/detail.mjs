// Full-depth detail outlines for named components (recreation inspection).
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

const SELECTORS = [
  '.sli01--stage-components .slider-slide',
  '.short-news__slider',
  '.rwe-tick01',
  'article.hasVideo',
  '.color-background-3-2',
  'article.color-teaser-1',
  'section .tic02--centered',
  'article.teaser-width.tea01--image-left:not(.inside-bas-05)',
  'article.inside-bas-05',
  '.color-background-gradient-green',
  '.grid-content-1.col-md-8 > div',
  'footer',
];

const out = await page.evaluate((SELECTORS) => {
  const lines = [];
  const em = (el, d) => {
    if (!el || el.nodeType !== 1 || ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(el.tagName)) return;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const hidden = cs.display === 'none' || cs.visibility === 'hidden';
    let l = ' '.repeat(d) + el.tagName.toLowerCase();
    const cls = (el.className && el.className.toString ? el.className.toString() : '').trim();
    if (cls) l += '.' + cls.split(/\s+/).slice(0, 4).join('.');
    l += ` [${Math.round(r.left)},${Math.round(r.top + scrollY)},${Math.round(r.width)},${Math.round(r.height)}]`;
    if (hidden) l += ' HIDDEN';
    const keep = {};
    for (const p of ['font-size', 'font-weight', 'line-height', 'font-family', 'color', 'background-color', 'background-image', 'background-size', 'background-position', 'padding', 'margin', 'text-align', 'border-radius', 'border', 'display', 'grid-template-columns', 'gap', 'object-fit', 'text-transform', 'width', 'height', 'position', 'top', 'left', 'right', 'bottom', 'justify-content', 'align-items', 'flex-direction', 'opacity', 'text-decoration-line', 'letter-spacing']) {
      const v = cs.getPropertyValue(p);
      if (v && !['none', 'normal', 'auto', 'rgba(0, 0, 0, 0)', '0px', 'static', 'visible', 'row', 'stretch', 'flex-start', 'left'].includes(v)) keep[p] = v.slice(0, 120);
    }
    const sv = Object.entries(keep).map(([k, v]) => `${k}:${v}`).join('; ');
    if (sv) l += ' {' + sv.slice(0, 350) + '}';
    const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).filter(Boolean).join(' ');
    if (own) l += ` "${own.slice(0, 150)}"`;
    if (el.tagName === 'IMG') l += ' SRC=' + (el.currentSrc || el.src);
    if (el.tagName === 'VIDEO') { const s = el.querySelector('source'); l += ' VSRC=' + (el.currentSrc || (s && s.src) || '') + ' poster=' + (el.poster || '') + ` auto=${el.autoplay} loop=${el.loop} muted=${el.muted}`; }
    if (el.tagName === 'A') l += ' HREF=' + el.getAttribute('href');
    if (el.tagName === 'IFRAME') l += ' ISRC=' + el.src;
    if (el.tagName === 'use') l += ' XLINK=' + (el.getAttribute('xlink:href') || el.getAttribute('href') || '');
    lines.push(l);
    if (d < 30) [...el.children].forEach((k) => em(k, d + 1));
  };
  for (const sel of SELECTORS) {
    const els = [...document.querySelectorAll(sel)];
    lines.push(`\n########## ${sel} (${els.length}) ##########`);
    els.forEach((el, i) => { lines.push(`--- match ${i} ---`); em(el, 0); });
  }
  return lines.join('\n');
}, SELECTORS);
fs.writeFileSync(`stardust/replica/detail-${W}.txt`, out);
console.log(`detail-${W}.txt written, ${out.split('\n').length} lines`);
await browser.close();
