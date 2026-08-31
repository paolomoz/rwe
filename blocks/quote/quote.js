/**
 * quote — big centered navy quote (quo01 replica). Template-slotted.
 * Authoring: one row, one cell with the quote text (quotation marks are
 * rendered by the block — live wraps the text in typographic quotes).
 */

export default async function decorate(block) {
  const text = block.textContent.trim().replace(/^["“]|["”]$/g, '');
  const wrap = document.createElement('div');
  wrap.className = 'quo01';
  const bq = document.createElement('blockquote');
  const h2 = document.createElement('h2');
  h2.className = 'content';
  h2.textContent = text;
  bq.append(h2);
  wrap.append(bq);
  block.replaceChildren(wrap);
}
