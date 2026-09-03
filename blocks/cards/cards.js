/**
 * cards — RWE teaser cards. Reconstructive (#95).
 * Schema: stardust/eds-schema/index.json § cards
 *
 * Variants (block classes):
 *   color   — text-only cards on white (6-up grid on grey ground)
 *   media   — image on top + white body + outline button
 *   grey    — with media: grey body (career cards)
 *   contact — round icon image + centered heading/text/affordance
 *
 * Authoring rows — one per card:
 *   [picture?] [heading (h3, or h2 for contact) + <p> teaser + <a> link]
 * The card link's text is the CTA label (affordance for color/contact,
 * outline button for media).
 */

function collectCard(row) {
  const pic = row.querySelector('picture, img');
  const heading = row.querySelector('h2, h3, h4');
  const p = [...row.querySelectorAll('p')].find((x) => !x.querySelector('a') && !x.querySelector('picture, img') && x.textContent.trim());
  const link = [...row.querySelectorAll('a')].pop();
  return {
    pic, heading, p, link,
  };
}

/**
 * Experience Workspace contract (see stardust/plugin-improvements/
 * experience-workspace-editability.md): authored elements are MOVED into
 * generated wrappers that carry the layout classes; the card is the link, so
 * the authored CTA anchor is unwrapped in the live DOM after its href is read.
 */
function wrapNode(node, className) {
  const w = document.createElement('div');
  w.className = className;
  w.append(node);
  return w;
}

// CTA label: move the authored <p> (it holds the prose index), drop the inner <a>.
function labelWrap(link, className) {
  const w = document.createElement('div');
  w.className = className;
  const par = link.closest('p');
  if (par) {
    w.append(par);
    link.replaceWith(...link.childNodes);
  } else {
    const span = document.createElement('span');
    span.append(...link.childNodes);
    w.append(span);
    link.remove();
  }
  return w;
}

function lazy(pic) {
  const img = pic.matches('img') ? pic : pic.querySelector('img');
  if (img) img.setAttribute('loading', 'lazy');
  return pic;
}

export default async function decorate(block) {
  const isMedia = block.classList.contains('media');
  const isContact = block.classList.contains('contact');
  const isRelated = block.classList.contains('related');
  const rows = [...block.children];

  const grid = document.createElement('ul');
  grid.className = 'card-list';

  rows.forEach((row) => {
    const {
      pic, heading, p, link,
    } = collectCard(row);
    const li = document.createElement('li');
    li.className = 'cell';
    if (pic && !heading && !link) {
      // media-only tile (no caption, no link)
      li.classList.add('cell--plain');
      const plain = document.createElement('article');
      plain.className = 'card card--plain';
      const media = document.createElement('div');
      media.className = 'card-media';
      media.append(lazy(pic));
      plain.append(media);
      li.append(plain);
      grid.append(li);
      return;
    }
    const article = document.createElement('article');
    article.className = 'card';
    const a = document.createElement('a');
    if (link) { a.href = link.href; a.title = link.title || (heading ? heading.textContent.trim() : ''); }

    if (isRelated) {
      // related press cards: media + [h3 + date] header + fixed affordance
      const media = document.createElement('div');
      media.className = 'card-media';
      if (pic) media.append(lazy(pic));
      a.append(media);
      const header = document.createElement('header');
      if (heading) header.append(wrapNode(heading, 'headline'));
      if (p) header.append(wrapNode(p, 'date'));
      const aff = document.createElement('div');
      aff.className = 'affordance';
      const sp = document.createElement('span');
      sp.textContent = 'Read more';
      aff.append(sp);
      header.append(aff);
      a.append(header);
    } else if (isContact) {
      const iconWrap = document.createElement('div');
      iconWrap.className = 'icon-img';
      if (pic) iconWrap.append(pic);
      a.append(iconWrap);
      const header = document.createElement('header');
      if (heading) header.append(wrapNode(heading, 'headline'));
      if (p) header.append(p);
      if (link) header.append(labelWrap(link, 'affordance'));
      a.append(header);
    } else if (isMedia) {
      const media = document.createElement('div');
      media.className = 'card-media';
      if (pic) media.append(lazy(pic));
      a.append(media);
      const body = document.createElement('div');
      body.className = 'card-body';
      const content = document.createElement('div');
      content.className = 'content';
      if (heading) content.append(wrapNode(heading, 'headline'));
      if (p) content.append(p);
      body.append(content);
      if (link) body.append(labelWrap(link, 'button secondary card-cta'));
      a.append(body);
    } else {
      // color cards: text on white, affordance pinned bottom
      const header = document.createElement('header');
      if (heading) header.append(wrapNode(heading, 'headline'));
      if (p) header.append(p);
      a.append(header);
      if (link) a.append(labelWrap(link, 'affordance'));
    }

    article.append(a);
    li.append(article);
    grid.append(li);
  });

  block.replaceChildren(grid);
}
