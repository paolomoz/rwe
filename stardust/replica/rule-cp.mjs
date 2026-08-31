import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 360, height: 800 } });
await p.goto('https://main--rwe--paolomoz.aem.live/en/responsibility-and-sustainability/environmental-protection/climate', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(8000);
const r = await p.evaluate(() => {
  const byText = (sel, txt) => [...document.querySelectorAll(sel)].find((e) => e.textContent.trim().includes(txt) && e.getBoundingClientRect().height > 0);
  const power = byText('h2', 'Powering the clean');
  const sec = power.closest('.section');
  const dcw = sec.querySelector('.default-content-wrapper');
  const after = getComputedStyle(dcw, '::after');
  const rect = sec.getBoundingClientRect();
  const ps = [...dcw.querySelectorAll('p')];
  const lastP = ps[ps.length - 1];
  return {
    secClasses: sec.className,
    secBtm: Math.round(rect.bottom + window.scrollY),
    secPB: getComputedStyle(sec).paddingBottom,
    lastPBtm: Math.round(lastP.getBoundingClientRect().bottom + window.scrollY),
    lastPMb: getComputedStyle(lastP).marginBottom,
    afterContent: after.content,
    afterH: after.height,
    afterMt: after.marginTop,
    afterBorder: after.borderTopWidth,
    dcwBtm: Math.round(dcw.getBoundingClientRect().bottom + window.scrollY),
    nextSec: (() => { const n = sec.nextElementSibling; const cs = getComputedStyle(n); return `${n.className} pt${cs.paddingTop} top${Math.round(n.getBoundingClientRect().top + window.scrollY)}`; })(),
  };
});
console.log(JSON.stringify(r, null, 1));
await b.close();
