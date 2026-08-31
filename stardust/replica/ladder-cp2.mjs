import { chromium } from 'playwright';
const probe = async (url) => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 360, height: 800 }, userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36' });
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(9000);
  const r = await p.evaluate(() => {
    const byText = (sel, txt) => [...document.querySelectorAll(sel)].find((e) => e.textContent.trim().includes(txt) && e.getBoundingClientRect().height > 0);
    const yt = (el) => (el ? Math.round(el.getBoundingClientRect().top + window.scrollY) : null);
    return {
      crumb: yt(byText('li', 'Climate')),
      h2Power: yt(byText('h2', 'Powering the clean')),
      h2Ambition: yt(byText('h2', 'ambition') || byText('h2', 'Net zero')),
      tilesH2: yt(byText('h2', 'measures') || byText('h2', 'five')),
      cardsH2: yt(byText('h2', 'projects')),
      cutH2: yt(byText('h2', 'Cutting other emissions')),
      furtherH3: yt(byText('h3', 'Further information')),
      contactH2: yt(byText('h2', 'contact') || byText('h2', 'questions')),
      docH: document.documentElement.scrollHeight,
    };
  });
  await b.close();
  return r;
};
const [live, pub] = await Promise.all([
  probe('https://www.rwe.com/en/responsibility-and-sustainability/environmental-protection/climate/'),
  probe('https://main--rwe--paolomoz.aem.live/en/responsibility-and-sustainability/environmental-protection/climate'),
]);
let prev = 0;
for (const k of Object.keys(live)) {
  if (live[k] == null || pub[k] == null) { console.log(k.padEnd(10), 'live', live[k], 'pub', pub[k]); continue; }
  const d = pub[k] - live[k];
  console.log(k.padEnd(10), `live ${String(live[k]).padStart(5)} pub ${String(pub[k]).padStart(5)} Δ${String(d).padStart(4)} seg ${d - prev}`);
  prev = d;
}
