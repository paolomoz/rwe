// A2 press-hub: full DOM dump + targeted computed styles (hero + filters + tiles),
// one navigation at 1440, deny consent.
import { chromium } from 'playwright';
import fs from 'node:fs';

const URL_ = 'https://www.rwe.com/en/press/';
const b = await chromium.launch({ headless: false, channel: 'chrome' });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, locale: 'en-US' })).newPage();
await p.goto(URL_, { waitUntil: 'domcontentloaded', timeout: 90000 });
await p.waitForTimeout(2500);
await p.evaluate(() => { const h=[...document.querySelectorAll('button,a')].find(x=>/^\s*deny all\s*$/i.test(x.textContent||'')); if(h)h.click(); });
await p.waitForTimeout(800);
const total = await p.evaluate(() => document.body.scrollHeight);
for (let y = 0; y < total + 900; y += 700) { await p.evaluate((v) => window.scrollTo(0, v), y); await p.waitForTimeout(100); }
await p.evaluate(() => window.scrollTo(0, 0));
await p.waitForTimeout(1000);
const html = await p.evaluate(() => document.documentElement.outerHTML);
fs.writeFileSync('stardust/replica/press-hub-dom-1440.html', html);
// targeted outline for hero + filter + one tile (full depth, absolute coords)
const out = await p.evaluate(() => {
  const lines = [];
  const em = (el, d, maxd) => {
    if (!el || el.nodeType !== 1 || ['SCRIPT','STYLE','NOSCRIPT','SVG','PATH','SOURCE','LINK'].includes(el.tagName)) return;
    const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
    const hidden = cs.display === 'none' || cs.visibility === 'hidden';
    let l = ' '.repeat(d) + el.tagName.toLowerCase();
    const cls = (el.className && el.className.toString ? el.className.toString() : '').trim();
    if (cls) l += '.' + cls.split(/\s+/).slice(0, 5).join('.');
    l += ` [${Math.round(r.left)},${Math.round(r.top + scrollY)},${Math.round(r.width)},${Math.round(r.height)}]`;
    if (hidden) { lines.push(l + ' HIDDEN'); return; }
    const keep = {};
    for (const pr of ['font-size','font-weight','line-height','font-family','color','background-color','background-image','background-size','background-position','padding','margin','text-align','border-radius','border','display','object-fit','position','justify-content','align-items','flex-direction','width','height','top','left','right','bottom','box-shadow','opacity','z-index','transform']) {
      const v = cs.getPropertyValue(pr);
      if (v && !['none','normal','auto','rgba(0, 0, 0, 0)','0px','static','visible','row','stretch','flex-start','1','matrix(1, 0, 0, 1, 0, 0)'].includes(v)) keep[pr] = v.slice(0, 130);
    }
    l += ' {' + Object.entries(keep).map(([k, v]) => `${k}:${v}`).join(' ').slice(0, 420) + '}';
    const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).filter(Boolean).join(' ');
    if (own) l += ` "${own.slice(0, 120)}"`;
    if (el.tagName === 'IMG') l += ' SRC=' + (el.currentSrc || el.src).slice(-90);
    lines.push(l);
    if (d < maxd) [...el.children].forEach((k) => em(k, d + 1, maxd));
  };
  const secs = [];
  // everything before main (header, hero/stage etc.)
  for (const el of document.body.children) {
    if (el.tagName === 'MAIN') break;
    secs.push(el);
  }
  secs.forEach((s) => em(s, 0, 12));
  lines.push('==== FILTER ====');
  const f = document.querySelector('.search-filter-container'); if (f) em(f, 0, 14);
  lines.push('==== TILE1 ====');
  const t = document.querySelector('.dynamic-search-result-tile'); if (t) em(t, 0, 14);
  lines.push('==== COUNT HEADER + RSS ====');
  const rc = document.querySelector('.search-results-count-container'); if (rc) em(rc, 0, 14);
  lines.push('==== COUNTRY SLIDE (active) ====');
  const sl = document.querySelector('.slider-slide.slick-current'); if (sl) em(sl, 0, 16);
  lines.push('==== AFTER MAIN (breadcrumb etc) ====');
  let after = false;
  for (const el of document.body.children) {
    if (el.tagName === 'MAIN') { after = true; continue; }
    if (after && !['SCRIPT','STYLE','NOSCRIPT'].includes(el.tagName)) em(el, 0, 6);
  }
  return lines.join('\n');
});
fs.writeFileSync('stardust/replica/press-hub-stage-1440.txt', out);
console.log('dom bytes', html.length, '; stage outline lines', out.split('\n').length);
await b.close();
