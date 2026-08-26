/**
 * banner — RWE full-width video teaser. Template-slotted (#95).
 * Schema: stardust/eds-schema/index.json § banner
 *
 * Variants:
 *   trading — full-bleed video + right overlay caption + teal scrim
 *   jobs    — contained video + gradient caption panel + impact print
 *
 * Authoring row (one): <h3> title + <p> lede + <em><a> CTA (target link)
 *
 * Videos are fixed composition assets from the code origin (#103):
 *   trading → /media/trading-floor-webm.webm
 *   jobs    → /media/tea01r-jobs-webm.webm
 */

const VIDEOS = {
  trading: '/media/trading-floor-webm.webm',
  jobs: '/media/tea01r-jobs-webm.webm',
};

export default async function decorate(block) {
  const variant = block.classList.contains('jobs') ? 'jobs' : 'trading';
  const row = block.firstElementChild;
  const link = row ? [...row.querySelectorAll('a')].pop() : null;
  const heading = row ? row.querySelector('h2, h3') : null;
  const p = row ? [...row.querySelectorAll('p')].find((x) => !x.querySelector('a') && x.textContent.trim()) : null;

  const a = document.createElement('a');
  a.className = `banner-teaser on-media ${variant}-teaser`;
  if (link) a.href = link.href;

  const video = document.createElement('video');
  video.muted = true;
  video.loop = true;
  video.setAttribute('playsinline', '');
  video.setAttribute('muted', '');
  const src = document.createElement('source');
  src.src = VIDEOS[variant];
  src.type = 'video/webm';
  video.append(src);
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    video.autoplay = true;
    video.setAttribute('autoplay', '');
  }
  a.append(video);

  const wrap = document.createElement('div');
  wrap.className = 'header-wrapper';
  const caption = document.createElement('header');
  caption.className = 'caption';
  const content = document.createElement('div');
  content.className = 'content';
  if (heading) {
    const h3 = document.createElement('h3');
    h3.className = 'headline';
    h3.textContent = heading.textContent.trim();
    content.append(h3);
  }
  if (p) {
    const pp = document.createElement('p');
    pp.textContent = p.textContent.trim();
    content.append(pp);
  }
  caption.append(content);
  if (link) {
    const btn = document.createElement('div');
    btn.className = 'button secondary banner-cta';
    const s = document.createElement('span');
    s.textContent = link.textContent.trim();
    btn.append(s);
    caption.append(btn);
  }
  if (variant === 'jobs') {
    const imprint = document.createElement('img');
    imprint.className = 'imprint';
    imprint.src = '/img/impact-print-dark-green-and-white.svg';
    imprint.alt = '';
    imprint.loading = 'lazy';
    caption.append(imprint);
  }
  wrap.append(caption);
  a.append(wrap);

  block.replaceChildren(a);
}
