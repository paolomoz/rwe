import { chromium } from 'playwright';
const probe = async (url, isProto) => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 360, height: 800 } });
  await p.goto(url, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(isProto ? 1500 : 6000);
  const r = await p.evaluate(() => {
    const byText = (sel, txt) => [...document.querySelectorAll(sel)].find((e) => e.textContent.includes(txt));
    const w = (el) => (el ? Math.round(el.getBoundingClientRect().width) : null);
    const box = (el) => { if (!el) return null; const r2 = el.getBoundingClientRect(); const cs = getComputedStyle(el); return `w${Math.round(r2.width)} h${Math.round(r2.height)} mt${cs.marginTop} mb${cs.marginBottom} pt${cs.paddingTop} pb${cs.paddingBottom}`; };
    const vt = document.querySelector('.banner.locations') || document.querySelector('.lm-video-teaser');
    const vtHead = vt ? (vt.querySelector('header') || vt.querySelector(':scope > div > div:last-child, .banner-caption, [class*=caption]')) : null;
    const conH2 = byText('h2', 'Contact and service');
    const conSec = conH2 ? conH2.closest('.section, section') : null;
    return {
      leadP: w(byText('p', 'With our presence')) ?? w(byText('p', 'active around the globe') ? null : null),
      leadPactual: box(byText('p', 'RWE has a footprint') || byText('p', 'With our') || document.querySelector('.lm-lead') || document.querySelector('main .section:nth-of-type(2) p')),
      moreP: box(byText('p', 'Are you interested') || byText('p', 'interested in')),
      mapP: box(byText('p', 'The RWE Group') || byText('p', 'map below')),
      vtBox: box(vt),
      vtHead: box(vtHead),
      vtH3: box(byText('h3', 'video format')),
      vtP: box(byText('p', 'video series')),
      conSec: box(conSec),
      conH2: box(conH2),
      conImg: box(conSec ? conSec.querySelector('img') : null),
      conP: box(byText('p', 'right contact partner')),
      conCta: box(byText('a', 'e-mail') || byText('a', 'contact')),
    };
  });
  await b.close();
  return r;
};
const [pub, proto] = await Promise.all([
  probe('https://main--rwe--paolomoz.aem.live/en/the-group/countries-and-locations', false),
  probe('http://localhost:8797/locations-map-proposed.html', true),
]);
for (const k of Object.keys(pub)) console.log(k.padEnd(10), '\n  pub  ', pub[k], '\n  proto', proto[k]);
