import { chromium } from 'playwright';
const probe = async (url, marks) => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 360, height: 800 }, userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36' });
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(8000);
  const r = await p.evaluate((mk) => {
    const byText = (sel, txt) => [...document.querySelectorAll(sel)].find((e) => e.textContent.trim().includes(txt) && e.getBoundingClientRect().height > 0);
    const yt = (el) => (el ? Math.round(el.getBoundingClientRect().top + window.scrollY) : null);
    const out = {};
    mk.forEach(([k, sel, txt]) => { out[k] = yt(byText(sel, txt)); });
    out.docH = document.documentElement.scrollHeight;
    return out;
  }, marks);
  await b.close();
  return r;
};
const marks = [
  ['crumbClimate', 'li', 'Climate'],
  ['ctaFirst', 'a', 'Net zero'],
  ['h2Power', 'h2', 'Powering the clean'],
];
const [live, pub] = await Promise.all([
  probe('https://www.rwe.com/en/responsibility-and-sustainability/environmental-protection/climate/', marks),
  probe('https://main--rwe--paolomoz.aem.live/en/responsibility-and-sustainability/environmental-protection/climate', marks),
]);
for (const k of Object.keys(live)) {
  const d = (live[k] != null && pub[k] != null) ? pub[k] - live[k] : null;
  console.log(k.padEnd(12), 'live', live[k], 'pub', pub[k], d != null ? `Δ${d}` : '');
}
