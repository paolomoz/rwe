// A5 locations-map recreation probe: full-depth outline + verbatim content
// + widget forensics (map tech detection), one navigation per width.
// Deny-all consent state to match the gate capture.
import { chromium } from 'playwright';
import fs from 'node:fs';

const W = +(process.argv[2] || 1440);
const URL_ = 'https://www.rwe.com/en/the-group/countries-and-locations/';
const b = await chromium.launch({ headless: false, channel: 'chrome' });
const p = await (await b.newContext({ viewport: { width: W, height: 900 }, locale: 'en-US' })).newPage();
await p.goto(URL_, { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForTimeout(2500);
await p.evaluate(() => { const h = [...document.querySelectorAll('button,a')].find((x) => /^\s*deny all\s*$/i.test(x.textContent || '')); if (h) h.click(); });
await p.waitForTimeout(1200);
const total = await p.evaluate(() => document.body.scrollHeight);
for (let y = 0; y < total + 900; y += 600) { await p.evaluate((v) => window.scrollTo(0, v), y); await p.waitForTimeout(120); }
await p.evaluate(() => window.scrollTo(0, 0));
await p.waitForTimeout(1000);

// 1) outline with computed styles (child cap for huge lists)
const out = await p.evaluate(() => {
  const lines = [];
  const em = (el, d) => {
    if (!el || el.nodeType !== 1 || ['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'PATH', 'SOURCE'].includes(el.tagName)) return;
    const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
    const hidden = cs.display === 'none' || cs.visibility === 'hidden';
    let l = ' '.repeat(d) + el.tagName.toLowerCase();
    const cls = (el.className && el.className.toString ? el.className.toString() : '').trim();
    if (cls) l += '.' + cls.split(/\s+/).slice(0, 5).join('.');
    if (el.id) l += '#' + el.id;
    const tpl = el.getAttribute && el.getAttribute('data-tpl'); if (tpl) l += `(tpl=${tpl})`;
    l += ` [${Math.round(r.left)},${Math.round(r.top + scrollY)},${Math.round(r.width)},${Math.round(r.height)}]`;
    if (hidden) { lines.push(l + ' HIDDEN'); return; }
    const keep = {};
    for (const pr of ['font-size', 'font-weight', 'line-height', 'font-family', 'color', 'background-color', 'background-image', 'padding', 'margin', 'text-align', 'border-radius', 'border', 'display', 'grid-template-columns', 'gap', 'object-fit', 'position', 'justify-content', 'align-items', 'flex-direction', 'max-width', 'width', 'height', 'overflow', 'box-shadow']) {
      const v = cs.getPropertyValue(pr);
      if (v && !['none', 'normal', 'auto', 'rgba(0, 0, 0, 0)', '0px', 'static', 'visible', 'row', 'stretch', 'flex-start'].includes(v)) keep[pr] = v.slice(0, 110);
    }
    const sv = Object.entries(keep).map(([k, v]) => `${k.replace(/^[a-z]+-/, '')}:${v}`).join(' ');
    if (sv) l += ' {' + sv.slice(0, 300) + '}';
    const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).filter(Boolean).join(' ');
    if (own) l += ` "${own.slice(0, 130)}"`;
    if (el.tagName === 'IMG') l += ' SRC=' + (el.currentSrc || el.src).slice(-90);
    if (el.tagName === 'A') l += ' HREF=' + (el.getAttribute('href') || '').slice(0, 80);
    if (['INPUT', 'SELECT', 'BUTTON'].includes(el.tagName)) l += ` VAL="${(el.value || '').slice(0, 40)}" PH="${(el.placeholder || '').slice(0, 40)}"`;
    lines.push(l);
    if (d < 16) {
      const kids = [...el.children];
      const cap = kids.length > 12 && d > 4 ? 8 : kids.length;
      kids.slice(0, cap).forEach((k) => em(k, d + 1));
      if (cap < kids.length) lines.push(' '.repeat(d + 1) + `… +${kids.length - cap} more siblings like above`);
    }
  };
  em(document.body, 0);
  return lines.join('\n');
});
fs.writeFileSync(`stardust/replica/locations-outline-${W}.txt`, out);

// 2) widget forensics: what is the map/list module made of
const widget = await p.evaluate(() => {
  const r = {};
  r.canvases = [...document.querySelectorAll('canvas')].map((c) => { const b2 = c.getBoundingClientRect(); return { w: c.width, h: c.height, rect: [Math.round(b2.left), Math.round(b2.top + scrollY), Math.round(b2.width), Math.round(b2.height)], cls: c.className.toString().slice(0, 80) }; });
  r.iframes = [...document.querySelectorAll('iframe')].map((f) => ({ src: (f.src || '').slice(0, 120), rect: (() => { const b2 = f.getBoundingClientRect(); return [Math.round(b2.left), Math.round(b2.top + scrollY), Math.round(b2.width), Math.round(b2.height)]; })() }));
  r.leaflet = !!document.querySelector('.leaflet-container');
  r.gmap = !!document.querySelector('.gm-style');
  r.htm01 = [...document.querySelectorAll('[data-tpl="htm01"],[class*="htm01"]')].map((e) => ({ cls: e.className.toString().slice(0, 100), html0: e.innerHTML.slice(0, 500) }));
  const list = document.querySelector('[class*="location"]');
  r.locationClassSample = list ? list.className.toString() : null;
  // globals that hint at map libs
  r.globals = ['google', 'L', 'mapboxgl', 'ol', 'maplibregl', 'H'].filter((g) => window[g] !== undefined);
  // count list items in the results widget
  const results = [...document.querySelectorAll('li,article,div')].filter((e) => /result/i.test(e.className.toString())).slice(0, 5).map((e) => e.className.toString().slice(0, 80));
  r.resultClasses = results;
  return r;
});
fs.writeFileSync(`stardust/replica/locations-widget-${W}.json`, JSON.stringify(widget, null, 1));

// 3) full main HTML (verbatim source of truth for strings)
if (W === 1440) {
  const html = await p.evaluate(() => (document.querySelector('main') || document.body).outerHTML);
  fs.writeFileSync('stardust/replica/locations-main-1440.html', html);
  const bgs = await p.evaluate(() => {
    const seen = [];
    for (const el of document.querySelectorAll('*')) {
      const bi = getComputedStyle(el).backgroundImage;
      if (bi && bi !== 'none' && bi.includes('url(')) {
        const r2 = el.getBoundingClientRect();
        if (r2.width > 40) seen.push({ cls: el.className.toString().slice(0, 90), rect: [Math.round(r2.left), Math.round(r2.top + scrollY), Math.round(r2.width), Math.round(r2.height)], bi: bi.slice(0, 220) });
      }
    }
    return seen;
  });
  fs.writeFileSync('stardust/replica/locations-bgs-1440.json', JSON.stringify(bgs, null, 1));
}
console.log(`probe ${W}: outline ${out.split('\n').length} lines; canvases ${widget.canvases.length}; gmap ${widget.gmap}; leaflet ${widget.leaflet}; globals ${widget.globals}`);
await b.close();
