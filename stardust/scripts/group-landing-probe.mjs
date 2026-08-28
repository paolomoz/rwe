// A3 group-landing recreation probe: full-depth outline + verbatim content
// + computed styles + HTML dump, one navigation per width. Deny-consent state.
import { chromium } from 'playwright';
import fs from 'node:fs';

const W = +(process.argv[2] || 1440);
const URL_ = 'https://www.rwe.com/en/the-group/';
const b = await chromium.launch({ headless: false, channel: 'chrome' });
const p = await (await b.newContext({ viewport: { width: W, height: 900 }, locale: 'en-US' })).newPage();
await p.goto(URL_, { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForTimeout(2500);
await p.evaluate(() => { const h=[...document.querySelectorAll('button,a')].find(x=>/^\s*deny all\s*$/i.test(x.textContent||'')); if(h)h.click(); });
await p.waitForTimeout(800);
const total = await p.evaluate(() => document.body.scrollHeight);
for (let y = 0; y < total + 900; y += 600) { await p.evaluate((v) => window.scrollTo(0, v), y); await p.waitForTimeout(100); }
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
    if (cls) l += '.' + cls.split(/\s+/).slice(0, 5).join('.');
    const tpl = el.getAttribute && el.getAttribute('data-tpl'); if (tpl) l += `[tpl=${tpl}]`;
    l += ` [${Math.round(r.left)},${Math.round(r.top + scrollY)},${Math.round(r.width)},${Math.round(r.height)}]`;
    if (hidden) { lines.push(l + ' HIDDEN'); return; }
    const keep = {};
    for (const pr of ['font-size','font-weight','line-height','font-family','color','background-color','background-image','padding','margin','text-align','border-radius','border','display','object-fit','position','justify-content','align-items','flex-direction','flex-wrap','max-width','width','height','overflow']) {
      const v = cs.getPropertyValue(pr);
      if (v && !['none','normal','auto','rgba(0, 0, 0, 0)','0px','static','visible','row','stretch','flex-start','nowrap'].includes(v)) keep[pr] = v.slice(0, 110);
    }
    const sv = Object.entries(keep).map(([k, v]) => `${k}:${v}`).join(' ');
    if (sv) l += ' {' + sv.slice(0, 330) + '}';
    const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).filter(Boolean).join(' ');
    if (own) l += ` "${own.slice(0, 140)}"`;
    if (el.tagName === 'IMG') l += ' SRC=' + (el.currentSrc || el.src).slice(-90);
    if (el.tagName === 'A') l += ' HREF=' + (el.getAttribute('href') || '').slice(0, 80);
    lines.push(l);
    if (d < 16) [...el.children].forEach((k) => em(k, d + 1));
  };
  const main = document.querySelector('main') || document.body;
  em(main, 0);
  return lines.join('\n');
});
fs.writeFileSync(`stardust/replica/group-landing-outline-${W}.txt`, out);
// verbatim content dump (raw innerHTML for nbsp fidelity)
const content = await p.evaluate(() => {
  const main = document.querySelector('main') || document.body;
  const heads = [...main.querySelectorAll('h1,h2,h3,h4')].map((h) => ({ t: h.tagName, html: h.innerHTML.trim(), vis: !!h.offsetParent }));
  const paras = [...main.querySelectorAll('p')].filter((x) => x.textContent.trim().length > 5).map((x) => ({ html: x.innerHTML.trim(), vis: !!x.offsetParent }));
  const links = [...main.querySelectorAll('a[href]')].filter((a) => a.textContent.trim()).map((a) => ({ t: a.textContent.trim().slice(0, 70), h: a.getAttribute('href').slice(0, 110), vis: !!a.offsetParent }));
  const bgs = [...main.querySelectorAll('*')].map((el) => { const b = getComputedStyle(el).backgroundImage; return b && b !== 'none' ? { sel: el.tagName + '.' + (el.className||'').toString().split(/\s+/).slice(0,3).join('.'), b: b.slice(0, 220) } : null; }).filter(Boolean);
  const imgs = [...main.querySelectorAll('img')].map((i) => ({ src: (i.currentSrc || i.src).slice(0, 200), srcset: (i.getAttribute('srcset')||'').slice(0,300), w: i.width, h: i.height }));
  return { title: document.title, desc: (document.querySelector('meta[name="description"]')||{}).content, heads, paras, links, bgs, imgs };
});
fs.writeFileSync(`stardust/replica/group-landing-content-${W}.json`, JSON.stringify(content, null, 1));
// full main HTML for structural reference
const html = await p.evaluate(() => (document.querySelector('main') || document.body).outerHTML);
fs.writeFileSync(`stardust/replica/group-landing-dom-${W}.html`, html);
console.log(`outline ${W}: ${out.split('\n').length} lines; heads ${content.heads.length}; paras ${content.paras.length}; bgs ${content.bgs.length}; height ${total}`);
await b.close();
