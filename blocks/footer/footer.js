import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * footer — RWE gradient footer (template-slotted, deploy Step 6).
 * /footer document contract (sections, in order):
 *   1. Recommend: <h2> + share icon links (images inside links)
 *   2. Find us: <h2> + social icon links
 *   3. Talk to us: <h3> + <strong><a> Contact CTA
 *   4. Start pages: <h3> + link list
 *   5. Quick links: <h3> + link list
 *   6. We recommend: <h3> + link list
 *   7. Legal: link list + copyright text
 */

function iconRow(section) {
  const ul = document.createElement('ul');
  ul.className = 'icon-row';
  [...section.querySelectorAll('a')].forEach((a) => {
    const li = document.createElement('li');
    const na = document.createElement('a');
    na.href = a.href;
    const pic = a.querySelector('picture, img');
    if (pic) na.append(pic.cloneNode(true));
    li.append(na);
    ul.append(li);
  });
  return ul;
}

function linkCol(section) {
  const col = document.createElement('div');
  col.className = 'f-col f-links';
  const h = section.querySelector('h2, h3');
  if (h) {
    const h3 = document.createElement('h3');
    h3.className = 'subheadline';
    const btn = document.createElement('button');
    const span = document.createElement('span');
    span.textContent = h.textContent.trim();
    btn.append(span);
    h3.append(btn);
    col.append(h3);
    btn.addEventListener('click', () => {
      const c = col.querySelector('.accordion-content');
      if (c) c.style.display = c.style.display === 'none' ? '' : 'none';
    });
  }
  const content = document.createElement('div');
  content.className = 'accordion-content';
  const ul = document.createElement('ul');
  [...section.querySelectorAll('ul a, p a')].forEach((a) => {
    const li = document.createElement('li');
    const na = document.createElement('a');
    na.href = a.href;
    na.textContent = a.textContent.trim();
    li.append(na);
    ul.append(li);
  });
  content.append(ul);
  col.append(content);
  return col;
}

export default async function decorate(block) {
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);
  const sections = fragment ? [...fragment.querySelectorAll(':scope .section')] : [];
  const [recommend, findUs, talk, startPages, quickLinks, weRecommend, legal] = sections;

  const root = document.createElement('div');
  root.className = 'site-footer';

  const top = document.createElement('div');
  top.className = 'f-top';

  // recommend band
  if (recommend) {
    const sec = document.createElement('section');
    sec.className = 'f-section';
    const c = document.createElement('div');
    c.className = 'f-container';
    const inner = document.createElement('div');
    inner.className = 'f-recommend';
    const h = recommend.querySelector('h2, h3');
    if (h) {
      const h2 = document.createElement('h2');
      h2.className = 'headline--medium';
      h2.textContent = h.textContent.trim();
      inner.append(h2);
    }
    inner.append(iconRow(recommend));
    c.append(inner, document.createElement('hr'));
    sec.append(c);
    top.append(sec);
  }

  // find-us / talk-to-us band
  const sec2 = document.createElement('section');
  sec2.className = 'f-section';
  const c2 = document.createElement('div');
  c2.className = 'f-container';
  const cols2 = document.createElement('div');
  cols2.className = 'f-cols';
  if (findUs) {
    const col = document.createElement('div');
    col.className = 'f-col';
    const h = findUs.querySelector('h2, h3');
    if (h) {
      const h2 = document.createElement('h2');
      h2.className = 'headline--medium';
      h2.textContent = h.textContent.trim();
      col.append(h2);
    }
    col.append(iconRow(findUs));
    cols2.append(col);
  }
  if (talk) {
    const col = document.createElement('div');
    col.className = 'f-col talk-to-us';
    const h = talk.querySelector('h2, h3');
    if (h) {
      const h3 = document.createElement('h3');
      h3.className = 'subheadline';
      h3.textContent = h.textContent.trim();
      col.append(h3);
    }
    const cta = talk.querySelector('a');
    if (cta) {
      const wrap = document.createElement('div');
      wrap.append(cta.cloneNode(true));
      col.append(wrap);
    }
    cols2.append(col);
  }
  cols2.append(Object.assign(document.createElement('div'), { className: 'f-col' }));
  c2.append(cols2);
  sec2.append(c2);
  top.append(sec2);

  // rule
  const secHr = document.createElement('section');
  secHr.className = 'f-section';
  const cHr = document.createElement('div');
  cHr.className = 'f-container';
  cHr.append(document.createElement('hr'));
  secHr.append(cHr);
  top.append(secHr);

  // link columns
  const sec4 = document.createElement('section');
  sec4.className = 'f-section';
  const c4 = document.createElement('div');
  c4.className = 'f-container';
  const cols4 = document.createElement('div');
  cols4.className = 'f-cols';
  [startPages, quickLinks, weRecommend].forEach((s) => { if (s) cols4.append(linkCol(s)); });
  c4.append(cols4);
  sec4.append(c4);
  top.append(sec4);

  root.append(top);

  // legal bar
  if (legal) {
    const bar = document.createElement('section');
    bar.className = 'legal';
    const c = document.createElement('div');
    c.className = 'f-container';
    const row = document.createElement('div');
    row.className = 'legal-row';
    const nav = document.createElement('nav');
    nav.setAttribute('aria-label', 'Footer');
    const ol = document.createElement('ol');
    [...legal.querySelectorAll('a')].forEach((a) => {
      const li = document.createElement('li');
      const na = document.createElement('a');
      if (a.getAttribute('href')) na.href = a.href;
      na.textContent = a.textContent.trim();
      li.append(na);
      ol.append(li);
    });
    nav.append(ol);
    row.append(nav);
    const copy = document.createElement('div');
    copy.className = 'copyright';
    const copyText = [...legal.querySelectorAll('p')].map((p) => p.textContent.trim()).find((t) => t.includes('©'));
    const span = document.createElement('span');
    span.textContent = copyText || '';
    copy.append(span);
    // RWE endorsement wordmark (brand chrome, live legal-row parity)
    const endorse = document.createElement('div');
    endorse.className = 'endorsement';
    endorse.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="18" viewBox="0, 0, 100, 29" aria-label="RWE"><g><path d="M77.293,0.037 C75.961,0.037 74.938,1.041 74.938,2.392 L74.938,26.308 C74.938,27.609 75.992,28.663 77.293,28.663 L99.99,28.663 L99.99,22.936 L82.207,22.936 L82.207,16.813 L96.956,16.813 L96.956,11.32 L82.207,11.32 L82.207,5.585 L99.79,5.585 L99.79,0.037 z M17.091,13.483 L12.46,13.483 C11.654,13.483 11.153,14.361 11.564,15.055 L20.365,28.663 L29.026,28.663 L21.183,18.059 C24.975,17.565 28.122,15.573 28.122,9.293 C28.122,2.683 25.274,0.037 18.287,0.037 L2.365,0.037 C1.034,0.037 0.01,1.041 0.01,2.392 L0.01,28.663 L7.535,28.663 L7.535,5.484 L17.2,5.484 C20.04,5.484 21.131,6.791 21.131,9.433 C21.131,11.687 19.913,13.483 17.091,13.483 M44.883,27.467 C44.623,28.185 43.941,28.663 43.178,28.663 L38.654,28.663 C37.815,28.663 37.085,28.087 36.891,27.272 L30.381,0.037 L38.091,0.037 L41.67,17.701 L47.296,1.262 C47.547,0.529 48.236,0.037 49.011,0.037 L52.973,0.037 C53.748,0.037 54.437,0.529 54.688,1.262 L60.314,17.701 L63.893,0.037 L71.603,0.037 L65.094,27.272 C64.899,28.087 64.169,28.663 63.33,28.663 L58.807,28.663 C58.043,28.663 57.361,28.185 57.101,27.467 L50.992,10.591 z"></path></g></svg>';
    copy.append(endorse);
    row.append(copy);
    c.append(row);
    bar.append(c);
    root.append(bar);
  }

  block.replaceChildren(root);
}
