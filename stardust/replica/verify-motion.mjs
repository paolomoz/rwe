import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('https://main--rwe--paolomoz.aem.live/', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(9000);
// header + play static checks
const staticChecks = await p.evaluate(() => {
  const right = document.querySelector('.navigation-list--right');
  const nav = document.querySelector('nav.header-navigation');
  const play = document.querySelector('.columns .big-play');
  const vid = play ? play.parentElement : null;
  const rr = right.getBoundingClientRect(); const nr = nav.getBoundingClientRect();
  const pr = play ? play.getBoundingClientRect() : null;
  const vr = vid ? vid.getBoundingClientRect() : null;
  return {
    navRight: Math.round(nr.right), rightGroupRight: Math.round(rr.right),
    rightItems: [...right.children].map((li) => `${li.textContent.trim().slice(0, 10)} x${Math.round(li.getBoundingClientRect().left)}`),
    play: pr ? { w: Math.round(pr.width), h: Math.round(pr.height), cx: Math.round(pr.left + pr.width / 2 - vr.left), cy: Math.round(pr.top + pr.height / 2 - vr.top), vidW: Math.round(vr.width), vidH: Math.round(vr.height), border: getComputedStyle(play).borderWidth } : null,
  };
});
console.log('STATIC', JSON.stringify(staticChecks, null, 1));
// scroll to the color cards + contact band, check animations fire
await p.evaluate(() => { const el = document.querySelector('.cards.color .card'); el.scrollIntoView({ block: 'center' }); });
await p.waitForTimeout(800);
const anim1 = await p.evaluate(() => {
  const card = document.querySelector('.cards.color .card');
  const cs = getComputedStyle(card);
  return { classes: card.className, animation: cs.animationName, dur: cs.animationDuration };
});
console.log('CARDS', JSON.stringify(anim1));
await p.evaluate(() => { document.querySelector('.cards.contact .icon-img').scrollIntoView({ block: 'center' }); });
await p.waitForTimeout(400);
const anim2 = await p.evaluate(() => {
  const wrap = document.querySelector('.cards.contact .card-list');
  const icons = [...document.querySelectorAll('.cards.contact .icon-img')];
  return {
    wrapCls: wrap.className,
    icons: icons.map((ic) => `${getComputedStyle(ic).animationName} delay:${ic.style.animationDelay}`),
  };
});
console.log('WOBBLE', JSON.stringify(anim2, null, 1));
// header morph: scroll down then up
await p.evaluate(() => window.scrollTo(0, 2000));
await p.waitForTimeout(300);
const down = await p.evaluate(() => document.querySelector('body > header .header').className);
await p.evaluate(() => window.scrollTo(0, 1800));
await p.waitForTimeout(300);
const up = await p.evaluate(() => {
  const h = document.querySelector('body > header .header');
  const cs = getComputedStyle(h);
  return { cls: h.className, pos: cs.position, h: cs.height, transform: cs.transform };
});
await p.evaluate(() => window.scrollTo(0, 0));
await p.waitForTimeout(300);
const top = await p.evaluate(() => document.querySelector('body > header .header').className);
console.log('MORPH down:', down, '\nMORPH up:', JSON.stringify(up), '\nMORPH y0:', top);
await b.close();
