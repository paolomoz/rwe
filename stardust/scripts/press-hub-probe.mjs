// A2 press-hub recreation probe: full-depth outline + verbatim content
// + computed styles + form/filter state, one navigation per width.
// Deny-state consent (matches gate reference capture).
import { chromium } from 'playwright';
import fs from 'node:fs';

const W = +(process.argv[2] || 1440);
const URL_ = 'https://www.rwe.com/en/press/';
const b = await chromium.launch({ headless: false, channel: 'chrome' });
const p = await (await b.newContext({ viewport: { width: W, height: 900 }, locale: 'en-US' })).newPage();
await p.goto(URL_, { waitUntil: 'domcontentloaded', timeout: 90000 });
await p.waitForTimeout(2500);
await p.evaluate(() => { const h=[...document.querySelectorAll('button,a')].find(x=>/^\s*deny all\s*$/i.test(x.textContent||'')); if(h)h.click(); });
await p.waitForTimeout(800);
const total = await p.evaluate(() => document.body.scrollHeight);
for (let y = 0; y < total + 900; y += 600) { await p.evaluate((v) => window.scrollTo(0, v), y); await p.waitForTimeout(120); }
await p.evaluate(() => window.scrollTo(0, 0));
await p.waitForTimeout(1200);
const out = await p.evaluate(() => {
  const lines = [];
  const em = (el, d) => {
    if (!el || el.nodeType !== 1 || ['SCRIPT','STYLE','NOSCRIPT','SVG','PATH','SOURCE'].includes(el.tagName)) return;
    const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
    const hidden = cs.display === 'none' || cs.visibility === 'hidden';
    let l = ' '.repeat(d) + el.tagName.toLowerCase();
    const cls = (el.className && el.className.toString ? el.className.toString() : '').trim();
    if (cls) l += '.' + cls.split(/\s+/).slice(0, 5).join('.');
    l += ` [${Math.round(r.left)},${Math.round(r.top + scrollY)},${Math.round(r.width)},${Math.round(r.height)}]`;
    if (hidden) { lines.push(l + ' HIDDEN'); return; }
    const keep = {};
    for (const pr of ['font-size','font-weight','line-height','font-family','color','background-color','background-image','padding','margin','text-align','border-radius','border','display','grid-template-columns','gap','object-fit','position','justify-content','align-items','flex-direction','flex-wrap','max-width','width','height','overflow']) {
      const v = cs.getPropertyValue(pr);
      if (v && !['none','normal','auto','rgba(0, 0, 0, 0)','0px','static','visible','row','stretch','flex-start','nowrap'].includes(v)) keep[pr] = v.slice(0, 110);
    }
    const sv = Object.entries(keep).map(([k, v]) => `${k.replace(/^[a-z]+-/,'')}:${v}`).join(' ');
    if (sv) l += ' {' + sv.slice(0, 300) + '}';
    const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).filter(Boolean).join(' ');
    if (own) l += ` "${own.slice(0, 130)}"`;
    if (el.tagName === 'IMG') l += ' SRC=' + (el.currentSrc || el.src).slice(-80);
    if (el.tagName === 'A') l += ' HREF=' + (el.getAttribute('href') || '').slice(0, 90);
    if (el.tagName === 'INPUT') l += ` INPUT[type=${el.type} value="${(el.value||'').slice(0,40)}" ph="${(el.placeholder||'').slice(0,40)}"]`;
    if (el.tagName === 'SELECT') l += ` SELECT[sel="${(el.selectedOptions[0]?.textContent||'').trim().slice(0,40)}" n=${el.options.length}]`;
    for (const at of ['data-short','data-tpl','aria-label','id']) { const v = el.getAttribute && el.getAttribute(at); if (v) l += ` ${at}=${v.slice(0,40)}`; }
    lines.push(l);
    if (d < 16) [...el.children].forEach((k) => em(k, d + 1));
  };
  const main = document.querySelector('main') || document.body;
  em(main, 0);
  return lines.join('\n');
});
fs.writeFileSync(`stardust/replica/press-hub-outline-${W}.txt`, out);
// verbatim content dump (preserve nbsp: JSON keeps raw chars)
const content = await p.evaluate(() => {
  const main = document.querySelector('main') || document.body;
  const heads = [...main.querySelectorAll('h1,h2,h3,h4')].map((h) => ({ t: h.tagName, hid: !h.offsetParent, x: h.textContent.trim(), html: h.innerHTML.trim().slice(0, 300) }));
  const paras = [...main.querySelectorAll('p')].filter((x) => x.textContent.trim().length > 5 && x.offsetParent).map((x) => x.innerHTML.trim().slice(0, 600));
  const links = [...main.querySelectorAll('a[href]')].filter((a) => a.offsetParent && a.textContent.trim()).map((a) => ({ t: a.textContent.trim().slice(0, 80), h: a.getAttribute('href').slice(0, 130) }));
  const selects = [...main.querySelectorAll('select')].map((s) => ({ name: s.name || s.id, opts: [...s.options].map((o) => o.textContent.trim()).slice(0, 30), sel: s.selectedIndex }));
  const inputs = [...main.querySelectorAll('input')].map((i) => ({ type: i.type, name: i.name || i.id, value: i.value, ph: i.placeholder, visible: !!i.offsetParent }));
  const buttons = [...main.querySelectorAll('button')].filter((x)=>x.offsetParent).map((x) => x.textContent.trim().slice(0, 60));
  const times = [...main.querySelectorAll('time, [data-short]')].map((t) => ({ html: t.outerHTML.slice(0, 300) }));
  const bgs = [...main.querySelectorAll('*')].map((e) => getComputedStyle(e).backgroundImage).filter((v) => v && v.includes('url(')).map((v) => v.slice(0, 250));
  const imgs = [...main.querySelectorAll('img')].map((i) => ({ src: (i.currentSrc || i.src).slice(0, 200), w: i.width, h: i.height, alt: i.alt, vis: !!i.offsetParent }));
  return { title: document.title, desc: (document.querySelector('meta[name="description"]')||{}).content, heads, paras, links: links.slice(0, 120), selects, inputs, buttons, times: times.slice(0, 40), bgs: [...new Set(bgs)], imgs };
});
fs.writeFileSync(`stardust/replica/press-hub-content-${W}.json`, JSON.stringify(content, null, 1));
console.log(`outline ${W}: ${out.split('\n').length} lines; heads ${content.heads.length}; paras ${content.paras.length}; selects ${content.selects.length}; bgs ${content.bgs.length}`);
await b.close();
