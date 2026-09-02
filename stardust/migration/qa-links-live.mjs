import fs from 'fs';
const r = JSON.parse(fs.readFileSync('stardust/migration/qa-links-results.json', 'utf8'));
const broken = r.broken.map((b) => b.split(' ')[1]).filter(Boolean).filter((b) => b !== '/en');
const out = { deadOnLiveToo: [], liveHas: [] };
let i = 0;
const worker = async () => {
  while (i < broken.length) {
    const t = broken[i]; i += 1;
    try {
      const resp = await fetch(`https://www.rwe.com${encodeURI(t)}/`, { method: 'HEAD', redirect: 'manual', headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (resp.status === 200) out.liveHas.push(t);
      else out.deadOnLiveToo.push(`${resp.status} ${t}`);
    } catch (e) { out.deadOnLiveToo.push(`ERR ${t}`); }
  }
};
await Promise.all(Array.from({ length: 8 }, worker));
console.log('dead on live too (parity):', out.deadOnLiveToo.length);
console.log('LIVE HAS (real gaps):', out.liveHas.length);
out.liveHas.forEach((x) => console.log(' ', x));
fs.writeFileSync('stardust/migration/qa-links-live.json', JSON.stringify(out, null, 1));
