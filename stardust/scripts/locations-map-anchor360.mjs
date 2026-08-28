import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext({viewport:{width:360,height:800}})).newPage();
await p.goto('http://localhost:8797/locations-map-proposed.html');
await p.waitForTimeout(1500);
const sels = ['.lmhero','.lm-intro h2','.lm-intro .lm-lead','.lm-btnrow','.lm-btnrow .btn','.lm-more','.lm-more p','.lm-intro hr','.lm-mapintro','.lm-mapintro h2','.lm-filter-head','.lm-select .select-control','.lm-filter-col--search','.lm-search-container','.lm-accordion-label','.lm-switch-wrapper','.lm-count','.lm-toggle-pill','.lm-listview','.lm-sort-nav','.location-list-card','.lm-list-second','.lm-disclaimer','.lm-hr--top','.lm-small','.lm-hr--mid','.lm-video-teaser .media','.lm-video-teaser header','.lm-contact-band','.lm-contact-teaser .icon-img','.lm-contact-teaser h2','#breadcrumb-bottom','.site-footer'];
const out = await p.evaluate((sels) => sels.map(s => {
  const e=document.querySelector(s); if(!e) return s+': MISSING';
  const r=e.getBoundingClientRect();
  return `${s}: [${Math.round(r.left)},${Math.round(r.top+scrollY)},${Math.round(r.width)},${Math.round(r.height)}]`;
}), sels);
console.log(out.join('\n'));
await b.close();
