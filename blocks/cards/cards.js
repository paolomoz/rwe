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

export default async function decorate(block) {
  const isMedia = block.classList.contains('media');
  const isContact = block.classList.contains('contact');
  const rows = [...block.children];

  const grid = document.createElement('ul');
  grid.className = 'card-list';

  rows.forEach((row) => {
    const { pic, heading, p, link } = collectCard(row);
    const li = document.createElement('li');
    li.className = 'cell';
    const article = document.createElement('article');
    article.className = 'card';
    const a = document.createElement('a');
    if (link) { a.href = link.href; a.title = link.title || (heading ? heading.textContent.trim() : ''); }

    if (isContact) {
      const iconWrap = document.createElement('div');
      iconWrap.className = 'icon-img';
      if (pic) iconWrap.append(pic.cloneNode(true));
      a.append(iconWrap);
      const header = document.createElement('header');
      if (heading) {
        const h2 = document.createElement('h2');
        h2.className = 'headline';
        h2.textContent = heading.textContent.trim();
        header.append(h2);
      }
      if (p) { const pp = document.createElement('p'); pp.textContent = p.textContent.trim(); header.append(pp); }
      if (link) {
        const aff = document.createElement('div');
        aff.className = 'affordance';
        const s = document.createElement('span');
        s.textContent = link.textContent.trim();
        aff.append(s);
        header.append(aff);
      }
      a.append(header);
    } else if (isMedia) {
      const media = document.createElement('div');
      media.className = 'card-media';
      if (pic) {
        const img = pic.matches('img') ? pic : pic.querySelector('img');
        if (img) img.setAttribute('loading', 'lazy');
        media.append(pic.cloneNode(true));
      }
      a.append(media);
      const body = document.createElement('div');
      body.className = 'card-body';
      const content = document.createElement('div');
      content.className = 'content';
      if (heading) {
        const h3 = document.createElement('h3');
        h3.className = 'headline';
        h3.textContent = heading.textContent.trim();
        content.append(h3);
      }
      if (p) { const pp = document.createElement('p'); pp.textContent = p.textContent.trim(); content.append(pp); }
      body.append(content);
      if (link) {
        const btn = document.createElement('div');
        btn.className = 'button secondary card-cta';
        const s = document.createElement('span');
        s.textContent = link.textContent.trim();
        btn.append(s);
        body.append(btn);
      }
      a.append(body);
    } else {
      // color cards: text on white, affordance pinned bottom
      const header = document.createElement('header');
      if (heading) {
        const h3 = document.createElement('h3');
        h3.className = 'headline';
        h3.textContent = heading.textContent.trim();
        header.append(h3);
      }
      if (p) { const pp = document.createElement('p'); pp.textContent = p.textContent.trim(); header.append(pp); }
      a.append(header);
      if (link) {
        const aff = document.createElement('div');
        aff.className = 'affordance';
        const s = document.createElement('span');
        s.textContent = link.textContent.trim();
        aff.append(s);
        a.append(aff);
      }
    }

    article.append(a);
    li.append(article);
    grid.append(li);
  });

  block.replaceChildren(grid);
}
