/**
 * country-slider — "Press releases from RWE in other countries"
 * (sli01 text carousel replica). Template-slotted.
 *
 * Authoring rows — one per country:
 *   cell 1: <h3>country</h3>
 *   cell 2: teaser <p> (may carry <br>/<strong>) + CTA <p><strong><a>
 * The block groups countries into slides of 3 (live slick grouping),
 * autoplay 7s, arrows + magic dots. t=0 = slide 1 (replica freeze policy).
 */

const PER_SLIDE = 3;
const INTERVAL = 7000;

export default async function decorate(block) {
  const rows = [...block.children];
  const cols = rows.map((row) => {
    const cells = [...row.children];
    const heading = row.querySelector('h2, h3, h4');
    const textCell = cells[cells.length - 1];
    const col = document.createElement('div');
    col.className = 'cs-col';
    // Experience Workspace contract: MOVE authored nodes; the wrapper carries the class
    const sub = document.createElement('div');
    sub.className = 'subheadline';
    if (heading) sub.append(heading);
    const content = document.createElement('div');
    content.className = 'content';
    [...textCell.querySelectorAll('p')].forEach((p) => {
      const cta = p.querySelector('a.button, a');
      if (cta && p.textContent.trim() === cta.textContent.trim()) p.classList.add('cs-cta');
      content.append(p);
    });
    col.append(sub, content);
    return col;
  });

  const windowEl = document.createElement('div');
  windowEl.className = 'cs-window';
  const slides = [];
  for (let i = 0; i < cols.length; i += PER_SLIDE) {
    const slide = document.createElement('div');
    slide.className = `cs-slide cs-slide--${slides.length + 1}`;
    if (slides.length > 0) slide.setAttribute('aria-hidden', 'true');
    cols.slice(i, i + PER_SLIDE).forEach((c) => slide.append(c));
    slides.push(slide);
    windowEl.append(slide);
  }

  const nav = document.createElement('div');
  nav.className = 'cs-nav';
  nav.innerHTML = `<button class="cs-prev" aria-label="Previous"></button><ul class="cs-dots slick-dots">${slides.map((_, i) => `<li class="d${i + 1}"><button>${i + 1}</button></li>`).join('')}</ul><button class="cs-next" aria-label="Next"></button>`;

  const slider = document.createElement('div');
  slider.className = 'country-slider';
  slider.append(windowEl, nav);
  block.replaceChildren(slider);

  // carousel (fade; dots resize per distance — live magic-dots equivalent)
  const dots = [...nav.querySelectorAll('.cs-dots li')];
  let cur = 0;
  slider.classList.add('js-init');
  const go = (n) => {
    cur = (n + slides.length) % slides.length;
    dots.forEach((d, i) => d.classList.toggle('slick-active', i === cur));
    slides.forEach((s, i) => {
      s.classList.toggle('cs-active', i === cur);
      s.setAttribute('aria-hidden', i === cur ? 'false' : 'true');
    });
    dots.forEach((d, i) => {
      const b = d.querySelector('button');
      const size = [12, 8, 4, 2][Math.min(Math.abs(i - cur), 3)];
      b.style.width = `${size}px`;
      b.style.height = `${size}px`;
      b.style.background = i === cur ? 'var(--teal)' : 'transparent';
    });
  };
  go(0);
  let timer = setInterval(() => go(cur + 1), INTERVAL);
  const manual = (n) => {
    clearInterval(timer);
    go(n);
    timer = setInterval(() => go(cur + 1), INTERVAL);
  };
  nav.querySelector('.cs-prev').addEventListener('click', () => manual(cur - 1));
  nav.querySelector('.cs-next').addEventListener('click', () => manual(cur + 1));
  dots.forEach((d, i) => d.addEventListener('click', () => manual(i)));
}
