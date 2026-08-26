import { chromium } from 'playwright';
const b = await chromium.launch({ headless: false, channel: 'chrome' });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, locale: 'en-US' })).newPage();
await p.goto('https://www.rwe.com/en/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForTimeout(3000);
await p.evaluate(() => { const h=[...document.querySelectorAll('button,a')].find(x=>/^\s*accept all\s*$/i.test(x.textContent||'')); if(h)h.click(); });
await p.waitForTimeout(1000);
const total = await p.evaluate(() => document.body.scrollHeight);
for (let y = 0; y < total + 900; y += 540) { await p.evaluate(v => window.scrollTo(0, v), y); await p.waitForTimeout(150); }
console.log('pre-fix h:', await p.evaluate(() => document.body.scrollHeight));
await p.addStyleTag({ content: '*,*::before,*::after{animation-play-state:paused!important;transition:none!important;}' });
await p.evaluate(async () => {
  const vids = [...document.querySelectorAll('video')];
  await Promise.all(vids.map((v) => new Promise((res) => {
    try {
      v.pause(); v.removeAttribute('autoplay');
      if (v.readyState >= 1) { v.currentTime = 0; }
      if (v.seeking) { v.addEventListener('seeked', () => res(), { once: true }); setTimeout(res, 1500); }
      else { setTimeout(res, 200); }
    } catch { res(); }
  })));
});
console.log('after video pause h:', await p.evaluate(() => document.body.scrollHeight));
await p.evaluate(() => { let id = window.setTimeout(() => {}, 0); while (id-- > 0) { window.clearTimeout(id); window.clearInterval(id); } });
await p.waitForTimeout(1500);
console.log('after timer clear h:', await p.evaluate(() => document.body.scrollHeight), 'x:', await p.evaluate(() => window.scrollX));
const culprits = await p.evaluate(() => {
  const out = [];
  document.querySelectorAll('body > *, main > *, main section').forEach(el => {
    const r = el.getBoundingClientRect(); const top = r.top + scrollY;
    if (r.height > 800) out.push({ tag: el.tagName, cls: el.className.toString().slice(0,60), top: Math.round(top), h: Math.round(r.height) });
  });
  return out;
});
console.log(JSON.stringify(culprits));
await b.close();
