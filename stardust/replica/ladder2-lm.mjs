import { chromium } from 'playwright';
const probe = async (url, isProto) => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 360, height: 800 } });
  await p.goto(url, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(isProto ? 1500 : 6000);
  const r = await p.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const yt = (el) => { if (!el) return null; const r2 = el.getBoundingClientRect(); return Math.round(r2.top + window.scrollY); };
    const yb = (el) => { if (!el) return null; const r2 = el.getBoundingClientRect(); return Math.round(r2.bottom + window.scrollY); };
    const byText = (sel, txt) => [...document.querySelectorAll(sel)].find((e) => e.textContent.includes(txt));
    const list = q('.lm-listview');
    const banner = q('.banner.locations') || q('.lm-video-teaser');
    return {
      listTop: yt(list),
      listBtm: yb(list),
      listH: list ? Math.round(list.getBoundingClientRect().height) : null,
      listKids: list ? list.querySelectorAll('.location-card, [class*=location]').length : null,
      discTop: yt(byText('p', 'in alphabetical order') || byText('p', 'representation on this') || q('.lm-disclaimer')),
      discBtm: yb(byText('p', 'does not claim') || q('.lm-disclaimer')),
      bannerTop: yt(banner),
      bannerSecPT: banner ? getComputedStyle(banner.closest('.section, section')).paddingTop : null,
    };
  });
  await b.close();
  return r;
};
const [pub, proto] = await Promise.all([
  probe('https://main--rwe--paolomoz.aem.live/en/the-group/countries-and-locations', false),
  probe('http://localhost:8797/locations-map-proposed.html', true),
]);
for (const k of Object.keys(pub)) {
  const d = (typeof pub[k] === 'number' && typeof proto[k] === 'number') ? ' Δ' + (pub[k] - proto[k]) : '';
  console.log(k.padEnd(11), 'pub', pub[k], ' proto', proto[k], d);
}
