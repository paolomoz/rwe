// import-article.mjs — A1 sibling-tier importer (press releases + IR
// publications). Fetches each live article and emits EDS content matching
// the gated article-detail archetype structure (content/en/press/rwe-ag/
// 2026-08-13-….html). Verbatim content: NBSP-safe collapsing, inline
// strong/em/a preserved, media kept on the www.rwe.com origin during
// transition (PDF policy parity).
//
// Usage: node stardust/migration/import-article.mjs <path> [<path>…]
//        node stardust/migration/import-article.mjs --list /tmp/a1-list.json [--concurrency 4]
import fs from 'fs';
import { chromium } from 'playwright';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const args = process.argv.slice(2);
let paths = [];
let concurrency = 4;
for (let i = 0; i < args.length; i += 1) {
  if (args[i] === '--list') { paths = JSON.parse(fs.readFileSync(args[i + 1], 'utf8')); i += 1; } else if (args[i] === '--concurrency') { concurrency = Number(args[i + 1]); i += 1; } else paths.push(args[i]);
}
if (!paths.length) { console.error('no paths'); process.exit(1); }

const extractPage = async (page, path) => {
  await page.goto(`https://www.rwe.com${path}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(3000);
  // trigger lazy-loaded media (images use loading=lazy / data-src)
  await page.evaluate(async () => {
    const h = document.body.scrollHeight;
    for (let y = 0; y <= h; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(1500);
  return page.evaluate(() => {
    const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const escAttr = (s) => esc(s).replace(/"/g, '&quot;');
    // NBSP-safe collapse (never \s+ — it eats  )
    const collapse = (s) => s.replace(/[ \t\r\n]+/g, ' ');
    const ABS = (u0) => {
      const u = (u0 || '').trim();
      if (!u) return u;
      if (u.startsWith('//')) return `https:${u}`;
      if (u.startsWith('/en/') || u.startsWith('/de/')) return u; // site-internal stays relative
      if (u.startsWith('/')) return `https://www.rwe.com${u}`; // /-/media etc.
      return u;
    };
    // serialize rich text: keep strong/em/a/br/nbsp, strip spans/styles
    const serializeInline = (node) => {
      let out = '';
      node.childNodes.forEach((n) => {
        if (n.nodeType === 3) { out += esc(n.nodeValue); return; }
        if (n.nodeType !== 1) return;
        const tag = n.tagName.toLowerCase();
        if (tag === 'br') { out += '<br>'; return; }
        if (tag === 'script' || tag === 'style') return;
        const inner = serializeInline(n);
        if (tag === 'sub' || tag === 'sup') out += `<${tag}>${inner}</${tag}>`;
        else if (tag === 'strong' || tag === 'b') out += inner.trim() ? `<strong>${inner}</strong>` : inner;
        else if (tag === 'em' || tag === 'i') out += inner.trim() ? `<em>${inner}</em>` : inner;
        else if (tag === 'a') {
          const href = ABS(n.getAttribute('href') || '');
          // author-formatted CTAs on live carry btn/affordance classes inside <strong> already handled upstream
          out += href ? `<a href="${escAttr(href)}">${inner}</a>` : inner;
        } else out += inner; // spans/divs unwrap
      });
      return out;
    };
    // trailing <br> runs (incl. inside a closing strong/em) are live markup noise
    const tidy = (s) => s.replace(/(?:<br>\s*)+(<\/(?:strong|em)>)?$/g, '$1').replace(/(?:<br>\s*)+(<\/(?:strong|em)>)/g, '$1');
    const serializeBlockEl = (el) => {
      const tag = el.tagName.toLowerCase();
      if (tag === 'p') {
        const t = tidy(collapse(serializeInline(el)).trim());
        return t ? `<p>${t}</p>` : '';
      }
      if (tag === 'h2' || tag === 'h3' || tag === 'h4') {
        const t = collapse(serializeInline(el)).trim();
        return t ? `<${tag}>${t}</${tag}>` : '';
      }
      if (tag === 'ul' || tag === 'ol') {
        const lis = [...el.querySelectorAll(':scope > li')].map((li) => `<li>${tidy(collapse(serializeInline(li)).trim())}</li>`).join('\n');
        return `<${tag}>\n${lis}\n</${tag}>`;
      }
      if (tag === 'table') return ''; // none observed in A1 survey; flagged via counts if present
      return '';
    };

    const out = { warnings: [] };
    out.title = (document.querySelector('meta[property="og:title"]')?.content || document.title).replace(/ \| RWE.*$/, '').trim();
    out.description = document.querySelector('meta[name="description"]')?.content || '';
    out.ogImage = ABS(document.querySelector('meta[property="og:image"]')?.content || '');
    out.date = document.querySelector('meta[name="date"]')?.content || '';

    // ---- stage: sta02 (press) or hea01-led (IR) ----
    const sta = document.querySelector('[data-tpl="sta02"]');
    const h1El = document.querySelector('main h1, h1');
    out.h1 = h1El ? collapse(serializeInline(h1El)).trim() : '';
    out.brand = '';
    if (sta) {
      const h3 = sta.querySelector('h3, .subheadline');
      if (h3) out.brand = collapse(h3.textContent).trim();
    }
    // back link: live sta02 back affordance
    const backA = [...document.querySelectorAll('a')].find((a) => /back to/i.test(a.textContent) && a.closest('[data-tpl="sta02"], [class*="stage"], main'));
    out.back = backA ? { href: ABS(backA.getAttribute('href')), label: collapse(backA.textContent).trim() } : null;
    // IR byline (date + category line under the h1)
    const byline = document.querySelector('[data-tpl="bnv01"], [class*="byline"]');
    out.byline = byline ? collapse(byline.textContent).trim() : '';

    // ---- body: walk content modules in DOM order within the main column ----
    // main column = the article content ancestor that holds tic01/mediaContainer;
    // exclude the contact rail (con01 ancestor), related teasers, breadcrumb.
    const mainEl = document.querySelector('main') || document.body;
    const bodyParts = [];
    const seen = new Set();
    const mods = [...mainEl.querySelectorAll('[data-tpl="tic01"], [data-tpl="mediaContainer"], [data-tpl="hea01"], [data-tpl="ll01"], [data-tpl="cta01"]')];
    mods.forEach((m) => {
      // skip stage + contact rail + related zone + anything nested in another captured module
      if (m.closest('[data-tpl="sta02"]')) return;
      if (m.closest('[data-tpl="con01"], [data-tpl="contact-container"], [class*="contact"]')) return;
      if (m.closest('[data-tpl="tea01r"], [data-tpl="grid-bas-05"]')) return;
      if ([...seen].some((s) => s.contains(m))) return;
      const tpl = m.getAttribute('data-tpl');
      if (tpl === 'tic01') {
        [...m.querySelectorAll('p, ul, ol, h2, h3, h4, img')].forEach((el) => {
          if (el.closest('ul, ol') !== null && el.tagName !== 'UL' && el.tagName !== 'OL') return; // lis handled by their list
          if (el.tagName === 'IMG') {
            if (el.closest('p')) return; // inline imgs ride their paragraph (none observed)
            const src = ABS(el.currentSrc || el.getAttribute('src') || el.getAttribute('data-src') || '');
            if (src) bodyParts.push(`<p><img src="${escAttr(src)}" alt="${escAttr(el.getAttribute('alt') || '')}"></p>`);
            return;
          }
          const s = serializeBlockEl(el);
          if (s) bodyParts.push(s);
        });
        seen.add(m);
      } else if (tpl === 'mediaContainer') {
        const img = m.querySelector('img');
        if (img) {
          const src = ABS(img.currentSrc || img.getAttribute('src') || img.getAttribute('data-src') || '');
          if (src) bodyParts.push(`<p><img src="${escAttr(src)}" alt="${escAttr(img.getAttribute('alt') || '')}"></p>`);
          const note = m.querySelector('figcaption, [class*="zoom"], [class*="caption"]');
          if (note && note.textContent.trim()) bodyParts.push(`<p>${esc(collapse(note.textContent).trim())}</p>`);
        }
        seen.add(m);
      } else if (tpl === 'hea01') {
        const h = m.querySelector('h2, h3');
        if (h && h !== h1El) { const s = serializeBlockEl(h); if (s) bodyParts.push(s); }
        seen.add(m);
      } else if (tpl === 'll01') {
        const title = m.querySelector('h3, h4');
        const links = [...m.querySelectorAll('a')].map((a) => ({ href: ABS(a.getAttribute('href')), label: collapse(a.textContent).trim() })).filter((l) => l.href && l.label);
        if (links.length) bodyParts.push({ downloads: { title: title ? collapse(title.textContent).trim() : 'Downloads', links } });
        seen.add(m);
      } else if (tpl === 'cta01') {
        const a = m.querySelector('a');
        if (a) {
          const solid = /gradient-green(?!-)|btn--solid|color-cta--default/.test(a.className);
          const href = ABS(a.getAttribute('href'));
          const label = collapse(a.textContent).trim();
          if (href && label) bodyParts.push(`<p><${solid ? 'strong' : 'em'}><a href="${escAttr(href)}">${esc(label)}</a></${solid ? 'strong' : 'em'}></p>`);
        }
        seen.add(m);
      }
    });
    out.bodyParts = bodyParts;

    // ---- contacts (con01 cards + consent note) ----
    out.contacts = [...document.querySelectorAll('[data-tpl="con01"]')].map((c) => {
      const img = c.querySelector('img');
      const name = c.querySelector('h2, h3, [class*="name"]');
      const role = name ? name.nextElementSibling : null;
      const tel = c.querySelector('a[href^="tel:"]');
      const mail = [...c.querySelectorAll('a')].find((a) => /e-?mail|contact-form/i.test(a.textContent + a.href));
      return {
        img: img ? ABS(img.currentSrc || img.getAttribute('src')) : null,
        imgAlt: img ? (img.getAttribute('alt') || '') : '',
        name: name ? collapse(name.textContent).trim() : '',
        role: role ? collapse(role.textContent).trim() : '',
        tel: tel ? { href: tel.getAttribute('href'), label: collapse(tel.textContent).trim() } : null,
        mail: mail ? { href: ABS(mail.getAttribute('href')), label: collapse(mail.textContent).trim() } : null,
      };
    }).filter((c) => c.name);
    const noteEls = [...document.querySelectorAll('div, p')].filter((el) => /not allowed the cookies/i.test(el.textContent));
    const socialNote = noteEls[noteEls.length - 1]; // deepest match
    out.socialNote = socialNote ? collapse(socialNote.textContent).trim() : '';

    // ---- related teasers (tea01r) ----
    out.related = [...document.querySelectorAll('[data-tpl="tea01r"]')].map((t) => {
      const link = t.querySelector('a[href]');
      const h3 = t.querySelector('h3');
      let bg = [...t.querySelectorAll('[style*="background-image"]')].map((el) => (el.getAttribute('style').match(/url\('?([^')]+)'?\)/) || [])[1]).find(Boolean);
      if (!bg) {
        // live sets card media via an inline <style> ([data-image-id] media queries)
        const styleEl = t.querySelector('style') || (t.parentElement ? t.parentElement.querySelector('style') : null);
        if (styleEl) {
          const urls = [...styleEl.textContent.matchAll(/url\((['"]?)([^'")]+)\1\)/g)].map((mm) => mm[2]);
          bg = urls.find((u) => !/mw=479|mw=767/.test(u)) || urls[0];
        }
      }
      const img = t.querySelector('img');
      const date = [...t.querySelectorAll('p, span, time')].map((el) => el.textContent.trim()).find((s) => /^\d{2}\.\d{2}\.\d{4}$/.test(s));
      return {
        href: link ? ABS(link.getAttribute('href')) : null,
        title: h3 ? collapse(h3.textContent).trim() : '',
        img: ABS(bg || (img ? (img.currentSrc || img.getAttribute('src')) : null)),
        date: date || '',
      };
    }).filter((t) => t.href && t.title);

    // ---- breadcrumb ----
    const bcLis = [...document.querySelectorAll('#breadcrumb-list li, nav[aria-label*="read"] li, [id*="breadcrumb"] li')];
    out.breadcrumb = bcLis.map((li) => {
      const a = li.querySelector('a');
      return { href: a && a.getAttribute('href') ? ABS(a.getAttribute('href')) : null, label: collapse(li.textContent).trim() };
    }).filter((b) => b.label);

    out.liveTextNodes = [...mainEl.querySelectorAll('p, li, h1, h2, h3, h4')].filter((el) => el.textContent.trim()).length;
    return out;
  });
};

const COMPANIES = { 'rwe-ag': 'RWE AG' }; // display names come from the page's own stage h3

const renderContent = (path, d) => {
  const isPress = path.startsWith('/en/press/');
  const companySlug = isPress ? path.split('/')[3] : '';
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  // publishdate: the URL slug date is authoritative (meta[name=date] drifts to last-modified)
  const urlDate = (path.match(/(\d{4}-\d{2}-\d{2})/) || [])[1];
  d.date = urlDate || d.date;
  if (!isPress) {
    // IR publication: no h1/sta02 on live — the first body h2 is the headline.
    // Promote it to the stage h1 (delivery contract: exactly one h1).
    const i = d.bodyParts.findIndex((p2) => typeof p2 === 'string' && p2.startsWith('<h2>'));
    if (i >= 0 && !d.h1) {
      d.h1 = d.bodyParts[i].replace(/^<h2>|<\/h2>$/g, '');
      d.bodyParts.splice(i, 1);
    }
    if (!d.title || /News Investor Relations/.test(d.title)) d.title = d.h1.replace(/<[^>]+>/g, '');
    d.brand = '';
    d.byline = '';
    d.back = { href: path.replace(/\/news\/[^/]+\/?$/, '/'), label: (d.back && d.back.label) || 'Back to previous page' };
  }
  const meta = [
    `        <div><div>Title</div><div>${esc(d.title)}</div></div>`,
    `        <div><div>Description</div><div>${esc(d.description)}</div></div>`,
    '        <div><div>Theme</div><div>solid-header</div></div>',
  ];
  if (d.date) meta.push(`        <div><div>publishdate</div><div>${d.date}</div></div>`);
  if (isPress && companySlug) meta.push(`        <div><div>company</div><div>${companySlug}</div></div>`);
  if (!isPress) meta.push('        <div><div>category</div><div>news</div></div>');
  if (d.description) meta.push(`        <div><div>teaser</div><div>${esc(d.description)}</div></div>`);

  const stage = [];
  const backHref = (d.back && d.back.href) || (isPress ? '/en/press/' : path.replace(/\/news\/[^/]+\/?$/, '/'));
  const backLabel = (d.back && d.back.label) || 'Back to previous page';
  stage.push(`      <p><a href="${backHref}">${esc(backLabel)}</a></p>`);
  if (d.brand) stage.push(`      <h3>${esc(d.brand)}</h3>`);
  else if (d.byline) stage.push(`      <h3>${esc(d.byline)}</h3>`);
  stage.push(`      <h1>${d.h1}</h1>`);

  const body = [];
  d.bodyParts.forEach((part) => {
    if (typeof part === 'string') { body.push(`      ${part}`); return; }
    if (part.downloads) {
      body.push('      <div class="downloads">');
      body.push('        <div>');
      body.push('          <div>');
      body.push(`            <h3>${esc(part.downloads.title)}</h3>`);
      body.push('            <ul>');
      part.downloads.links.forEach((l) => body.push(`              <li><a href="${l.href}">${esc(l.label)}</a></li>`));
      body.push('            </ul>');
      body.push('          </div>');
      body.push('        </div>');
      body.push('      </div>');
    }
  });

  if (d.contacts.length) {
    body.push('      <div class="contacts">');
    d.contacts.forEach((c) => {
      body.push('        <div>');
      if (c.img) body.push(`          <div><img src="${c.img}" alt="${esc(c.imgAlt || c.name)}"></div>`);
      body.push('          <div>');
      body.push(`            <h2>${esc(c.name)}</h2>`);
      if (c.role) body.push(`            <h3>${esc(c.role)}</h3>`);
      if (c.tel) body.push(`            <p><a href="${c.tel.href}">${esc(c.tel.label)}</a></p>`);
      if (c.mail) body.push(`            <p><strong><a href="${c.mail.href}">${esc(c.mail.label)}</a></strong></p>`);
      body.push('          </div>');
      body.push('        </div>');
    });
    if (d.socialNote) {
      body.push('        <div>');
      body.push(`          <div>${esc(d.socialNote)}</div>`);
      body.push('        </div>');
    }
    body.push('      </div>');
  }

  const sections = [];
  sections.push(`    <div>\n      <div class="metadata">\n${meta.join('\n')}\n      </div>\n    </div>`);
  sections.push(`    <div>\n${stage.join('\n')}\n      <div class="section-metadata">\n        <div><div>style</div><div>article-stage</div></div>\n      </div>\n    </div>`);
  sections.push(`    <div>\n${body.join('\n')}\n      <div class="section-metadata">\n        <div><div>style</div><div>article-body</div></div>\n      </div>\n    </div>`);

  if (d.related.length) {
    const rel = d.related.map((t) => `        <div>
          <div><img src="${t.img || ''}" alt="${esc(t.title)}"></div>
          <div>
            <h3><a href="${t.href}">${esc(t.title)}</a></h3>
            <p>${t.date}</p>
          </div>
        </div>`).join('\n');
    sections.push(`    <div>\n      <div class="cards related">\n${rel}\n      </div>\n    </div>`);
  }

  if (d.breadcrumb.length) {
    const bc = d.breadcrumb.map((b) => `<a href="${b.href || `${path}`}">${esc(b.label)}</a>`).join(' ');
    sections.push(`    <div>\n      <div class="breadcrumb">\n        <div>\n          <div>${bc}</div>\n        </div>\n      </div>\n    </div>`);
  }

  return `<body>\n  <header></header>\n  <main>\n${sections.join('\n')}\n  </main>\n  <footer></footer>\n</body>\n`;
};

const b = await chromium.launch();
const ledger = {};
let done = 0;
const worker = async () => {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, userAgent: UA });
  const page = await ctx.newPage();
  while (paths.length) {
    const path = paths.shift();
    try {
      const d = await extractPage(page, path);
      const html = renderContent(path, d);
      const file = `content${path.replace(/\/$/, '')}.html`;
      fs.mkdirSync(file.slice(0, file.lastIndexOf('/')), { recursive: true });
      fs.writeFileSync(file, html);
      const emitted = (html.match(/<(p|li|h1|h2|h3)[ >]/g) || []).length;
      ledger[path] = { ok: true, live: d.liveTextNodes, emitted, contacts: d.contacts.length, related: d.related.length, warn: d.warnings };
      done += 1;
      console.log(`[${done}] ${path} live:${d.liveTextNodes} emitted:${emitted}`);
    } catch (e) {
      ledger[path] = { ok: false, error: String(e).slice(0, 200) };
      console.log(`FAIL ${path}: ${String(e).slice(0, 120)}`);
    }
  }
  await ctx.close();
};
await Promise.all(Array.from({ length: concurrency }, worker));
await b.close();
fs.writeFileSync('stardust/migration/import-articles-ledger.json', JSON.stringify(ledger, null, 1));
const fails = Object.values(ledger).filter((l) => !l.ok).length;
console.log(`done: ${Object.keys(ledger).length - fails} ok, ${fails} failed`);
