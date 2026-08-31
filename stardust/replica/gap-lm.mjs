import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 360, height: 800 } });
await p.goto('https://main--rwe--paolomoz.aem.live/en/the-group/countries-and-locations', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(6000);
const r = await p.evaluate(() => {
  const out = [];
  const walk = (el, label) => {
    const r2 = el.getBoundingClientRect(); const cs = getComputedStyle(el);
    out.push(`${label}: top ${Math.round(r2.top + window.scrollY)} btm ${Math.round(r2.bottom + window.scrollY)} mt${cs.marginTop} mb${cs.marginBottom} pt${cs.paddingTop} pb${cs.paddingBottom}`);
  };
  const sp = document.querySelector('main .section.small-print');
  walk(sp, 'small-print sec');
  walk(sp.querySelector('.default-content-wrapper'), '  dcw');
  const bs = document.querySelector('.banner.locations').closest('.section');
  walk(bs, 'banner sec');
  walk(bs.querySelector('.banner-wrapper'), '  banner-wrapper');
  walk(document.querySelector('.banner.locations'), '  banner block');
  // also contact→end tail
  const cs2 = [...document.querySelectorAll('main .section')];
  cs2.slice(-3).forEach((s, i) => walk(s, `tail sec ${i} (${s.className.split(' ').filter((c) => c !== 'section').join(',')})`));
  walk(document.querySelector('footer'), 'footer');
  return out;
});
console.log(r.join('\n'));
await b.close();
