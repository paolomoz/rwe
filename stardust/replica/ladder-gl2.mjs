import { chromium } from 'playwright';
const probe = async (url) => {
  const b = await chromium.launch();
  const ctx = await b.newContext({
    viewport: { width: 360, height: 800 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  });
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(8000);
  // dismiss consent if present
  try { await p.click('#usercentrics-cmp-ui [data-testid="uc-deny-all-button"], .uc-deny-button, button:has-text("Deny")', { timeout: 3000 }); } catch (e) { /* none */ }
  await p.waitForTimeout(1500);
  const r = await p.evaluate(() => {
    const byText = (sel, txt) => [...document.querySelectorAll(sel)].find((e) => e.textContent.trim().includes(txt));
    const yt = (el) => (el ? Math.round(el.getBoundingClientRect().top + window.scrollY) : null);
    const marks = {
      bcGroup: byText('li, .breadcrumb-list li', 'The Group'),
      btnIntro: byText('a', 'RWE introduces itself'),
      h2Key: byText('h2', 'key drivers'),
      pCurrent: byText('p', 'Our current industrial'),
      h2Global: byText('h3, h2', 'RWE global'),
      h2Figures: byText('h2', 'Facts & Figures') || byText('h2', 'figures'),
      h2Board: byText('h2', 'Executive Board') || byText('h3', 'Executive Board'),
      strategy: byText('h2', 'strategy'),
    };
    const out = {};
    Object.entries(marks).forEach(([k, el]) => { out[k] = yt(el); });
    out.docH = document.documentElement.scrollHeight;
    return out;
  });
  await b.close();
  return r;
};
const [live, pub] = await Promise.all([
  probe('https://www.rwe.com/en/the-group/'),
  probe('https://main--rwe--paolomoz.aem.live/en/the-group'),
]);
let prev = 0;
for (const k of Object.keys(live)) {
  if (live[k] == null || pub[k] == null) { console.log(k.padEnd(10), 'live', live[k], 'pub', pub[k]); continue; }
  const d = pub[k] - live[k];
  console.log(k.padEnd(10), `live ${String(live[k]).padStart(5)} pub ${String(pub[k]).padStart(5)} Δ${String(d).padStart(4)} seg ${d - prev}`);
  prev = d;
}
