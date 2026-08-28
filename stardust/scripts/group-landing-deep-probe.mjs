// A3 deep probe: stage box internals + pseudo-elements, per width
import { chromium } from 'playwright';
import fs from 'node:fs';

const W = +(process.argv[2] || 1440);
const URL_ = 'https://www.rwe.com/en/the-group/';
const b = await chromium.launch({ headless: false, channel: 'chrome' });
const p = await (await b.newContext({ viewport: { width: W, height: 900 }, locale: 'en-US' })).newPage();
await p.goto(URL_, { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForTimeout(2500);
await p.evaluate(() => { const h=[...document.querySelectorAll('button,a')].find(x=>/^\s*deny all\s*$/i.test(x.textContent||'')); if(h)h.click(); });
await p.waitForTimeout(1200);
const out = await p.evaluate(() => {
  const lines = [];
  const dump = (el, d) => {
    if (!el || el.nodeType !== 1 || ['SCRIPT','STYLE','NOSCRIPT'].includes(el.tagName)) return;
    const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
    let l = ' '.repeat(d) + el.tagName.toLowerCase() + (el.className ? '.' + el.className.toString().trim().split(/\s+/).slice(0,4).join('.') : '');
    l += ` [${Math.round(r.left)},${Math.round(r.top + scrollY)},${Math.round(r.width)},${Math.round(r.height)}]`;
    const keep = {};
    for (const pr of ['font-size','font-weight','line-height','font-family','color','background-color','background-image','background-size','background-position','padding','margin','text-align','border-radius','border','display','position','justify-content','align-items','flex-direction','max-width','width','height','top','left','right','bottom','opacity','box-shadow','backdrop-filter']) {
      const v = cs.getPropertyValue(pr);
      if (v && !['none','normal','auto','rgba(0, 0, 0, 0)','0px','static','visible','row','stretch','flex-start','nowrap'].includes(v)) keep[pr] = v.slice(0, 140);
    }
    l += ' {' + Object.entries(keep).map(([k, v]) => `${k}:${v}`).join(' ').slice(0, 460) + '}';
    const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim();
    if (own) l += ` "${own.slice(0, 90)}"`;
    for (const ps of ['::before','::after']) {
      const pcs = getComputedStyle(el, ps);
      if (pcs.content && pcs.content !== 'none' && pcs.content !== 'normal') {
        l += ` ${ps}{content:${pcs.content} ff:${pcs.fontFamily.slice(0,20)} fs:${pcs.fontSize} col:${pcs.color} disp:${pcs.display} mr:${pcs.marginRight} ml:${pcs.marginLeft} pos:${pcs.position} tr:${pcs.transform.slice(0,40)} w:${pcs.width} h:${pcs.height}}`;
      }
    }
    lines.push(l);
    [...el.children].forEach((k) => dump(k, d + 1));
  };
  const sels = ['#slick-slide00', '.slider-container > button.slider-prev', '.slider-container > button.slider-next', 'ul.slick-dots', '#breadcrumb-top', '.content-extended-arrow', '.quo01--quotations', '[data-tpl="tea02r"] .tea02r--affordance', '.cta01--center', 'a.color-cta--gradient-green.btn'];
  for (const s of sels) {
    const el = document.querySelector(s);
    lines.push('===== ' + s + ' =====');
    if (el) dump(el, 0); else lines.push('NOT FOUND');
  }
  return lines.join('\n');
});
fs.writeFileSync(`stardust/replica/group-landing-deep-${W}.txt`, out);
console.log(`deep ${W}: ${out.split('\n').length} lines`);
await b.close();
