import { chromium } from 'playwright';
const b = await chromium.launch();
const ctx = await b.newContext({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36' });
const p = await ctx.newPage();
for (const u of ['https://www.rwe.com/en/investor-relations/contact-and-service/ir-newsletter/', 'https://www.rwe.com/en/investor-relations/contact-and-service/meeting-request/']) {
  await p.goto(u, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(4000);
  const r = await p.evaluate(() => {
    const f = document.querySelector('main form.dynamic-contact-form, main [data-tpl=form-v2] form');
    const re = new RegExp('["\\x27](/api/[^"\\x27\\s]+)["\\x27]', 'g');
    const hints = new Set();
    [...document.querySelectorAll('script:not([src])')].forEach((s) => [...s.textContent.matchAll(re)].forEach((m) => hints.add(m[1])));
    return {
      cls: f ? f.className : null,
      fields: f ? [...f.querySelectorAll('input, select, textarea')].map((i) => `${i.type || i.tagName}:${i.name}${i.required ? '*' : ''}`).slice(0, 15) : null,
      api: [...hints],
    };
  });
  console.log(u.split('/en/')[1], JSON.stringify(r, null, 1));
}
await b.close();
