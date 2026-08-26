import { chromium } from 'playwright';
import { dismissOverlays } from '../../scripts/diff/live-session.mjs';
const b = await chromium.launch({ headless: false, channel: 'chrome' });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, locale: 'en-US' })).newPage();
await p.goto('https://www.rwe.com/en/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForTimeout(2500);
const d1 = await dismissOverlays(p);
console.log('dismiss pass 1:', JSON.stringify(d1));
console.log('h:', await p.evaluate(() => document.body.scrollHeight));
const total = await p.evaluate(() => document.body.scrollHeight);
for (let y = 0; y < total + 900; y += 540) { await p.evaluate(v => window.scrollTo(0, v), y); await p.waitForTimeout(150); }
await p.waitForTimeout(3000);
const d2 = await dismissOverlays(p, { lateWindowMs: 1000 });
console.log('dismiss pass 2:', JSON.stringify(d2));
console.log('h after sweep2:', await p.evaluate(() => document.body.scrollHeight), 'scrollX:', await p.evaluate(() => window.scrollX));
await b.close();
