// Interaction parity (recreation-procedure.md § Interaction parity).
// Widgets mirrored from the live page's behavior: hero fade carousel
// (slick fade:true, autoplay ~7s assumed — logged in progress.json),
// spotlight vertical ticker, video big-play, footer accordions.
(function () {
  // hero fade carousel
  var track = document.querySelector('.hero .hero-track');
  if (track) {
    var slides = [].slice.call(track.children);
    var dots = [].slice.call(document.querySelectorAll('.hero .slick-dots li'));
    var cur = 0;
    slides.forEach(function (s, i) {
      s.style.position = 'relative';
      s.style.left = (-i * 100) + '%';
      s.style.transition = 'opacity .5s ease';
      s.style.opacity = i === 0 ? '1' : '0';
      s.style.zIndex = i === 0 ? '999' : '998';
    });
    function go(n) {
      cur = (n + slides.length) % slides.length;
      slides.forEach(function (s, i) {
        s.style.opacity = i === cur ? '1' : '0';
        s.style.zIndex = i === cur ? '999' : '998';
      });
      dots.forEach(function (d, i) { d.classList.toggle('slick-active', i === cur); });
    }
    var timer = setInterval(function () { go(cur + 1); }, 7000);
    function manual(n) { clearInterval(timer); go(n); timer = setInterval(function () { go(cur + 1); }, 7000); }
    var prev = document.querySelector('.hero .slider-prev');
    var next = document.querySelector('.hero .slider-next');
    if (prev) prev.addEventListener('click', function () { manual(cur - 1); });
    if (next) next.addEventListener('click', function () { manual(cur + 1); });
    dots.forEach(function (d, i) { d.addEventListener('click', function () { manual(i); }); });
  }

  // spotlight vertical ticker (window shows one 205px slide; 4 real slides at track indexes 1-4)
  var sn = document.querySelector('.spotlight .sn-track');
  if (sn) {
    var pos = 1;
    sn.style.transition = 'transform .5s ease';
    var navDots = [].slice.call(document.querySelectorAll('.spotlight .slider-nav__dots span'));
    function snGo(n) {
      pos = n < 1 ? 4 : (n > 4 ? 1 : n);
      sn.style.transform = 'translateY(' + (-pos * 205) + 'px)';
      navDots.forEach(function (d, i) { d.classList.toggle('active', i === pos - 1); });
    }
    var snTimer = setInterval(function () { snGo(pos + 1); }, 6000);
    function snManual(n) { clearInterval(snTimer); snGo(n); snTimer = setInterval(function () { snGo(pos + 1); }, 6000); }
    var up = document.querySelector('.spotlight .slider-nav__arrow--up');
    var down = document.querySelector('.spotlight .slider-nav__arrow--down');
    if (up) up.addEventListener('click', function () { snManual(pos - 1); });
    if (down) down.addEventListener('click', function () { snManual(pos + 1); });
    navDots.forEach(function (d, i) { d.addEventListener('click', function () { snManual(i + 1); }); });
  }

  // quote-band video big play
  var play = document.querySelector('.quote-band .big-play');
  if (play) play.addEventListener('click', function () {
    var v = document.querySelector('.quote-band video');
    if (v) { v.setAttribute('controls', ''); v.play(); play.style.display = 'none'; }
  });

  // footer accordion toggles (default expanded, mirrors live)
  [].slice.call(document.querySelectorAll('.site-footer .f-links h3 button')).forEach(function (btn) {
    btn.addEventListener('click', function () {
      var content = btn.closest('.f-links').querySelector('.accordion-content');
      if (content) content.style.display = content.style.display === 'none' ? '' : 'none';
    });
  });
})();
