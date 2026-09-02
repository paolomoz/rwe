import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * header — RWE transparent overlay chrome + mega menu + search overlay.
 * /nav document contract: section 1 = brand link, section 2 = left links
 * (Contact, Apps & Tools), section 3 = right links (RWE Global),
 * section 4 = the mega-menu tree as nested ULs (an "Overview" first child
 * is the section overview link; a li containing an image is the section's
 * newsbox teaser).
 *
 * Mega menu (live "meme" contract, recon 2026-09-02): white panel below the
 * header (slides down, transform .4s ease-in-out; body scroll locks); left
 * rail 250px right-aligned bold 18/27 navy (active teal); flyout panels at
 * left 225 / width 945 switch on HOVER (transform .4s ease-out + opacity
 * .6s ease-in-out); links in 3 CSS columns — heads teal bold 18, leaves
 * navy regular 18/27; newsbox 298px gradient card on the right (The Group,
 * Investor Relations, Press & News).
 *
 * Search overlay (live app-drawer contract): gradient gauze
 * (45deg rgba(29,68,119,.75) 22%, rgba(0,161,159,.75)) over the page,
 * centered white input group (radius 6, 4px white border, 55px input,
 * navy magnifier right), white ✕ in the header row; results read the
 * site-wide query index.
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

/* ---- mega-menu tree parsing (nav section 4) ---- */
function parseTree(ul) {
  return [...ul.children].filter((li) => li.matches('li')).map((li) => {
    const a = li.querySelector(':scope > a');
    const sub = li.querySelector(':scope > ul');
    const picEl = li.querySelector(':scope > a picture, :scope > a img, :scope > picture');
    let pic = null;
    if (picEl) pic = picEl.matches('picture') ? picEl : (picEl.closest('picture') || picEl);
    const item = {
      label: a ? a.textContent.trim() : li.firstChild?.textContent?.trim() || '',
      href: a ? a.getAttribute('href') : null,
      isNewsbox: !!picEl,
      pic,
    };
    if (sub) item.children = parseTree(sub);
    return item;
  });
}

function buildPanel(section) {
  const panel = document.createElement('div');
  panel.className = 'meme-panel';
  const cols = document.createElement('div');
  cols.className = 'meme-cols';

  const kids = (section.children || []).filter((k) => !k.isNewsbox);
  const newsbox = (section.children || []).find((k) => k.isNewsbox);

  kids.forEach((k) => {
    const group = document.createElement('div');
    group.className = 'meme-group';
    if (k.label === 'Overview') {
      group.classList.add('meme-overview');
      const a = document.createElement('a');
      a.href = k.href || '#';
      a.className = 'affordance';
      const sp = document.createElement('span');
      sp.textContent = 'Overview';
      a.append(sp);
      group.append(a);
    } else {
      const head = document.createElement('a');
      head.className = k.children && k.children.length ? 'meme-head' : 'meme-leaf meme-solo';
      head.href = k.href || '#';
      head.textContent = k.label;
      group.append(head);
      if (k.children && k.children.length) {
        const ul = document.createElement('ul');
        k.children.forEach((leaf) => {
          const li = document.createElement('li');
          const la = document.createElement('a');
          la.className = 'meme-leaf';
          la.href = leaf.href || '#';
          la.textContent = leaf.label;
          li.append(la);
          ul.append(li);
        });
        group.append(ul);
      }
    }
    cols.append(group);
  });
  panel.append(cols);

  if (newsbox) {
    const nb = document.createElement('a');
    nb.className = 'meme-newsbox';
    nb.href = newsbox.href || '#';
    const img = document.createElement('div');
    img.className = 'meme-newsbox-image';
    if (newsbox.pic) img.append(newsbox.pic.cloneNode(true));
    const content = document.createElement('div');
    content.className = 'meme-newsbox-content';
    const h3 = document.createElement('h3');
    h3.textContent = newsbox.label;
    const cta = document.createElement('div');
    cta.className = 'affordance white';
    const sp = document.createElement('span');
    sp.textContent = 'Read more';
    cta.append(sp);
    content.append(h3, cta);
    nb.append(img, content);
    panel.append(nb);
    panel.classList.add('has-newsbox');
  }
  return panel;
}

function buildMegaMenu(menuSection) {
  const rootUl = menuSection ? menuSection.querySelector('ul') : null;
  if (!rootUl) return null;
  const tree = parseTree(rootUl);

  const meme = document.createElement('div');
  meme.className = 'meme';
  meme.hidden = true;
  const inner = document.createElement('div');
  inner.className = 'meme-inner';

  const rail = document.createElement('ul');
  rail.className = 'meme-rail';
  const panels = document.createElement('div');
  panels.className = 'meme-panels';

  const panelEls = [];
  const setActive = (i) => {
    [...rail.children].forEach((li, j) => li.classList.toggle('active', i === j));
    panelEls.forEach((el, j) => el.classList.toggle('active', i === j));
  };

  const isMobile = () => window.matchMedia('(max-width: 767px)').matches;

  // mobile: tapping a rail item slides the section panel in; Back returns
  const back = document.createElement('button');
  back.className = 'meme-back';
  back.type = 'button';
  back.innerHTML = '<span>&#8592;</span> Back';
  back.addEventListener('click', () => panels.classList.remove('mob-open'));
  panels.append(back);

  tree.forEach((section, i) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = section.href || '#';
    a.textContent = section.label;
    li.append(a);
    li.addEventListener('mouseenter', () => { if (!isMobile()) setActive(i); });
    a.addEventListener('focus', () => { if (!isMobile()) setActive(i); });
    a.addEventListener('click', (e) => {
      if (isMobile()) {
        e.preventDefault();
        setActive(i);
        panels.classList.add('mob-open');
      }
    });
    rail.append(li);

    const panel = buildPanel(section);
    panelEls.push(panel);
    panels.append(panel);
  });

  inner.append(rail, panels);
  meme.addEventListener('transitionend', () => { if (!meme.classList.contains('open')) panels.classList.remove('mob-open'); });
  meme.append(inner);
  setActive(0);
  return meme;
}

/* ---- search overlay (live app-drawer design) ---- */
function buildSearch() {
  const drawer = document.createElement('div');
  drawer.className = 'app-drawer';
  drawer.hidden = true;
  drawer.innerHTML = `
    <button class="drawer-close" aria-label="Close search">&#10005;</button>
    <div class="drawer-inner">
      <div class="search-group">
        <input type="search" class="search-input" placeholder="Enter search term" aria-label="Enter search term">
        <button class="search-go" aria-label="Search"></button>
      </div>
      <ul class="search-results"></ul>
    </div>`;
  let siteIndex = null;
  const input = drawer.querySelector('.search-input');
  const resultsUl = drawer.querySelector('.search-results');
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
  drawer.loadIndex = async () => {
    if (siteIndex) return;
    try {
      const resp = await fetch('/en/query-index.json?limit=1000');
      if (resp.ok) siteIndex = (await resp.json()).data || [];
    } catch (e) { siteIndex = []; }
  };
  return drawer;
}

export default async function decorate(block) {
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  const sections = fragment ? [...fragment.querySelectorAll(':scope .section')] : [];
  const [brandSection, leftSection, rightSection, menuSection] = sections;

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
  menuBtn.setAttribute('aria-expanded', 'false');
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

  const wrapper = document.createElement('div');
  wrapper.className = 'header-container header-container--is-transparent';
  wrapper.append(nav);

  // ---- mega menu ----
  const meme = buildMegaMenu(menuSection);
  const search = buildSearch();

  let scrollY = 0;
  const lockScroll = (lock) => {
    if (lock) {
      scrollY = window.scrollY;
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      window.scrollTo(0, scrollY);
    }
  };

  const closeMenu = () => {
    if (!meme || meme.hidden) return;
    meme.classList.remove('open');
    wrapper.classList.remove('menu-open');
    menuBtn.setAttribute('aria-expanded', 'false');
    lockScroll(false);
    setTimeout(() => { meme.hidden = true; }, 400);
  };
  const closeSearch = () => {
    if (search.hidden) return;
    search.classList.remove('open');
    wrapper.classList.remove('search-open');
    setTimeout(() => { search.hidden = true; }, 300);
  };

  if (meme) {
    wrapper.append(meme);
    menuBtn.addEventListener('click', () => {
      if (meme.hidden) {
        closeSearch();
        meme.hidden = false;
        requestAnimationFrame(() => requestAnimationFrame(() => meme.classList.add('open')));
        wrapper.classList.add('menu-open');
        menuBtn.setAttribute('aria-expanded', 'true');
        lockScroll(true);
      } else {
        closeMenu();
      }
    });
  }

  // ---- search overlay ----
  wrapper.append(search);
  searchBtn.addEventListener('click', async () => {
    if (search.hidden) {
      closeMenu();
      search.hidden = false;
      requestAnimationFrame(() => requestAnimationFrame(() => search.classList.add('open')));
      wrapper.classList.add('search-open');
      search.querySelector('.search-input').focus();
      await search.loadIndex();
    } else {
      closeSearch();
    }
  });
  search.querySelector('.drawer-close').addEventListener('click', closeSearch);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeMenu(); closeSearch(); }
  });

  block.replaceChildren(wrapper);
}
