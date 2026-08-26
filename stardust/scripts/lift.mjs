// CSS lift for the replica recreation (recreation-procedure.md § CSS lifting).
// Harvests: font files (via the page's own responses), source stylesheets,
// per-element computed styles for gate-measured elements, container model,
// text-rendering group, and per-section geometry. Run per gate breakpoint.
//
//   node stardust/scripts/lift.mjs --width 1440 [--url https://www.rwe.com/en/]
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const args = { url: 'https://www.rwe.com/en/', width: 1440 };
for (let i = 2; i < process.argv.length; i += 1) {
  if (process.argv[i] === '--url') args.url = process.argv[++i];
  else if (process.argv[i] === '--width') args.width = +process.argv[++i];
}
const W = args.width;
const outDir = 'stardust/replica';
const fontDir = 'stardust/current/assets/fonts';
const cssDir = path.join(outDir, 'source-css');
fs.mkdirSync(fontDir, { recursive: true });
fs.mkdirSync(cssDir, { recursive: true });

const browser = await chromium.launch({ headless: false, channel: 'chrome' });
const ctx = await browser.newContext({
  viewport: { width: W, height: 900 },
  locale: 'en-US',
  deviceScaleFactor: 1,
  ...(W < 800 ? { isMobile: false } : {}),
});
const page = await ctx.newPage();

// harvest fonts + css from the page's own responses (CDN-authorized)
const savedFonts = [];
page.on('response', async (resp) => {
  try {
    const u = new URL(resp.url());
    if (/\.(woff2?|ttf|otf)(\?|$)/i.test(u.pathname)) {
      const name = path.basename(u.pathname);
      const fp = path.join(fontDir, name);
      if (!fs.existsSync(fp)) {
        fs.writeFileSync(fp, await resp.body());
        savedFonts.push({ file: name, url: resp.url() });
      }
    } else if (/\.css(\?|$)/i.test(u.pathname) && resp.status() === 200) {
      const name = path.basename(u.pathname);
      const fp = path.join(cssDir, name);
      if (!fs.existsSync(fp)) fs.writeFileSync(fp, await resp.body());
    }
  } catch { /* ignore */ }
});

await page.goto(args.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(3000);
await page.evaluate(() => {
  const btns = [...document.querySelectorAll('button, [role="button"], a')];
  const hit = btns.find((x) => /^\s*accept all\s*$/i.test(x.textContent || ''));
  if (hit) hit.click();
});
await page.waitForTimeout(800);
await page.mouse.move(2, 2);
// settle: slow scroll to trigger lazyload + entrance animations
const total = await page.evaluate(() => document.body.scrollHeight);
for (let y = 0; y < total + 900; y += Math.round(900 * 0.6)) {
  await page.evaluate((v) => window.scrollTo(0, v), y);
  await page.waitForTimeout(180);
}
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(1200);

const lift = await page.evaluate(() => {
  const pick = (cs, props) => Object.fromEntries(props.map((p) => [p, cs.getPropertyValue(p)]));
  const TYPO = ['font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing', 'text-transform', 'color', 'margin-top', 'margin-bottom'];
  const BOX = ['max-width', 'width', 'padding', 'margin', 'background-color', 'background-image', 'border-radius', 'box-shadow', 'border', 'display', 'gap', 'grid-template-columns', 'flex-wrap', 'justify-content', 'align-items', 'position', 'height', 'min-height', 'overflow'];
  const el1 = (sel) => document.querySelector(sel);
  const styleOf = (el, props) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { rect: { top: Math.round(r.top + scrollY), left: Math.round(r.left), w: Math.round(r.width), h: Math.round(r.height) }, ...pick(getComputedStyle(el), props) };
  };
  const out = {};
  out.rendering = pick(getComputedStyle(document.body), ['text-rendering', '-webkit-font-smoothing', 'font-synthesis', 'font-variant-numeric', 'font-kerning', 'font-family', 'font-size', 'line-height', 'color', 'background-color']);
  out.rootVars = (() => {
    const vars = {};
    for (const sheet of document.styleSheets) {
      let rules; try { rules = sheet.cssRules; } catch { continue; }
      for (const r of rules || []) {
        if (r.selectorText === ':root' || r.selectorText === 'html') {
          for (const p of r.style) if (p.startsWith('--')) vars[p] = r.style.getPropertyValue(p).trim();
        }
      }
    }
    return vars;
  })();
  // type ramp: first visible instance of each heading level + p in main
  out.type = {};
  for (const t of ['h1', 'h2', 'h3', 'h4', 'h5', 'p', 'a']) {
    const els = [...document.querySelectorAll(`main ${t}, body > div ${t}`)].filter((e) => e.getBoundingClientRect().height > 0);
    if (els[0]) out.type[t] = styleOf(els[0], TYPO);
  }
  // buttons: distinct visual classes
  out.buttons = [];
  const seen = new Set();
  for (const b of document.querySelectorAll('a[class*="button" i], button[class*="button" i], a[class*="btn" i], .button, [class*="cta" i] a')) {
    const cls = b.className.toString().trim();
    if (seen.has(cls) || b.getBoundingClientRect().height === 0) continue;
    seen.add(cls);
    out.buttons.push({ cls, text: (b.textContent || '').trim().slice(0, 40), ...styleOf(b, [...TYPO, 'padding', 'border', 'border-radius', 'background-color', 'box-shadow', 'display', 'text-decoration']) });
    if (out.buttons.length > 12) break;
  }
  // container model: candidate wrappers
  out.containers = [];
  const cseen = new Set();
  for (const el of document.querySelectorAll('main > *, main section > div, [class*="container" i], [class*="wrapper" i], [class*="grid" i]')) {
    const cs = getComputedStyle(el);
    const mw = cs.maxWidth;
    const key = `${el.className}`.slice(0, 60);
    if (mw !== 'none' && !cseen.has(key)) {
      cseen.add(key);
      out.containers.push({ cls: key, maxWidth: mw, marginLeft: cs.marginLeft, marginRight: cs.marginRight, paddingLeft: cs.paddingLeft, paddingRight: cs.paddingRight, w: Math.round(el.getBoundingClientRect().width) });
      if (out.containers.length > 15) break;
    }
  }
  // per-section map: main-level sections with geometry + surface + key children
  out.sections = [];
  const secs = [...document.querySelectorAll('main section, main > div > section, body section')].filter((s) => {
    const r = s.getBoundingClientRect();
    return r.height > 120 && !s.closest('header, footer') && !secs2has(s);
  });
  function secs2has(s) { return false; }
  const topSecs = secs.filter((s) => !secs.some((o) => o !== s && o.contains(s)));
  for (const s of topSecs) {
    const r = s.getBoundingClientRect();
    const entry = { cls: s.className.toString().slice(0, 100), top: Math.round(r.top + scrollY), h: Math.round(r.height), ...pick(getComputedStyle(s), ['background-color', 'background-image', 'padding-top', 'padding-bottom']) };
    const h = s.querySelector('h1,h2,h3');
    if (h) entry.heading = { text: (h.textContent || '').trim().slice(0, 70), tag: h.tagName, ...pick(getComputedStyle(h), TYPO) };
    out.sections.push(entry);
  }
  // header + footer chrome
  out.header = styleOf(el1('header') || el1('[class*="header" i]'), [...BOX, 'z-index', 'top']);
  out.footer = styleOf(el1('footer') || el1('[class*="footer" i]'), BOX);
  // stylesheet hrefs for the record
  out.stylesheets = [...document.querySelectorAll('link[rel="stylesheet"]')].map((l) => l.href);
  // @font-face declarations
  out.fontFaces = (() => {
    const faces = [];
    for (const sheet of document.styleSheets) {
      let rules; try { rules = sheet.cssRules; } catch { continue; }
      for (const r of rules || []) if (r instanceof CSSFontFaceRule) faces.push(r.cssText.slice(0, 300));
    }
    return faces;
  })();
  out.scrollHeight = document.body.scrollHeight;
  return out;
});

lift._provenance = { writtenBy: 'stardust:replica lift.mjs', url: args.url, width: W, fetchedAt: new Date().toISOString() };
lift.savedFonts = savedFonts;
fs.writeFileSync(path.join(outDir, `lift-${W}.json`), JSON.stringify(lift, null, 2));
// live DOM snapshot for value inspection (reference only — never copied into the prototype)
fs.writeFileSync(path.join(outDir, `live-dom-${W}.html`), await page.content());
console.log(`lift-${W}.json written: ${lift.sections.length} sections, ${lift.buttons.length} button specs, ${savedFonts.length} fonts, ${lift.stylesheets.length} stylesheets, scrollHeight ${lift.scrollHeight}`);
await browser.close();
