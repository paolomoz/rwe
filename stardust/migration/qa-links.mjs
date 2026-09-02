// P5 — internal link integrity: collect every /en/ href from all content
// files, resolve each unique target on the published origin (200 or 301 ok).
import fs from 'fs';

const ORIGIN = 'https://main--rwe--paolomoz.aem.live';
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(`${d}/${e.name}`) : (e.name.endsWith('.html') ? [`${d}/${e.name}`] : [])));
const targets = new Set();
walk('content/en').forEach((f) => {
  const c = fs.readFileSync(f, 'utf8');
  [...c.matchAll(/href="(\/en\/[^"#?]*)/g)].forEach((m) => targets.add(m[1].replace(/\/$/, '')));
});
const list = [...targets];
console.log(`unique internal targets: ${list.length}`);
const results = { ok: 0, redirect: 0, broken: [] };
let i = 0;
const worker = async () => {
  while (i < list.length) {
    const t = list[i]; i += 1;
    try {
      const r = await fetch(`${ORIGIN}${t}`, { method: 'HEAD', redirect: 'manual' });
      if (r.status === 200) results.ok += 1;
      else if (r.status >= 300 && r.status < 400) results.redirect += 1;
      else results.broken.push(`${r.status} ${t}`);
    } catch (e) { results.broken.push(`ERR ${t}`); }
    if (i % 200 === 0) console.log(`…${i}`);
  }
};
await Promise.all(Array.from({ length: 10 }, worker));
console.log(`ok: ${results.ok}, redirected: ${results.redirect}, broken: ${results.broken.length}`);
results.broken.slice(0, 15).forEach((x) => console.log(' ', x.slice(0, 110)));
fs.writeFileSync('stardust/migration/qa-links-results.json', JSON.stringify(results, null, 1));
