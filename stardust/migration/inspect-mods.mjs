import fs from 'fs';
import { chromium } from 'playwright';
const s = JSON.parse(fs.readFileSync('stardust/migration/module-survey.json', 'utf8'));
const want = process.argv.slice(2);
// find one page per wanted module
const reps = {};
Object.entries(s).forEach(([path, v]) => {
  (v.mods || []).forEach((m) => { if (want.includes(m) && !reps[m]) reps[m] = path; });
});
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, userAgent: UA });
const page = await ctx.newPage();
for (const [mod, path] of Object.entries(reps)) {
  await page.goto(`https://www.rwe.com${path}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(2500);
  const html = await page.evaluate((m) => {
    const el = document.querySelector(`[data-tpl="${m}"]`);
    if (!el) return null;
    return el.outerHTML.replace(/\s+/g, ' ').slice(0, 900);
  }, mod);
  console.log(`\n=== ${mod} @ ${path}\n${html}`);
}
await b.close();
