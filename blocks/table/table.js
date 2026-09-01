/**
 * table — genuine data tables (tbl01/tbl02). Authoring rows map 1:1 to
 * table rows; the first row is the header.
 */

export default async function decorate(block) {
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');
  [...block.children].forEach((row, i) => {
    const tr = document.createElement('tr');
    [...row.children].forEach((cell) => {
      const td = document.createElement(i === 0 ? 'th' : 'td');
      td.append(...cell.childNodes);
      tr.append(td);
    });
    (i === 0 ? thead : tbody).append(tr);
  });
  table.append(thead, tbody);
  block.replaceChildren(table);
}
