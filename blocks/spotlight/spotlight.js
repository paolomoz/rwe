/**
 * spotlight — RWE "Spotlight @ RWE.com" news ticker (short-news replica).
 * Reconstructive. Schema: stardust/eds-schema/index.json § spotlight
 *
 * Authoring rows:
 *   row 1 (head): cell 1 icon <picture>, cell 2 <h2> title
 *   rows 2..N (items): cell 1 <h3> title + <p> teaser + <a> read-more,
 *                      cell 2 item <picture>
 *
 * Renders the live site's vertical slick ticker (window shows one 205px
 * slide; clone slides mirror slick's DOM). Autoplay 6s.
 */

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

  const h = textCell.querySelector('h3, h4');
  if (h) {
    const h4 = document.createElement('h4');
    h4.textContent = h.textContent.trim();
    vert.append(h4);
  }
  const p = [...textCell.querySelectorAll('p')].find((x) => !x.querySelector('a') && x.textContent.trim());
  if (p) {
    const tw = document.createElement('div');
    tw.className = 'text-wrapper';
    const pp = document.createElement('p');
    pp.textContent = p.textContent.trim();
    tw.append(pp);
    vert.append(tw);
  }
  const a = textCell.querySelector('a');
  if (a) {
    const link = document.createElement('a');
    link.className = 'affordance';
    link.href = a.href;
    link.textContent = a.textContent.trim();
    vert.append(link);
  }
  horiz.append(vert);

  const imgWrap = document.createElement('div');
  imgWrap.className = 'slider-element__image';
  const inner = document.createElement('div');
  inner.className = 'short-news-image';
  if (pic) inner.append(pic.cloneNode(true));
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
  if (icon) iconWrap.append(icon.cloneNode(true));
  head.append(iconWrap);
  const h2src = headRow.querySelector('h2');
  const h2 = document.createElement('h2');
  h2.className = 'headline';
  h2.textContent = h2src ? h2src.textContent.trim() : '';
  head.append(h2);

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
  const track = document.createElement('div');
  track.className = 'sn-track';
  const cloneLast = buildItem(itemRows[itemRows.length - 1]);
  cloneLast.setAttribute('aria-hidden', 'true');
  track.append(cloneLast);
  trackItems.forEach((it) => track.append(it));
  itemRows.forEach((r) => {
    const c = buildItem(r);
    c.setAttribute('aria-hidden', 'true');
    track.append(c);
  });

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
