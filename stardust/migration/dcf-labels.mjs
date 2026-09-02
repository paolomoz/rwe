import { chromium } from 'playwright';
const b = await chromium.launch();
const ctx = await b.newContext({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36' });
const p = await ctx.newPage();
await p.goto('https://www.rwe.com/en/contact-services/contact-form/?c=8ce5ec31b0c644e2be4479736254db33', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(5000);
const r = await p.evaluate(() => {
  const f = document.querySelector('main form');
  const labels = [...f.querySelectorAll('label, legend')].map((l) => `${l.tagName}[for=${l.getAttribute('for') || ''}]: ${l.textContent.trim().slice(0, 70)}`);
  const radios = [...f.querySelectorAll('input[type=radio]')].map((rr) => `${rr.name}=${rr.value}`);
  const h1 = document.querySelector('main h1, h1');
  const intro = [...document.querySelectorAll('main p')].slice(0, 3).map((pp) => pp.textContent.trim().slice(0, 80));
  const privacy = [...f.querySelectorAll('p, .privacy, [class*=privacy], [class*=hint]')].map((pp) => pp.textContent.trim().slice(0, 120)).filter(Boolean).slice(0, 4);
  const submit = f.querySelector('button[type=submit], button.btn, input[type=submit]');
  return { h1: h1 ? h1.textContent.trim() : null, intro, labels, radios, privacy, submit: submit ? submit.textContent.trim() : null };
});
console.log(JSON.stringify(r, null, 1));
await b.close();
