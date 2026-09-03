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
  // Experience Workspace contract: MOVE the authored heading and list (the <ul> is
  // the editable unit). Icon classes are a published-page hint only; the CSS also
  // matches by href so the icon survives the editor's re-render.
  if (heading) out.append(heading);
  if (list) {
    list.querySelectorAll('a').forEach((a) => {
      const doc = /\.pdf(\?|$)/i.test(a.href) || a.href.includes('/-/media/');
      a.className = doc ? 'link-download' : 'link-plain';
    });
    out.append(list);
  }
  block.replaceChildren(out);
}
