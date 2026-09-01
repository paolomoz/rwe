/**
 * icon-list — RWE il01 replica (checklist with icon bullets).
 * Authoring: one cell with optional h2 + intro <p>s, then a <ul> whose
 * items get the check-circle icon.
 */

export default async function decorate(block) {
  const cell = block.querySelector(':scope > div > div');
  if (cell) block.replaceChildren(...cell.childNodes);
  block.querySelectorAll('ul').forEach((ul) => ul.classList.add('icon-list-items'));
}
