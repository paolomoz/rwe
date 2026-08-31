/**
 * job-side — job-offers sidebar (jar01 job-alerts teaser + n-jfc01 filter
 * panel). Styled INERT chrome shipped as a code asset (panel.html): the
 * selects, keyword search and job-alerts CTA render in their captured
 * visible state; behavior is the P4 jobs-API integration
 * (stardust/dynamic-blocks-map.md § job-search). Hidden on mobile —
 * live renders it as an off-canvas drawer not painted at rest.
 *
 * Authoring: an empty block table (one placeholder row) — all UI is chrome.
 */

export default async function decorate(block) {
  block.textContent = '';
  try {
    const resp = await fetch('/blocks/job-side/panel.html');
    if (resp.ok) block.innerHTML = await resp.text();
  } catch (e) {
    // placeholder stays empty if the asset is unavailable
  }
}
