import { chromium } from 'playwright';
const probe = async (url, isPub) => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 360, height: 800 }, userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36' });
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(8000);
  const r = await p.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const box = (el) => { if (!el) return null; const r2 = el.getBoundingClientRect(); return { top: Math.round(r2.top + window.scrollY), h: Math.round(r2.height) }; };
    const hero = q('.hero.block') || q('.stage-slider') || q('[class*=stage]');
    const img = hero ? hero.querySelector('img') : null;
    const boxEl = hero ? (hero.querySelector('.stage-box') || hero.querySelector('header')) : null;
    return { hero: box(hero), img: box(img), captionBox: box(boxEl) };
  });
  await b.close();
  return r;
};
const [live, pub] = await Promise.all([
  probe('https://www.rwe.com/en/responsibility-and-sustainability/environmental-protection/climate/', false),
  probe('https://main--rwe--paolomoz.aem.live/en/responsibility-and-sustainability/environmental-protection/climate', true),
]);
console.log('LIVE', JSON.stringify(live));
console.log('PUB ', JSON.stringify(pub));
