import fs from 'fs';
import crypto from 'crypto';
import { execSync } from 'child_process';
import { chromium } from 'playwright';

const ids = fs.readFileSync('/tmp/careers-cf-ids.txt', 'utf8').trim().split('\n');
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const b = await chromium.launch();
const ctx = await b.newContext({ userAgent: UA, viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const map = JSON.parse(fs.readFileSync('blocks/form/dcf-configs.json', 'utf8'));
let title = ''; let desc = '';
for (const id of ids) {
  await page.goto(`https://www.rwe.com/en/rwe-careers-portal/contact-form/?c=${encodeURIComponent(id)}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(3500);
  const cfg = await page.evaluate(() => {
    const collapse = (s) => (s || '').replace(/[ \t\r\n]+/g, ' ').trim();
    const h2 = document.querySelector('main h2.headline, main h2');
    const brandEl = h2 ? h2.nextElementSibling : null;
    const con = document.querySelector('main aside [data-tpl="con01"], aside [data-tpl="con01"]');
    const img = con ? con.querySelector('img') : null;
    let name = null; let role = null;
    if (con) {
      const textEls = [...con.querySelectorAll('h2, h3, h4, p, strong, [class*="headline"]')].filter((el) => collapse(el.textContent) && !el.querySelector('img') && el.children.length <= 1);
      name = textEls[0] || null; role = textEls[1] || null;
    }
    const tels = con ? [...con.querySelectorAll('a[href^="tel:"]')].map((a) => ({ href: a.getAttribute('href'), label: collapse(a.textContent) })) : [];
    return {
      title: document.title.replace(/ \| RWE.*$/, '').trim(),
      desc: document.querySelector('meta[name="description"]')?.content || '',
      headline: h2 ? collapse(h2.textContent) : '',
      brand: brandEl && !brandEl.matches('form, div') ? collapse(brandEl.textContent).slice(0, 60) : '',
      name: name ? collapse(name.textContent) : '',
      role: role ? collapse(role.textContent) : '',
      photo: img ? (img.currentSrc || img.getAttribute('src')) : null,
      tels,
    };
  });
  title = cfg.title; desc = cfg.desc;
  let photo = null;
  if (cfg.photo) {
    const abs = cfg.photo.startsWith('/') ? `https://www.rwe.com${cfg.photo}` : cfg.photo;
    const base = abs.split('?')[0].split('/').pop().toLowerCase().replace(/[^a-z0-9.-]/g, '-');
    const h = crypto.createHash('md5').update(abs).digest('hex').slice(0, 6);
    const fname = `${base.replace(/\.[a-z]+$/, '')}-${h}.jpg`;
    try {
      execSync(`/usr/bin/curl -sf -A "${UA}" -o "/tmp/${fname}" "${abs}"`, { timeout: 60000 });
      fs.copyFileSync(`/tmp/${fname}`, `blocks/form/dcf/${fname}`);
      photo = `/blocks/form/dcf/${fname}`;
    } catch (e) { /* keep null */ }
  }
  map[id] = {
    headline: cfg.headline, brand: cfg.brand, name: cfg.name, role: cfg.role, tels: cfg.tels, photo,
  };
  console.log(id, '→', cfg.headline, '|', cfg.name, '|', cfg.role.slice(0, 40));
}
await b.close();
fs.writeFileSync('blocks/form/dcf-configs.json', JSON.stringify(map, null, 1));
console.log('title:', title, '| desc:', desc.slice(0, 80));
