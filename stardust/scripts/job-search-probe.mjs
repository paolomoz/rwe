// A6 job-search recreation probe: full-depth outline + verbatim content
// + computed styles + network log (jobs API endpoints), one navigation per width.
import { chromium } from 'playwright';
import fs from 'node:fs';

const W = +(process.argv[2] || 1440);
const URL_ = 'https://www.rwe.com/en/rwe-careers-portal/job-offers/';
const b = await chromium.launch({ headless: false, channel: 'chrome' });
const ctx = await b.newContext({ viewport: { width: W, height: 900 }, locale: 'en-US' });
const p = await ctx.newPage();

// network log: everything that looks like data/API traffic
const net = [];
p.on('request', (r) => {
  const u = r.url();
  const t = r.resourceType();
  if (t === 'xhr' || t === 'fetch' || /amplifyapp|api|search|job|graphql|query/i.test(u)) {
    net.push({ type: t, method: r.method(), url: u.slice(0, 300), post: (r.postData() || '').slice(0, 500) });
  }
});

await p.goto(URL_, { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForTimeout(3000);
// deny consent (gate state)
await p.evaluate(() => { const h = [...document.querySelectorAll('button,a')].find((x) => /^\s*deny all\s*$/i.test(x.textContent || '')); if (h) h.click(); });
await p.waitForTimeout(1200);
const total = await p.evaluate(() => document.body.scrollHeight);
for (let y = 0; y < total + 900; y += 600) { await p.evaluate((v) => window.scrollTo(0, v), y); await p.waitForTimeout(120); }
await p.evaluate(() => window.scrollTo(0, 0));
await p.waitForTimeout(1500);

const out = await p.evaluate(() => {
  const lines = [];
  const em = (el, d) => {
    if (!el || el.nodeType !== 1 || ['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'PATH', 'SOURCE'].includes(el.tagName)) return;
    const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
    const hidden = cs.display === 'none' || cs.visibility === 'hidden';
    let l = ' '.repeat(d) + el.tagName.toLowerCase();
    const cls = (el.className && el.className.toString ? el.className.toString() : '').trim();
    if (cls) l += '.' + cls.split(/\s+/).slice(0, 5).join('.');
    const tpl = el.getAttribute && el.getAttribute('data-tpl'); if (tpl) l += `⟨${tpl}⟩`;
    l += ` [${Math.round(r.left)},${Math.round(r.top + scrollY)},${Math.round(r.width)},${Math.round(r.height)}]`;
    if (hidden) { lines.push(l + ' HIDDEN'); return; }
    const keep = {};
    for (const pr of ['font-size', 'font-weight', 'line-height', 'font-family', 'color', 'background-color', 'background-image', 'padding', 'margin', 'text-align', 'border-radius', 'border', 'display', 'grid-template-columns', 'gap', 'object-fit', 'position', 'justify-content', 'align-items', 'flex-direction', 'flex-wrap', 'max-width', 'width', 'box-shadow']) {
      const v = cs.getPropertyValue(pr);
      if (v && !['none', 'normal', 'auto', 'rgba(0, 0, 0, 0)', '0px', 'static', 'visible', 'row', 'stretch', 'flex-start', 'nowrap'].includes(v)) keep[pr] = v.slice(0, 110);
    }
    const sv = Object.entries(keep).map(([k, v]) => `${k.replace(/^[a-z]+-/, '')}:${v}`).join(' ');
    if (sv) l += ' {' + sv.slice(0, 300) + '}';
    const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).filter(Boolean).join(' ');
    if (own) l += ` "${own.slice(0, 140)}"`;
    if (el.tagName === 'IMG') l += ' SRC=' + (el.currentSrc || el.src).slice(-90);
    if (el.tagName === 'A') l += ' HREF=' + (el.getAttribute('href') || '').slice(0, 90);
    if (el.tagName === 'INPUT') l += ` INPUT[${el.type};name=${el.name};value=${(el.value || '').slice(0, 40)};ph=${el.placeholder || ''}]`;
    if (el.tagName === 'SELECT') l += ` SELECT[name=${el.name};sel=${el.selectedIndex};opts=${[...el.options].slice(0, 30).map((o) => o.text.trim()).join('|').slice(0, 300)}]`;
    if (el.tagName === 'FORM') l += ` FORM[action=${el.getAttribute('action')};method=${el.getAttribute('method')}]`;
    if (el.tagName === 'IFRAME' || el.tagName === 'VIDEO') l += ` SRC=${(el.src || el.currentSrc || '').slice(0, 120)}`;
    lines.push(l);
    if (d < 18) [...el.children].forEach((k) => em(k, d + 1));
  };
  em(document.querySelector('main') || document.body, 0);
  return lines.join('\n');
});
fs.writeFileSync(`stardust/replica/job-search-outline-${W}.txt`, out);

// verbatim content + integration intel
const content = await p.evaluate(() => {
  const main = document.querySelector('main') || document.body;
  const heads = [...main.querySelectorAll('h1,h2,h3,h4')].map((h) => ({ t: h.tagName, hidden: !h.offsetParent, html: h.innerHTML.trim().slice(0, 300) }));
  const forms = [...document.querySelectorAll('form')].map((f) => ({
    action: f.getAttribute('action'), method: f.getAttribute('method'), cls: f.className,
    fields: [...f.elements].map((e) => ({ tag: e.tagName, type: e.type, name: e.name, value: (e.value || '').slice(0, 60), ph: e.placeholder || undefined })).slice(0, 40),
  }));
  const results = main.querySelector('[data-tpl="blanko-overview"], .search-results, [class*="job-result"], [class*="jobresult"]');
  const videos = [...main.querySelectorAll('video')].map((v) => ({ src: v.currentSrc || v.src, poster: v.poster, w: v.offsetWidth, h: v.offsetHeight, sources: [...v.querySelectorAll('source')].map((s) => s.src) }));
  const iframes = [...document.querySelectorAll('iframe')].map((f) => ({ src: f.src, w: f.offsetWidth, h: f.offsetHeight, cls: f.className }));
  const bgImgs = [...main.querySelectorAll('*')].map((e) => [getComputedStyle(e).backgroundImage, e.tagName + '.' + (e.className || '').toString().split(/\s+/)[0]]).filter(([b]) => b && b.includes('url(')).map(([b, s]) => ({ sel: s, bg: b.slice(0, 250) }));
  const inlineScripts = [...document.querySelectorAll('script:not([src])')].map((s) => s.textContent).filter((t) => /job|search|api|amplify|filter/i.test(t)).map((t) => t.slice(0, 1200)).slice(0, 12);
  return { title: document.title, heads, forms, videos, iframes, bgImgs: bgImgs.slice(0, 60), inlineScripts };
});
fs.writeFileSync(`stardust/replica/job-search-content-${W}.json`, JSON.stringify(content, null, 1));

// verbatim HTML of the volatile zones: freeze source of truth
const frozen = await p.evaluate(() => {
  const pick = (sel) => { const e = document.querySelector(sel); return e ? e.outerHTML : null; };
  return {
    results: pick('[data-tpl="blanko-overview"]'),
    jic: pick('[data-tpl="jic01"]'),
    jrc: pick('[data-tpl="jrc01"]'),
    src: pick('[data-tpl="src01"]'),
    sde: pick('[data-tpl="sde01"]'),
    tfb: pick('[data-tpl="tfb01"]'),
    jar: pick('[data-tpl="jar01"]'),
    njrt: pick('[data-tpl="n-jrt01"]'),
    njfc: pick('[data-tpl="n-jfc01"]'),
    las: pick('[data-tpl="las01r"]'),
    ses: pick('[data-tpl="ses01"]'),
    cta: pick('[data-tpl="cta01"]'),
  };
});
fs.writeFileSync(`stardust/replica/job-search-frozen-${W}.json`, JSON.stringify(frozen, null, 1));
fs.writeFileSync(`stardust/replica/job-search-net-${W}.json`, JSON.stringify(net, null, 1));
console.log(`outline ${W}: ${out.split('\n').length} lines; net ${net.length}; frozen keys: ${Object.entries(frozen).filter(([, v]) => v).map(([k]) => k).join(',')}`);
await b.close();
