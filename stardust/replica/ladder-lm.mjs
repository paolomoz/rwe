import { chromium } from 'playwright';
const marks = [
  ['heroBtm', ['.hero.block', '.lm-stage'], 'bottom'],
  ['introH2', ['main h2', '.lm-intro h2'], 'top'],
  ['btnFirst', ['.cta-grid .button, .cta-grid a.button', '.lm-btnrow .btn'], 'top'],
  ['btnLast', null, 'lastBtn'],
  ['moreP', null, 'moreP'],
  ['mapH2', null, 'mapH2'],
  ['filterHead', ['.locations-map .lm-filter-head, .lm-filter-head', '.lm-filter-head'], 'top'],
  ['listTop', ['.lm-listview', '.lm-listview'], 'top'],
  ['disclaimer', null, 'disc'],
  ['videoH3', ['.banner h3, .lm-video-teaser h3', '.lm-video-teaser h3'], 'top'],
  ['videoImgH', ['.banner img, .banner picture img', '.lm-video-teaser .media img, .lm-video-teaser .media'], 'height'],
  ['contactH2', null, 'contact'],
  ['docH', null, 'docH'],
];
const probe = async (url, isProto) => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 360, height: 800 } });
  await p.goto(url, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(isProto ? 1500 : 6000);
  const r = await p.evaluate(() => {
    const y = (el, mode) => { if (!el) return null; const b2 = el.getBoundingClientRect(); const s = window.scrollY; return Math.round(mode === 'bottom' ? b2.bottom + s : mode === 'height' ? b2.height : b2.top + s); };
    const q = (sel) => document.querySelector(sel);
    const byText = (sel, txt) => [...document.querySelectorAll(sel)].find((e) => e.textContent.includes(txt));
    const btns = [...document.querySelectorAll('.cta-grid a.button, .lm-btnrow .btn')];
    return {
      heroBtm: y(q('.hero.block') || q('.lm-stage'), 'bottom'),
      introH2: y(byText('h2', 'active around the globe'), 'top'),
      btnFirst: y(btns[0], 'top'),
      btnLast: y(btns[btns.length - 1], 'bottom'),
      btnW: btns[0] ? Math.round(btns[0].getBoundingClientRect().width) : null,
      btnH: btns[0] ? Math.round(btns[0].getBoundingClientRect().height) : null,
      moreP: y(byText('p', 'Are you interested in RWE'), 'top'),
      mapH2: y(byText('h2', 'map'), 'top'),
      filterHead: y(q('.lm-filter-head'), 'top'),
      listTop: y(q('.lm-listview'), 'top'),
      disc: y(byText('p', 'does not claim to be complete') || byText('p', 'Please note'), 'top'),
      videoH3: y(byText('h3', 'video format'), 'top'),
      videoImgH: y(q('.banner picture img') || q('.lm-video-teaser .media img') || q('.lm-video-teaser .media'), 'height'),
      videoImgW: (() => { const e = q('.banner picture img') || q('.lm-video-teaser .media img') || q('.lm-video-teaser .media'); return e ? Math.round(e.getBoundingClientRect().width) : null; })(),
      contact: y(byText('h2', 'Contact and service'), 'top'),
      docH: document.documentElement.scrollHeight,
    };
  });
  await b.close();
  return r;
};
const [pub, proto] = await Promise.all([
  probe('https://main--rwe--paolomoz.aem.live/en/the-group/countries-and-locations', false),
  probe('http://localhost:8797/locations-map-proposed.html', true),
]);
let prev = 0;
for (const k of Object.keys(pub)) {
  if (pub[k] == null || proto[k] == null) { console.log(k.padEnd(12), 'pub', pub[k], 'proto', proto[k]); continue; }
  const d = pub[k] - proto[k];
  const seg = d - prev;
  if (['btnW', 'btnH', 'videoImgH', 'videoImgW'].includes(k)) { console.log(k.padEnd(12), `pub ${pub[k]} proto ${proto[k]} Δ${d}`); continue; }
  console.log(k.padEnd(12), `pub ${String(pub[k]).padStart(5)} proto ${String(proto[k]).padStart(5)} Δ${String(d).padStart(4)} seg ${seg}`);
  prev = d;
}
