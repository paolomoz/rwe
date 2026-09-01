// Module-coverage survey over the in-scope wave: fetch each page, record its
// data-tpl module sequence. Output drives the wave-2 importer coverage plan.
import fs from 'fs';
import { chromium } from 'playwright';

const u = JSON.parse(fs.readFileSync('stardust/migration/urls.json', 'utf8'));
const done = new Set(['/en/', '/en/press/', '/en/the-group/', '/en/the-group/countries-and-locations/',
  '/en/responsibility-and-sustainability/environmental-protection/climate/', '/en/rwe-careers-portal/job-offers/']);
const scope = u.pages.filter((p) => p.wave === 'in-scope' && !done.has(p.path) && p.type !== 'ir-report');
const sample = process.argv[2] === '--all' ? scope : scope.filter((_, i) => i % Math.ceil(scope.length / 60) === 0);
console.log(`surveying ${sample.length} of ${scope.length}`);

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const b = await chromium.launch();
const out = {};
const queue = [...sample];
const worker = async () => {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, userAgent: UA });
  const page = await ctx.newPage();
  while (queue.length) {
    const p = queue.shift();
    try {
      await page.goto(`https://www.rwe.com${p.path}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.waitForTimeout(2500);
      const mods = await page.evaluate(() => {
        const seen = [];
        document.querySelectorAll('main [data-tpl], body [data-tpl]').forEach((m) => {
          const t = m.getAttribute('data-tpl');
          if (!m.parentElement.closest('[data-tpl]') || m.parentElement.closest('[data-tpl]').getAttribute('data-tpl') !== t) seen.push(t);
        });
        return seen;
      });
      out[p.path] = { type: p.type, mods };
      console.log(`${p.type} ${p.path.slice(0, 60)}: ${[...new Set(mods)].join(',')}`);
    } catch (e) { out[p.path] = { type: p.type, error: String(e).slice(0, 100) }; }
  }
  await ctx.close();
};
await Promise.all(Array.from({ length: 5 }, worker));
await b.close();
fs.writeFileSync('stardust/migration/module-survey.json', JSON.stringify(out, null, 1));
// aggregate
const freq = {};
Object.values(out).forEach((v) => (v.mods || []).forEach((m) => { freq[m] = (freq[m] || 0) + 1; }));
console.log('\nMODULE FREQUENCY:', JSON.stringify(Object.fromEntries(Object.entries(freq).sort((a, c) => c[1] - a[1])), null, 1));
