/**
 * quote — big centered navy quote (quo01 replica). Template-slotted.
 * Authoring: one row, one cell with the quote text. Quotation marks are
 * rendered by CSS — do not author them.
 *
 * Experience Workspace contract: the authored paragraph is MOVED into the
 * `.content` wrapper (the runtime wraps a bare-text cell in <p> before decorate).
 */

export default async function decorate(block) {
  const cell = block.querySelector(':scope > div > div') || block;
  const wrap = document.createElement('div');
  wrap.className = 'quo01';
  const bq = document.createElement('blockquote');
  const content = document.createElement('div');
  content.className = 'content';
  content.append(...cell.childNodes);
  bq.append(content);
  wrap.append(bq);
  block.replaceChildren(wrap);
}
