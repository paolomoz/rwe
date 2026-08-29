// motion.js — shared motion-parity layer (all archetypes).
// Entrance animations, header scroll morph, and remaining carousels.
// Contracts lifted live 2026-08-28 (stardust/replica/motion-probe.json +
// nkStyles source CSS). Gate-safe: all timers are cleared by stitch-shot's
// instrument; nothing here changes the t=0 render.
(function () {
  // ---- entrance animations: ONLY the animations that measurably fire on
  // live (runtime observation via scripts/replica/motion-observe.mjs,
  // 2026-08-28 — stardust/replica/motion-observe-*.json). Live carries
  // *-animation classes on many more elements whose animations never fire
  // (the nk framework never adds .animate to them) — tagging from static
  // classes invents motion. Dead on live and therefore NOT tagged here:
  // media-card/trading/interest/gl-card/teaser-card/cvm/explore captions.
  var TAG = {
    'bottom-to-top-animation': [
      '.color-card', '.press-item', '.topic-card', '.resp-band .container',
    ],
    'right-to-left-animation': ['.jobs-teaser .caption'],
    'left-to-right-animation': ['.lm-video-teaser header'],
  };
  // wobble: [container, icon-circles] — delays follow the live stagger
  // (2nd child first, then 3rd…, first child last, 0.5s steps)
  var WOBBLE = [
    ['.contact-band .cols', '.icon-img'],
    ['.gl-contact', '.gl-contact-icon'],
    ['.lm-contact-band', '.lm-contact-teaser .icon-img'],
  ];

  var observed = [];
  Object.keys(TAG).forEach(function (cls) {
    TAG[cls].forEach(function (sel) {
      [].slice.call(document.querySelectorAll(sel)).forEach(function (el) {
        el.classList.add(cls);
        observed.push(el);
      });
    });
  });
  WOBBLE.forEach(function (pair) {
    var wrap = document.querySelector(pair[0]);
    if (!wrap) return;
    var icons = [].slice.call(wrap.querySelectorAll(pair[1]));
    if (!icons.length) return;
    wrap.classList.add('wobble-animation-trigger');
    icons.forEach(function (ic, i) {
      ic.classList.add('wobble-animation');
      // live order: children[1]→0s, [2]→.5s, …, children[0] last
      var order = i === 0 ? icons.length - 1 : i - 1;
      ic.style.animationDelay = (order * 0.5) + 's';
    });
    observed.push(wrap);
  });

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('animate'); io.unobserve(e.target); }
      });
    }, { threshold: 0.15 });
    observed.forEach(function (el) { io.observe(el); });
  } else {
    observed.forEach(function (el) { el.classList.add('animate'); });
  }

  // ---- header scroll morph — in-place, exactly the live mechanism
  // (measured timeline in motion-observe-press.json): the SINGLE header
  // gains scrolled(-fixed 64px)+hidden classes on scroll-down past the
  // header, loses hidden on any scroll-up (compact bar slides in), and
  // returns to the full in-flow header only at y=0. Live keeps the compact
  // bar even at y=30 and compensates no layout (main padding stays 0).
  // A cloned-bar overlay is NOT live behavior and can double-render.
  var hdr = document.querySelector('header.site-header');
  if (hdr) {
    var lastY = window.pageYOffset;
    window.addEventListener('scroll', function () {
      var y = window.pageYOffset;
      if (y <= 1) {
        hdr.classList.remove('site-header--scrolled', 'site-header--hidden');
      } else if (y > lastY + 2 && y > 130) {
        hdr.classList.add('site-header--scrolled', 'site-header--hidden');
      } else if (y < lastY - 2 && hdr.classList.contains('site-header--scrolled')) {
        hdr.classList.remove('site-header--hidden');
      }
      lastY = y;
    }, { passive: true });
  }

  // ---- press-hub country slider (live sli01--text-components, autoplay) ----
  var cSlider = document.querySelector('.country-slider');
  if (cSlider) {
    var slides = [].slice.call(cSlider.querySelectorAll('.cs-slide'));
    var dots = [].slice.call(cSlider.querySelectorAll('.cs-dots li'));
    cSlider.classList.add('js-init');
    var cur = 0;
    function csGo(n) {
      cur = (n + slides.length) % slides.length;
      slides.forEach(function (s, i) {
        s.classList.toggle('cs-active', i === cur);
        s.setAttribute('aria-hidden', i === cur ? 'false' : 'true');
      });
      // magic-dot sizing frozen in CSS for slide 1 — re-derive per distance
      dots.forEach(function (d, i) {
        var b = d.querySelector('button');
        var dist = Math.min(Math.abs(i - cur), 3);
        var size = [12, 8, 4, 2][dist];
        b.style.width = size + 'px';
        b.style.height = size + 'px';
        b.style.background = i === cur ? 'var(--teal)' : 'transparent';
      });
    }
    csGo(0);
    var csTimer = setInterval(function () { csGo(cur + 1); }, 7000);
    function csManual(n) { clearInterval(csTimer); csGo(n); csTimer = setInterval(function () { csGo(cur + 1); }, 7000); }
    var csPrev = cSlider.querySelector('.cs-prev');
    var csNext = cSlider.querySelector('.cs-next');
    if (csPrev) csPrev.addEventListener('click', function () { csManual(cur - 1); });
    if (csNext) csNext.addEventListener('click', function () { csManual(cur + 1); });
    dots.forEach(function (d, i) { d.addEventListener('click', function () { csManual(i); }); });
  }

  // ---- group-landing stage fade carousel (live sli01--stage --autoplay, 2 slides) ----
  var glStage = document.querySelector('.gl-stage');
  if (glStage) {
    var glSlides = [].slice.call(glStage.querySelectorAll('.gl-slide'));
    var glDots = [].slice.call(document.querySelectorAll('.gl-dots li'));
    var glCur = 0;
    function glGo(n) {
      glCur = (n + glSlides.length) % glSlides.length;
      glSlides.forEach(function (s, i) {
        s.classList.toggle('gl-slide--active', i === glCur);
        s.setAttribute('aria-hidden', i === glCur ? 'false' : 'true');
      });
      glDots.forEach(function (d, i) { d.classList.toggle('slick-active', i === glCur); });
    }
    var glTimer = setInterval(function () { glGo(glCur + 1); }, 7000);
    function glManual(n) { clearInterval(glTimer); glGo(n); glTimer = setInterval(function () { glGo(glCur + 1); }, 7000); }
    var glPrev = document.querySelector('.gl-prev');
    var glNext = document.querySelector('.gl-next');
    if (glPrev) glPrev.addEventListener('click', function () { glManual(glCur - 1); });
    if (glNext) glNext.addEventListener('click', function () { glManual(glCur + 1); });
    glDots.forEach(function (d, i) { d.addEventListener('click', function () { glManual(i); }); });
  }

  // ---- locations stage slider (live sli01--stage, NO autoplay — manual only) ----
  var lmTrack = document.querySelector('.lmhero .lm-track');
  if (lmTrack) {
    var lmSlides = [].slice.call(lmTrack.children);
    var lmDots = [].slice.call(document.querySelectorAll('.lmhero .slick-dots li'));
    var lmCur = 0;
    function lmGo(n) {
      lmCur = (n + lmSlides.length) % lmSlides.length;
      lmTrack.style.transform = 'translateX(' + (-lmCur * (100 / lmSlides.length)) + '%)';
      lmSlides.forEach(function (s, i) {
        s.classList.toggle('slick-current', i === lmCur);
        s.classList.toggle('slick-active', i === lmCur);
      });
      lmDots.forEach(function (d, i) { d.classList.toggle('slick-active', i === lmCur); });
    }
    var lmPrev = document.querySelector('.lmhero .slider-prev');
    var lmNext = document.querySelector('.lmhero .slider-next');
    if (lmPrev) lmPrev.addEventListener('click', function () { lmGo(lmCur - 1); });
    if (lmNext) lmNext.addEventListener('click', function () { lmGo(lmCur + 1); });
    lmDots.forEach(function (d, i) { d.addEventListener('click', function () { lmGo(i); }); });
  }
})();
