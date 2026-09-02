/**
 * Consent-gated martech (live parity, recon 2026-09-02):
 *   - Google Tag Manager container GTM-K6ZG5P5
 *   - etracker code.etracker.com (et=e8K7Wx)
 * Loaded only after consent (see consent-check.js).
 */

/* GTM */
(function loadGtm(w, d, s, l, i) {
  w[l] = w[l] || [];
  w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
  const f = d.getElementsByTagName(s)[0];
  const j = d.createElement(s);
  const dl = l !== 'dataLayer' ? `&l=${l}` : '';
  j.async = true;
  j.src = `https://www.googletagmanager.com/gtm.js?id=${i}${dl}`;
  f.parentNode.insertBefore(j, f);
}(window, document, 'script', 'dataLayer', 'GTM-K6ZG5P5'));

/* etracker */
(function loadEtracker() {
  const s = document.createElement('script');
  s.src = 'https://code.etracker.com/code/e.js';
  s.async = true;
  s.setAttribute('data-secure-code', 'e8K7Wx');
  s.id = '_etLoader';
  s.setAttribute('data-block-cookies', 'true');
  document.head.append(s);
}());
