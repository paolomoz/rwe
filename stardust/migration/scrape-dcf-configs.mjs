// Freeze the dynamic-contact-form configurations referenced by the estate:
// per ?c= hash, capture headline person, brand line, role, photo, phones.
import fs from 'fs';
import { chromium } from 'playwright';

const hashes = fs.readFileSync('/tmp/dcf-hashes.txt', 'utf8').trim().split('\n');
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const b = await chromium.launch();
const ctx = await b.newContext({ userAgent: UA, viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const out = {};
for (const h of hashes) {
  try {
    await page.goto(`https://www.rwe.com/en/contact-services/contact-form/?c=${h}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(3500);
    const cfg = await page.evaluate(() => {
      const collapse = (s) => (s || '').replace(/[ \t\r\n]+/g, ' ').trim();
      const h2 = document.querySelector('main h2.headline, main h2');
      const brand = document.querySelector('main h2 + p, main [class*="subline"], main h2 ~ .subheadline');
      // contact rail: aside > h3 "Contact" + [data-tpl=con01]
      const con = document.querySelector('main aside [data-tpl="con01"], aside [data-tpl="con01"]');
      const img = con ? con.querySelector('img') : null;
      let name = null; let role = null;
      if (con) {
        const textEls = [...con.querySelectorAll('h2, h3, h4, p, strong, [class*="headline"]')].filter((el) => collapse(el.textContent) && !el.querySelector('img') && el.children.length <= 1);
        name = textEls[0] || null;
        role = textEls[1] || null;
      }
      const tels = con ? [...con.querySelectorAll('a[href^="tel:"]')].map((a) => ({ href: a.getAttribute('href'), label: collapse(a.textContent) })) : [];
      // brand line: the paragraph right under the page h2 in the form column
      const brandEl = h2 ? h2.nextElementSibling : null;
      // privacy note (same across configs)
      const priv = [...document.querySelectorAll('main p')].find((p2) => /data protection/i.test(p2.textContent) && p2.querySelector('a'));
      return {
        headline: h2 ? collapse(h2.textContent) : '',
        brand: brandEl && !brandEl.matches('form, div') ? collapse(brandEl.textContent).slice(0, 60) : '',
        contactName: name ? collapse(name.textContent) : '',
        role: role ? collapse(role.textContent) : '',
        photo: img ? (img.currentSrc || img.getAttribute('src')) : null,
        tels,
        privacy: priv ? { text: collapse(priv.textContent), href: (priv.querySelector('a') || {}).href || '' } : null,
      };
    });
    if (cfg.photo && cfg.photo.startsWith('/')) cfg.photo = `https://www.rwe.com${cfg.photo}`;
    out[h] = cfg;
    console.log(h.slice(0, 8), '→', cfg.headline.slice(0, 50), '|', cfg.contactName, '|', cfg.tels.length, 'tels');
  } catch (e) {
    out[h] = { error: String(e).slice(0, 100) };
    console.log(h.slice(0, 8), 'FAIL');
  }
}
await b.close();
fs.writeFileSync('/tmp/dcf-configs-raw.json', JSON.stringify(out, null, 1));
