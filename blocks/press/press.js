/**
 * press — RWE press releases + share-price ticker (media band).
 * Reconstructive. Schema: stardust/eds-schema/index.json § press
 *
 * Authoring rows:
 *   row 1 (head): cell 1 <h3> "Press releases", cell 2 <a> "View all"
 *   rows 2..N-1 (releases): cell 1 ISO date (YYYY-MM-DD),
 *                           cell 2 <h3> title, cell 3 <a> "Continue" link
 *   last row (ticker): a single share-ticker embed URL as a plain <a>
 *     (rendered by the block into the gradient share box — live market
 *     data widget, D1 auto-block style)
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function isTickerRow(row) {
  const a = row.querySelector('a');
  return a && /eurolandir\.com|ticker/i.test(a.href) && row.textContent.trim() === a.textContent.trim();
}

export default async function decorate(block) {
  const rows = [...block.children];
  const headRow = rows.find((r) => r.querySelector('a') && /view all/i.test(r.textContent)) || rows[0];
  const tickerRow = rows.find(isTickerRow);
  const items = rows.filter((r) => r !== headRow && r !== tickerRow);

  const cols = document.createElement('div');
  cols.className = 'cols';

  // press column
  const colPress = document.createElement('div');
  colPress.className = 'col-press';
  const header = document.createElement('header');
  header.className = 'press-header';
  const ht = headRow.querySelector('h2, h3');
  const h3 = document.createElement('h3');
  h3.className = 'subheadline';
  h3.textContent = ht ? ht.textContent.trim() : 'Press releases';
  header.append(h3);
  const viewAll = headRow.querySelector('a');
  if (viewAll) {
    const va = document.createElement('a');
    va.className = 'affordance';
    va.href = viewAll.href;
    va.textContent = viewAll.textContent.trim();
    header.append(va);
  }
  colPress.append(header);

  const list = document.createElement('ul');
  list.className = 'press-list';
  items.forEach((row) => {
    const cells = [...row.children];
    const dateText = (cells[0] ? cells[0].textContent.trim() : '');
    const title = row.querySelector('h3, h4');
    const link = [...row.querySelectorAll('a')].pop();

    const li = document.createElement('li');
    const item = document.createElement('div');
    item.className = 'press-item';
    const a = document.createElement('a');
    if (link) a.href = link.href;

    const time = document.createElement('time');
    const m = dateText.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (m) {
      time.setAttribute('datetime', dateText);
      const day = document.createElement('span');
      day.className = 'date--day';
      day.textContent = String(parseInt(m[3], 10));
      const month = document.createElement('span');
      month.className = 'date--month';
      month.setAttribute('data-short', `${MONTHS[parseInt(m[2], 10) - 1]}'${m[1].slice(2)}`);
      month.textContent = new Date(`${dateText}T00:00:00`).toLocaleString('en', { month: 'long' });
      time.append(day, document.createTextNode(' '), month);
    }
    a.append(time);

    const head = document.createElement('header');
    const h4 = document.createElement('h4');
    h4.textContent = title ? title.textContent.trim() : '';
    head.append(h4);
    a.append(head);

    const more = document.createElement('div');
    more.className = 'read-more';
    const btn = document.createElement('span');
    btn.className = 'button secondary';
    btn.textContent = link ? link.textContent.trim() : 'Continue';
    more.append(btn);
    a.append(more);

    item.append(a);
    li.append(item);
    list.append(li);
  });
  colPress.append(list);

  // share-price column
  const colShare = document.createElement('div');
  colShare.className = 'col-share';
  if (tickerRow) {
    const url = tickerRow.querySelector('a').href;
    const box = document.createElement('div');
    box.className = 'share-box';
    const iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.title = 'RWE share price';
    iframe.loading = 'lazy';
    box.append(iframe);
    colShare.append(box);
  }

  cols.append(colPress, colShare);
  block.replaceChildren(cols);
}
