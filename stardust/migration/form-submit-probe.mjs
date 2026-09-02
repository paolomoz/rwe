import { chromium } from 'playwright';
const b = await chromium.launch();
const ctx = await b.newContext({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36' });
const p = await ctx.newPage();
let captured = null;
await p.route('**/api/dcf**', (route) => {
  const req = route.request();
  captured = { url: req.url(), method: req.method(), headers: req.headers()['content-type'], body: (req.postData() || '').slice(0, 800) };
  route.abort(); // never reaches RWE
});
await p.goto('https://www.rwe.com/en/contact-services/contact-form/?c=8ce5ec31b0c644e2be4479736254db33', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(6000);
await p.evaluate(() => {
  const f = document.querySelector('main form');
  const set = (n, v) => { const el = f.querySelector(`[name="${n}"]`); if (el) { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); } };
  set('request', 'TEST do not send');
  set('text', 'TEST message do not send');
  set('firstname', 'Test');
  set('lastname', 'Probe');
  set('email', 'test@example.com');
});
await p.waitForTimeout(3000); // let turnstile settle
await p.evaluate(() => {
  const f = document.querySelector('main form');
  const btn = f.querySelector('button[type=submit], input[type=submit], button');
  if (btn) btn.click(); else f.requestSubmit();
});
await p.waitForTimeout(5000);
console.log(captured ? JSON.stringify(captured, null, 1) : 'no request captured (client-side validation blocked?)');
const errs = await p.evaluate(() => [...document.querySelectorAll('.error, [class*=error], [class*=invalid]')].map((e) => e.textContent.trim().slice(0, 60)).filter(Boolean).slice(0, 5));
console.log('validation msgs:', JSON.stringify(errs));
await b.close();
