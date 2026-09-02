import fs from 'fs';
import crypto from 'crypto';
import { execSync } from 'child_process';
import { chromium } from 'playwright';

const map = JSON.parse(fs.readFileSync('blocks/form/dcf-configs.json', 'utf8'));
const ids = Object.keys(map).filter((k) => k.startsWith('{') && !map[k].photo);
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const b = await chromium.launch();
const ctx = await b.newContext({ userAgent: UA, viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
for (const id of ids) {
  try {
    await page.goto(`https://www.rwe.com/en/rwe-careers-portal/contact-form/?c=${encodeURIComponent(id)}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    // wait until the rail img has a resolved currentSrc
    await page.waitForFunction(() => {
      const i = document.querySelector('aside [data-tpl="con01"] img');
      return i && i.currentSrc && i.currentSrc.length > 10;
    }, { timeout: 15000 });
    const src = await page.evaluate(() => document.querySelector('aside [data-tpl="con01"] img').currentSrc);
    const abs = src.startsWith('/') ? `https://www.rwe.com${src}` : src;
    const base = abs.split('?')[0].split('/').pop().toLowerCase().replace(/[^a-z0-9.-]/g, '-');
    const h = crypto.createHash('md5').update(abs).digest('hex').slice(0, 6);
    const fname = `${base.replace(/\.[a-z]+$/, '')}-${h}.jpg`;
    // download through the browser session (CDN is referer-gated; bare curl 403s)
    const b64 = await page.evaluate(async (u) => {
      const resp = await fetch(u);
      const buf = await resp.arrayBuffer();
      let bin = '';
      new Uint8Array(buf).forEach((byte) => { bin += String.fromCharCode(byte); });
      return btoa(bin);
    }, abs);
    fs.writeFileSync(`blocks/form/dcf/${fname}`, Buffer.from(b64, 'base64'));
    map[id].photo = `/blocks/form/dcf/${fname}`;
    console.log(id.slice(0, 12), '→', fname);
  } catch (e) {
    console.log(id.slice(0, 12), 'no photo:', String(e).slice(0, 60));
  }
}
await b.close();
fs.writeFileSync('blocks/form/dcf-configs.json', JSON.stringify(map, null, 1));
const left = Object.values(map).filter((c) => !c.photo).length;
console.log('configs without photo now:', left);
