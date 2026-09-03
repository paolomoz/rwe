/**
 * spotlight — RWE "Spotlight @ RWE.com" news ticker (short-news replica).
 * Reconstructive. Schema: stardust/eds-schema/index.json § spotlight
 *
 * Authoring rows:
 *   row 1 (head): cell 1 icon <picture>, cell 2 <h2> title
 *   rows 2..N (items): cell 1 <h3> title (kept as authored) + <p> teaser + <p><a> read-more,
 *                      cell 2 item <picture>
 *
 * Renders the live site's vertical slick ticker (window shows one 205px
 * slide; clone slides mirror slick's DOM). Autoplay 6s.
 */

// Presentational copies must not carry the editor's instrumentation, or the
// editor attaches to the (hidden) clone instead of the authored element.
function stripInstrumentation(el) {
  el.querySelectorAll('[data-prose-index], [data-image-index]').forEach((n) => {
    n.removeAttribute('data-prose-index');
    n.removeAttribute('data-image-index');
  });
  return el;
}

function buildItem(row) {
  const cells = [...row.children];
  const textCell = cells.find((c) => c.querySelector('h3, h4')) || cells[0];
  const pic = row.querySelector('picture, img');

  const el = document.createElement('div');
  el.className = 'slider-element';
  const content = document.createElement('div');
  content.className = 'slider-element__content';
  const horiz = document.createElement('div');
  horiz.className = 'slider-element__content--horizontal';
  const vert = document.createElement('div');
  vert.className = 'slider-element__content--vertical';

  // Experience Workspace contract: MOVE authored elements into generated wrappers.
  const h = textCell.querySelector('h3, h4');
  if (h) {
    const hw = document.createElement('div');
    hw.className = 'item-headline';
    hw.append(h);
    vert.append(hw);
  }
  const p = [...textCell.querySelectorAll('p')].find((x) => !x.querySelector('a') && x.textContent.trim());
  if (p) {
    const tw = document.createElement('div');
    tw.className = 'text-wrapper';
    tw.append(p);
    vert.append(tw);
  }
  const a = textCell.querySelector('a');
  if (a) {
    const aw = document.createElement('div');
    aw.className = 'affordance-wrap';
    aw.append(a.closest('p') || a);
    vert.append(aw);
  }
  horiz.append(vert);

  const imgWrap = document.createElement('div');
  imgWrap.className = 'slider-element__image';
  const inner = document.createElement('div');
  inner.className = 'short-news-image';
  if (pic) inner.append(pic);
  imgWrap.append(inner);
  horiz.append(imgWrap);
  content.append(horiz);
  el.append(content);
  return el;
}

export default async function decorate(block) {
  const rows = [...block.children];
  const headRow = rows.find((r) => r.querySelector('h2')) || rows[0];
  const itemRows = rows.filter((r) => r !== headRow);

  // head: info icon + teal h2
  const head = document.createElement('div');
  head.className = 'short-news__header';
  const iconWrap = document.createElement('div');
  iconWrap.className = 'short-news-icon';
  const icon = headRow.querySelector('picture, img');
  if (icon) iconWrap.append(icon);
  head.append(iconWrap);
  const hw = document.createElement('div');
  hw.className = 'headline';
  const h2src = headRow.querySelector('h2');
  if (h2src) hw.append(h2src);
  head.append(hw);

  // slider nav (arrows + vertical dots)
  const nav = document.createElement('div');
  nav.className = 'slider-nav';
  const up = document.createElement('div');
  up.className = 'slider-nav__arrow slider-nav__arrow--up';
  const dots = document.createElement('div');
  dots.className = 'slider-nav__dots';
  itemRows.forEach((r, i) => {
    const s = document.createElement('span');
    if (i === 0) s.classList.add('active');
    dots.append(s);
  });
  const down = document.createElement('div');
  down.className = 'slider-nav__arrow slider-nav__arrow--down';
  nav.append(up, dots, down);

  // track: clone(last) + items + clones(all) — mirrors slick's live DOM
  const trackItems = itemRows.map(buildItem);
  const cloneOf = (it) => {
    const c = stripInstrumentation(it.cloneNode(true));
    c.setAttribute('aria-hidden', 'true');
    return c;
  };
  const track = document.createElement('div');
  track.className = 'sn-track';
  if (trackItems.length) track.append(cloneOf(trackItems[trackItems.length - 1]));
  trackItems.forEach((it) => track.append(it));
  trackItems.forEach((it) => track.append(cloneOf(it)));

  const window_ = document.createElement('div');
  window_.className = 'slider-content';
  window_.append(track);

  const slider = document.createElement('div');
  slider.className = 'short-news__slider';
  slider.append(nav, window_);

  block.replaceChildren(head, slider);

  // ticker behavior (vertical, 205px pitch)
  const dotEls = [...dots.children];
  const n = itemRows.length;
  let pos = 1;
  track.style.transform = 'translateY(-205px)';
  track.style.transition = 'transform 0.5s ease';
  const go = (p) => {
    pos = p < 1 ? n : (p > n ? 1 : p);
    track.style.transform = `translateY(${-pos * 205}px)`;
    dotEls.forEach((d, i) => d.classList.toggle('active', i === pos - 1));
  };
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let timer = reduced ? null : setInterval(() => go(pos + 1), 6000);
  const manual = (p) => {
    if (timer) clearInterval(timer);
    go(p);
    if (!reduced) timer = setInterval(() => go(pos + 1), 6000);
  };
  up.addEventListener('click', () => manual(pos - 1));
  down.addEventListener('click', () => manual(pos + 1));
  dotEls.forEach((d, i) => d.addEventListener('click', () => manual(i + 1)));
}
