// Download newsbox images through a live browser session (CDN referer-gated)
import fs from 'fs';
import { chromium } from 'playwright';
const c = fs.readFileSync('stardust/migration/megamenu-live.html', 'utf8');
const urls = [...c.matchAll(/newsbox-image" style="background-image: url\('?([^')]+)'?\)/g)].map((m) => m[1]);
const uniq = [...new Set(urls)];
console.log('newsbox imgs:', uniq);
const b = await chromium.launch();
const ctx = await b.newContext({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36' });
const p = await ctx.newPage();
await p.goto('https://www.rwe.com/en/', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(3000);
const map = {};
for (const u of uniq) {
  const abs = u.startsWith('http') ? u : `https://www.rwe.com/${u.replace(/^\/?/, '')}`;
  const name = abs.split('?')[0].split('/').pop().toLowerCase().replace(/[^a-z0-9.-]/g, '-');
  const b64 = await p.evaluate(async (x) => {
    const r = await fetch(x);
    const buf = await r.arrayBuffer();
    let bin = '';
    new Uint8Array(buf).forEach((byte) => { bin += String.fromCharCode(byte); });
    return btoa(bin);
  }, abs);
  fs.writeFileSync(`blocks/header/${name}`, Buffer.from(b64, 'base64'));
  map[u] = `/blocks/header/${name}`;
  console.log(name, fs.statSync(`blocks/header/${name}`).size, 'bytes');
}
fs.writeFileSync('/tmp/newsbox-map.json', JSON.stringify(map, null, 1));
await b.close();
