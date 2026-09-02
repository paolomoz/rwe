// P5 rollout QA — full-estate delivered-contract sweep.
// Per page: .plain.html 200, exactly one h1, zero about:error, zero
// leftover origin images; full page: title + description present.
import fs from 'fs';

const ORIGIN = 'https://main--rwe--paolomoz.aem.live';
const l = JSON.parse(fs.readFileSync('content/.deploy-ledger.json', 'utf8'));
const paths = Object.keys(l.pages || l).filter((p) => p.startsWith('/'));
console.log(`sweeping ${paths.length} pages`);

const results = { ok: 0, issues: [] };
let i = 0;
const worker = async () => {
  while (i < paths.length) {
    const path = paths[i]; i += 1;
    try {
      const [plainR, fullR] = await Promise.all([
        fetch(`${ORIGIN}${path}.plain.html`),
        fetch(`${ORIGIN}${path}`),
      ]);
      const plain = plainR.ok ? await plainR.text() : '';
      const full = fullR.ok ? await fullR.text() : '';
      const probs = [];
      if (!plainR.ok) probs.push(`plain ${plainR.status}`);
      else {
        const h1s = (plain.match(/<h1[ >]/g) || []).length;
        if (h1s !== 1) probs.push(`h1=${h1s}`);
        if (plain.includes('about:error')) probs.push('about:error');
        if (/<img[^>]+src="https:\/\/www\.rwe\.com/.test(plain)) probs.push('origin-img');
      }
      if (!fullR.ok) probs.push(`page ${fullR.status}`);
      else {
        if (!/<title>[^<]+<\/title>/.test(full)) probs.push('no-title');
        if (!/name="description" content="[^"]+"/.test(full)) probs.push('no-description');
      }
      if (probs.length) results.issues.push({ path, probs });
      else results.ok += 1;
    } catch (e) {
      results.issues.push({ path, probs: [`fetch: ${String(e).slice(0, 60)}`] });
    }
    if (i % 100 === 0) console.log(`…${i}`);
  }
};
await Promise.all(Array.from({ length: 10 }, worker));
fs.writeFileSync('stardust/migration/qa-sweep-results.json', JSON.stringify(results, null, 1));
console.log(`OK: ${results.ok}, issues: ${results.issues.length}`);
const byProb = {};
results.issues.forEach((x) => x.probs.forEach((pr) => { byProb[pr.split(' ')[0]] = (byProb[pr.split(' ')[0]] || 0) + 1; }));
console.log(JSON.stringify(byProb));
results.issues.slice(0, 10).forEach((x) => console.log(' ', x.path.slice(0, 70), x.probs.join(',')));
