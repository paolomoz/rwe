import { chromium } from 'playwright';
const probe = async (url, sel) => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 360, height: 800 }, userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36' });
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(8000);
  const r = await p.evaluate((s) => {
    const els = [...document.querySelectorAll(s)];
    const el = els.find((e) => e.textContent.includes('The Group') && e.getBoundingClientRect().height > 0);
    if (!el) return null;
    const list = el.closest('ol, ul, div');
    const cs = getComputedStyle(list);
    const li = [...list.querySelectorAll('li, a')].filter((x) => x.getBoundingClientRect().height > 0);
    const first = li[0]; const fc = getComputedStyle(first);
    const rect = list.getBoundingClientRect();
    return {
      listTop: Math.round(rect.top + window.scrollY), listH: Math.round(rect.height),
      pad: `${cs.paddingTop} ${cs.paddingBottom}`,
      firstItem: `${fc.fontSize}/${fc.lineHeight}`,
      next: (() => { const btn = [...document.querySelectorAll('a')].find((a) => a.textContent.includes('RWE introduces')); return btn ? Math.round(btn.getBoundingClientRect().top + window.scrollY) : null; })(),
    };
  }, sel);
  await b.close();
  return r;
};
const [live, pub] = await Promise.all([
  probe('https://www.rwe.com/en/the-group/', 'li'),
  probe('https://main--rwe--paolomoz.aem.live/en/the-group', '.breadcrumb-list li'),
]);
console.log('LIVE', JSON.stringify(live));
console.log('PUB ', JSON.stringify(pub));
