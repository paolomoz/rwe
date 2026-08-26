import { chromium } from 'playwright';
const b = await chromium.launch({ headless: false, channel: 'chrome' });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, locale: 'en-US' });
const p = await ctx.newPage();
await p.goto('https://www.rwe.com/en/', { waitUntil: 'domcontentloaded', timeout: 45000 });
await p.waitForTimeout(3000);
// dismiss consent
await p.evaluate(() => {
  const btns = [...document.querySelectorAll('button, [role="button"], a')];
  const hit = btns.find((x) => /^\s*accept all\s*$/i.test(x.textContent || ''));
  if (hit) hit.click();
});
await p.waitForTimeout(1000);
// scroll slowly through the page to trigger everything
for (let y = 0; y < 9000; y += 450) { await p.evaluate((v) => window.scrollTo(0, v), y); await p.waitForTimeout(250); }
await p.waitForTimeout(1500);
// find sections and their bounding boxes
const info = await p.evaluate(() => {
  const out = [];
  document.querySelectorAll('main section, main > div, [class*="section" i], [class*="stage" i], [class*="parallax" i], canvas, video').forEach((el) => {
    const r = el.getBoundingClientRect();
    const top = r.top + window.scrollY;
    if (r.height > 300) out.push({ tag: el.tagName, cls: (el.className || '').toString().slice(0, 90), top: Math.round(top), h: Math.round(r.height), text: (el.innerText || '').replace(/\s+/g, ' ').slice(0, 90) });
  });
  return { total: document.body.scrollHeight, out: out.sort((a, b) => a.top - b.top).slice(0, 40) };
});
console.log('scrollHeight:', info.total);
info.out.forEach((s) => console.log(String(s.top).padStart(6), String(s.h).padStart(6), s.tag, '|', s.cls, '|', s.text));
await b.close();
