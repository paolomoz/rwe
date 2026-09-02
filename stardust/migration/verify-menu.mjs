import { chromium } from 'playwright';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
await p.goto('https://main--rwe--paolomoz.aem.live/', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(7000);
// open menu
await p.click('.menu-button');
await p.waitForTimeout(900);
const state = await p.evaluate(() => ({
  railItems: document.querySelectorAll('.meme-rail li').length,
  activeSection: document.querySelector('.meme-rail li.active a')?.textContent,
  panelLinks: document.querySelector('.meme-panel.active')?.querySelectorAll('a').length,
  newsbox: !!document.querySelector('.meme-panel.active .meme-newsbox'),
  newsboxImgOk: (() => { const i = document.querySelector('.meme-panel.active .meme-newsbox img'); return i ? i.naturalWidth > 0 : null; })(),
  bodyLocked: getComputedStyle(document.body).overflow === 'hidden',
  totalMenuLinks: document.querySelectorAll('.meme a').length,
}));
console.log('MENU OPEN:', JSON.stringify(state, null, 1));
await p.screenshot({ path: '/tmp/menu-open-pub.png' });
// hover 7th section (Investor Relations)
await p.hover('.meme-rail li:nth-child(7)');
await p.waitForTimeout(900);
const ir = await p.evaluate(() => ({
  active: document.querySelector('.meme-rail li.active a')?.textContent,
  newsboxHeadline: document.querySelector('.meme-panel.active .meme-newsbox h3')?.textContent,
}));
console.log('HOVER IR:', JSON.stringify(ir));
await p.screenshot({ path: '/tmp/menu-ir-pub.png' });
// esc closes; search opens
await p.keyboard.press('Escape');
await p.waitForTimeout(600);
await p.click('.icon-search');
await p.waitForTimeout(900);
await p.type('.app-drawer .search-input', 'hydrogen');
await p.waitForTimeout(1200);
const search = await p.evaluate(() => ({
  gauze: getComputedStyle(document.querySelector('.app-drawer')).backgroundImage.slice(0, 60),
  results: document.querySelectorAll('.app-drawer .search-results li').length,
}));
console.log('SEARCH:', JSON.stringify(search));
await p.screenshot({ path: '/tmp/search-pub.png' });
await b.close();

// mobile
const b2 = await chromium.launch();
const p2 = await (await b2.newContext({ viewport: { width: 360, height: 800 } })).newPage();
await p2.goto('https://main--rwe--paolomoz.aem.live/', { waitUntil: 'domcontentloaded' });
await p2.waitForTimeout(7000);
await p2.click('.menu-button');
await p2.waitForTimeout(800);
await p2.screenshot({ path: '/tmp/menu-mobile-pub.png' });
await p2.click('.meme-rail li:nth-child(1) a');
await p2.waitForTimeout(800);
const mob = await p2.evaluate(() => ({
  panelsOpen: document.querySelector('.meme-panels').classList.contains('mob-open'),
  backVisible: getComputedStyle(document.querySelector('.meme-back')).display !== 'none',
}));
console.log('MOBILE:', JSON.stringify(mob));
await p2.screenshot({ path: '/tmp/menu-mobile-panel-pub.png' });
await b2.close();
