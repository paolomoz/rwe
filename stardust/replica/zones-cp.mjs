import { chromium } from 'playwright';
const probe = async (url, isPub) => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 360, height: 800 }, userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36' });
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(9000);
  const r = await p.evaluate((pub) => {
    const byText = (sel, txt) => [...document.querySelectorAll(sel)].find((e) => e.textContent.trim().includes(txt) && e.getBoundingClientRect().height > 0);
    const box = (el) => { if (!el) return null; const r2 = el.getBoundingClientRect(); const cs = getComputedStyle(el); return `y${Math.round(r2.top + window.scrollY)} h${Math.round(r2.height)} mb${cs.marginBottom} pt${cs.paddingTop} pb${cs.paddingBottom}`; };
    // cards zone: cells between projects h2 and cutting h2
    const cardSel = pub ? '.cards.cp .cell' : '.teaser-card, .teaser-plain';
    const cells = [...document.querySelectorAll(cardSel)].filter((e) => e.getBoundingClientRect().height >= 0);
    // powering prose zone
    const power = byText('h2', 'Powering the clean');
    const powerZone = power ? power.closest(pub ? '.section' : 'section, .band, div') : null;
    const cut = byText('h2', 'Cutting other emissions');
    const cutZone = cut ? cut.closest(pub ? '.section' : 'section, .band, div') : null;
    return {
      cards: cells.slice(0, 8).map(box),
      powerZone: box(powerZone),
      powerPs: powerZone ? [...powerZone.querySelectorAll('p')].slice(0, 6).map(box) : null,
      cutZone: box(cutZone),
      cutPs: cutZone ? [...cutZone.querySelectorAll('p')].slice(0, 8).map(box) : null,
    };
  }, isPub);
  await b.close();
  return r;
};
const [live, pub] = await Promise.all([
  probe('https://www.rwe.com/en/responsibility-and-sustainability/environmental-protection/climate/', false),
  probe('https://main--rwe--paolomoz.aem.live/en/responsibility-and-sustainability/environmental-protection/climate', true),
]);
console.log('LIVE cards:', JSON.stringify(live.cards, null, 0));
console.log('PUB  cards:', JSON.stringify(pub.cards, null, 0));
console.log('LIVE power:', live.powerZone, JSON.stringify(live.powerPs));
console.log('PUB  power:', pub.powerZone, JSON.stringify(pub.powerPs));
console.log('LIVE cut:', live.cutZone, JSON.stringify(live.cutPs));
console.log('PUB  cut:', pub.cutZone, JSON.stringify(pub.cutPs));
