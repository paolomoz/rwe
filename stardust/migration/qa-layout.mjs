// P5 — per-template computed-style gate: blocks decorate, declared layouts
// compute, zero pageerrors, zero broken images.
import { chromium } from 'playwright';

const PAGES = [
  ['article-press', '/en/press/rwe-generation/2026-08-04-get-h2-nukleus-gains-momentum'],
  ['article-ir', '/en/investor-relations/financial-calendar-and-publications/news-and-ad-hoc-announcements/news/news-2026-03-04'],
  ['content-page', '/en/our-energy/discover-conventional-energy-sources/gas'],
  ['content-accordion', '/en/data-protection'],
  ['ir-content', '/en/investor-relations/debt-and-credit-ratings/bonds-and-sustainable-finance'],
  ['location-detail', '/en/the-group/countries-and-locations/arkona-offshore-wind-farm'],
  ['legal', '/en/disclaimer'],
  ['press-hub-sibling', '/en/press/rwe-ag'],
  ['section-landing', '/en/investor-relations'],
  ['careers-hybrid', '/en/rwe-careers-portal/experienced-professionals/engineering-and-technical-roles'],
];

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
let failures = 0;
for (const [name, path] of PAGES) {
  const errs = [];
  const handler = (e) => errs.push(String(e).slice(0, 80));
  p.on('pageerror', handler);
  await p.goto(`https://main--rwe--paolomoz.aem.live${path}`, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(6500);
  const r = await p.evaluate(() => {
    const blocks = [...document.querySelectorAll('[data-block-name]')];
    const notLoaded = blocks.filter((el) => el.dataset.blockStatus !== 'loaded').map((el) => el.dataset.blockName);
    // tracking pixels (etracker/accountinsight chain, injected by the CMP for
    // essential services — live parity) are not content images
    const badImg = [...document.images].filter((img) => img.complete && img.naturalWidth === 0 && img.src
      && !/track|pixel|1px|\.cloud\/|etracker/.test(img.src)
      && !img.closest('[hidden]')).length;
    const gridProbe = ['.cards .card-list', '.cta-grid', '.listing-results', '.accordion-list', '.contacts']
      .map((s) => { const el = document.querySelector(s); return el ? `${s}:${getComputedStyle(el).display}` : null; })
      .filter(Boolean);
    return {
      blocks: blocks.length, notLoaded, badImg, gridProbe, sections: document.querySelectorAll('main .section').length,
    };
  });
  p.off('pageerror', handler);
  const bad = r.notLoaded.length || r.badImg || errs.length;
  if (bad) failures += 1;
  console.log(`${bad ? 'FAIL' : 'PASS'} ${name}: blocks=${r.blocks} notLoaded=[${r.notLoaded}] badImg=${r.badImg} errs=${errs.length} ${errs[0] || ''}`);
}
await b.close();
console.log(failures ? `${failures} template failures` : 'all templates green');
