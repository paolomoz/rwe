import { chromium } from 'playwright';
const b = await chromium.launch();
const ctx = await b.newContext({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36' });
const p = await ctx.newPage();
await p.goto('https://www.rwe.com/en/contact-services/contact-form/?c=8ce5ec31b0c644e2be4479736254db33', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(5000);
const r = await p.evaluate(() => {
  const f = document.querySelector('main form');
  const wrap = f.closest('[data-tpl=form-v2]');
  const attrs = (el) => Object.fromEntries([...el.attributes].map((a) => [a.name, a.value.slice(0, 140)]));
  const re = new RegExp('["\\x27](/api/[^"\\x27\\s]+)["\\x27]', 'g');
  const hints = new Set();
  [...document.querySelectorAll('script:not([src])')].forEach((s) => {
    [...s.textContent.matchAll(re)].forEach((m) => hints.add(m[1]));
  });
  return {
    formAttrs: attrs(f),
    wrapAttrs: wrap ? attrs(wrap) : null,
    apiHints: [...hints],
    turnstileKey: document.querySelector('[data-sitekey]')?.getAttribute('data-sitekey'),
  };
});
console.log(JSON.stringify(r, null, 1));
await b.close();
