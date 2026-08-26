/**
 * hero — RWE stage carousel (sli01 replica). Template-slotted (#95).
 * Schema: stardust/eds-schema/index.json § hero
 *
 * Authoring rows — one per slide:
 *   cell 1: slide background <picture>
 *   cell 2: headline (first slide <h1>, others <h2>) + <h3> subheadline +
 *           CTA paragraph (<strong><a> primary → light box slide,
 *           <em><a> secondary → gradient box slide — mirrors the live site)
 *
 * Carousel: fade, autoplay 7s (assumption logged in the conversion log),
 * arrows + dots. Static t=0 state = slide 1 (replica freeze policy).
 */

function slideBox(cell, isFirst) {
  const heading = cell.querySelector('h1, h2, h3:first-child') || cell.querySelector('h1, h2');
  const sub = cell.querySelector('h3:not(:first-child), h4') || [...cell.querySelectorAll('h3')].pop();
  const cta = cell.querySelector('a.button, a');
  const light = cta ? cta.classList.contains('primary') : true;

  const box = document.createElement('header');
  box.className = `stage-box ${light ? 'stage-box--light light' : 'stage-box--gradient gradient'}`;

  const h = document.createElement(isFirst ? 'h1' : 'h2');
  h.className = 'headline';
  if (heading) {
    // live wraps each headline line in a block span (granularity parity)
    const lines = heading.innerHTML.split(/<br\s*\/?>/i);
    h.innerHTML = lines.map((l) => `<span class="${light ? 'hl-navy' : 'hl-white'}">${l}</span>`).join('');
  }
  box.append(h);

  if (sub && sub !== heading) {
    const s = document.createElement('h3');
    s.className = `subheadline${light ? ' subheadline--navy' : ''}`;
    s.textContent = sub.textContent.trim();
    box.append(s);
  }

  if (cta) {
    const actions = document.createElement('div');
    actions.className = 'buttons-container';
    actions.append(cta.cloneNode(true));
    box.append(actions);
  }
  return box;
}

export default async function decorate(block) {
  const rows = [...block.children];
  const track = document.createElement('div');
  track.className = 'hero-track';

  rows.forEach((row, i) => {
    const cells = [...row.children];
    const pic = row.querySelector('picture, img');
    const textCell = cells.find((c) => c.querySelector('h1, h2, h3')) || cells[cells.length - 1];

    const slide = document.createElement('div');
    slide.className = `slider-slide${i === 0 ? ' active' : ''}`;
    const stage = document.createElement('div');
    stage.className = 'stage';
    const media = document.createElement('div');
    media.className = 'stage-image';
    if (pic) {
      const img = pic.matches('img') ? pic : pic.querySelector('img');
      if (img && i === 0) { img.setAttribute('loading', 'eager'); img.setAttribute('fetchpriority', 'high'); }
      media.append(pic.cloneNode(true));
    }
    const wrap = document.createElement('div');
    wrap.className = 'teaser-width';
    wrap.append(slideBox(textCell, i === 0));
    stage.append(media, wrap);
    slide.append(stage);
    track.append(slide);
  });

  const list = document.createElement('div');
  list.className = 'slick-list';
  list.append(track);

  const prev = document.createElement('button');
  prev.className = 'slider-arrow slider-prev';
  prev.setAttribute('aria-label', 'Previous slide');
  const next = document.createElement('button');
  next.className = 'slider-arrow slider-next';
  next.setAttribute('aria-label', 'Next slide');

  const dots = document.createElement('ul');
  dots.className = 'slick-dots';
  rows.forEach((r, i) => {
    const li = document.createElement('li');
    if (i === 0) li.classList.add('slick-active');
    const b = document.createElement('button');
    b.textContent = String(i + 1);
    li.append(b);
    dots.append(li);
  });

  block.replaceChildren(list, prev, next, dots);

  // fade carousel behavior
  const slides = [...track.children];
  const dotEls = [...dots.children];
  let cur = 0;
  const go = (n) => {
    cur = (n + slides.length) % slides.length;
    slides.forEach((s, i) => s.classList.toggle('active', i === cur));
    dotEls.forEach((d, i) => d.classList.toggle('slick-active', i === cur));
  };
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let timer = reduced ? null : setInterval(() => go(cur + 1), 7000);
  const manual = (n) => {
    if (timer) clearInterval(timer);
    go(n);
    if (!reduced) timer = setInterval(() => go(cur + 1), 7000);
  };
  prev.addEventListener('click', () => manual(cur - 1));
  next.addEventListener('click', () => manual(cur + 1));
  dotEls.forEach((d, i) => d.addEventListener('click', () => manual(i)));
}
