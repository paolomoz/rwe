/**
 * downloads — article download-link list (lnl01 replica). Template-slotted.
 * Bespoke link-list widget: medium teal links, download icon on document
 * links (justifies the single-cell shape — see conversion log).
 *
 * Authoring: one row, one cell: <h3>Downloads</h3> + <ul> of links.
 * Links to documents (.pdf, /-/media/) get the download icon.
 */

export default async function decorate(block) {
  const heading = block.querySelector('h2, h3, h4');
  const list = block.querySelector('ul');
  const out = document.createElement('div');
  if (heading) {
    const h3 = document.createElement('h3');
    h3.textContent = heading.textContent.trim();
    out.append(h3);
  }
  if (list) {
    const ul = list.cloneNode(true);
    ul.querySelectorAll('a').forEach((a) => {
      const doc = /\.pdf(\?|$)/i.test(a.href) || a.href.includes('/-/media/');
      a.className = doc ? 'link-download' : 'link-plain';
    });
    out.append(ul);
  }
  block.replaceChildren(out);
}
