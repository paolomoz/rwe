import { chromium } from 'playwright';
const probe = async (url, isProto, width) => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width, height: 900 } });
  await p.goto(url, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(isProto ? 1500 : 7000);
  const r = await p.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const byText = (sel, txt) => [...document.querySelectorAll(sel)].find((e) => e.textContent.includes(txt));
    const yt = (el) => (el ? Math.round(el.getBoundingClientRect().top + window.scrollY) : null);
    const hb = (el) => (el ? Math.round(el.getBoundingClientRect().height) : null);
    const video = q('.cvm-video');
    const cap = q('.cvm-caption');
    return {
      h1: yt(q('h1')),
      cvmTop: yt(q('.cvm-teaser')),
      cvmVideoH: hb(video),
      cvmVideoW: video ? Math.round(video.getBoundingClientRect().width) : null,
      cvmCapH: hb(cap),
      cvmCapW: cap ? Math.round(cap.getBoundingClientRect().width) : null,
      jicH2: yt(byText('h2', '210 Jobs')),
      srcHeader: yt(q('.src-header')),
      firstCard: yt(q("article[data-tpl='n-jrt01']")),
      cardH: hb(q("article[data-tpl='n-jrt01']")),
      loadMore: yt(q('.load-more')),
      sideTop: yt(q('.job-side .job-alert') || q('.job-alert')),
      sideH: hb(q('.job-side.block .job-side') || q('.job-side')),
      note: yt(byText('p', 'The term')),
      exploreH2: yt(byText('h2', 'Explore more')),
      cardMediaH: hb(q('.explore-card .media') || q('.cards.explore .card-media')),
      cardBodyH: hb(q('.explore-card .card-body') || q('.cards.explore .card-body')),
      exploreCellW: (() => { const e = q('.explore-row .cell') || q('.cards.explore .cell'); return e ? Math.round(e.getBoundingClientRect().width) : null; })(),
      breadcrumb: yt(q('#breadcrumb-bottom') || q('.breadcrumb.block')),
      footerTop: yt(q('footer')),
      docH: document.documentElement.scrollHeight,
    };
  });
  await b.close();
  return r;
};
const width = Number(process.argv[2] || 1440);
const [pub, proto] = await Promise.all([
  probe('https://main--rwe--paolomoz.aem.live/en/rwe-careers-portal/job-offers', false, width),
  probe('http://localhost:8797/job-search-proposed.html', true, width),
]);
let prev = 0;
for (const k of Object.keys(pub)) {
  if (pub[k] == null || proto[k] == null) { console.log(k.padEnd(12), 'pub', pub[k], 'proto', proto[k]); continue; }
  const d = pub[k] - proto[k];
  if (['cvmVideoH', 'cvmVideoW', 'cvmCapH', 'cvmCapW', 'cardH', 'sideH', 'cardMediaH', 'cardBodyH', 'exploreCellW'].includes(k)) {
    console.log(k.padEnd(12), `pub ${pub[k]} proto ${proto[k]} Δ${d}`);
  } else {
    console.log(k.padEnd(12), `pub ${String(pub[k]).padStart(5)} proto ${String(proto[k]).padStart(5)} Δ${String(d).padStart(4)} seg ${d - prev}`);
    prev = d;
  }
}
