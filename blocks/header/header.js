import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * header — RWE transparent overlay chrome (template-slotted, deploy Step 6).
 * /nav document contract: section 1 = brand link, section 2 = left links
 * (Contact, Apps & Tools), section 3 = right links (RWE Global).
 * Menu / Search / language are visual triggers (mega menu and search overlay
 * are out of scope for the single-page replica — see the conversion log).
 */

const LOGO_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="110" height="32" viewBox="0, 0, 100, 29" aria-hidden="true"><g><path d="M77.293,0.037 C75.961,0.037 74.938,1.041 74.938,2.392 L74.938,26.308 C74.938,27.609 75.992,28.663 77.293,28.663 L99.99,28.663 L99.99,22.936 L82.207,22.936 L82.207,16.813 L96.956,16.813 L96.956,11.32 L82.207,11.32 L82.207,5.585 L99.79,5.585 L99.79,0.037 z M17.091,13.483 L12.46,13.483 C11.654,13.483 11.153,14.361 11.564,15.055 L20.365,28.663 L29.026,28.663 L21.183,18.059 C24.975,17.565 28.122,15.573 28.122,9.293 C28.122,2.683 25.274,0.037 18.287,0.037 L2.365,0.037 C1.034,0.037 0.01,1.041 0.01,2.392 L0.01,28.663 L7.535,28.663 L7.535,5.484 L17.2,5.484 C20.04,5.484 21.131,6.791 21.131,9.433 C21.131,11.687 19.913,13.483 17.091,13.483 M44.883,27.467 C44.623,28.185 43.941,28.663 43.178,28.663 L38.654,28.663 C37.815,28.663 37.085,28.087 36.891,27.272 L30.381,0.037 L38.091,0.037 L41.67,17.701 L47.296,1.262 C47.547,0.529 48.236,0.037 49.011,0.037 L52.973,0.037 C53.748,0.037 54.437,0.529 54.688,1.262 L60.314,17.701 L63.893,0.037 L71.603,0.037 L65.094,27.272 C64.899,28.087 64.169,28.663 63.33,28.663 L58.807,28.663 C58.043,28.663 57.361,28.185 57.101,27.467 L50.992,10.591 z"/></g></svg>';

const ICONS = { contact: 'icon-contact', 'apps & tools': 'icon-add-app', 'rwe global': 'icon-region' };

function linkItem(a) {
  const li = document.createElement('li');
  const na = document.createElement('a');
  na.href = a.href;
  na.textContent = a.textContent.trim();
  const icon = ICONS[a.textContent.trim().toLowerCase()];
  na.className = `link${icon ? ` ${icon}` : ''}`;
  li.append(na);
  return li;
}

export default async function decorate(block) {
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  const sections = fragment ? [...fragment.querySelectorAll(':scope .section')] : [];
  const [brandSection, leftSection, rightSection] = sections;

  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.className = 'header-navigation';
  nav.setAttribute('aria-label', 'Quick Navigation');

  // left list: burger menu trigger + authored links
  const left = document.createElement('ul');
  left.className = 'navigation-list navigation-list--left';
  const menuLi = document.createElement('li');
  menuLi.className = 'menu';
  const menuBtn = document.createElement('button');
  menuBtn.className = 'menu-button icon-burgermenu';
  menuBtn.setAttribute('aria-label', 'Menu');
  const menuLabel = document.createElement('span');
  menuLabel.textContent = 'Menu';
  menuBtn.append(menuLabel);
  menuLi.append(menuBtn);
  left.append(menuLi);
  if (leftSection) [...leftSection.querySelectorAll('a')].forEach((a) => left.append(linkItem(a)));

  // centered brand
  const brandLink = brandSection ? brandSection.querySelector('a') : null;
  const logo = document.createElement('a');
  logo.className = 'logo link';
  logo.href = brandLink ? brandLink.href : '/';
  logo.setAttribute('aria-label', 'RWE');
  logo.innerHTML = LOGO_SVG;

  // right list: authored links + search + language
  const right = document.createElement('ul');
  right.className = 'navigation-list navigation-list--right';
  if (rightSection) [...rightSection.querySelectorAll('a')].forEach((a) => right.append(linkItem(a)));
  const searchLi = document.createElement('li');
  searchLi.className = 'search';
  const searchBtn = document.createElement('button');
  searchBtn.className = 'icon-search';
  searchBtn.setAttribute('aria-label', 'Search');
  const searchLabel = document.createElement('span');
  searchLabel.textContent = 'Search';
  searchBtn.append(searchLabel);
  searchLi.append(searchBtn);
  right.append(searchLi);

  // search overlay (P4): queries the site-wide index (/en/query-index.json)
  const overlay = document.createElement('div');
  overlay.className = 'search-overlay';
  overlay.hidden = true;
  overlay.innerHTML = `
    <div class="search-overlay-inner">
      <input type="search" class="search-input" placeholder="Search term" aria-label="Search term">
      <button class="search-close" aria-label="Close search">&#10005;</button>
      <ul class="search-results"></ul>
    </div>`;
  let siteIndex = null;
  const input = overlay.querySelector('.search-input');
  const resultsUl = overlay.querySelector('.search-results');
  const renderResults = () => {
    const q = input.value.trim().toLowerCase();
    resultsUl.replaceChildren();
    if (!q || q.length < 2 || !siteIndex) return;
    siteIndex
      .filter((en) => `${en.title || ''} ${en.description || ''}`.toLowerCase().includes(q))
      .slice(0, 10)
      .forEach((en) => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = `${en.path}/`.replace(/\/\/$/, '/');
        a.textContent = (en.title || en.path).replace(/ \| RWE.*$/, '');
        const d = document.createElement('p');
        d.textContent = (en.description || '').slice(0, 140);
        li.append(a, d);
        resultsUl.append(li);
      });
  };
  input.addEventListener('input', renderResults);
  searchBtn.addEventListener('click', async () => {
    overlay.hidden = !overlay.hidden;
    if (!overlay.hidden) {
      input.focus();
      if (!siteIndex) {
        try {
          const resp = await fetch('/en/query-index.json?limit=1000');
          if (resp.ok) siteIndex = (await resp.json()).data || [];
        } catch (e) { siteIndex = []; }
      }
    }
  });
  overlay.querySelector('.search-close').addEventListener('click', () => { overlay.hidden = true; });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') overlay.hidden = true; });
  const langLi = document.createElement('li');
  langLi.className = 'lang';
  const langBtn = document.createElement('button');
  langBtn.className = 'lang-select';
  langBtn.setAttribute('aria-label', 'Language');
  const langLabel = document.createElement('span');
  langLabel.textContent = 'English';
  langBtn.append(langLabel);
  langLi.append(langBtn);
  right.append(langLi);

  nav.append(left, logo, right);
  nav.append(overlay);

  const wrapper = document.createElement('div');
  wrapper.className = 'header-container header-container--is-transparent';
  wrapper.append(nav);
  block.replaceChildren(wrapper);
}
