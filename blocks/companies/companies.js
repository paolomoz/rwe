/**
 * companies — organisational-structure company rows (tic01 pairs replica).
 * Template-slotted. Authoring rows — one per company:
 *   cell 1: <h2>company name</h2> + body <p>s + optional
 *           <h3>Subsidiaries</h3> + plain <a> links (one per line) +
 *           CTA <p><strong><a>More about the company</a></strong></p>
 *   cell 2: company <picture>
 * The subsidiaries list renders behind the live expand/collapse toggle
 * (closed by default — the gated capture state).
 */

function buildCompany(row, isFirst, isLast) {
  const cells = [...row.children];
  const pic = row.querySelector('picture, img');
  const textCell = cells.find((c) => !c.querySelector('picture, img')) || cells[0];
  const name = textCell.querySelector('h1, h2');
  const subsHead = textCell.querySelector('h3');
  const cta = [...textCell.querySelectorAll('a.button, p strong a')].pop()
    || [...textCell.querySelectorAll('a')].filter((a) => a.textContent.trim().startsWith('More about')).pop();

  // Experience Workspace contract: MOVE authored nodes (they carry the editor's
  // data-prose-index); capture sibling traversal starts BEFORE moving anything.
  const contentStart = name ? name.nextElementSibling : textCell.firstElementChild;
  const subsStart = subsHead ? subsHead.nextElementSibling : null;

  const sec = document.createElement('section');
  sec.className = `company${isFirst ? ' company--first' : ''}${isLast ? ' company--last' : ''}`;
  const rowEl = document.createElement('div');
  rowEl.className = 'row';
  const colText = document.createElement('div');
  colText.className = 'col col-8';
  const tick = document.createElement('div');
  tick.className = 'gl-tick';

  if (name) {
    const hw = document.createElement('div');
    hw.className = 'headline';
    hw.append(name);
    tick.append(hw);
  }

  const content = document.createElement('div');
  content.className = 'content';
  let node = contentStart;
  while (node && node !== subsHead) {
    const next = node.nextElementSibling;
    if (node.tagName === 'P' && !node.contains(cta)) content.append(node);
    node = next;
  }
  tick.append(content);

  if (subsHead) {
    const ext = document.createElement('div');
    ext.className = 'content-extended';
    ext.append(subsHead);
    let n = subsStart;
    while (n) {
      const next = n.nextElementSibling;
      const a = n.querySelector ? n.querySelector('a') : null;
      if (a && a !== cta && !a.textContent.trim().startsWith('More about')) {
        ext.append(a.closest('p') || n);
      }
      n = next;
    }
    tick.append(ext);
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'content-extended-arrow';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.innerHTML = '<span class="extended-arrow--open">Show less</span><span class="extended-arrow--close">Subsidiaries</span>';
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      ext.style.height = open ? '0' : 'auto';
    });
    tick.append(toggle);
  }

  if (cta) {
    const ctaWrap = document.createElement('div');
    ctaWrap.className = 'gl-cta';
    cta.className = 'button primary';
    ctaWrap.append(cta.closest('p') || cta); // the <p> holds the prose index
    tick.append(ctaWrap);
  }
  colText.append(tick);

  const colImg = document.createElement('div');
  colImg.className = 'col col-4';
  if (pic) {
    const fig = document.createElement('figure');
    fig.className = 'gl-zoomable';
    const img = pic.matches('img') ? pic : pic.querySelector('img');
    if (img) img.setAttribute('loading', 'lazy');
    fig.append(pic);
    colImg.append(fig);
  }
  rowEl.append(colText, colImg);
  sec.append(rowEl);
  return sec;
}

export default async function decorate(block) {
  const rows = [...block.children];
  const out = [];
  rows.forEach((row, i) => {
    if (i > 0) {
      const sep = document.createElement('section');
      sep.className = 'company-sep';
      sep.innerHTML = '<hr>';
      out.push(sep);
    }
    out.push(buildCompany(row, i === 0, i === rows.length - 1));
  });
  block.replaceChildren(...out);
}
