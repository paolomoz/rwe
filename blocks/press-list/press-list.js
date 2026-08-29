/**
 * press-list — blanko-overview press-release listing (hub pages).
 * Reconstructive rows; filter shell, result counts and pagination footer are
 * app UI rendered by the block (frozen at capture values — wired to the
 * `press` query-index + live filtering in the integrations phase, see
 * stardust/dynamic-blocks-map.md § press-list).
 *
 * Authoring rows — one per release tile (first page state):
 *   cell 1: tile <picture>
 *   cell 2: <h3><a href>title</a></h3> + <p>company tag</p> + <p>dd.mm.yyyy</p>
 */

// frozen live-data (capture 2026-08-27) — replaced by index-driven values
const FROZEN = { total: '885 results were found.', shown: '6 / 885' };

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
      const label = document.createElement('label');
      label.className = 'lf-label';
      label.textContent = f.label;
      cell.append(label);
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

export default async function decorate(block) {
  const rows = [...block.children];
  const results = document.createElement('div');
  results.className = 'listing-results';
  rows.forEach((row) => results.append(buildTile(row)));

  const count = document.createElement('header');
  count.className = 'listing-count';
  count.innerHTML = `<div class="lc-rss"><a title="Press releases of RWE">${RSS_SVG}</a></div><h3 class="lc-count">${FROZEN.total}</h3>`;

  const more = document.createElement('footer');
  more.className = 'listing-more';
  more.innerHTML = `<h3 class="lm-count">${FROZEN.shown}</h3><div class="lm-btn"><button class="button secondary">Load more</button></div>`;

  block.replaceChildren(buildFilter(), count, results, more);
}
