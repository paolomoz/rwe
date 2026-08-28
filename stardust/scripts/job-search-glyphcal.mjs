import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto('http://localhost:8797/job-search-proposed.html', { waitUntil: 'networkidle' });
const ink = await p.evaluate(async () => {
  await document.fonts.ready;
  const cv = document.createElement('canvas'); cv.width = 900; cv.height = 300;
  const ctx = cv.getContext('2d');
  const out = {};
  for (const [id, ch] of [['clock',''],['globe',''],['heart',''],['chev',''],['mag',''],['mag2',''],['arrow','']]) {
    ctx.clearRect(0,0,900,300);
    ctx.font = '100px RWE_Icon_Font';
    ctx.fillText(ch, 50, 200);
    const d = ctx.getImageData(0,0,900,300).data;
    let minx=1e9,maxx=0,miny=1e9,maxy=0;
    for (let y=0;y<300;y++) for (let x=0;x<900;x++) { if (d[(y*900+x)*4+3]>50) { if(x<minx)minx=x; if(x>maxx)maxx=x; if(y<miny)miny=y; if(y>maxy)maxy=y; } }
    out[id] = { inkW: maxx-minx+1, inkH: maxy-miny+1, advance: Math.round(ctx.measureText(ch).width) };
  }
  return out;
});
console.log(JSON.stringify(ink));
await b.close();
