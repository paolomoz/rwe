import { chromium } from 'playwright';
const b = await chromium.launch({ headless: false, channel: 'chrome' });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, locale: 'en-US' })).newPage();
await p.goto('https://www.rwe.com/en/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForTimeout(3000);
await p.evaluate(() => { const h=[...document.querySelectorAll('button,a')].find(x=>/^\s*accept all\s*$/i.test(x.textContent||'')); if(h)h.click(); });
await p.waitForTimeout(800);
const total = await p.evaluate(() => document.body.scrollHeight);
for (let y = 0; y < total + 900; y += 540) { await p.evaluate(v => window.scrollTo(0, v), y); await p.waitForTimeout(120); }
await p.waitForTimeout(800);
const out = await p.evaluate(() => {
  const r = [];
  const f = document.querySelector('footer');
  const walk = (el, d) => {
    const b = el.getBoundingClientRect(); const cs = getComputedStyle(el);
    r.push(`${' '.repeat(d)}${el.tagName.toLowerCase()}.${(el.className||'').toString().split(/\s+/).slice(0,3).join('.')} y${Math.round(b.top+scrollY)} h${Math.round(b.height)} bg:${cs.backgroundColor}|${cs.backgroundImage.slice(0,40)} ${cs.display}${cs.position!=='static'?' '+cs.position:''}${(el.textContent||'').trim().slice(0,20)?' "'+(el.textContent||'').trim().slice(0,20)+'"':''}`);
    if (d < 2) [...el.children].forEach((k) => walk(k, d+1));
  };
  // also the element BEFORE footer
  let prev = f.previousElementSibling;
  if (prev) r.push(`PREV: ${prev.tagName}.${(prev.className||'').toString().slice(0,60)} y${Math.round(prev.getBoundingClientRect().top+scrollY)} h${Math.round(prev.getBoundingClientRect().height)}`);
  walk(f, 0);
  return r.join('\n');
});
console.log(out);
await b.close();
