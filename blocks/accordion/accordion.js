/**
 * accordion — RWE acc01 replica (content accordions; the footer's mobile
 * accordion is separate chrome). Authoring rows: [heading | rich content].
 * All panels collapsed at rest (live parity); chevron rotates on expand.
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
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('aria-expanded', 'false');
    const span = document.createElement('span');
    span.textContent = headingEl.textContent.trim();
    btn.append(span);
    h3.append(btn);
    const panel = document.createElement('div');
    panel.className = 'accordion-panel';
    panel.hidden = true;
    panel.append(...contentEl.childNodes);
    btn.addEventListener('click', () => {
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
