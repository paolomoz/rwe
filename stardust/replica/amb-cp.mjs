import { chromium } from 'playwright';
const probe = async (url, isPub) => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 360, height: 800 }, userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36' });
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(9000);
  const r = await p.evaluate(() => {
    const byText = (sel, txt) => [...document.querySelectorAll(sel)].find((e) => e.textContent.trim().includes(txt) && e.getBoundingClientRect().height > 0);
    const box = (el) => { if (!el) return null; const r2 = el.getBoundingClientRect(); const cs = getComputedStyle(el); return `y${Math.round(r2.top + window.scrollY)} h${Math.round(r2.height)} mb${cs.marginBottom}`; };
    const amb = byText('h2', 'Net Zero by 2040');
    const zone = amb ? amb.parentElement : null;
    const lastPowerP = byText('p', 'find more information on our decarbon') || byText('p', 'transition news');
    return {
      ambH2: box(amb),
      siblings: zone ? [...zone.children].slice(0, 8).map((el) => `${el.tagName}${el.className ? `.${el.className.split(' ')[0]}` : ''} ${box(el)}`) : null,
      lastPowerP: box(lastPowerP),
      tilesH2: box(byText('h2', 'measures')),
    };
  });
  await b.close();
  return r;
};
const [live, pub] = await Promise.all([
  probe('https://www.rwe.com/en/responsibility-and-sustainability/environmental-protection/climate/', false),
  probe('https://main--rwe--paolomoz.aem.live/en/responsibility-and-sustainability/environmental-protection/climate', true),
]);
console.log('LIVE', JSON.stringify(live, null, 1));
console.log('PUB ', JSON.stringify(pub, null, 1));
