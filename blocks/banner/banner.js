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

// Experience Workspace contract: MOVE authored nodes into wrappers that carry
// the classes; the teaser is the link, so the CTA anchor is unwrapped after use.
function wrapNode(node, className) {
  const w = document.createElement('div');
  w.className = className;
  w.append(node);
  return w;
}

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

const VIDEOS = {
  trading: '/media/trading-floor-webm.webm',
  jobs: '/media/tea01r-jobs-webm.webm',
  cvm: '/media/cv-matcher-video-teaser-webm.webm',
};

export default async function decorate(block) {
  if (block.classList.contains('cvm')) {
    // CV-matcher teaser (tea01r): contained video + gradient caption box.
    // Launch behavior (RweCVMatch.start) is the P4 careers integration.
    const row0 = block.firstElementChild;
    const heading0 = row0.querySelector('h2, h3');
    const cta0 = [...row0.querySelectorAll('p')].pop();
    const art0 = document.createElement('article');
    art0.className = 'cvm-teaser';
    const link0 = document.createElement('div');
    link0.className = 'link';
    const media0 = document.createElement('div');
    media0.className = 'media-container';
    const video0 = document.createElement('video');
    video0.className = 'cvm-video';
    video0.muted = true;
    video0.setAttribute('muted', '');
    video0.setAttribute('playsinline', '');
    video0.setAttribute('preload', 'auto');
    const src0 = document.createElement('source');
    src0.src = VIDEOS.cvm;
    src0.type = 'video/webm';
    video0.append(src0);
    media0.append(video0);
    const capWrap = document.createElement('div');
    capWrap.className = 'caption-wrapper';
    const cap = document.createElement('header');
    cap.className = 'cvm-caption';
    const content0 = document.createElement('div');
    content0.className = 'content';
    if (heading0) content0.append(wrapNode(heading0, 'headline'));
    content0.append(document.createElement('p'));
    const ctaBox = document.createElement('div');
    ctaBox.className = 'cta-reverse';
    if (cta0) {
      ctaBox.append(cta0);
      cta0.querySelectorAll('a').forEach((a) => a.replaceWith(...a.childNodes));
    }
    const imprintWrap = document.createElement('div');
    imprintWrap.className = 'imprint-wrapper';
    const imprint = document.createElement('img');
    imprint.src = '/img/impact-print-dark-green-and-white.svg';
    imprint.alt = '';
    imprint.className = 'imprint';
    imprintWrap.append(imprint);
    cap.append(content0, ctaBox, imprintWrap);
    capWrap.append(cap);
    link0.append(media0, capWrap);
    art0.append(link0);
    block.replaceChildren(art0);
    return;
  }
  if (block.classList.contains('locations')) {
    // image teaser: big media right + gradient caption box left (gated A5)
    const row0 = block.firstElementChild;
    const pic = row0.querySelector('picture, img');
    const heading = row0.querySelector('h2, h3');
    const p0 = [...row0.querySelectorAll('p')].find((x) => !x.querySelector('a, picture, img') && x.textContent.trim());
    const link0 = [...row0.querySelectorAll('a')].pop();
    const a0 = document.createElement('a');
    a0.className = 'lm-video-teaser';
    if (link0) a0.href = link0.href;
    const mediaEl = document.createElement('div');
    mediaEl.className = 'media';
    if (pic) {
      const img = pic.matches('img') ? pic : pic.querySelector('img');
      if (img) img.setAttribute('loading', 'lazy');
      mediaEl.append(pic);
    }
    const header0 = document.createElement('header');
    if (heading) header0.append(wrapNode(heading, 'headline'));
    if (p0) header0.append(p0);
    if (link0) header0.append(labelWrap(link0, 'button secondary on-media-cta'));
    a0.append(mediaEl, header0);
    block.replaceChildren(a0);
    return;
  }
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
  if (heading) content.append(wrapNode(heading, 'headline'));
  if (p) content.append(p);
  caption.append(content);
  if (link) caption.append(labelWrap(link, 'button secondary banner-cta'));
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
