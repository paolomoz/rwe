// Extract clean content fragments (inline semantics preserved, live wrappers
// and classes stripped) from article-html.json for the A1 prototype.
import fs from 'node:fs';
import { chromium } from 'playwright';

const j = JSON.parse(fs.readFileSync('stardust/replica/article-html.json', 'utf8'));
const b = await chromium.launch();
const p = await (await b.newContext()).newPage();
await p.setContent(`<div id="root">${j.mainBlocks.join('\n<hr class="SEP">\n')}</div><div id="aside">${j.aside.join('\n<hr class="SEP">\n')}</div>`);
const out = await p.evaluate(() => {
  const KEEP_INLINE = ['STRONG', 'EM', 'A', 'BR', 'B', 'I', 'SPAN'];
  const clean = (el) => {
    // returns cleaned HTML string of an element, keeping block tags p/h2/h3/ul/li/figure-ish as clean tags
    const ser = (node) => {
      if (node.nodeType === 3) return node.textContent;
      if (node.nodeType !== 1) return '';
      const tag = node.tagName;
      const inner = [...node.childNodes].map(ser).join('');
      if (tag === 'BR') return '<br>';
      if (tag === 'A') {
        const href = node.getAttribute('href') || '';
        return `<a href="${href}">${inner}</a>`;
      }
      if (tag === 'STRONG' || tag === 'B') return `<strong>${inner}</strong>`;
      if (tag === 'EM' || tag === 'I') return `<em>${inner}</em>`;
      if (tag === 'SPAN') return inner;
      return inner;
    };
    return ser(el).replace(/[ \t\r\n]+/g, ' ').trim();
  };
  const blocks = [];
  document.querySelectorAll('#root > *:not(.SEP), #root > hr.SEP').forEach(() => {});
  const roots = [...document.querySelectorAll('#root > *')];
  let cur = [];
  const flush = () => { if (cur.length) { blocks.push(cur); cur = []; } };
  roots.forEach((r) => {
    if (r.classList.contains('SEP')) { flush(); return; }
    cur.push(r);
  });
  flush();
  const emit = [];
  blocks.forEach((group) => {
    const parts = [];
    group.forEach((g) => {
      g.querySelectorAll('ul, p, h2, h3, li, a.link--download, a.link').forEach(() => {});
      const walk = (el) => {
        [...el.children].forEach((c) => {
          const t = c.tagName;
          if (t === 'UL' && c.querySelector('li')) {
            const lis = [...c.querySelectorAll(':scope > li')].map((li) => `  <li>${clean(li)}</li>`).join('\n');
            parts.push(`<ul>\n${lis}\n</ul>`);
          } else if (t === 'P') {
            const cl = clean(c);
            if (cl) parts.push(`<p>${cl}</p>`);
          } else if (/^H[1-6]$/.test(t)) {
            parts.push(`<${t.toLowerCase()}>${clean(c)}</${t.toLowerCase()}>`);
          } else if (t === 'FIGURE' || t === 'PICTURE') {
            parts.push('<!--FIGURE-->');
          } else {
            walk(c);
          }
        });
      };
      walk(g);
    });
    emit.push(parts.join('\n'));
  });
  return emit;
});
fs.writeFileSync('stardust/replica/article-fragments.json', JSON.stringify(out, null, 1));
out.forEach((f, i) => console.log(`--- block ${i} (${f.length} chars) ---\n${f.slice(0, 200)}\n`));
await b.close();
