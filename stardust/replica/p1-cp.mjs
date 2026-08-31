import { chromium } from 'playwright';
const probe = async (url) => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 360, height: 800 }, userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36' });
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(8000);
  const r = await p.evaluate(() => {
    const byText = (sel, txt) => [...document.querySelectorAll(sel)].find((e) => e.textContent.trim().includes(txt) && e.getBoundingClientRect().height > 0);
    const h2 = byText('h2', 'Powering the clean');
    const zone = h2.parentElement;
    const p1 = zone.querySelector('p');
    const cs = getComputedStyle(p1);
    return {
      w: Math.round(p1.getBoundingClientRect().width),
      h: Math.round(p1.getBoundingClientRect().height),
      fs: `${cs.fontSize}/${cs.lineHeight} ${cs.fontFamily.split(',')[0]}`,
      len: p1.textContent.length,
      nbsp: (p1.innerHTML.match(/ |&nbsp;/g) || []).length,
      html: p1.innerHTML.slice(0, 400),
    };
  });
  await b.close();
  return r;
};
const [live, pub] = await Promise.all([
  probe('https://www.rwe.com/en/responsibility-and-sustainability/environmental-protection/climate/'),
  probe('https://main--rwe--paolomoz.aem.live/en/responsibility-and-sustainability/environmental-protection/climate'),
]);
console.log('LIVE', JSON.stringify(live, null, 1));
console.log('PUB ', JSON.stringify(pub, null, 1));
