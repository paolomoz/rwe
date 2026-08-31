/**
 * job-list — job-offers result list (src01 sort header + n-jrt01 cards).
 * Template-slotted with FROZEN live data (gated A6 capture): the sort
 * select, favourites link, 9 result cards and load-more button ship as a
 * code asset (results.html) — an integration placeholder. The delivery
 * integration replaces it with the live jobs API
 * (POST https://www.rwe.com/api/jobborse/entities/v1 — see
 * stardust/dynamic-blocks-map.md § job-search).
 *
 * Authoring: an empty block table (one placeholder row) — all UI is chrome.
 */

export default async function decorate(block) {
  block.textContent = '';
  try {
    const resp = await fetch('/blocks/job-list/results.html');
    if (resp.ok) block.innerHTML = await resp.text();
  } catch (e) {
    // placeholder stays empty if the asset is unavailable
  }
}
