import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('https://main--rwe--paolomoz.aem.live/', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(8000);
const step = async (y) => {
  await p.evaluate((yy) => window.scrollTo(0, yy), y);
  await p.waitForTimeout(250);
  return p.evaluate(() => {
    const h = document.querySelector('body > header .header');
    return `y${window.pageYOffset}: ${h.className.replace('header block', '').trim() || '(full)'} | visible:${getComputedStyle(h).transform === 'none' && getComputedStyle(h).position === 'fixed' ? 'BAR' : (window.pageYOffset <= 1 ? 'full-header' : 'hidden')}`;
  });
};
console.log(await step(500));
console.log(await step(1200));
console.log(await step(2400));
console.log(await step(2200));
console.log(await step(2600));
console.log(await step(0));
await b.close();
