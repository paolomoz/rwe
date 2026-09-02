/**
 * Consent-gated martech (live parity, recon 2026-09-02):
 *   - Google Tag Manager container GTM-K6ZG5P5
 * (etracker runs cookie-less as an essential service — loaded
 * unconditionally by consent-check.js, live parity.)
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
