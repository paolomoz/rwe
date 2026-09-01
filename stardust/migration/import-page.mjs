// import-page.mjs — generic sibling-tier importer for the in-scope wave
// (content-page, ir-content, location-detail, legal, section-landing).
// Walks the live page's module sequence (data-tpl vocabulary) and emits EDS
// content composed from the gated archetype building blocks. Verbatim
// content (NBSP-safe); images rehosted later by rehost pass; unknown
// modules logged per page, never invented.
//
// Usage: node stardust/migration/import-page.mjs <path> [...]
//        node stardust/migration/import-page.mjs --list file.json [--concurrency 4]
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
  const resp = await page.goto(`https://www.rwe.com${path}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
  if (resp && resp.status() >= 400) throw new Error(`HTTP ${resp.status()}`);
  await page.waitForTimeout(2500);
  await page.evaluate(async () => {
    const h = document.body.scrollHeight;
    for (let y = 0; y <= h; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 100)); }
    window.scrollTo(0, 0);
  });
  await page.evaluate(() => {
    document.querySelectorAll('main .accordion-item__button[aria-expanded="false"], main .accordion-item button[aria-expanded="false"]').forEach((btn) => btn.click());
  });
  await page.waitForTimeout(1200);
  return page.evaluate(() => {
    const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const escAttr = (s) => esc(s).replace(/"/g, '&quot;');
    const collapse = (s) => s.replace(/[ \t\r\n]+/g, ' ');
    const ABS = (u0) => {
      const u = (u0 || '').trim();
      if (!u) return u;
      if (u.startsWith('javascript:')) return '';
      if (u.startsWith('//')) return `https:${u}`;
      if (u.startsWith('/en/') || u.startsWith('/de/')) return u;
      if (u.startsWith('/')) return `https://www.rwe.com${u}`;
      return u;
    };
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
          out += href ? `<a href="${escAttr(href)}">${inner}</a>` : inner;
        } else out += inner;
      });
      return out;
    };
    const tidy = (s) => s.replace(/(?:<br>\s*)+(<\/(?:strong|em)>)?$/g, '$1').replace(/(?:<br>\s*)+(<\/(?:strong|em)>)/g, '$1');
    const blockEl = (el) => {
      const tag = el.tagName.toLowerCase();
      if (tag === 'p') { const t = tidy(collapse(serializeInline(el)).trim()); return t && t !== '&nbsp;' ? `<p>${t}</p>` : ''; }
      if (['h2', 'h3', 'h4'].includes(tag)) { const t = collapse(serializeInline(el)).trim(); return t ? `<${tag}>${t}</${tag}>` : ''; }
      if (tag === 'ul' || tag === 'ol') {
        const lis = [...el.querySelectorAll(':scope > li')].map((li) => `<li>${tidy(collapse(serializeInline(li)).trim())}</li>`).join('\n');
        return `<${tag}>\n${lis}\n</${tag}>`;
      }
      return '';
    };
    const imgOf = (scope) => {
      const imgs = [...scope.querySelectorAll('img')].filter((i) => {
        const s = i.currentSrc || i.getAttribute('src') || i.getAttribute('data-src') || '';
        return s && !/impact-print|logo|icon/i.test(s);
      });
      imgs.sort((a2, b2) => (b2.getBoundingClientRect().width * b2.getBoundingClientRect().height) - (a2.getBoundingClientRect().width * a2.getBoundingClientRect().height));
      const img = imgs[0];
      if (img) {
        const src = ABS(img.currentSrc || img.getAttribute('src') || img.getAttribute('data-src') || '');
        if (src) return { src, alt: img.getAttribute('alt') || '' };
      }
      const styled = [...scope.querySelectorAll('[style*="background-image"]')].map((el) => (el.getAttribute('style').match(/url\('?"?([^'")]+)'?"?\)/) || [])[1]).find(Boolean);
      if (styled) return { src: ABS(styled), alt: '' };
      const styleEl = scope.querySelector('style');
      if (styleEl) {
        const urls = [...styleEl.textContent.matchAll(/url\((['"]?)([^'")]+)\1\)/g)].map((m) => m[2]);
        const u = urls.find((x) => !/mw=479|mw=767/.test(x)) || urls[0];
        if (u) return { src: ABS(u), alt: '' };
      }
      return null;
    };
    const isGrey = (el) => {
      let n = el;
      while (n && n !== document.body) {
        const bg = getComputedStyle(n).backgroundColor;
        if (bg === 'rgb(244, 244, 242)' || bg === 'rgb(232, 232, 228)') return true;
        if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'rgb(255, 255, 255)') return false;
        n = n.parentElement;
      }
      return false;
    };

    const CHROME = new Set(['meta-navigation', 'target-group-select', 'las01r', 'quick-navigation', 'tag-bar-sticky',
      'ses01', 'sms01', 'fol01', 'global-zone', 'footer', 'individual-zone', 'individual-global-zone', 'modal',
      'grid-wrapper', 'grid-form-01', 'blanko-overview', 'div01',
      'detail-one-marginal-column', 'detail-two-flex-marginal-column', 'inline-style', 'lin01', 'breadcrumb',
      'contact-container', 'head02', 'bnv01']);
    const GRIDS = new Set(['grid-bas-01', 'grid-bas-02', 'grid-bas-03', 'grid-bas-04', 'grid-bas-05', 'grid-bas-06',
      'grid-ext-02', 'grid-ext-03', 'grid-ext-04', 'grid-ext-05', 'grid-ext-06']);
    const HANDLED = new Set(['sta01', 'sli01', 'sta02', 'sta04', 'tic01', 'tic02', 'tic03', 'hea01', 'mediaContainer',
      'cta01', 'll01', 'acc01', 'il01', 'tea01r', 'tea02r', 'tea03r', 'tea00n', 'plt01r', 'pl01r', 'quo01',
      'con01', 'con02', 'tbl01', 'tbl02', 'lll01', 'it01', 'el01']);
    const PLACEHOLDER = new Set(['htm01', 'iframe', 'video', 'form', 'form-v2', 'form-v3', 'cde-input',
      'jic01', 'jrc01', 'src01', 'sde01', 'tfb01', 'n-jrt01', 'n-jfc01', 'jar01', 'ri01', 'tbl-filter', 'global-event-filter', 'df01', 'cf01']);

    const out = { warnings: [], placeholders: [], parts: [] };
    out.title = (document.querySelector('meta[property="og:title"]')?.content || document.title).replace(/ \| RWE.*$/, '').trim();
    if (out.title === '404' || /^Oops!?$/.test(document.querySelector('h1')?.textContent.trim() || '')) out.is404 = true;
    out.description = document.querySelector('meta[name="description"]')?.content || '';
    out.ogImage = ABS(document.querySelector('meta[property="og:image"]')?.content || '');

    const mainEl = document.body;
    const inFooter = (el) => !!el.closest('footer, [data-tpl="fol01"], [data-tpl="global-zone"]');
    const mods = [...mainEl.querySelectorAll('[data-tpl]')].filter((m) => {
      const t = m.getAttribute('data-tpl');
      if (CHROME.has(t)) return false;
      if (inFooter(m)) return false;
      return true;
    });
    const seen = [];
    const claimed = (m) => seen.some((s) => s.contains(m));
    const parts = out.parts; // sequence of {kind, ...}

    mods.forEach((m) => {
      if (claimed(m)) return;
      const t = m.getAttribute('data-tpl');
      if (GRIDS.has(t)) {
        // bare markup directly inside a grid (timeline milestones etc.) —
        // extract only elements whose nearest data-tpl ancestor is this grid
        const blocks = [];
        [...m.querySelectorAll('p, ul, ol, h2, h3, h4, img')].forEach((el) => {
          if (el.closest('[data-tpl]') !== m) return;
          if (el.closest('[class*="clone"], [class*="slick-cloned"]')) return;
          const la = el.closest('ul, ol');
          if (la && m.contains(la) && !['UL', 'OL'].includes(el.tagName)) return;
          if (el.tagName === 'IMG') {
            const src = ABS(el.currentSrc || el.getAttribute('src') || el.getAttribute('data-src') || '');
            if (src && !/impact-print|logo/i.test(src)) blocks.push(`<p><img src="${escAttr(src)}" alt="${escAttr(el.getAttribute('alt') || '')}"></p>`);
            return;
          }
          const s = blockEl(el);
          if (s) blocks.push(s);
        });
        if (blocks.length) parts.push({ kind: 'prose', blocks, grey: isGrey(m) });
        return; // never claim the grid — inner modules process on their own
      }
      if (!HANDLED.has(t) && !PLACEHOLDER.has(t)) { out.warnings.push(`unknown module ${t}`); return; }
      if (PLACEHOLDER.has(t)) { out.placeholders.push(t); seen.push(m); return; }
      const grey = isGrey(m);
      if (t === 'sta01' || t === 'sli01' || t === 'sta04') {
        // page stage → hero content slide(s); sli01 wraps nested sta01 slides
        let slides;
        if (t === 'sli01') {
          const nested = [...m.querySelectorAll('[data-tpl="sta01"]')];
          if (nested.length) slides = nested;
          else {
            // content carousel (tic02 slides) — flatten to prose (layout simplified, logged)
            const tics = [...m.querySelectorAll('[data-tpl="tic02"], [data-tpl="tic01"]')];
            if (tics.length) {
              const blocks = [];
              tics.forEach((tt) => {
                [...tt.querySelectorAll('p, h2, h3, h4, ul, ol')].forEach((el) => {
                  const la = el.closest('ul, ol');
                  if (la && tt.contains(la) && !['UL', 'OL'].includes(el.tagName)) return;
                  const s = blockEl(el);
                  if (s) blocks.push(s);
                });
              });
              if (blocks.length) { parts.push({ kind: 'prose', blocks, grey: isGrey(m) }); out.warnings.push('sli01 content carousel flattened to prose'); }
              seen.push(m);
              return;
            }
            slides = [m];
          }
        } else slides = [m];
        const rows = (slides.length ? slides : [m]).slice(0, 4).map((s) => {
          const img = imgOf(s) || (out.ogImage ? { src: out.ogImage, alt: '' } : null);
          const h = s.querySelector('h1, h2, .headline');
          const sub = s.querySelector('h3, .subheadline');
          const cta = s.querySelector('a[class*="btn"], a[class*="cta"]');
          return {
            img,
            heading: h ? collapse(h.textContent).trim() : '',
            sub: sub && sub !== h ? collapse(sub.textContent).trim() : '',
            cta: cta ? { href: ABS(cta.getAttribute('href')), label: collapse(cta.textContent).trim(), solid: /solid|default/.test(cta.className) } : null,
          };
        }).filter((r) => r.heading || r.img);
        // dedupe identical slides (slick clones)
        const uniq = []; const keys = new Set();
        rows.forEach((r) => { const k = r.heading + (r.img ? r.img.src : ''); if (!keys.has(k)) { keys.add(k); uniq.push(r); } });
        if (uniq.length) parts.push({ kind: 'hero', rows: uniq, video: t === 'sta04' });
        seen.push(m);
      } else if (t === 'sta02') {
        const h1 = m.querySelector('h1');
        const h3 = m.querySelector('h3, .subheadline');
        const backA = [...m.querySelectorAll('a')].find((a) => /back to/i.test(a.textContent));
        parts.push({
          kind: 'stage2',
          h1: h1 ? collapse(serializeInline(h1)).trim() : '',
          brand: h3 ? collapse(h3.textContent).trim() : '',
          back: backA ? { href: ABS(backA.getAttribute('href')), label: collapse(backA.textContent).trim() } : null,
        });
        seen.push(m);
      } else if (t === 'tic01' || t === 'tic02' || t === 'tic03') {
        const blocks = [];
        [...m.querySelectorAll('p, ul, ol, h2, h3, h4, img')].forEach((el) => {
          const la = el.closest('ul, ol');
          if (la && m.contains(la) && el.tagName !== 'UL' && el.tagName !== 'OL') return;
          if (el.tagName === 'IMG') {
            if (el.closest('p') || el.closest('[data-tpl="tea01r"], [data-tpl="tea03r"]')) return;
            const src = ABS(el.currentSrc || el.getAttribute('src') || el.getAttribute('data-src') || '');
            if (src) blocks.push(`<p><img src="${escAttr(src)}" alt="${escAttr(el.getAttribute('alt') || '')}"></p>`);
            return;
          }
          const s = blockEl(el);
          if (s) blocks.push(s);
        });
        if (blocks.length) parts.push({ kind: 'prose', blocks, centered: /centered/.test(m.className), grey });
        seen.push(m);
      } else if (t === 'hea01') {
        const h = m.querySelector('h1, h2, h3');
        if (h && h.tagName !== 'H1') { const s = blockEl(h); if (s) parts.push({ kind: 'prose', blocks: [s], grey }); }
        seen.push(m);
      } else if (t === 'mediaContainer') {
        const img = imgOf(m);
        if (img) {
          const blocks = [`<p><img src="${escAttr(img.src)}" alt="${escAttr(img.alt)}"></p>`];
          const note = m.querySelector('figcaption');
          if (note && note.textContent.trim()) blocks.push(`<p>${esc(collapse(note.textContent).trim())}</p>`);
          parts.push({ kind: 'prose', blocks, grey });
        }
        seen.push(m);
      } else if (t === 'cta01') {
        const a = m.querySelector('a');
        if (a) {
          const solid = /gradient-green(?!-)|btn--solid|color-cta--default/.test(a.className) && !/reverse/.test(a.className);
          const href = ABS(a.getAttribute('href'));
          const label = collapse(a.textContent).trim();
          if (href && label) {
            const btn = `<p><${solid ? 'strong' : 'em'}><a href="${escAttr(href)}">${esc(label)}</a></${solid ? 'strong' : 'em'}></p>`;
            const last = parts[parts.length - 1];
            if (last && last.kind === 'prose' && last.ctaRun && last.grey === grey) last.blocks.push(btn);
            else parts.push({ kind: 'prose', blocks: [btn], grey, ctaRun: true });
          }
        }
        seen.push(m);
      } else if (t === 'll01' || t === 'lll01') {
        const title = m.querySelector('h3, h4');
        const links = [...m.querySelectorAll('a')].map((a) => ({ href: ABS(a.getAttribute('href')), label: collapse(a.textContent).trim() })).filter((l) => l.href && l.label);
        if (links.length) parts.push({ kind: 'downloads', title: title ? collapse(title.textContent).trim() : '', links, grey });
        seen.push(m);
      } else if (t === 'acc01') {
        const items = [...m.querySelectorAll('.accordion-item')].map((it) => {
          const label = it.querySelector('.accordion-item__button-label, button span');
          const content = it.querySelector('.accordion-item__content, article');
          const blocks = [];
          if (content) {
            [...content.querySelectorAll('p, ul, ol, h4')].forEach((el) => {
              const la = el.closest('ul, ol');
              if (la && content.contains(la) && !['UL', 'OL'].includes(el.tagName)) return;
              const s = blockEl(el);
              if (s) blocks.push(s);
            });
          }
          return { heading: label ? collapse(label.textContent).trim() : '', blocks };
        }).filter((it) => it.heading && it.blocks.length);
        if (items.length) parts.push({ kind: 'accordion', items, grey });
        else out.placeholders.push('acc01-dynamic');
        seen.push(m);
      } else if (t === 'il01') {
        const blocks = [];
        const h = m.querySelector('h2');
        if (h) blocks.push(blockEl(h));
        [...m.querySelectorAll('.content p')].forEach((el) => { const s = blockEl(el); if (s) blocks.push(s); });
        const lis = [...m.querySelectorAll(':scope > ul > li')].map((li) => `<li>${tidy(collapse(serializeInline(li)).trim())}</li>`);
        if (lis.length) blocks.push(`<ul>\n${lis.join('\n')}\n</ul>`);
        parts.push({ kind: 'icon-list', blocks: blocks.filter(Boolean), grey });
        seen.push(m);
      } else if (['tea01r', 'tea02r', 'tea03r', 'tea00n'].includes(t)) {
        const img = t === 'tea00n' ? imgOf(m) : imgOf(m);
        const link = m.querySelector('a[href]');
        const h3 = m.querySelector('h3');
        const p = [...m.querySelectorAll('p')].find((x) => x.textContent.trim());
        const cta = m.querySelector('[class*="affordance"] span, .read-more-link span, [class*="cta"] span');
        const card = {
          plain: t === 'tea00n',
          img,
          href: link ? ABS(link.getAttribute('href')) : null,
          title: h3 ? collapse(h3.textContent).trim() : '',
          text: p ? tidy(collapse(serializeInline(p)).trim()) : '',
          cta: cta ? collapse(cta.textContent).trim() : '',
        };
        const last = parts[parts.length - 1];
        if (last && last.kind === 'cards' && last.grey === grey) last.cards.push(card);
        else parts.push({ kind: 'cards', cards: [card], grey });
        seen.push(m);
      } else if (t === 'plt01r' || t === 'pl01r') {
        const a = m.querySelector('a[href]');
        const time = m.querySelector('time');
        const h4 = m.querySelector('h4, .headline');
        const item = {
          href: a ? ABS(a.getAttribute('href')) : null,
          date: time ? (time.getAttribute('datetime') || collapse(time.textContent).trim()) : '',
          title: h4 ? collapse(h4.textContent).trim() : '',
        };
        const last = parts[parts.length - 1];
        if (last && last.kind === 'press') last.items.push(item);
        else parts.push({ kind: 'press', items: [item], grey });
        seen.push(m);
      } else if (t === 'quo01') {
        const q = m.querySelector('h2, blockquote, .content');
        const cite = m.querySelector('footer, cite, .subheadline');
        parts.push({ kind: 'quote', text: q ? collapse(q.textContent).trim() : '', cite: cite ? collapse(cite.textContent).trim() : '', grey });
        seen.push(m);
      } else if (t === 'con01' || t === 'con02') {
        const img = imgOf(m);
        const name = m.querySelector('h2, h3, [class*="name"]');
        const role = name ? name.nextElementSibling : null;
        const tel = m.querySelector('a[href^="tel:"]');
        const mail = [...m.querySelectorAll('a')].find((a) => /e-?mail|contact-form/i.test(a.textContent + a.href));
        const card = {
          img: img ? img.src : null,
          imgAlt: img ? img.alt : '',
          name: name ? collapse(name.textContent).trim() : '',
          role: role ? collapse(role.textContent).trim() : '',
          tel: tel ? { href: tel.getAttribute('href'), label: collapse(tel.textContent).trim() } : null,
          mail: mail ? { href: ABS(mail.getAttribute('href')), label: collapse(mail.textContent).trim() } : null,
        };
        if (card.name) {
          const last = parts[parts.length - 1];
          if (last && last.kind === 'contacts') last.cards.push(card);
          else parts.push({ kind: 'contacts', cards: [card], grey });
        }
        seen.push(m);
      } else if (t === 'it01') {
        const tiles = [...m.querySelectorAll('.tile__item')].map((tile) => {
          const cover = tile.querySelector('.tile__cover__text');
          const content = tile.querySelector('.tile__content, [class*="content"]');
          const blocks = [];
          if (content) {
            [...content.querySelectorAll('h3, h4, p, ul, ol')].forEach((el) => {
              const la = el.closest('ul, ol');
              if (la && content.contains(la) && !['UL', 'OL'].includes(el.tagName)) return;
              const s = blockEl(el);
              if (s) blocks.push(s);
            });
          }
          return { cover: cover ? collapse(cover.textContent).trim() : '', blocks };
        }).filter((tl) => tl.cover);
        if (tiles.length) parts.push({ kind: 'icon-tiles', tiles, grey });
        else out.placeholders.push('it01-empty');
        seen.push(m);
      } else if (t === 'el01') {
        const events = [...m.querySelectorAll('li, article, [class*="event-item"]')].map((ev) => {
          const date = ev.querySelector('time, [class*="date"]');
          const h = ev.querySelector('h3, h4, [class*="title"]');
          const loc = ev.querySelector('[class*="location"], [class*="place"]');
          return {
            date: date ? collapse(date.textContent).trim() : '',
            title: h ? collapse(h.textContent).trim() : '',
            loc: loc ? collapse(loc.textContent).trim() : '',
          };
        }).filter((ev) => ev.title);
        if (events.length) parts.push({ kind: 'events', events, grey });
        seen.push(m);
      } else if (t === 'tbl01' || t === 'tbl02') {
        const rows = [...m.querySelectorAll('tr')].map((tr) => [...tr.children].map((c) => tidy(collapse(serializeInline(c)).trim())));
        if (rows.length) parts.push({ kind: 'table', rows: rows.slice(0, 60), grey });
        seen.push(m);
      }
    });

    // breadcrumb
    const bcLis = [...document.querySelectorAll('#breadcrumb-list li, nav[aria-label*="read"] li, [id*="breadcrumb"] li')];
    out.breadcrumb = bcLis.map((li) => {
      const a = li.querySelector('a');
      return { href: a && a.getAttribute('href') ? ABS(a.getAttribute('href')) : null, label: collapse(li.textContent).trim() };
    }).filter((b2) => b2.label);
    const contentRoot = document.querySelector('main') || document.body;
    out.liveTextNodes = [...contentRoot.querySelectorAll('p, li, h1, h2, h3, h4')].filter((el) => el.textContent.trim() && !inFooter(el)
      && !el.closest('header, nav, [data-tpl="modal"], [data-tpl="jar01"], [data-tpl="meta-navigation"], [data-tpl="quick-navigation"]')
      && !el.closest('[data-tpl="jrc01"], [data-tpl="n-jfc01"], [data-tpl="n-jrt01"], [data-tpl="form-v2"], [data-tpl="form-v3"]')).length;
    return out;
  });
};

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const renderContent = (path, d) => {
  const sections = [];
  const meta = [
    `        <div><div>Title</div><div>${esc(d.title)}</div></div>`,
    `        <div><div>Description</div><div>${esc(d.description)}</div></div>`,
    '        <div><div>Theme</div><div>solid-header</div></div>',
  ];
  sections.push(`    <div>\n      <div class="metadata">\n${meta.join('\n')}\n      </div>\n    </div>`);

  let h1Done = false;
  const styleRow = (styles) => (styles.length ? `      <div class="section-metadata">\n        <div><div>style</div><div>${styles.join(', ')}</div></div>\n      </div>\n` : '');

  d.parts.forEach((part) => {
    const grey = part.grey ? ['grey', 'plain'] : [];
    if (part.kind === 'hero') {
      const rows = part.rows.map((r) => {
        const lines = [];
        lines.push(`          <div>${r.img ? `<img src="${r.img.src}" alt="${esc(r.img.alt || r.heading)}">` : ''}</div>`);
        lines.push('          <div>');
        if (r.heading) { lines.push(`            ${h1Done ? '<h2>' : '<h1>'}${esc(r.heading)}${h1Done ? '</h2>' : '</h1>'}`); h1Done = true; }
        if (r.sub) lines.push(`            <h3>${esc(r.sub)}</h3>`);
        if (r.cta && r.cta.href) lines.push(`            <p><${r.cta.solid ? 'strong' : 'em'}><a href="${r.cta.href}">${esc(r.cta.label)}</a></${r.cta.solid ? 'strong' : 'em'}></p>`);
        lines.push('          </div>');
        return `        <div>\n${lines.join('\n')}\n        </div>`;
      }).join('\n');
      sections.push(`    <div>\n      <div class="hero hub content${part.rows.length > 1 ? '' : ' static'}">\n${rows}\n      </div>\n    </div>`);
    } else if (part.kind === 'stage2') {
      const st = [];
      st.push(`      <p><a href="${(part.back && part.back.href) || '/en/'}">${esc((part.back && part.back.label) || 'Back to previous page')}</a></p>`);
      if (part.brand) st.push(`      <h3>${esc(part.brand)}</h3>`);
      st.push(`      <h1>${part.h1}</h1>`);
      h1Done = true;
      sections.push(`    <div>\n${st.join('\n')}\n${styleRow(['article-stage'])}    </div>`);
    } else if (part.kind === 'prose') {
      let blocks = part.blocks;
      if (!h1Done) {
        const i = blocks.findIndex((b) => b.startsWith('<h2>'));
        if (i >= 0) { blocks = [...blocks]; blocks[i] = blocks[i].replace('<h2>', '<h1>').replace('</h2>', '</h1>'); h1Done = true; }
      }
      const isCtaGrid = part.ctaRun && part.blocks.length > 1;
      const styles = isCtaGrid ? ['cta-grid', 'pad-btm', ...grey] : ['cp-prose', ...(part.centered ? ['centered-heading'] : []), ...grey];
      sections.push(`    <div>\n${blocks.map((b) => `      ${b}`).join('\n')}\n${styleRow(styles)}    </div>`);
    } else if (part.kind === 'downloads') {
      const lis = part.links.map((l) => `              <li><a href="${l.href}">${esc(l.label)}</a></li>`).join('\n');
      sections.push(`    <div>\n      <div class="downloads">\n        <div>\n          <div>\n            <h3>${esc(part.title || 'Downloads')}</h3>\n            <ul>\n${lis}\n            </ul>\n          </div>\n        </div>\n      </div>\n${styleRow(grey)}    </div>`);
    } else if (part.kind === 'accordion') {
      const rows = part.items.map((it) => `        <div>\n          <div>${esc(it.heading)}</div>\n          <div>\n${it.blocks.map((b) => `            ${b}`).join('\n')}\n          </div>\n        </div>`).join('\n');
      sections.push(`    <div>\n      <div class="accordion">\n${rows}\n      </div>\n${styleRow(grey)}    </div>`);
    } else if (part.kind === 'icon-list') {
      sections.push(`    <div>\n      <div class="icon-list">\n        <div>\n          <div>\n${part.blocks.map((b) => `            ${b}`).join('\n')}\n          </div>\n        </div>\n      </div>\n${styleRow(grey)}    </div>`);
    } else if (part.kind === 'cards') {
      const withMedia = part.cards.some((c) => c.img && !c.plain);
      const cls = withMedia ? 'cards media explore' : 'cards color';
      const rows = part.cards.map((c) => {
        if (c.plain && c.img) return `        <div>\n          <div><img src="${c.img.src}" alt=""></div>\n        </div>`;
        const cell = [];
        if (c.img) cell.push(`          <div><img src="${c.img.src}" alt="${esc(c.title)}"></div>`);
        cell.push('          <div>');
        if (c.title) cell.push(`            <h3>${esc(c.title)}</h3>`);
        if (c.text) cell.push(`            <p>${c.text}</p>`);
        if (c.href) cell.push(`            <p><em><a href="${c.href}">${esc(c.cta || 'Read more')}</a></em></p>`);
        cell.push('          </div>');
        return `        <div>\n${cell.join('\n')}\n        </div>`;
      }).join('\n');
      sections.push(`    <div>\n      <div class="${cls}">\n${rows}\n      </div>\n${styleRow(grey)}    </div>`);
    } else if (part.kind === 'press') {
      const rows = part.items.filter((it) => it.href && it.title).map((it) => `        <div>\n          <div>${it.date}</div>\n          <div>\n            <h3>${esc(it.title)}</h3>\n            <p><a href="${it.href}">Read more</a></p>\n          </div>\n        </div>`).join('\n');
      if (rows) sections.push(`    <div>\n      <div class="press">\n${rows}\n      </div>\n${styleRow(grey)}    </div>`);
    } else if (part.kind === 'quote') {
      if (part.text) sections.push(`    <div>\n      <div class="quote">\n        <div>\n          <div>\n            <p>${esc(part.text)}</p>\n${part.cite ? `            <p><em>${esc(part.cite)}</em></p>\n` : ''}          </div>\n        </div>\n      </div>\n${styleRow(grey)}    </div>`);
    } else if (part.kind === 'contacts') {
      const rows = part.cards.map((c) => {
        const cell = [];
        if (c.img) cell.push(`          <div><img src="${c.img}" alt="${esc(c.imgAlt || c.name)}"></div>`);
        cell.push('          <div>');
        cell.push(`            <h2>${esc(c.name)}</h2>`);
        if (c.role) cell.push(`            <h3>${esc(c.role)}</h3>`);
        if (c.tel) cell.push(`            <p><a href="${c.tel.href}">${esc(c.tel.label)}</a></p>`);
        if (c.mail) cell.push(`            <p><strong><a href="${c.mail.href}">${esc(c.mail.label)}</a></strong></p>`);
        cell.push('          </div>');
        return `        <div>\n${cell.join('\n')}\n        </div>`;
      }).join('\n');
      sections.push(`    <div>\n      <div class="contacts">\n${rows}\n      </div>\n${styleRow(grey)}    </div>`);
    } else if (part.kind === 'icon-tiles') {
      const rows = part.tiles.map((tl) => `        <div>\n          <div>${esc(tl.cover)}</div>\n          <div>\n${tl.blocks.map((b2) => `            ${b2}`).join('\n')}\n          </div>\n        </div>`).join('\n');
      sections.push(`    <div>\n      <div class="icon-tiles">\n${rows}\n      </div>\n${styleRow(grey)}    </div>`);
    } else if (part.kind === 'events') {
      const rows = part.events.map((ev) => `        <div>\n          <div>${esc(ev.date)}</div>\n          <div>\n            <h3>${esc(ev.title)}</h3>\n${ev.loc ? `            <p>${esc(ev.loc)}</p>\n` : ''}          </div>\n        </div>`).join('\n');
      sections.push(`    <div>\n      <div class="events">\n${rows}\n      </div>\n${styleRow(grey)}    </div>`);
    } else if (part.kind === 'table') {
      const rows = part.rows.map((r) => `        <div>\n${r.map((c) => `          <div>${c}</div>`).join('\n')}\n        </div>`).join('\n');
      sections.push(`    <div>\n      <div class="table">\n${rows}\n      </div>\n${styleRow(grey)}    </div>`);
    }
  });

  // contract: exactly one h1 — fall back to the title
  if (!h1Done) sections.splice(1, 0, `    <div>\n      <h1>${esc(d.title)}</h1>\n      <div class="section-metadata">\n        <div><div>style</div><div>cp-prose</div></div>\n      </div>\n    </div>`);

  if (d.breadcrumb.length) {
    const bc = d.breadcrumb.map((b) => `<a href="${b.href || path}">${esc(b.label)}</a>`).join(' ');
    sections.push(`    <div>\n      <div class="breadcrumb">\n        <div>\n          <div>${bc}</div>\n        </div>\n      </div>\n    </div>`);
  }

  return `<body>\n  <header></header>\n  <main>\n${sections.join('\n')}\n  </main>\n  <footer></footer>\n</body>\n`;
};

const b = await chromium.launch();
const ledger = fs.existsSync('stardust/migration/import-pages-ledger.json') ? JSON.parse(fs.readFileSync('stardust/migration/import-pages-ledger.json', 'utf8')) : {};
let done = 0;
const queue = paths.filter((p) => !(ledger[p] && ledger[p].ok));
console.log(`importing ${queue.length} pages (${paths.length - queue.length} already done)`);
const worker = async () => {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, userAgent: UA });
  const page = await ctx.newPage();
  while (queue.length) {
    const path = queue.shift();
    try {
      const d = await extractPage(page, path);
      if (d.is404) throw new Error('live page is a 404');
      const html = renderContent(path, d);
      const file = `content${path.replace(/\/$/, '')}.html`;
      fs.mkdirSync(file.slice(0, file.lastIndexOf('/')), { recursive: true });
      fs.writeFileSync(file, html);
      const emitted = (html.match(/<(p|li|h1|h2|h3)[ >]/g) || []).length;
      ledger[path] = {
        ok: true, live: d.liveTextNodes, emitted, warn: d.warnings, placeholders: d.placeholders,
      };
      done += 1;
      const ratio = d.liveTextNodes ? (emitted / d.liveTextNodes) : 1;
      console.log(`[${done}] ${path.slice(0, 70)} live:${d.liveTextNodes} emitted:${emitted}${ratio < 0.6 ? ' ⚠LOW' : ''}${d.warnings.length ? ` WARN:${d.warnings.join(';')}` : ''}`);
    } catch (e) {
      ledger[path] = { ok: false, error: String(e).slice(0, 200) };
      console.log(`FAIL ${path}: ${String(e).slice(0, 120)}`);
    }
    if (done % 25 === 0) fs.writeFileSync('stardust/migration/import-pages-ledger.json', JSON.stringify(ledger, null, 1));
  }
  await ctx.close();
};
await Promise.all(Array.from({ length: concurrency }, worker));
await b.close();
fs.writeFileSync('stardust/migration/import-pages-ledger.json', JSON.stringify(ledger, null, 1));
const fails = Object.values(ledger).filter((l) => !l.ok).length;
console.log(`done: ${Object.keys(ledger).length - fails} ok, ${fails} failed`);
