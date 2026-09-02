/**
 * form — RWE forms (P4 integration, recon 2026-09-02).
 *
 * Variants:
 *   contact  — the dynamic-contact-form (dcf): standard field set lifted
 *              from live; posts to the EXISTING RWE endpoint /api/dcf
 *              (absolute during transition; same-origin at cutover) with the
 *              config hash from the page's ?c= parameter, honeypot and
 *              Cloudflare Turnstile (live sitekey — validates once the site
 *              serves under the rwe.com domain).
 *   external — Sitecore Forms (fxb) pages: session-bound CSRF tokens cannot
 *              be replicated statically; renders the form intro + a button
 *              to the original live form until the forms backend is rebuilt.
 *              Authoring row: [notice text | link to the live form].
 */

const DCF_ENDPOINT = 'https://www.rwe.com/api/dcf';
const TURNSTILE_SITEKEY = '0x4AAAAAABBk7C92w6CSJ5Sh';

function field(labelText, name, type, required) {
  const wrap = document.createElement('div');
  wrap.className = 'form-field';
  const label = document.createElement('label');
  label.setAttribute('for', `dcf-${name}`);
  label.textContent = required ? `${labelText}*` : labelText;
  let input;
  if (type === 'textarea') {
    input = document.createElement('textarea');
    input.rows = 6;
  } else {
    input = document.createElement('input');
    input.type = type;
  }
  input.id = `dcf-${name}`;
  input.name = name;
  if (required) input.required = true;
  wrap.append(label, input);
  return wrap;
}

async function loadConfig() {
  const cHash = new URLSearchParams(window.location.search).get('c');
  if (!cHash) return null;
  try {
    const resp = await fetch('/blocks/form/dcf-configs.json');
    if (!resp.ok) return null;
    const map = await resp.json();
    return map[cHash] || null;
  } catch (e) { return null; }
}

function buildContact(block, cfg) {
  // personalize the page stage from the frozen config (live parity: the
  // ?c= hash resolves to a recipient server-side on rwe.com)
  if (cfg) {
    const h1 = document.querySelector('main h1');
    if (h1 && cfg.headline) {
      const back = document.createElement('p');
      back.className = 'dcf-back';
      const backA = document.createElement('a');
      backA.href = '#';
      backA.textContent = 'Back';
      backA.addEventListener('click', (e) => { e.preventDefault(); window.history.back(); });
      back.append(backA);
      h1.before(back);
      h1.textContent = cfg.headline;
      if (cfg.brand) {
        const brand = document.createElement('p');
        brand.className = 'dcf-brand';
        brand.textContent = cfg.brand;
        h1.after(brand);
      }
    }
  }

  const form = document.createElement('form');
  form.className = 'dcf';
  form.noValidate = false;

  form.append(field('Subject', 'request', 'text', true));
  form.append(field('Your message', 'text', 'textarea', true));

  const fieldset = document.createElement('fieldset');
  fieldset.className = 'form-field form-radios';
  const legend = document.createElement('legend');
  legend.textContent = 'I would like to be contacted by *';
  fieldset.append(legend);
  [['email', 'Email', true], ['post', 'Post', false], ['phone', 'Telephone', false]].forEach(([value, label, checked]) => {
    const l = document.createElement('label');
    l.className = 'radio';
    const r = document.createElement('input');
    r.type = 'radio';
    r.name = 'informed-by';
    r.value = value;
    r.required = true;
    if (checked) r.checked = true; // live default: Email preselected
    l.append(r, document.createTextNode(` ${label}`));
    fieldset.append(l);
  });
  form.append(fieldset);

  const nameRow = document.createElement('div');
  nameRow.className = 'form-row';
  nameRow.append(field('Name', 'firstname', 'text', true), field('Surname', 'lastname', 'text', true));
  form.append(nameRow);
  form.append(field('Company/institution', 'company-institution', 'text', false));
  form.append(field('Email address', 'email', 'email', true));

  // honeypot (live parity)
  const hp = field('Leave this field empty', 'hp-name', 'text', false);
  hp.classList.add('hp');
  form.append(hp);

  // turnstile slot (domain-validated: active once served under rwe.com)
  const ts = document.createElement('div');
  ts.className = 'cf-turnstile';
  ts.setAttribute('data-sitekey', TURNSTILE_SITEKEY);
  form.append(ts);
  const tsScript = document.createElement('script');
  tsScript.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
  tsScript.async = true;
  document.head.append(tsScript);

  const note = document.createElement('p');
  note.className = 'form-note';
  note.textContent = '* Mandatory fields';
  form.append(note);

  // privacy note (live verbatim)
  const privacy = document.createElement('p');
  privacy.className = 'form-privacy';
  privacy.append(document.createTextNode('Further information on data protection can be found in our '));
  const pa = document.createElement('a');
  pa.href = '/en/data-protection/';
  pa.textContent = 'data protection information';
  privacy.append(pa, document.createTextNode('.'));
  form.append(privacy);

  const btn = document.createElement('button');
  btn.type = 'submit';
  btn.className = 'button primary';
  btn.textContent = 'Send';
  form.append(btn);

  const status = document.createElement('p');
  status.className = 'form-status';
  form.append(status);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (form.querySelector('[name="hp-name"]').value) return; // bot
    status.textContent = '';
    btn.disabled = true;
    try {
      const data = new FormData(form);
      const c = new URLSearchParams(window.location.search).get('c');
      if (c) data.append('c', c);
      const resp = await fetch(DCF_ENDPOINT, { method: 'POST', body: data, mode: 'cors' });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      form.querySelectorAll('.form-field, fieldset, button').forEach((el) => { el.style.display = 'none'; });
      status.textContent = 'Thank you for your message. We will get back to you as soon as possible.';
      status.classList.add('ok');
    } catch (err) {
      status.textContent = 'Your message could not be sent. Please try again later.';
      status.classList.add('error');
      btn.disabled = false;
    }
  });

  // two-column layout: form + contact rail (live marginal column)
  const grid = document.createElement('div');
  grid.className = 'dcf-grid';
  grid.append(form);
  if (cfg && (cfg.name || cfg.photo)) {
    const rail = document.createElement('aside');
    rail.className = 'dcf-rail';
    const railH = document.createElement('h3');
    railH.textContent = 'Contact';
    rail.append(railH);
    if (cfg.photo) {
      const img = document.createElement('img');
      img.src = cfg.photo;
      img.alt = cfg.name || '';
      rail.append(img);
    }
    if (cfg.name) {
      const nm = document.createElement('h2');
      nm.textContent = cfg.name;
      rail.append(nm);
    }
    if (cfg.role) {
      const rl = document.createElement('p');
      rl.className = 'dcf-role';
      rl.textContent = cfg.role;
      rail.append(rl);
    }
    (cfg.tels || []).forEach((t) => {
      const tp = document.createElement('p');
      tp.className = 'dcf-tel';
      const ta = document.createElement('a');
      ta.href = t.href;
      ta.textContent = t.label;
      tp.append(ta);
      rail.append(tp);
    });
    grid.append(rail);
  }
  block.replaceChildren(grid);
}

function buildExternal(block) {
  const row = block.firstElementChild;
  const cells = row ? [...row.children] : [];
  const text = cells[0] ? cells[0].textContent.trim() : '';
  const link = row ? row.querySelector('a') : null;
  const wrap = document.createElement('div');
  wrap.className = 'form-external';
  if (text) {
    const p = document.createElement('p');
    p.textContent = text;
    wrap.append(p);
  }
  if (link) {
    const a = document.createElement('a');
    a.className = 'button primary';
    a.href = link.href;
    a.textContent = link.textContent.trim() || 'Open the form';
    wrap.append(a);
  }
  block.replaceChildren(wrap);
}

export default async function decorate(block) {
  if (block.classList.contains('contact')) buildContact(block, await loadConfig());
  else buildExternal(block);
}
