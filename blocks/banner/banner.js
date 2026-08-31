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
    if (heading0) {
      const h3 = document.createElement('h3');
      h3.className = 'headline';
      h3.textContent = heading0.textContent.trim();
      content0.append(h3);
    }
    content0.append(document.createElement('p'));
    const ctaBox = document.createElement('div');
    ctaBox.className = 'cta-reverse';
    const sp0 = document.createElement('span');
    sp0.textContent = cta0 ? cta0.textContent.trim() : '';
    ctaBox.append(sp0);
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
      mediaEl.append(pic.cloneNode(true));
    }
    const header0 = document.createElement('header');
    if (heading) {
      const h3 = document.createElement('h3');
      h3.className = 'headline';
      h3.textContent = heading.textContent.trim();
      header0.append(h3);
    }
    if (p0) { const pp = document.createElement('p'); pp.textContent = p0.textContent.trim(); header0.append(pp); }
    if (link0) {
      const btn = document.createElement('div');
      btn.className = 'button secondary on-media-cta';
      const sp = document.createElement('span');
      sp.textContent = link0.textContent.trim();
      btn.append(sp);
      header0.append(btn);
    }
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
