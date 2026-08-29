// motion-observe.mjs — RUNTIME motion observation for stardust:replica.
// Records what the live page actually DOES (animation events, class
// mutations, scroll-state chrome, widget transitions) instead of inferring
// motion from static CSS classes — static classes routinely exist on
// elements whose animations never fire, and chrome morph mechanics are
// invisible in CSS alone.
//
// Usage: node scripts/replica/motion-observe.mjs <url> <out.json>
//          [--width 1440] [--consent "button:has-text(\"Deny all\")"]
//          [--click <selector>]   (repeatable: widget to poke, e.g. slider next)
import { chromium } from 'playwright';
import fs from 'fs';

const args = process.argv.slice(2);
const url = args[0];
const out = args[1];
const width = Number((args.find((a, i) => args[i - 1] === '--width')) || 1440);
const consentSel = args.find((a, i) => args[i - 1] === '--consent');
const clicks = args.flatMap((a, i) => (args[i - 1] === '--click' ? [a] : []));

const browser = await chromium.launch({ headless: false, channel: 'chrome' });
const page = await browser.newPage({ viewport: { width, height: 900 } });
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(2500);
if (consentSel) {
  try {
    const btn = page.locator(consentSel).first();
    if (await btn.isVisible({ timeout: 2000 })) { await btn.click(); await page.waitForTimeout(800); }
  } catch {}
}

// ---- instrument BEFORE any scrolling ----
await page.evaluate(() => {
  const path = (el) => {
    const bits = [];
    for (let e = el; e && e.nodeType === 1 && bits.length < 5; e = e.parentElement) {
      let b = e.tagName.toLowerCase();
      const cls = (e.className && e.className.baseVal !== undefined ? e.className.baseVal : e.className) || '';
      if (cls) b += '.' + String(cls).trim().split(/\s+/).slice(0, 3).join('.');
      bits.unshift(b);
      if (e.dataset && e.dataset.tpl) { bits[0] += `[data-tpl=${e.dataset.tpl}]`; break; }
    }
    return bits.join(' > ');
  };
  window.__motion = { animations: [], transitions: [], classMutations: [] };
  document.addEventListener('animationstart', (ev) => {
    window.__motion.animations.push({
      name: ev.animationName,
      el: path(ev.target),
      txt: (ev.target.textContent || '').trim().slice(0, 50),
      y: window.pageYOffset,
    });
  }, true);
  document.addEventListener('transitionstart', (ev) => {
    if (window.__motion.transitions.length > 400) return;
    window.__motion.transitions.push({
      prop: ev.propertyName,
      el: path(ev.target),
      y: window.pageYOffset,
      dur: getComputedStyle(ev.target).transitionDuration,
    });
  }, true);
  const mo = new MutationObserver((muts) => {
    for (const m of muts) {
      if (m.type !== 'attributes' || m.attributeName !== 'class') continue;
      const oldC = new Set(String(m.oldValue || '').split(/\s+/));
      const newC = String((m.target.className && m.target.className.baseVal !== undefined
        ? m.target.className.baseVal : m.target.className) || '').split(/\s+/);
      const added = newC.filter((c) => c && !oldC.has(c));
      if (!added.length) continue;
      if (window.__motion.classMutations.length > 600) return;
      window.__motion.classMutations.push({ added, el: path(m.target), y: window.pageYOffset });
    }
  });
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'], attributeOldValue: true, subtree: true });
});

// ---- header state sampler ----
const headerState = () => page.evaluate(() => {
  const h = document.querySelector('.header-container, header');
  if (!h) return null;
  const cs = getComputedStyle(h);
  const main = document.querySelector('main, #main-content, body > .content');
  return {
    y: window.pageYOffset,
    cls: String(h.className).trim(),
    position: cs.position, height: cs.height, transform: cs.transform,
    transition: cs.transition,
    mainPadTop: main ? getComputedStyle(main).paddingTop : null,
    bodyPadTop: getComputedStyle(document.body).paddingTop,
    headerCount: document.querySelectorAll('header, .header-container').length,
  };
});

const headerTimeline = [];
headerTimeline.push(await headerState());

// scroll DOWN to bottom in steps
const docH = await page.evaluate(() => document.documentElement.scrollHeight);
for (let y = 0; y < docH - 900; y += 400) {
  await page.evaluate((yy) => window.scrollTo(0, yy), y);
  await page.waitForTimeout(180);
  if (y % 1200 === 0) headerTimeline.push(await headerState());
}
await page.waitForTimeout(400);
// scroll UP in steps, sampling densely near the top
for (const y of [docH - 2000, docH - 3500, 2400, 1200, 800, 500, 300, 200, 150, 120, 90, 60, 30, 0]) {
  if (y < 0) continue;
  await page.evaluate((yy) => window.scrollTo(0, yy), Math.max(0, y));
  await page.waitForTimeout(180);
  headerTimeline.push(await headerState());
}

// ---- widget pokes: click each selector, sample its neighborhood over time ----
const widgetSamples = [];
for (const sel of clicks) {
  const found = await page.evaluate((s) => {
    const el = document.querySelector(s);
    if (!el) return false;
    el.scrollIntoView({ block: 'center' });
    return true;
  }, sel);
  if (!found) { widgetSamples.push({ sel, error: 'not found' }); continue; }
  await page.waitForTimeout(800);
  await page.evaluate((s) => document.querySelector(s).click(), sel);
  const frames = [];
  for (let t = 0; t < 4; t++) {
    frames.push(await page.evaluate(() => {
      const track = document.querySelector('.slick-track');
      const dots = [...document.querySelectorAll('.slick-dots li')].slice(0, 8).map((li) => {
        const b = li.querySelector('button');
        const cs = b ? getComputedStyle(b) : null;
        return { cls: li.className, w: cs && cs.width, h: cs && cs.height, bg: cs && cs.backgroundColor, transition: cs && cs.transition };
      });
      const trackCs = track ? getComputedStyle(track) : null;
      return { t: performance.now(), trackTransform: trackCs && trackCs.transform, trackTransition: trackCs && trackCs.transition, dots };
    }));
    await page.waitForTimeout(200);
  }
  widgetSamples.push({ sel, frames });
}

const events = await page.evaluate(() => window.__motion);
fs.writeFileSync(out, JSON.stringify({ url, width, headerTimeline, widgetSamples, events }, null, 2));
console.error(`written ${out}: ${events.animations.length} animations, ${events.transitions.length} transitions, ${events.classMutations.length} class mutations`);
await browser.close();
