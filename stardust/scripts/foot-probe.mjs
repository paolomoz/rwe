import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto(process.argv[2], { waitUntil: 'networkidle' });
const out = await p.evaluate(() => {
  const r = [];
  const f = document.querySelector('footer');
  const walk = (el, d) => {
    const b = el.getBoundingClientRect();
    if (b.height > 0 || el.children.length) r.push(`${' '.repeat(d)}${el.tagName.toLowerCase()}.${(el.className||'').toString().split(/\s+/).slice(0,2).join('.')} y${Math.round(b.top+scrollY)} h${Math.round(b.height)}`);
    if (d < 3) [...el.children].forEach((k) => walk(k, d+1));
  };
  walk(f, 0);
  return r.join('\n');
});
console.log(out);
await b.close();
