// Download A1 article images from the live origin and rehost on DA media;
// writes the URL→DA mapping for the content rewrite.
import fs from 'fs';
import crypto from 'crypto';
import { execSync } from 'child_process';

const urls = JSON.parse(fs.readFileSync('/tmp/a1-imgs.json', 'utf8'));
const TOKEN = process.env.DA_TOKEN;
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
fs.mkdirSync('/tmp/a1-imgs', { recursive: true });
const map = {};
let ok = 0; let fail = 0;
for (const url of urls) {
  const base = url.split('?')[0].split('/').pop().toLowerCase().replace(/[^a-z0-9.-]/g, '-');
  const hash = crypto.createHash('md5').update(url).digest('hex').slice(0, 6);
  const ext = (base.match(/\.(jpg|jpeg|png|gif|webp|svg)$/) || [, 'jpg'])[1];
  const name = `${base.replace(/\.[a-z]+$/, '')}-${hash}.${ext}`;
  const local = `/tmp/a1-imgs/${name}`;
  try {
    if (!fs.existsSync(local) || !fs.statSync(local).size) {
      execSync(`/usr/bin/curl -sf -A "${UA}" -o "${local}" "${url}"`, { timeout: 60000 });
    }
    if (!fs.statSync(local).size) throw new Error('empty');
    const mime = ext === 'png' ? 'image/png' : ext === 'svg' ? 'image/svg+xml' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
    const code = execSync(`/usr/bin/curl -s -o /dev/null -w '%{http_code}' -X POST -H "Authorization: Bearer ${TOKEN}" -F "data=@${local};type=${mime}" "https://admin.da.live/source/paolomoz/rwe/media/rwe/a1/${name}"`).toString();
    if (code !== '200' && code !== '201') throw new Error(`PUT ${code}`);
    map[url] = `https://content.da.live/paolomoz/rwe/media/rwe/a1/${name}`;
    ok += 1;
    if (ok % 20 === 0) console.log(ok, 'uploaded');
  } catch (e) {
    fail += 1;
    console.log('FAIL', url.slice(0, 90), String(e).slice(0, 80));
  }
}
fs.writeFileSync('stardust/migration/a1-img-map.json', JSON.stringify(map, null, 1));
console.log(`done: ${ok} ok, ${fail} failed`);
