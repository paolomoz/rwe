let consentedLoaded = false;

/**
 * Usercentrics CMP integration (live parity: Usercentrics CMP,
 * settings id lrfueDZgn — recon 2026-09-02). The CMP loads in the delayed
 * phase; consented scripts (GTM + etracker, see consented.js) load only after
 * the user grants consent via the CMP.
 *
 * Testing override (pilot origin): ?consent=accept | ?consent=decline
 */

const UC_SETTINGS_ID = 'lrfueDZgn';

function consentOverride() {
  const consent = new URLSearchParams(window.location.search).get('consent');
  if (consent === null) return null;
  return ['accept', 'true', '1', 'yes'].includes(consent.toLowerCase());
}

function loadConsented() {
  if (consentedLoaded) return;
  consentedLoaded = true;
  import('./consented.js');
}

function notify(consented) {
  window.dispatchEvent(new CustomEvent('consent.update', { detail: { consented } }));
  if (consented) loadConsented();
}

/* UC_UI service-consent check: any explicit consent beyond essential */
function ucHasAnalyticsConsent() {
  try {
    const services = window.UC_UI.getServicesBaseInfo();
    return services.some((s) => s.consent && s.consent.status === true && !s.isEssential);
  } catch (e) {
    return false;
  }
}

const override = consentOverride();
if (override !== null) {
  notify(override);
} else {
  // load the CMP exactly as live does
  const s = document.createElement('script');
  s.id = 'usercentrics-cmp';
  s.src = 'https://web.cmp.usercentrics.eu/ui/loader.js';
  s.setAttribute('data-settings-id', UC_SETTINGS_ID);
  s.async = true;
  document.head.append(s);

  window.addEventListener('UC_UI_INITIALIZED', () => notify(ucHasAnalyticsConsent()));
  // fires on accept/deny/save interactions
  window.addEventListener('UC_UI_CMP_EVENT', (e) => {
    const t = e.detail && e.detail.type;
    if (['ACCEPT_ALL', 'DENY_ALL', 'SAVE'].includes(t)) notify(ucHasAnalyticsConsent());
  });
}

/* footer "Cookies & Services" link opens the CMP second layer (live parity) */
document.addEventListener('click', (e) => {
  const a = e.target.closest('a');
  if (a && /cookies\s*&\s*services/i.test(a.textContent) && !a.getAttribute('href')) {
    e.preventDefault();
    if (window.UC_UI) window.UC_UI.showSecondLayer();
  }
});
