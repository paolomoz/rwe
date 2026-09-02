// Generate content/nav.html: top-bar sections (unchanged) + the mega-menu
// tree (nested ULs; a section's newsbox = trailing li with a picture).
import fs from 'fs';
const { tree } = JSON.parse(fs.readFileSync('stardust/migration/megamenu-tree.json', 'utf8'));
const esc = (s) => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const NB_IMG = {
  'The Group': 'https://content.da.live/paolomoz/rwe/media/rwe/nav/tea-bulle-baer.jpg',
  'Investor Relations': 'https://content.da.live/paolomoz/rwe/media/rwe/nav/tea-bulle-baer.jpg',
  'Press & News': 'https://content.da.live/paolomoz/rwe/media/rwe/nav/tea-presse.jpg',
};
const li = (item, depth) => {
  const pad = '  '.repeat(depth + 4);
  let out = `${pad}<li><a href="${item.href || '#'}">${esc(item.label)}</a>`;
  const kids = [];
  if (item.overview) kids.push({ label: `Overview`, href: item.overview.href });
  if (item.children) kids.push(...item.children);
  if (kids.length) {
    out += `\n${pad}  <ul>\n${kids.map((k) => li(k, depth + 1)).join('\n')}`;
    if (item.newsbox && NB_IMG[item.label]) {
      out += `\n${pad}    <li><a href="${item.newsbox.href}"><img src="${NB_IMG[item.label]}" alt="${esc(item.newsbox.headline)}"> ${esc(item.newsbox.headline)}</a></li>`;
    }
    out += `\n${pad}  </ul>\n${pad}`;
  }
  return `${out}</li>`;
};
const menu = tree.map((s) => li(s, 0)).join('\n');
const out = `<body>
  <header></header>
  <main>
    <div>
      <p><a href="/">RWE</a></p>
    </div>
    <div>
      <ul>
        <li><a href="/en/contact-services/">Contact</a></li>
        <li><a href="/en/contact-services/apps-and-tools/">Apps &amp; Tools</a></li>
      </ul>
    </div>
    <div>
      <ul>
        <li><a href="/en/the-group/countries-and-locations/">RWE Global</a></li>
      </ul>
    </div>
    <div>
      <ul>
${menu}
      </ul>
    </div>
  </main>
  <footer></footer>
</body>
`;
fs.writeFileSync('content/nav.html', out);
const links = (out.match(/<a /g) || []).length;
console.log('nav.html written:', out.length, 'bytes,', links, 'links');
