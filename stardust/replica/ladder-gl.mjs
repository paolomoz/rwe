import { chromium } from 'playwright';
const probe = async (url, isProto) => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 360, height: 800 } });
  await p.goto(url, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(isProto ? 1500 : 7000);
  const r = await p.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const byText = (sel, txt) => [...document.querySelectorAll(sel)].find((e) => e.textContent.includes(txt));
    const yt = (el) => (el ? Math.round(el.getBoundingClientRect().top + window.scrollY) : null);
    const hb = (el) => (el ? Math.round(el.getBoundingClientRect().height) : null);
    return {
      heroH: hb(q('.hero.block') || q('.stage-slider') || q('.lm-stage') || q('[class*=stage]')),
      firstH2: yt(document.querySelector('main h2')),
      docH: document.documentElement.scrollHeight,
      landmarks: ['strategy', 'Executive Board', 'figures', 'history', 'subsidiaries'].map((t) => {
        const e = byText('h2, h3', t);
        return `${t}: ${e ? Math.round(e.getBoundingClientRect().top + window.scrollY) : null}`;
      }),
    };
  });
  await b.close();
  return r;
};
const [pub, proto] = await Promise.all([
  probe('https://main--rwe--paolomoz.aem.live/en/the-group', false),
  probe('http://localhost:8797/group-landing-proposed.html', true),
]);
console.log('PUB  ', JSON.stringify(pub));
console.log('PROTO', JSON.stringify(proto));
