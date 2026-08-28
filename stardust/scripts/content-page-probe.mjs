// A4 content-page recreation probe: full-depth outline + verbatim content
// + computed styles + full DOM dump + asset urls, one navigation per width.
import { chromium } from 'playwright';
import fs from 'node:fs';

const W = +(process.argv[2] || 1440);
const URL_ = 'https://www.rwe.com/en/responsibility-and-sustainability/environmental-protection/climate/';
const b = await chromium.launch({ headless: false, channel: 'chrome' });
const p = await (await b.newContext({ viewport: { width: W, height: 900 }, locale: 'en-US' })).newPage();
await p.goto(URL_, { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForTimeout(2500);
// deny consent to match gate state
await p.evaluate(() => { const h=[...document.querySelectorAll('button,a')].find(x=>/^\s*deny all\s*$/i.test(x.textContent||'')); if(h)h.click(); });
await p.waitForTimeout(1000);
const total = await p.evaluate(() => document.body.scrollHeight);
for (let y = 0; y < total + 900; y += 600) { await p.evaluate((v) => window.scrollTo(0, v), y); await p.waitForTimeout(120); }
await p.evaluate(() => window.scrollTo(0, 0));
await p.waitForTimeout(800);
const out = await p.evaluate(() => {
  const lines = [];
  const em = (el, d) => {
    if (!el || el.nodeType !== 1 || ['SCRIPT','STYLE','NOSCRIPT','SVG','PATH','SOURCE'].includes(el.tagName)) return;
    const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
    const hidden = cs.display === 'none' || cs.visibility === 'hidden';
    let l = ' '.repeat(d) + el.tagName.toLowerCase();
    const cls = (el.className && el.className.toString ? el.className.toString() : '').trim();
    if (cls) l += '.' + cls.split(/\s+/).slice(0, 4).join('.');
    l += ` [${Math.round(r.left)},${Math.round(r.top + scrollY)},${Math.round(r.width)},${Math.round(r.height)}]`;
    if (hidden) { lines.push(l + ' HIDDEN'); return; }
    const keep = {};
    for (const pr of ['font-size','font-weight','line-height','font-family','color','background-color','background-image','padding','margin','text-align','border-radius','border','display','grid-template-columns','gap','object-fit','position','justify-content','align-items','flex-direction','max-width','width','height','aspect-ratio','flex-wrap','overflow']) {
      const v = cs.getPropertyValue(pr);
      if (v && !['none','normal','auto','rgba(0, 0, 0, 0)','0px','static','visible','row','stretch','flex-start'].includes(v)) keep[pr] = v.slice(0, 110);
    }
    const sv = Object.entries(keep).map(([k, v]) => `${k}:${v}`).join(' ');
    if (sv) l += ' {' + sv.slice(0, 320) + '}';
    const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).filter(Boolean).join(' ');
    if (own) l += ` "${own.slice(0, 130)}"`;
    if (el.tagName === 'IMG') l += ' SRC=' + (el.currentSrc || el.src).slice(-90);
    if (el.tagName === 'A') l += ' HREF=' + (el.getAttribute('href') || '').slice(0, 80);
    lines.push(l);
    if (d < 16) [...el.children].forEach((k) => em(k, d + 1));
  };
  const main = document.querySelector('main') || document.body;
  em(main, 0);
  return lines.join('\n');
});
fs.writeFileSync(`stardust/replica/content-page-outline-${W}.txt`, out);
// full DOM (for verbatim extraction offline)
const dom = await p.content();
fs.writeFileSync(`stardust/replica/content-page-dom-${W}.html`, dom);
// asset urls: images incl. bg images
const assets = await p.evaluate(() => {
  const set = new Set();
  document.querySelectorAll('img').forEach((i) => { if (i.currentSrc || i.src) set.add(i.currentSrc || i.src); });
  document.querySelectorAll('*').forEach((e) => {
    const bg = getComputedStyle(e).backgroundImage;
    if (bg && bg !== 'none') { const m = bg.match(/url\("?([^")]+)"?\)/g); if (m) m.forEach((u) => set.add(u.replace(/url\("?/, '').replace(/"?\)$/, ''))); }
  });
  return [...set];
});
fs.writeFileSync(`stardust/replica/content-page-assets-${W}.json`, JSON.stringify(assets, null, 1));
console.log(`outline ${W}: ${out.split('\n').length} lines; assets ${assets.length}; height ${total}`);
await b.close();
