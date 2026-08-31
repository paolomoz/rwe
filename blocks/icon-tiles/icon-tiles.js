/**
 * icon-tiles — decarbonisation measure flip-tiles (htm01 replica).
 * Template-slotted. Authoring rows — one per tile:
 *   cell 1: cover label text
 *   cell 2: <h3>title</h3> + <p>s (revealed on hover/click)
 */

export default async function decorate(block) {
  const rows = [...block.children];
  const grid = document.createElement('div');
  grid.className = 'icon-tiles-grid';
  rows.forEach((row) => {
    const cells = [...row.children];
    const label = cells[0] ? cells[0].textContent.trim() : '';
    const content = cells[1];

    const container = document.createElement('div');
    container.className = 'tile-container';
    const item = document.createElement('div');
    item.className = 'tile-item';
    item.innerHTML = `
      <div class="tile-cover">
        <div class="tile-cover-inner">
          <div class="tile-cover-text"></div>
          <div class="tile-opener-mobile"><span class="icon icon-arrow-down"></span></div>
        </div>
      </div>
      <div class="tile-content">
        <div class="tile-closer"><span class="icon icon-close"></span></div>
        <div class="tile-content-inner">
          <div class="tile-content-text content"></div>
          <div class="tile-closer-mobile"><span class="icon icon-close"></span></div>
        </div>
      </div>`;
    item.querySelector('.tile-cover-text').textContent = label;
    if (content) {
      const target = item.querySelector('.tile-content-text');
      [...content.children].forEach((el) => target.append(el.cloneNode(true)));
    }
    const cover = item.querySelector('.tile-cover');
    const closer = item.querySelector('.tile-content');
    cover.addEventListener('click', () => item.classList.add('open'));
    closer.querySelectorAll('.tile-closer, .tile-closer-mobile').forEach((c) => c.addEventListener('click', () => item.classList.remove('open')));
    container.append(item);
    grid.append(container);
  });
  block.replaceChildren(grid);
}
