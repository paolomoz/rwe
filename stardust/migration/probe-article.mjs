// Inspect a live article's DOM structure for the importer mapping.
import { chromium } from 'playwright';
const url = process.argv[2];
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36' });
const p = await ctx.newPage();
await p.goto(url, { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(6000);
const r = await p.evaluate(() => {
  const out = {};
  out.title = document.title;
  out.desc = document.querySelector('meta[name=description]')?.content;
  out.ogImage = document.querySelector('meta[property="og:image"]')?.content;
  // stage
  const stage = document.querySelector('[data-tpl=sta02], .stage, [class*=stage]');
  out.stage = stage ? { tpl: stage.getAttribute('data-tpl'), h1: document.querySelector('h1')?.textContent.trim().slice(0, 60), h3: stage.querySelector('h3, .subheadline')?.textContent.trim() } : null;
  out.back = document.querySelector('a[class*=back], [class*=back-link] a, a[href*="/en/press/"]')?.textContent.trim().slice(0, 40);
  // body container structure: list direct module children of the main content column
  const main = document.querySelector('main') || document.body;
  const mods = [...main.querySelectorAll('[data-tpl]')].map((m) => m.getAttribute('data-tpl'));
  out.modules = mods;
  // downloads
  out.downloads = [...document.querySelectorAll('.link-download, a[class*=download]')].slice(0, 5).map((a) => `${a.textContent.trim().slice(0, 40)} -> ${a.getAttribute('href')?.slice(0, 60)}`);
  // contacts
  out.contacts = [...document.querySelectorAll('[data-tpl=con01], [class*=contact-teaser]')].length;
  // related teasers
  out.related = [...document.querySelectorAll('[data-tpl=tea01r], .teaser-card')].length;
  // breadcrumb
  out.breadcrumb = [...document.querySelectorAll('nav[aria-label*=read] li, #breadcrumb-list li, [id*=breadcrumb] li')].map((li) => li.textContent.trim().slice(0, 30));
  return out;
});
console.log(JSON.stringify(r, null, 1));
await b.close();
