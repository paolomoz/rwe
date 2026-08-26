/**
 * responsibility — RWE video teaser + "Information for…" sidebar.
 * Template-slotted (#95). Schema: stardust/eds-schema/index.json § responsibility
 *
 * Authoring rows:
 *   row 1 (teaser): <h3> title + <p> lede + <a> target link
 *   row 2 (sidebar): cell 1 <h3> sidebar title, cell 2 <ul> of links
 *
 * The looping forest video is a fixed composition asset served from the
 * code origin (/media/tea03r-wald_web.webm — #103: video must not ride
 * content.da.live).
 */

const VIDEO_SRC = '/media/tea03r-wald_web.webm';

export default async function decorate(block) {
  const rows = [...block.children];
  const teaserRow = rows[0];
  const sideRow = rows[1];

  const grid = document.createElement('div');
  grid.className = 'teaser-row';

  // main video teaser
  const colMain = document.createElement('div');
  colMain.className = 'teaser-col-main';
  const link = teaserRow ? teaserRow.querySelector('a') : null;
  const a = document.createElement('a');
  a.className = 'resp-video-teaser';
  if (link) a.href = link.href;
  const video = document.createElement('video');
  video.muted = true;
  video.loop = true;
  video.setAttribute('playsinline', '');
  video.setAttribute('muted', '');
  const src = document.createElement('source');
  src.src = VIDEO_SRC;
  src.type = 'video/webm';
  video.append(src);
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    video.autoplay = true;
    video.setAttribute('autoplay', '');
  }
  const caption = document.createElement('div');
  caption.className = 'teaser-caption';
  const h = teaserRow ? teaserRow.querySelector('h3, h2') : null;
  if (h) {
    const h3 = document.createElement('h3');
    h3.className = 'headline';
    h3.textContent = h.textContent.trim();
    caption.append(h3);
  }
  const p = teaserRow ? [...teaserRow.querySelectorAll('p')].find((x) => !x.querySelector('a') && x.textContent.trim()) : null;
  if (p) {
    const pp = document.createElement('p');
    pp.textContent = p.textContent.trim();
    caption.append(pp);
  }
  const more = document.createElement('div');
  more.className = 'affordance white';
  const span = document.createElement('span');
  span.textContent = link ? link.textContent.trim() : 'Read more';
  more.append(span);
  caption.append(more);
  a.append(video, caption);
  colMain.append(a);

  // sidebar
  const colSide = document.createElement('div');
  colSide.className = 'teaser-col-side';
  const box = document.createElement('div');
  box.className = 'info-for';
  if (sideRow) {
    const sh = sideRow.querySelector('h3, h2');
    if (sh) {
      const header = document.createElement('header');
      const h3 = document.createElement('h3');
      h3.className = 'headline';
      h3.textContent = sh.textContent.trim();
      header.append(h3);
      box.append(header);
    }
    const list = sideRow.querySelector('ul');
    if (list) {
      const ul = document.createElement('ul');
      [...list.querySelectorAll('a')].forEach((la) => {
        const li = document.createElement('li');
        const na = document.createElement('a');
        na.href = la.href;
        na.textContent = la.textContent.trim();
        li.append(na);
        ul.append(li);
      });
      box.append(ul);
    }
  }
  colSide.append(box);

  grid.append(colMain, colSide);
  block.replaceChildren(grid);
}
