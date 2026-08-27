import fs from 'node:fs';
import { chromium } from 'playwright';
const b = await chromium.launch({ headless: false, channel: 'chrome' });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, locale: 'en-US' })).newPage();
await p.goto('https://www.rwe.com/en/press/rwe-ag/2026-08-13-rwe-delivers-strong-first-half-results/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForTimeout(2500);
await p.evaluate(() => { const h=[...document.querySelectorAll('button,a')].find(x=>/^\s*accept all\s*$/i.test(x.textContent||'')); if(h)h.click(); });
await p.waitForTimeout(600);
const out = await p.evaluate(() => {
  const lines = [];
  const em = (el, d) => {
    if (!el || el.nodeType !== 1 || ['SCRIPT','STYLE','NOSCRIPT'].includes(el.tagName)) return;
    const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
    if (cs.display === 'none') { lines.push(' '.repeat(d) + el.tagName.toLowerCase() + ' HIDDEN'); return; }
    let l = ' '.repeat(d) + el.tagName.toLowerCase() + (el.className && el.className.toString ? '.' + el.className.toString().split(/\s+/).slice(0,3).join('.') : '');
    l += ` [${Math.round(r.left)},${Math.round(r.top + scrollY)},${Math.round(r.width)},${Math.round(r.height)}]`;
    const kp = {};
    ['font-size','line-height','font-family','color','background-color','background-image','padding','margin','text-align'].forEach((pr) => {
      const v = cs.getPropertyValue(pr);
      if (v && !['none','normal','auto','rgba(0, 0, 0, 0)','0px'].includes(v)) kp[pr] = v.slice(0, 70);
    });
    l += ' {' + Object.entries(kp).map(([k,v])=>k.split('-').pop()+':'+v).join(' ').slice(0,200) + '}';
    const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).filter(Boolean).join(' ');
    if (own) l += ` "${own.slice(0, 80)}"`;
    if (el.tagName === 'IMG') l += ' SRC=' + (el.currentSrc || el.src).slice(-50);
    if (el.tagName === 'A') l += ' HREF=' + (el.getAttribute('href') || '').slice(0, 50);
    lines.push(l);
    if (d < 10) [...el.children].forEach((k) => em(k, d + 1));
  };
  // everything between body start and main
  const main = document.querySelector('main');
  let el = document.body.firstElementChild;
  while (el && el !== main) {
    if (!['HEADER','SCRIPT','STYLE'].includes(el.tagName) || el.tagName === 'HEADER') em(el, 0);
    el = el.nextElementSibling;
  }
  return lines.join('\n');
});
fs.writeFileSync('stardust/replica/article-stage-1440.txt', out);
console.log(out.split('\n').filter(l => !/HIDDEN/.test(l)).slice(0, 60).join('\n'));
await b.close();
