// A6: hero/out-of-main structure + deep computed for form widgets (1 navigation)
import { chromium } from 'playwright';
import fs from 'node:fs';

const W = +(process.argv[2] || 1440);
const URL_ = 'https://www.rwe.com/en/rwe-careers-portal/job-offers/';
const b = await chromium.launch({ headless: false, channel: 'chrome' });
const p = await (await b.newContext({ viewport: { width: W, height: 900 }, locale: 'en-US' })).newPage();
await p.goto(URL_, { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForTimeout(3000);
await p.evaluate(() => { const h = [...document.querySelectorAll('button,a')].find((x) => /^\s*deny all\s*$/i.test(x.textContent || '')); if (h) h.click(); });
await p.waitForTimeout(1500);

const out = await p.evaluate(() => {
  const res = { htmlFontSize: getComputedStyle(document.documentElement).fontSize, bodyKids: [], hero: null, widgets: {}, breadcrumbHTML: null };
  res.bodyKids = [...document.body.children].map((e) => {
    const r = e.getBoundingClientRect();
    return `${e.tagName.toLowerCase()}.${(e.className || '').toString().split(/\s+/).slice(0, 3).join('.')} [${Math.round(r.top + scrollY)},${Math.round(r.height)}] tpl=${e.getAttribute('data-tpl') || ''}`;
  });
  // hero: everything between header nav and main
  const main = document.querySelector('main');
  const lines = [];
  const em = (el, d) => {
    if (!el || el.nodeType !== 1 || ['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'PATH', 'SOURCE'].includes(el.tagName)) return;
    const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
    if (cs.display === 'none' || cs.visibility === 'hidden') { lines.push(' '.repeat(d) + el.tagName.toLowerCase() + '.' + (el.className || '').toString().slice(0, 60) + ' HIDDEN'); return; }
    let l = ' '.repeat(d) + el.tagName.toLowerCase();
    const cls = (el.className || '').toString().trim(); if (cls) l += '.' + cls.split(/\s+/).slice(0, 5).join('.');
    const tpl = el.getAttribute('data-tpl'); if (tpl) l += `⟨${tpl}⟩`;
    l += ` [${Math.round(r.left)},${Math.round(r.top + scrollY)},${Math.round(r.width)},${Math.round(r.height)}]`;
    const keep = {};
    for (const pr of ['font-size', 'font-weight', 'line-height', 'font-family', 'color', 'background-color', 'background-image', 'padding', 'margin', 'text-align', 'border-radius', 'border', 'display', 'position', 'justify-content', 'align-items', 'flex-direction', 'max-width', 'width', 'height']) {
      const v = cs.getPropertyValue(pr);
      if (v && !['none', 'normal', 'auto', 'rgba(0, 0, 0, 0)', '0px', 'static', 'visible', 'row', 'stretch', 'flex-start'].includes(v)) keep[pr] = v.slice(0, 100);
    }
    l += ' {' + Object.entries(keep).map(([k, v]) => `${k}:${v}`).join(' ').slice(0, 320) + '}';
    const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).filter(Boolean).join(' ');
    if (own) l += ` "${own.slice(0, 160)}"`;
    lines.push(l);
    if (d < 12) [...el.children].forEach((k) => em(k, d + 1));
  };
  let node = document.body.firstElementChild;
  while (node) {
    if (node === main) break;
    if (node.tagName !== 'SCRIPT' && node.tagName !== 'STYLE') em(node, 0);
    node = node.nextElementSibling;
  }
  res.hero = lines.join('\n');
  // deep computed for widgets
  const dump = (sel, name) => {
    const el = document.querySelector(sel);
    if (!el) { res.widgets[name] = 'NOT FOUND'; return; }
    const ls = [];
    const walk = (e, d) => {
      if (!e || e.nodeType !== 1 || d > 8) return;
      const cs = getComputedStyle(e); const r = e.getBoundingClientRect();
      if (cs.display === 'none') { ls.push(' '.repeat(d) + e.tagName.toLowerCase() + '.' + (e.className || '').toString().slice(0, 50) + ' HIDDEN'); return; }
      let l = ' '.repeat(d) + e.tagName.toLowerCase() + (e.className ? '.' + e.className.toString().split(/\s+/).slice(0, 4).join('.') : '');
      l += ` [${Math.round(r.left)},${Math.round(r.top + scrollY)},${Math.round(r.width)},${Math.round(r.height)}]`;
      const keep = {};
      for (const pr of ['font-size', 'line-height', 'font-family', 'color', 'background-color', 'padding', 'margin', 'border', 'border-radius', 'display', 'align-items', 'justify-content', 'width', 'height', 'opacity']) {
        const v = cs.getPropertyValue(pr);
        if (v && !['normal', 'auto', 'rgba(0, 0, 0, 0)', '0px', 'none', '1'].includes(v)) keep[pr] = v.slice(0, 90);
      }
      l += ' {' + Object.entries(keep).map(([k, v]) => `${k}:${v}`).join(' ') + '}';
      const own = [...e.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).filter(Boolean).join(' ');
      if (own) l += ` "${own.slice(0, 60)}"`;
      if (e.tagName === 'INPUT') l += ` [ph=${e.placeholder}]`;
      ls.push(l);
      [...e.children].forEach((k) => walk(k, d + 1));
    };
    walk(el, 0);
    res.widgets[name] = ls.join('\n');
  };
  dump('[data-tpl="sde01"]', 'sortForm');
  dump('[data-tpl="n-jfc01"]', 'jfc');
  dump('.n-register-job-alert', 'jobAlert');
  dump('.jrc01__load-more-button', 'loadMore');
  dump('#breadcrumb-bottom, .breadcrumb, nav[aria-label*=read]', 'breadcrumb');
  const bc = document.querySelector('[data-tpl="breadcrumb"]') || document.getElementById('breadcrumb-bottom');
  res.breadcrumbHTML = bc ? bc.outerHTML.slice(0, 3000) : null;
  return res;
});
fs.writeFileSync(`stardust/replica/job-search-hero-${W}.json`, JSON.stringify(out, null, 1));
console.log('htmlFontSize', out.htmlFontSize);
console.log('BODY KIDS:\n' + out.bodyKids.join('\n'));
console.log('HERO:\n' + out.hero);
await b.close();
