import { chromium } from 'playwright';
import fs from 'node:fs';
const b = await chromium.launch({ headless: false, channel: 'chrome' });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, locale: 'en-US' })).newPage();
await p.goto('https://www.rwe.com/en/the-group/countries-and-locations/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForTimeout(2500);
await p.evaluate(() => { const h=[...document.querySelectorAll('button,a')].find(x=>/^\s*deny all\s*$/i.test(x.textContent||'')); if(h)h.click(); });
await p.waitForTimeout(1200);
const total = await p.evaluate(() => document.body.scrollHeight);
for (let y = 0; y < total + 900; y += 700) { await p.evaluate(v => window.scrollTo(0, v), y); await p.waitForTimeout(100); }
await p.waitForTimeout(800);
const html = await p.evaluate(() => document.documentElement.outerHTML);
fs.writeFileSync('stardust/replica/locations-full-1440.html', html);
console.log('saved', html.length);
await b.close();
