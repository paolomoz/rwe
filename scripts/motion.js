/**
 * motion.js — motion-parity layer, EDS port of the gated prototype layer
 * (stardust/prototypes/js/motion.js). Every contract lifted from live
 * (stardust/replica/motion-probe.json + motion-observe, 2026-08-28) —
 * nothing invented. Loaded from loadDelayed(); entrance animations only
 * fire when `.animate` is added on scroll-into-view, so t=0 captures and
 * the pixel gates are unaffected.
 *
 * Live carries *-animation classes on many more elements whose animations
 * never fire (the nk framework never adds .animate to them). Only the
 * animations that measurably fired on live are tagged here. Dead on live
 * and therefore NOT tagged: media-card/trading/interest/gl-card/
 * teaser-card/cvm/explore captions.
 */

const TAG = {
  'bottom-to-top-animation': [
    '.cards.color .card',
    '.press-item',
    '.cards.topics .card',
    '.responsibility .teaser-row',
  ],
  'right-to-left-animation': ['.banner.jobs .caption'],
  'left-to-right-animation': ['.banner.locations .lm-video-teaser header'],
};

// wobble: [container, icon] — live stagger: 2nd child first, then 3rd…,
// first child last, 0.5s steps
const WOBBLE = [
  ['.cards.contact .card-list', '.icon-img'],
];

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!reduced) {
  const observed = [];
  Object.entries(TAG).forEach(([cls, sels]) => {
    sels.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => {
        el.classList.add(cls);
        observed.push(el);
      });
    });
  });
  WOBBLE.forEach(([wrapSel, iconSel]) => {
    document.querySelectorAll(wrapSel).forEach((wrap) => {
      const icons = [...wrap.querySelectorAll(iconSel)];
      if (!icons.length) return;
      wrap.classList.add('wobble-animation-trigger');
      icons.forEach((ic, i) => {
        ic.classList.add('wobble-animation');
        // live order: children[1]→0s, [2]→.5s, …, children[0] last
        const order = i === 0 ? icons.length - 1 : i - 1;
        ic.style.animationDelay = `${order * 0.5}s`;
      });
      observed.push(wrap);
    });
  });

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('animate');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.15 });
    observed.forEach((el) => io.observe(el));
  } else {
    observed.forEach((el) => el.classList.add('animate'));
  }
}

// ---- header scroll morph — exactly the live mechanism (measured timeline
// in motion-observe-press.json): the SINGLE header gains scrolled(-fixed
// 64px)+hidden classes on scroll-down past the header, loses hidden on any
// scroll-up (compact bar slides in), and returns to the full in-flow header
// only at y=0. Live keeps the compact bar even at y=30 and compensates no
// layout. Scroll-down keeps the bar hidden, so stitched captures are
// unaffected (they only scroll down).
const hdr = document.querySelector('body > header .header');
if (hdr) {
  let lastY = window.pageYOffset;
  window.addEventListener('scroll', () => {
    const y = window.pageYOffset;
    if (y <= 1) {
      hdr.classList.remove('header-scrolled', 'header-hidden');
    } else if (y > lastY + 2 && y > 130) {
      hdr.classList.add('header-scrolled', 'header-hidden');
    } else if (y < lastY - 2 && hdr.classList.contains('header-scrolled')) {
      hdr.classList.remove('header-hidden');
    }
    lastY = y;
  }, { passive: true });
}
