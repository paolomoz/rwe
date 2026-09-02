// Deep recon of the live RWE mega menu: structure (sections, columns,
// links, teasers), computed styles, and open/close + section-switch motion.
import fs from 'fs';
import { chromium } from 'playwright';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const b = await chromium.launch();
const ctx = await b.newContext({ userAgent: UA, viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
await p.goto('https://www.rwe.com/en/', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(6000);

// open the menu
await p.click('button.menu-button, [class*="menu-button"], li.menu button');
await p.waitForTimeout(1500);

const structure = await p.evaluate(() => {
  const collapse = (s) => (s || '').replace(/[ \t\r\n]+/g, ' ').trim();
  // find the open menu container
  const nav = document.querySelector('[class*="mega"], [class*="flyout"], [class*="main-navigation"], nav[class*="navigation"][class*="open"], [class*="menu"][class*="open"]');
  const root = nav || [...document.querySelectorAll('body > div, header ~ div, nav')].find((el) => el.getBoundingClientRect().height > 400 && /The Group/.test(el.textContent));
  if (!root) return { fail: 'no menu root found' };
  const cs = getComputedStyle(root);
  return {
    rootClass: root.className.toString().slice(0, 120),
    rootTag: root.tagName,
    rootStyle: { position: cs.position, background: cs.background.slice(0, 80), inset: `${cs.top} ${cs.right} ${cs.bottom} ${cs.left}`, zIndex: cs.zIndex, height: root.getBoundingClientRect().height },
    html: root.outerHTML.length,
  };
});
console.log('ROOT:', JSON.stringify(structure, null, 1));

// dump full menu HTML for offline analysis
const menuHtml = await p.evaluate(() => {
  const root = [...document.querySelectorAll('body > *, header *')].filter((el) => el.getBoundingClientRect().height > 400 && /The Group/.test(el.textContent) && /Our Energy/.test(el.textContent));
  // take the SMALLEST such container (deepest)
  root.sort((a, z) => a.outerHTML.length - z.outerHTML.length);
  return root[0] ? root[0].outerHTML : null;
});
if (menuHtml) fs.writeFileSync('stardust/migration/megamenu-live.html', menuHtml);
console.log('menu html bytes:', menuHtml ? menuHtml.length : 0);
await p.screenshot({ path: 'stardust/migration/megamenu-open-live.png' });
await b.close();
