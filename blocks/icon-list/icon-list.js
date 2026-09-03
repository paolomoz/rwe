/**
 * icon-list — RWE il01 replica (checklist with icon bullets).
 * Authoring: one cell with optional h2 + intro <p>s, then a <ul> whose
 * items get the check-circle icon.
 */

export default async function decorate(block) {
  const cell = block.querySelector(':scope > div > div');
  // Experience Workspace contract: authored nodes move as-is; the <ul> is styled by
  // element (a class added to an authored element dies in the editor swap).
  if (cell) block.replaceChildren(...cell.childNodes);
}
