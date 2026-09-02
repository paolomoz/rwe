import { chromium } from 'playwright';
const b = await chromium.launch();
const ctx = await b.newContext({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36' });
const p = await ctx.newPage();
await p.goto('https://www.rwe.com/en/investor-relations/contact-and-service/ir-newsletter/', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(5000);
const r = await p.evaluate(() => {
  const forms = [...document.querySelectorAll('form')].map((f) => ({
    cls: (f.className || '').slice(0, 50),
    id: f.id,
    action: f.getAttribute('action'),
    inMain: !!f.closest('main'),
    fields: [...f.querySelectorAll('input, select, textarea')].map((i) => `${i.type || i.tagName.toLowerCase()}:${i.name || i.id}`).slice(0, 12),
  }));
  const fv2 = document.querySelector('[data-tpl=form-v2]');
  return { forms, fv2: fv2 ? { id: fv2.id, config: (fv2.getAttribute('data-module-config') || '').slice(0, 200), inner: fv2.innerHTML.replace(/\s+/g, ' ').slice(0, 300) } : null };
});
console.log(JSON.stringify(r, null, 1));
await b.close();
