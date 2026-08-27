// A1 article-detail recreation probe: full-depth outline + verbatim content
// + computed styles, one navigation per width.
import { chromium } from 'playwright';
import fs from 'node:fs';

const W = +(process.argv[2] || 1440);
const URL_ = 'https://www.rwe.com/en/press/rwe-ag/2026-08-13-rwe-delivers-strong-first-half-results/';
const b = await chromium.launch({ headless: false, channel: 'chrome' });
const p = await (await b.newContext({ viewport: { width: W, height: 900 }, locale: 'en-US' })).newPage();
await p.goto(URL_, { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForTimeout(2500);
await p.evaluate(() => { const h=[...document.querySelectorAll('button,a')].find(x=>/^\s*accept all\s*$/i.test(x.textContent||'')); if(h)h.click(); });
await p.waitForTimeout(800);
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
    for (const pr of ['font-size','font-weight','line-height','font-family','color','background-color','background-image','padding','margin','text-align','border-radius','border','display','grid-template-columns','gap','object-fit','position','justify-content','align-items','flex-direction','max-width','width']) {
      const v = cs.getPropertyValue(pr);
      if (v && !['none','normal','auto','rgba(0, 0, 0, 0)','0px','static','visible','row','stretch','flex-start'].includes(v)) keep[pr] = v.slice(0, 90);
    }
    const sv = Object.entries(keep).map(([k, v]) => `${k.replace(/^[a-z]+-/,'')}:${v}`).join(' ');
    if (sv) l += ' {' + sv.slice(0, 260) + '}';
    const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).filter(Boolean).join(' ');
    if (own) l += ` "${own.slice(0, 130)}"`;
    if (el.tagName === 'IMG') l += ' SRC=' + (el.currentSrc || el.src).slice(-70);
    if (el.tagName === 'A') l += ' HREF=' + (el.getAttribute('href') || '').slice(0, 70);
    lines.push(l);
    if (d < 14) [...el.children].forEach((k) => em(k, d + 1));
  };
  const main = document.querySelector('main') || document.body;
  em(main, 0);
  return lines.join('\n');
});
fs.writeFileSync(`stardust/replica/article-outline-${W}.txt`, out);
// verbatim content dump
const content = await p.evaluate(() => {
  const main = document.querySelector('main') || document.body;
  const heads = [...main.querySelectorAll('h1,h2,h3,h4')].map((h) => ({ t: h.tagName, x: h.textContent.trim() }));
  const paras = [...main.querySelectorAll('p')].filter((x) => x.textContent.trim().length > 20 && x.offsetParent).map((x) => x.textContent.trim());
  const links = [...main.querySelectorAll('a[href]')].filter((a) => a.offsetParent && a.textContent.trim()).map((a) => ({ t: a.textContent.trim().slice(0, 60), h: a.getAttribute('href').slice(0, 90) }));
  return { title: document.title, desc: (document.querySelector('meta[name="description"]')||{}).content, heads, paras, links: links.slice(0, 60) };
});
fs.writeFileSync(`stardust/replica/article-content-${W}.json`, JSON.stringify(content, null, 1));
console.log(`outline ${W}: ${out.split('\n').length} lines; heads ${content.heads.length}; paras ${content.paras.length}`);
await b.close();
