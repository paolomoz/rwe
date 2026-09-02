/**
 * press-list — blanko-overview press-release listing (hub pages).
 * P4 integration (2026-09-02): tiles, counts, company/topic/date/search
 * filtering and load-more read the `press` query-index
 * (/en/press/query-index.json). On a brand hub (/en/press/<brand>/) the list
 * is pre-scoped to that company. Authored rows remain the no-JS/index-down
 * fallback (frozen capture state).
 */

const INDEX_URL = '/en/press/query-index.json?limit=1000';
const PAGE_SIZE = 6;

const COMPANY_LABELS = {
  'rwe-ag': 'RWE AG',
  'rwe-generation': 'RWE Generation',
  'rwe-power': 'RWE Power',
  'rwe-renewables': 'RWE Renewables',
  'rwe-clean-energy': 'RWE Clean Energy',
  'rwe-americas': 'RWE Americas',
  'rwe-offshore-wind-gmbh': 'RWE Offshore Wind',
  'rwe-renewables-europe-australia': 'RWE Renewables Europe & Australia',
  'rwe-supply-and-trading': 'RWE Supply & Trading',
  'rwe-gasstorage-west-gmbh': 'RWE Gasstorage West',
  interviews: 'Interviews',
};
const label = (slug) => COMPANY_LABELS[slug] || (slug || '').replace(/-/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase());
const fmtDate = (iso) => {
  const m = (iso || '').match(/(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : '';
};

const FILTERS = [
  {
    row: 1, label: 'Topics', kind: 'select', value: 'All', width: 'third',
  },
  {
    row: 1, label: 'Company', kind: 'select', value: 'All', width: 'third',
  },
  {
    row: 1, label: 'Energy Sources', kind: 'select', value: 'All', width: 'third',
  },
  {
    row: 2, label: 'From', kind: 'date', value: '02.01.2019', width: 'quarter',
  },
  {
    row: 2, label: 'Until', kind: 'date', value: '27.08.2026', width: 'quarter',
  },
  {
    row: 2, label: 'Search Term', kind: 'search', value: '', width: 'half',
  },
];

const RSS_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" width="22" height="22"><path d="M4 4 a 16 16 0 0 1 16 16"></path><path d="M4 11 a 9 9 0 0 1 9 9"></path><circle cx="5.5" cy="18.5" r="1.6" fill="currentColor" stroke="none"></circle></svg>';

function buildFilter() {
  const wrap = document.createElement('div');
  wrap.className = 'listing-filter';
  [1, 2].forEach((rowNo) => {
    const row = document.createElement('div');
    row.className = 'lf-row';
    FILTERS.filter((f) => f.row === rowNo).forEach((f) => {
      const cell = document.createElement('div');
      cell.className = `lf-cell lf-cell--${f.width}`;
      const lbl = document.createElement('label');
      lbl.className = 'lf-label';
      lbl.textContent = f.label;
      cell.append(lbl);
      if (f.kind === 'select') {
        cell.insertAdjacentHTML('beforeend', `<div class="lf-select"><div class="lf-value">${f.value}</div><div class="lf-indicators"><span class="lf-sep"></span><span class="lf-chevron"></span></div></div>`);
      } else if (f.kind === 'date') {
        cell.insertAdjacentHTML('beforeend', `<div class="lf-date"><input class="lf-input" type="text" value="${f.value}" readonly></div>`);
      } else {
        cell.insertAdjacentHTML('beforeend', `<div class="lf-search"><input class="lf-input" type="search" value="" aria-label="${f.label}"><button class="lf-search-btn" aria-label="Search"></button></div>`);
      }
      row.append(cell);
    });
    wrap.append(row);
  });
  return wrap;
}

function buildTile(row) {
  const pic = row.querySelector('picture, img');
  const titleLink = row.querySelector('h1 a, h2 a, h3 a, h4 a') || row.querySelector('a');
  const ps = [...row.querySelectorAll('p')].map((p) => p.textContent.trim()).filter(Boolean);
  const date = ps.find((t) => /^\d{2}\.\d{2}\.\d{4}$/.test(t)) || '';
  const company = ps.find((t) => !/^\d{2}\.\d{2}\.\d{4}$/.test(t)) || '';

  const cell = document.createElement('div');
  cell.className = 'lr-cell';
  const a = document.createElement('a');
  if (titleLink) a.href = titleLink.href;
  const img = pic && (pic.matches('img') ? pic : pic.querySelector('img'));
  if (img) img.setAttribute('loading', 'lazy');
  a.innerHTML = `
    <section class="lt-header">
      <div class="lt-tag"><h3 class="lt-tag-label"></h3></div>
      <div class="lt-image"></div>
    </section>
    <section class="lt-body">
      <div class="lt-content"><h3 class="lt-title"></h3><p></p></div>
      <div class="lt-footer">
        <p class="lt-date"></p>
        <div class="affordance lt-read-more"><span>Read more</span></div>
      </div>
    </section>`;
  a.querySelector('.lt-tag-label').textContent = company;
  if (img) a.querySelector('.lt-image').append(img.cloneNode(true));
  a.querySelector('.lt-title').textContent = titleLink ? titleLink.textContent.trim() : '';
  a.querySelector('.lt-date').textContent = date;
  const tile = document.createElement('div');
  tile.className = 'listing-tile';
  tile.append(a);
  cell.append(tile);
  return cell;
}

function buildIndexTile(entry) {
  const cell = document.createElement('div');
  cell.className = 'lr-cell';
  const a = document.createElement('a');
  a.href = `${entry.path}/`.replace(/\/\/$/, '/');
  a.innerHTML = `
    <section class="lt-header">
      <div class="lt-tag"><h3 class="lt-tag-label"></h3></div>
      <div class="lt-image"></div>
    </section>
    <section class="lt-body">
      <div class="lt-content"><h3 class="lt-title"></h3><p></p></div>
      <div class="lt-footer">
        <p class="lt-date"></p>
        <div class="affordance lt-read-more"><span>Read more</span></div>
      </div>
    </section>`;
  a.querySelector('.lt-tag-label').textContent = label(entry.company);
  if (entry.image) {
    const img = document.createElement('img');
    img.src = entry.image;
    img.alt = entry.title || '';
    img.loading = 'lazy';
    a.querySelector('.lt-image').append(img);
  }
  a.querySelector('.lt-title').textContent = entry.title || '';
  a.querySelector('.lt-date').textContent = fmtDate(entry.publishdate);
  const tile = document.createElement('div');
  tile.className = 'listing-tile';
  tile.append(a);
  cell.append(tile);
  return cell;
}

export default async function decorate(block) {
  const rows = [...block.children];

  // brand hub scoping: /en/press/<brand>/ pre-filters by company
  const hubMatch = window.location.pathname.match(/^\/en\/press\/([a-z-]+)\/?$/);
  const hubCompany = hubMatch ? hubMatch[1] : null;

  let entries = null;
  try {
    const resp = await fetch(INDEX_URL);
    if (resp.ok) {
      entries = ((await resp.json()).data || []).filter((en) => en.publishdate); // hub pages carry no publishdate
      if (!entries.length) entries = null;
    }
  } catch (e) { /* index down → authored fallback */ }

  const results = document.createElement('div');
  results.className = 'listing-results';
  const count = document.createElement('header');
  count.className = 'listing-count';
  const more = document.createElement('footer');
  more.className = 'listing-more';

  if (!entries || !entries.length) {
    // fallback: authored (frozen) tiles
    rows.forEach((row) => results.append(buildTile(row)));
    count.innerHTML = `<div class="lc-rss"><a title="Press releases of RWE">${RSS_SVG}</a></div><h3 class="lc-count"></h3>`;
    more.innerHTML = '';
    block.replaceChildren(buildFilter(), count, results, more);
    return;
  }

  entries.sort((a, b) => (b.publishdate || '').localeCompare(a.publishdate || ''));

  const state = {
    company: hubCompany || '', topic: '', q: '', from: '', until: '', shown: PAGE_SIZE,
  };
  const applyFilters = () => entries.filter((en) => {
    if (state.company && en.company !== state.company) return false;
    if (state.topic && !(en.topics || '').includes(state.topic)) return false;
    if (state.q) {
      const hay = `${en.title || ''} ${en.description || ''}`.toLowerCase();
      if (!hay.includes(state.q.toLowerCase())) return false;
    }
    if (state.from && (en.publishdate || '') < state.from) return false;
    if (state.until && (en.publishdate || '') > state.until) return false;
    return true;
  });

  const render = () => {
    const list = applyFilters();
    results.replaceChildren(...list.slice(0, state.shown).map(buildIndexTile));
    count.innerHTML = `<div class="lc-rss"><a title="Press releases of RWE">${RSS_SVG}</a></div><h3 class="lc-count">${list.length} results were found.</h3>`;
    const shown = Math.min(state.shown, list.length);
    more.innerHTML = `<h3 class="lm-count">${shown} / ${list.length}</h3>${shown < list.length ? '<div class="lm-btn"><button class="button secondary">Load more</button></div>' : ''}`;
    const btn = more.querySelector('button');
    if (btn) btn.addEventListener('click', () => { state.shown += PAGE_SIZE; render(); });
  };

  // functional filter shell (same skin, real controls)
  const filter = buildFilter();
  const selects = filter.querySelectorAll('.lf-select');
  const wire = (selEl, options, key, current) => {
    const real = document.createElement('select');
    real.className = 'lf-real-select';
    real.append(new Option('All', ''));
    options.forEach(([v, t]) => real.append(new Option(t, v, false, v === current)));
    real.addEventListener('change', () => {
      state[key] = real.value;
      state.shown = PAGE_SIZE;
      selEl.querySelector('.lf-value').textContent = real.selectedOptions[0].textContent;
      render();
    });
    selEl.append(real);
    if (current) selEl.querySelector('.lf-value').textContent = label(current);
  };
  const companies = [...new Set(entries.map((en) => en.company).filter(Boolean))].sort();
  const topics = [...new Set(entries.flatMap((en) => (en.topics || '').split(',')).map((t) => t.trim()).filter(Boolean))].sort();
  wire(selects[1], companies.map((cSlug) => [cSlug, label(cSlug)]), 'company', hubCompany);
  wire(selects[0], topics.map((t) => [t, t.replace(/-/g, ' ')]), 'topic', '');
  // energy-sources select stays inert (no index field yet — P4 residual)

  const search = filter.querySelector('.lf-search .lf-input');
  if (search) {
    search.addEventListener('input', () => { state.q = search.value; state.shown = PAGE_SIZE; render(); });
  }
  const dateInputs = filter.querySelectorAll('.lf-date .lf-input');
  const parseDe = (v) => { const m = v.match(/(\d{2})\.(\d{2})\.(\d{4})/); return m ? `${m[3]}-${m[2]}-${m[1]}` : ''; };
  dateInputs.forEach((inp, i) => {
    inp.removeAttribute('readonly');
    inp.addEventListener('change', () => { state[i === 0 ? 'from' : 'until'] = parseDe(inp.value); state.shown = PAGE_SIZE; render(); });
  });

  block.replaceChildren(filter, count, results, more);
  render();
}
