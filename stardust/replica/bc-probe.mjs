import { chromium } from 'playwright';
const probe = async (url, sel) => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 360, height: 800 } });
  await p.goto(url, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(7000);
  const r = await p.evaluate((s) => {
    const nav = document.querySelector(s);
    if (!nav) return null;
    const lis = [...nav.querySelectorAll('li')];
    const cs = getComputedStyle(nav);
    const rect = nav.getBoundingClientRect();
    return {
      navH: Math.round(rect.height),
      pt: cs.paddingTop, pb: cs.paddingBottom,
      lis: lis.map((li) => {
        const c = getComputedStyle(li);
        const a = li.querySelector('a') || li;
        const ca = getComputedStyle(a);
        return `fs${ca.fontSize}/${ca.lineHeight} ff:${ca.fontFamily.split(',')[0]} mr${c.marginRight} ml${c.marginLeft}`;
      }),
      olPad: (() => { const ol = nav.querySelector('ol, div'); const c = getComputedStyle(ol); return `${c.paddingTop} ${c.paddingRight} ${c.paddingBottom} ${c.paddingLeft}`; })(),
    };
  }, sel);
  await b.close();
  return r;
};
const [live, pub] = await Promise.all([
  probe('https://www.rwe.com/en/rwe-careers-portal/job-offers/', 'nav[aria-label*=read], nav[id*=breadcrumb], .breadcrumb-bottom, #breadcrumb-bottom, [class*=breadcrumb]'),
  probe('https://main--rwe--paolomoz.aem.live/en/rwe-careers-portal/job-offers', '.breadcrumb.block'),
]);
console.log('LIVE', JSON.stringify(live, null, 1));
console.log('PUB ', JSON.stringify(pub, null, 1));
