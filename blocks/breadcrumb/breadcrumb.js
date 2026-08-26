/**
 * breadcrumb — navy trail bar above the footer (#breadcrumb-bottom replica).
 * Template-slotted. Authoring row: one cell with the trail links/text.
 */

export default async function decorate(block) {
  const row = block.firstElementChild;
  const ol = document.createElement('ol');
  ol.className = 'breadcrumb-list';
  if (row) {
    const links = [...row.querySelectorAll('a')];
    if (links.length) {
      links.forEach((a, i) => {
        const li = document.createElement('li');
        if (i === links.length - 1) li.className = 'active';
        li.append(a.cloneNode(true));
        ol.append(li);
      });
    } else {
      const li = document.createElement('li');
      li.className = 'active';
      const a = document.createElement('a');
      a.setAttribute('aria-current', 'page');
      a.textContent = row.textContent.trim();
      li.append(a);
      ol.append(li);
    }
  }
  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Breadcrumb');
  nav.append(ol);
  block.replaceChildren(nav);
}
