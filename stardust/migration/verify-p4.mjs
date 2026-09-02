import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
p.on('pageerror', (e) => errs.push(String(e).slice(0, 100)));

// 1. press hub: index-driven count + tiles
await p.goto('https://main--rwe--paolomoz.aem.live/en/press', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(7000);
const press = await p.evaluate(() => ({
  count: document.querySelector('.lc-count')?.textContent,
  tiles: document.querySelectorAll('.listing-tile').length,
  shown: document.querySelector('.lm-count')?.textContent,
  companySelect: !!document.querySelector('.lf-real-select'),
}));
console.log('press hub:', JSON.stringify(press));

// 2. brand hub: scoped list
await p.goto('https://main--rwe--paolomoz.aem.live/en/press/rwe-ag', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(7000);
const brand = await p.evaluate(() => ({
  count: document.querySelector('.lc-count')?.textContent,
  tags: [...document.querySelectorAll('.lt-tag-label')].slice(0, 3).map((t) => t.textContent),
}));
console.log('rwe-ag hub:', JSON.stringify(brand));

// 3. contact form renders
await p.goto('https://main--rwe--paolomoz.aem.live/en/contact-services/contact-form?c=test', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(6000);
const form = await p.evaluate(() => ({
  fields: document.querySelectorAll('.form .form-field input, .form .form-field textarea').length,
  radios: document.querySelectorAll('.form input[type=radio]').length,
  submit: document.querySelector('.form button[type=submit]')?.textContent,
  turnstile: !!document.querySelector('.cf-turnstile'),
}));
console.log('contact form:', JSON.stringify(form));

// 4. fxb link-out on IR newsletter
await p.goto('https://main--rwe--paolomoz.aem.live/en/investor-relations/contact-and-service/ir-newsletter', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(6000);
const ext = await p.evaluate(() => ({
  notice: document.querySelector('.form-external p')?.textContent.slice(0, 50),
  btn: document.querySelector('.form-external a.button')?.href,
}));
console.log('fxb link-out:', JSON.stringify(ext));

// 5. jobs page: API fails on pilot origin -> frozen fallback
await p.goto('https://main--rwe--paolomoz.aem.live/en/rwe-careers-portal/job-offers', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(8000);
const jobs = await p.evaluate(() => ({
  cards: document.querySelectorAll("article[data-tpl='n-jrt01']").length,
  count: document.querySelector('main .section.jobs-count h2')?.textContent,
}));
console.log('jobs:', JSON.stringify(jobs));

// 6. consent CMP loads (delayed phase)
await p.goto('https://main--rwe--paolomoz.aem.live/', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(9000);
const consent = await p.evaluate(() => ({
  cmpScript: !!document.querySelector('#usercentrics-cmp'),
  ucui: typeof window.UC_UI !== 'undefined',
  gtmLoaded: !!document.querySelector('script[src*=googletagmanager]'),
}));
console.log('consent:', JSON.stringify(consent));
console.log('pageErrors:', JSON.stringify(errs.slice(0, 5)));
await b.close();
