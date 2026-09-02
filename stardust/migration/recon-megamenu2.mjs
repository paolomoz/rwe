// Parse the live mega-menu tree + measure panel styles and motion.
import fs from 'fs';
import { chromium } from 'playwright';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const b = await chromium.launch();
const ctx = await b.newContext({ userAgent: UA, viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
await p.goto('https://www.rwe.com/en/', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(6000);
await p.click('button.menu-button, li.menu button');
await p.waitForTimeout(1500);

const data = await p.evaluate(() => {
  const collapse = (s) => (s || '').replace(/[ \t\r\n]+/g, ' ').trim();
  const rootList = document.querySelector('.meme__list[data-meme-lvl="0"]');
  const walk = (list) => [...list.children].filter((li) => li.matches('.meme__list-item') && !li.matches('.meme__list-item--back')).map((li) => {
    const wrap = li.querySelector(':scope > .meme__link-wrapper');
    const a = wrap ? wrap.querySelector('a') : null;
    const trigger = wrap ? wrap.querySelector('.meme__trigger') : null;
    const sub = li.querySelector(':scope > .meme__lvl-wrapper');
    const item = {
      label: a ? collapse(a.textContent) : (wrap ? collapse(wrap.textContent) : ''),
      href: a ? a.getAttribute('href') : null,
      hasSub: !!sub,
    };
    if (sub) {
      const subList = sub.querySelector(':scope > .meme__list, .meme__list');
      item.columns = sub.className.match(/column-count--(\d)/) ? Number(RegExp.$1) : null;
      item.overview = (() => { const o = sub.querySelector('.meme__overview-wrapper a'); return o ? { label: collapse(o.textContent), href: o.getAttribute('href') } : null; })();
      item.children = subList ? walk(subList) : [];
      const nb = sub.querySelector(':scope .meme__newsbox');
      if (nb && sub.contains(nb) && nb.closest('.meme__lvl-wrapper') === sub) {
        const img = nb.querySelector('img');
        item.newsbox = {
          img: img ? (img.currentSrc || img.getAttribute('src')) : null,
          headline: collapse(nb.querySelector('.meme__newsbox-headline')?.textContent),
          cta: collapse(nb.querySelector('.btn, .affordance')?.textContent),
          href: nb.querySelector('a')?.getAttribute('href') || nb.closest('a')?.getAttribute('href'),
        };
      }
    }
    return item;
  });
  const tree = walk(rootList);

  // styles: menu panel, rail item, active item, column heading, link, newsbox
  const st = (el, props) => { if (!el) return null; const c = getComputedStyle(el); return Object.fromEntries(props.map((k) => [k, c[k]])); };
  const panel = rootList.closest('[class*="meme"]')?.parentElement || rootList.parentElement;
  const lvl0item = rootList.querySelector(':scope > .meme__list-item > .meme__link-wrapper a');
  const active = rootList.querySelector('.meme__link-wrapper--active a');
  const lvl1 = rootList.querySelector('.meme__lvl-wrapper--active .meme__list a') || rootList.querySelector('.meme__lvl-wrapper .meme__list a');
  const overview = rootList.querySelector('.meme__overview-wrapper a');
  const nbEl = document.querySelector('.meme__newsbox');
  const panelBox = panel.getBoundingClientRect();
  return {
    tree,
    styles: {
      panel: { ...st(panel, ['position', 'top', 'left', 'background', 'backgroundColor', 'zIndex', 'transition', 'boxShadow', 'overflow']), rect: { y: panelBox.y, h: panelBox.height, w: panelBox.width } },
      lvl0item: st(lvl0item, ['fontFamily', 'fontSize', 'lineHeight', 'color', 'textAlign', 'padding', 'margin']),
      activeItem: st(active, ['color', 'fontFamily']),
      lvl1link: st(lvl1, ['fontFamily', 'fontSize', 'lineHeight', 'color', 'padding', 'margin']),
      overview: st(overview, ['fontFamily', 'fontSize', 'color']),
      newsbox: { ...st(nbEl, ['width', 'background', 'backgroundColor', 'position']), rect: nbEl ? { w: nbEl.getBoundingClientRect().width, h: nbEl.getBoundingClientRect().height, x: nbEl.getBoundingClientRect().x } : null },
      lvlWrapper: st(document.querySelector('.meme__lvl-wrapper--first-lvl'), ['position', 'left', 'top', 'width', 'transition', 'transform', 'opacity', 'background']),
      lvl0rail: (() => { const ul = rootList; const r = ul.getBoundingClientRect(); const c = getComputedStyle(ul); return { x: r.x, w: r.width, padding: c.padding, textAlign: c.textAlign }; })(),
    },
  };
});
fs.writeFileSync('stardust/migration/megamenu-tree.json', JSON.stringify(data, null, 1));
console.log('top sections:', data.tree.map((t) => `${t.label}${t.hasSub ? ` [sub:${t.children.length}${t.newsbox ? ' +newsbox' : ''}]` : ''}`).join('\n'));
console.log('\nSTYLES:', JSON.stringify(data.styles, null, 1).slice(0, 2200));
await b.close();
