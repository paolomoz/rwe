/**
 * locations-map — countries-and-locations map tool (deny-consent LIST state).
 * Template-slotted with FROZEN live data (capture 2026-08-27): the filter
 * shell, result count and 718-location list ship as a code asset
 * (maptool.html) — an integration placeholder. The delivery integration
 * replaces it with the real map + the `locations` query-index
 * (see stardust/dynamic-blocks-map.md § locations-map).
 *
 * Authoring: an empty block table (one placeholder row) — all UI is chrome.
 */

export default async function decorate(block) {
  block.textContent = '';
  try {
    const resp = await fetch('/blocks/locations-map/maptool.html');
    if (resp.ok) {
      block.innerHTML = await resp.text();
      // list/map toggle (map view is the P4 integration; keep list active)
      const list = block.querySelector('.lm-listview');
      block.querySelectorAll('.lm-toggle button').forEach((btn) => {
        btn.addEventListener('click', () => {
          block.querySelectorAll('.lm-toggle button').forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          if (list) list.style.display = btn.textContent.trim().toLowerCase().includes('map') ? 'none' : '';
        });
      });
    }
  } catch (e) {
    // placeholder stays empty if the asset is unavailable
  }
}
