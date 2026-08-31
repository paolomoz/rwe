import { chromium } from 'playwright';
const probe = async (url, sel, isProto) => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 360, height: 800 } });
  await p.goto(url, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(isProto ? 1500 : 6000);
  const r = await p.evaluate((s) => {
    const sec = document.querySelector(s);
    if (!sec) return null;
    const cs = getComputedStyle(sec);
    const rect = sec.getBoundingClientRect();
    const ps = [...sec.querySelectorAll('p')].map((el) => {
      const c = getComputedStyle(el); const rr = el.getBoundingClientRect();
      return `w${Math.round(rr.width)} h${Math.round(rr.height)} fs${c.fontSize}/${c.lineHeight} mb${c.marginBottom}`;
    });
    return { top: Math.round(rect.top + window.scrollY), h: Math.round(rect.height), pt: cs.paddingTop, pb: cs.paddingBottom, bt: cs.borderTopWidth, bb: cs.borderBottomWidth, ps };
  }, sel);
  await b.close();
  return r;
};
const [pub, proto] = await Promise.all([
  probe('https://main--rwe--paolomoz.aem.live/en/the-group/countries-and-locations', 'main .section.small-print', false),
  probe('http://localhost:8797/locations-map-proposed.html', '.lm-disclaimer', true),
]);
console.log('pub  ', JSON.stringify(pub, null, 1));
console.log('proto', JSON.stringify(proto, null, 1));
