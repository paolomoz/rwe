// Sequential typed survey: ONE headed context navigates each representative
// URL (clearance cookie persists, paced), capturing per page: screenshot,
// structure summary, and integration signals (iframes, external scripts,
// forms, videos, maps, listing markers). Purpose: archetype typing +
// dynamic-blocks/integration inventory for the migration plan.
import { chromium } from 'playwright';
import fs from 'node:fs';

const URLS = JSON.parse(fs.readFileSync('stardust/migration/survey-urls.json', 'utf8'));
fs.mkdirSync('stardust/migration/survey', { recursive: true });
const b = await chromium.launch({ headless: false, channel: 'chrome' });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, locale: 'en-US' });
const page = await ctx.newPage();
const results = [];
for (const { slug, url } of URLS) {
  try {
    const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2500);
    await page.evaluate(() => {
      const h = [...document.querySelectorAll('button,a')].find((x) => /^\s*accept all\s*$/i.test(x.textContent || ''));
      if (h) h.click();
    });
    await page.waitForTimeout(800);
    // settle scroll
    const total = await page.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < total + 900; y += 700) { await page.evaluate((v) => window.scrollTo(0, v), y); await page.waitForTimeout(120); }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(600);
    const info = await page.evaluate(() => {
      const out = {};
      out.title = document.title;
      out.h1 = document.querySelector('h1') ? document.querySelector('h1').textContent.trim().slice(0, 90) : null;
      out.height = document.body.scrollHeight;
      out.sections = [...document.querySelectorAll('main section, body section')].filter((s) => {
        const r = s.getBoundingClientRect(); return r.height > 100 && !s.closest('footer,header');
      }).length;
      out.tpls = [...new Set([...document.querySelectorAll('[data-tpl]')].map((e) => e.dataset.tpl))];
      out.iframes = [...document.querySelectorAll('iframe')].map((f) => f.src).filter((s) => s && !s.startsWith('about:')).slice(0, 8);
      out.forms = [...document.querySelectorAll('form')].map((f) => (f.action || '').slice(0, 100)).slice(0, 5);
      out.videos = [...document.querySelectorAll('video')].map((v) => (v.currentSrc || (v.querySelector('source') || {}).src || '').slice(0, 100)).slice(0, 4);
      out.extScripts = [...new Set([...document.querySelectorAll('script[src]')].map((s) => { try { return new URL(s.src).host; } catch { return null; } }).filter((h) => h && h !== 'www.rwe.com'))];
      out.listingMarkers = {
        filters: document.querySelectorAll('[class*="filter" i], select[class*="topic" i], [class*="facet" i]').length,
        pagination: document.querySelectorAll('[class*="pagination" i], [class*="load-more" i], [class*="show-more" i]').length,
        searchInputs: document.querySelectorAll('input[type="search"], input[name*="search" i]').length,
        map: document.querySelectorAll('[class*="map" i][class*="container" i], .leaflet-container, [id*="map" i]').length,
        accordion: document.querySelectorAll('[class*="accordion" i]').length,
        table: document.querySelectorAll('main table').length,
        downloadLinks: document.querySelectorAll('a[href$=".pdf"]').length,
      };
      return out;
    });
    await page.screenshot({ path: `stardust/migration/survey/${slug}.png`, fullPage: true });
    results.push({ slug, url, httpStatus: resp.status(), ...info });
    console.log(`OK   ${slug}  h1="${info.h1}" tpls=${info.tpls.slice(0, 6).join(',')}`);
  } catch (e) {
    results.push({ slug, url, error: e.message.slice(0, 120) });
    console.log(`FAIL ${slug} ${e.message.slice(0, 80)}`);
  }
  await page.waitForTimeout(1500);
}
fs.writeFileSync('stardust/migration/survey.json', JSON.stringify({ _provenance: { writtenBy: 'stardust prepare-migration survey', renderedBy: 'playwright', at: new Date().toISOString() }, results }, null, 1));
console.log('survey written:', results.filter((r) => !r.error).length, 'ok /', results.length);
await b.close();
