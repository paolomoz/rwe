/**
 * columns — RWE strategy band: prose + CTA left, click-to-play video right.
 * Template-slotted (#95). Schema: stardust/eds-schema/index.json § columns
 *
 * Authoring row (one):
 *   cell 1: paragraphs + <strong><a> primary CTA
 *   cell 2: poster <picture> + <a> to the video file (external mp4)
 */

export default async function decorate(block) {
  const row = block.firstElementChild;
  if (!row) return;
  const cells = [...row.children];
  const textCell = cells[0];
  const mediaCell = cells[1] || cells[0];

  const cols = document.createElement('div');
  cols.className = 'cols';

  // text column
  const colText = document.createElement('div');
  colText.className = 'col col-text';
  const content = document.createElement('div');
  content.className = 'content';
  [...textCell.querySelectorAll('p')].forEach((p) => {
    if (p.querySelector('a.button')) return;
    content.append(p.cloneNode(true));
  });
  colText.append(content);
  const cta = textCell.querySelector('a.button');
  if (cta) {
    const actions = document.createElement('div');
    actions.append(cta.cloneNode(true));
    colText.append(actions);
  }

  // video column: poster + click-to-play (mirrors the live video.js poster state)
  const colMedia = document.createElement('div');
  colMedia.className = 'col col-media';
  const wrap = document.createElement('div');
  wrap.className = 'video-wrap';
  const poster = mediaCell.querySelector('picture, img');
  const videoLink = [...mediaCell.querySelectorAll('a')].find((a) => /\.(mp4|webm)|video/i.test(a.href));
  const video = document.createElement('video');
  video.setAttribute('preload', 'none');
  if (poster) {
    const img = poster.matches('img') ? poster : poster.querySelector('img');
    if (img) video.setAttribute('poster', img.currentSrc || img.src);
  }
  if (videoLink) {
    const source = document.createElement('source');
    source.src = videoLink.href;
    source.type = 'video/mp4';
    video.append(source);
  }
  const play = document.createElement('button');
  play.className = 'big-play';
  play.setAttribute('aria-label', 'Play Video');
  play.addEventListener('click', () => {
    video.setAttribute('controls', '');
    video.play();
    play.style.display = 'none';
  });
  wrap.append(video, play);
  colMedia.append(wrap);

  cols.append(colText, colMedia);
  block.replaceChildren(cols);
}
