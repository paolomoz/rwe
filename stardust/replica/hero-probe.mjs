import { chromium } from 'playwright';
const probe = async (url, isProto) => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 360, height: 800 } });
  await p.goto(url, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(isProto ? 1500 : 7000);
  const r = await p.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const box = (el) => { if (!el) return null; const r2 = el.getBoundingClientRect(); const cs = getComputedStyle(el); return `h${Math.round(r2.height)} pt${cs.paddingTop} pb${cs.paddingBottom} mt${cs.marginTop} mb${cs.marginBottom} pos:${cs.position} disp:${cs.display}`; };
    return {
      hero: box(q('.hero.block') || q('.stage-slider')),
      stage: box(q('.hero .stage') || q('.stage')),
      stageImg: box(q('.hero .stage-image') || q('.stage-image')),
      teaser: box(q('.hero .teaser-width') || q('.teaser-width')),
      stageBox: box(q('.hero .stage-box') || q('.stage-box')),
      h2: box(q('.hero .stage-box .headline') || q('.stage-box .headline')),
      sub: box(q('.hero .subheadline') || q('.stage-box .subheadline')),
      btns: box(q('.hero .buttons-container') || q('.stage-box .buttons-container')),
      dots: box(q('.hero .slick-dots') || q('.slick-dots')),
    };
  });
  await b.close();
  return r;
};
const [pub, proto] = await Promise.all([
  probe('https://main--rwe--paolomoz.aem.live/en/the-group', false),
  probe('http://localhost:8797/group-landing-proposed.html', true),
]);
for (const k of Object.keys(pub)) console.log(k.padEnd(9), '\n  pub  ', pub[k], '\n  proto', proto[k]);
