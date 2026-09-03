/**
 * accordion — RWE acc01 replica (content accordions; the footer's mobile
 * accordion is separate chrome). Authoring rows: [heading | rich content].
 * All panels collapsed at rest (live parity); chevron rotates on expand.
 *
 * Experience Workspace contract: the authored title paragraph is MOVED into
 * `.accordion-title` (a <button> cannot host an inline editor, so the toggle
 * is a chevron-only sibling button and the whole headline row is clickable).
 */

export default async function decorate(block) {
  const list = document.createElement('ul');
  list.className = 'accordion-list';
  [...block.children].forEach((row) => {
    const cells = [...row.children];
    const headingEl = cells[0];
    const contentEl = cells[1] || document.createElement('div');
    const li = document.createElement('li');
    li.className = 'accordion-item';
    const h3 = document.createElement('h3');
    h3.className = 'accordion-headline';
    const title = document.createElement('div');
    title.className = 'accordion-title';
    title.append(...headingEl.childNodes);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'accordion-toggle';
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', `Toggle: ${title.textContent.trim()}`);
    h3.append(title, btn);
    const panel = document.createElement('div');
    panel.className = 'accordion-panel';
    panel.hidden = true;
    panel.append(...contentEl.childNodes);
    h3.addEventListener('click', () => { // whole row toggles (button click bubbles here once)
      const open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      panel.hidden = open;
      li.classList.toggle('expanded', !open);
    });
    li.append(h3, panel);
    list.append(li);
  });
  block.replaceChildren(list);
}
