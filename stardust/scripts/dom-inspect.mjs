import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto('https://main--rwe--paolomoz.aem.page/', { waitUntil: 'networkidle', timeout: 60000 });
await p.waitForTimeout(2000);
const out = await p.evaluate(() => {
  const r = {};
  const resp = document.querySelector('.responsibility');
  r.resp = resp ? resp.innerHTML.slice(0, 800) : 'MISSING';
  const contact = document.querySelector('.cards.contact');
  r.contact = contact ? contact.innerHTML.slice(0, 700) : 'MISSING';
  const pressCols = document.querySelector('.press .cols');
  r.pressHead = document.querySelector('.press .press-header') ? document.querySelector('.press .press-header').outerHTML.slice(0, 300) : 'MISSING';
  r.pressItem1 = document.querySelector('.press .press-item') ? document.querySelector('.press .press-item').outerHTML.slice(0, 400) : 'MISSING';
  const iframe = document.querySelector('.press iframe');
  r.iframe = iframe ? iframe.src.slice(0, 80) : 'MISSING';
  const fcol = document.querySelector('footer .f-links ul');
  r.footerLinks = fcol ? fcol.children.length : 'MISSING';
  const heroBox = document.querySelector('.hero .slider-slide.active .stage-box');
  r.heroBox = heroBox ? `${heroBox.className} rect=${JSON.stringify(heroBox.getBoundingClientRect())}` : 'MISSING';
  const tw = document.querySelector('.hero .slider-slide.active .teaser-width');
  r.teaserWidth = tw ? JSON.stringify(tw.getBoundingClientRect()) : 'MISSING';
  // press section: check its section div structure
  const mediaSection = document.querySelector('.press')?.closest('.section');
  r.mediaSectionClasses = mediaSection ? mediaSection.className : 'MISSING';
  return r;
});
console.log(JSON.stringify(out, null, 1));
await b.close();
