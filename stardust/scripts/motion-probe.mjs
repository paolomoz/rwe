// motion-probe.mjs — inventory entrance-animation classes, slider configs,
// hover transitions, and header scroll morph across live rwe.com pages.
// Headed real Chrome (Cloudflare), paced, deny-consent.
import { chromium } from 'playwright';
import fs from 'fs';

const PAGES = {
  home: 'https://www.rwe.com/en/',
  'article-detail': 'https://www.rwe.com/en/press/rwe-ag/2026-08-14-rwe-commissions-battery-storage-projects-in-arizona-and-texas/',
  'press-hub': 'https://www.rwe.com/en/press/',
  'group-landing': 'https://www.rwe.com/en/the-group/',
  'content-page': 'https://www.rwe.com/en/responsibility-and-sustainability/environmental-protection/climate/',
  'locations-map': 'https://www.rwe.com/en/the-group/countries-and-locations/',
  'job-search': 'https://www.rwe.com/en/rwe-careers-portal/job-offers/',
};

const browser = await chromium.launch({ headless: false, channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const out = {};

for (const [slug, url] of Object.entries(PAGES)) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2500);
  // consent (first page only usually)
  try {
    const deny = page.locator('button:has-text("Deny all")').first();
    if (await deny.isVisible({ timeout: 1500 })) { await deny.click(); await page.waitForTimeout(800); }
  } catch {}

  const data = await page.evaluate(() => {
    const res = { anim: {}, wobble: [], sliders: [], transitions: {} };
    // entrance-animation inventory: class -> [{tag, section context, snippet}]
    for (const cls of ['bottom-to-top-animation', 'right-to-left-animation', 'left-to-right-animation']) {
      res.anim[cls] = [...document.querySelectorAll('.' + cls)].slice(0, 40).map((el) => {
        const sec = el.closest('[data-tpl]');
        return {
          tag: el.tagName.toLowerCase(),
          cls: el.className.toString().slice(0, 120),
          tpl: sec ? sec.getAttribute('data-tpl') : null,
          txt: (el.textContent || '').trim().slice(0, 60),
        };
      });
      res.anim[cls + '__count'] = document.querySelectorAll('.' + cls).length;
    }
    for (const el of document.querySelectorAll('.wobble-animation-trigger')) {
      res.wobble.push({ cls: el.className.toString().slice(0, 140), tpl: el.getAttribute('data-tpl'), children: el.querySelectorAll('.wobble-animation').length });
    }
    // slick slider configs
    for (const s of document.querySelectorAll('.slick-slider')) {
      const sec = s.closest('[data-tpl]');
      res.sliders.push({
        tpl: sec ? sec.getAttribute('data-tpl') : null,
        cls: (sec ? sec.className : s.className).toString().slice(0, 120),
        slides: s.querySelectorAll('.slick-slide:not(.slick-cloned)').length,
        dots: !!s.querySelector('.slick-dots'),
        arrows: !!s.querySelector('.slick-arrow'),
        autoplay: null,
      });
    }
    // computed transitions on representative hover targets
    const probe = (label, sel) => {
      const el = document.querySelector(sel);
      if (!el) return;
      const cs = getComputedStyle(el);
      res.transitions[label] = { sel, transition: cs.transition, cursor: cs.cursor };
    };
    probe('teaser-card', '[data-tpl=tea01r]');
    probe('teaser-header', '[data-tpl=tea01r] header');
    probe('affordance-after', '.affordance');
    probe('btn', '.btn');
    probe('overview-row-link', '.overview-teaser__link-block a, .blanko-overview a');
    probe('pagination', '.pagination a, [class*=pagination] a');
    return res;
  });
  out[slug] = data;
  console.error(`probed ${slug}`);
  await page.waitForTimeout(3000);
}

// header scroll morph on the last page (press hub)
await page.goto(PAGES['press-hub'], { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(2000);
const morph = { top: null, down: null, up: null };
const readHeader = () => page.evaluate(() => {
  const h = document.querySelector('.header-container');
  if (!h) return null;
  const cs = getComputedStyle(h);
  return { cls: h.className.toString(), position: cs.position, height: cs.height, transform: cs.transform, top: cs.top, background: cs.backgroundImage.slice(0, 80) || cs.backgroundColor };
});
morph.top = await readHeader();
await page.mouse.wheel(0, 1200); await page.waitForTimeout(700);
morph.down = await readHeader();
await page.mouse.wheel(0, -400); await page.waitForTimeout(700);
morph.up = await readHeader();
out.__headerMorph = morph;

fs.writeFileSync('stardust/replica/motion-probe.json', JSON.stringify(out, null, 2));
console.error('written stardust/replica/motion-probe.json');
await browser.close();
