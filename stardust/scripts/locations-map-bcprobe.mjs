import { chromium } from 'playwright';
const b = await chromium.launch();
for (const u of ['locations-map-proposed.html','article-proposed.html']) {
  const p = await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
  await p.goto('http://localhost:8797/'+u);
  await p.waitForTimeout(1200);
  const r = await p.evaluate(() => {
    const n=document.querySelector('#breadcrumb-bottom');
    const ol=n.querySelector('ol'); const li=ol.querySelector('li');
    const a=li.querySelector('a');
    return {page:location.pathname, bc:n.offsetHeight, ol:ol.offsetHeight, olcs:getComputedStyle(ol).lineHeight+' '+getComputedStyle(ol).fontSize, li:li.getBoundingClientRect().height, lics:getComputedStyle(li).lineHeight, acs:a?getComputedStyle(a).fontSize+'/'+getComputedStyle(a).lineHeight:null};
  });
  console.log(r);
}
await b.close();
