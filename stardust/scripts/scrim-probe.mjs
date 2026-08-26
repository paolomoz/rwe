import { chromium } from 'playwright';
const b = await chromium.launch({ headless: false, channel: 'chrome' });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, locale: 'en-US' })).newPage();
await p.goto('https://www.rwe.com/en/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForTimeout(3000);
await p.evaluate(() => { const h=[...document.querySelectorAll('button,a')].find(x=>/^\s*accept all\s*$/i.test(x.textContent||'')); if(h)h.click(); });
await p.waitForTimeout(800);
await p.evaluate(() => window.scrollTo(0, 3400));
await p.waitForTimeout(1500);
const info = await p.evaluate(() => {
  const out = [];
  const sec = document.querySelector('.teaser-grid--full-width');
  const els = [sec, ...sec.querySelectorAll('*')];
  for (const el of els.slice(0, 40)) {
    for (const ps of [null, '::before', '::after']) {
      const cs = getComputedStyle(el, ps);
      const bi = cs.backgroundImage;
      if (bi && bi !== 'none') {
        const r = el.getBoundingClientRect();
        out.push({ cls: (el.className||'').toString().slice(0,60), ps, bi: bi.slice(0,120), rect: [Math.round(r.left), Math.round(r.width), Math.round(r.height)], op: cs.opacity, mix: cs.mixBlendMode });
      }
    }
  }
  const v = document.querySelector('video.tear01r__video');
  return { out, video: { t: v.currentTime, paused: v.paused, src: v.currentSrc.split('/').pop(), filter: getComputedStyle(v).filter, opacity: getComputedStyle(v).opacity } };
});
console.log(JSON.stringify(info, null, 1));
await b.close();
