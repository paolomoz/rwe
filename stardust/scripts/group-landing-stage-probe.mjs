// A3 group-landing: probe everything OUTSIDE <main> (stage carousel, breadcrumbs, header)
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
  const em = (el, d) => {
    if (!el || el.nodeType !== 1 || ['SCRIPT','STYLE','NOSCRIPT','SVG','PATH','SOURCE','MAIN','FOOTER'].includes(el.tagName)) { if (el && (el.tagName==='MAIN'||el.tagName==='FOOTER')) lines.push(' '.repeat(d)+el.tagName); return; }
    const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
    const hidden = cs.display === 'none' || cs.visibility === 'hidden';
    let l = ' '.repeat(d) + el.tagName.toLowerCase();
    const cls = (el.className && el.className.toString ? el.className.toString() : '').trim();
    if (cls) l += '.' + cls.split(/\s+/).slice(0, 5).join('.');
    const tpl = el.getAttribute && el.getAttribute('data-tpl'); if (tpl) l += `[tpl=${tpl}]`;
    if (el.id) l += `#${el.id}`;
    l += ` [${Math.round(r.left)},${Math.round(r.top + scrollY)},${Math.round(r.width)},${Math.round(r.height)}]`;
    if (hidden) { lines.push(l + ' HIDDEN'); if (d<8) [...el.children].forEach((k) => em(k, d + 1)); return; }
    const keep = {};
    for (const pr of ['font-size','font-weight','line-height','font-family','color','background-color','background-image','background-size','background-position','padding','margin','text-align','border-radius','border','display','object-fit','position','justify-content','align-items','flex-direction','max-width','width','height','overflow','opacity','transform','z-index','top','left','right','bottom']) {
      const v = cs.getPropertyValue(pr);
      if (v && !['none','normal','auto','rgba(0, 0, 0, 0)','0px','static','visible','row','stretch','flex-start','nowrap','1','auto auto','0% 0%','matrix(1, 0, 0, 1, 0, 0)'].includes(v)) keep[pr] = v.slice(0, 130);
    }
    const sv = Object.entries(keep).map(([k, v]) => `${k}:${v}`).join(' ');
    if (sv) l += ' {' + sv.slice(0, 420) + '}';
    const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).filter(Boolean).join(' ');
    if (own) l += ` "${own.slice(0, 140)}"`;
    if (el.tagName === 'IMG') l += ' SRC=' + (el.currentSrc || el.src).slice(-100);
    if (el.tagName === 'A') l += ' HREF=' + (el.getAttribute('href') || '').slice(0, 80);
    lines.push(l);
    if (d < 14) [...el.children].forEach((k) => em(k, d + 1));
  };
  [...document.body.children].forEach((k) => em(k, 0));
  return lines.join('\n');
});
fs.writeFileSync(`stardust/replica/group-landing-stage-${W}.txt`, out);
// HTML of non-main top-level nodes that contain the stage/breadcrumb
const html = await p.evaluate(() => {
  const keep = [];
  for (const el of document.body.children) {
    if (['SCRIPT','STYLE','NOSCRIPT','MAIN','FOOTER'].includes(el.tagName)) continue;
    keep.push(el.outerHTML);
  }
  return keep.join('\n\n<!-- ===== next body child ===== -->\n\n');
});
fs.writeFileSync(`stardust/replica/group-landing-stage-${W}.html`, html);
console.log(`stage outline ${W}: ${out.split('\n').length} lines; html ${html.length} bytes`);
await b.close();
