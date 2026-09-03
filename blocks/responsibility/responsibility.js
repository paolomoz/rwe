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
  // Experience Workspace contract: MOVE authored nodes; wrappers carry the classes.
  const h = teaserRow ? teaserRow.querySelector('h3, h2') : null;
  if (h) {
    const hw = document.createElement('div');
    hw.className = 'headline';
    hw.append(h);
    caption.append(hw);
  }
  const p = teaserRow ? [...teaserRow.querySelectorAll('p')].find((x) => !x.querySelector('a') && x.textContent.trim()) : null;
  if (p) caption.append(p);
  const more = document.createElement('div');
  more.className = 'affordance white';
  if (link && link.closest('p')) {
    more.append(link.closest('p')); // the <p> holds the prose index; the teaser is the link
    link.replaceWith(...link.childNodes);
  } else {
    const span = document.createElement('span');
    span.textContent = link ? link.textContent.trim() : 'Read more';
    more.append(span);
  }
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
      const hw = document.createElement('div');
      hw.className = 'headline';
      hw.append(sh);
      header.append(hw);
      box.append(header);
    }
    const list = sideRow.querySelector('ul');
    if (list) box.append(list); // the authored <ul> IS the editable unit
  }
  colSide.append(box);

  grid.append(colMain, colSide);
  block.replaceChildren(grid);
}
