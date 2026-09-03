/**
 * events — "Current dates & news" event list (el01 replica). Template-slotted.
 *
 * Authoring rows:
 *   optional first row with a single link cell → the "All events" header link
 *   one row per event:
 *     cell 1: date text, e.g. "11 Nov'26" (day + month token)
 *     cell 2: <h3>title</h3> + <p>description</p> + optional <p>extra info</p>
 *       (extra info renders behind the live "Show more" toggle)
 * Location/save buttons are live-app UI (frozen labels, capture 2026-08-27) —
 * rendered by the block, wired at the integrations phase.
 */

const BTNS = `
  <button class="button primary le-btn"><span class="le-icon le-icon--location"></span><span>Essen</span></button>
  <button class="button primary le-btn"><span class="le-icon le-icon--download"></span><span>Save event</span></button>`;

function buildEvent(row) {
  const cells = [...row.children];
  const dateText = cells[0].textContent.trim();
  const [day, ...monthBits] = dateText.split(/\s+/);
  const title = row.querySelector('h2, h3, h4');
  const ps = [...cells[cells.length - 1].querySelectorAll('p')];
  const desc = ps[0];
  const extra = ps[1];

  const ev = document.createElement('div');
  ev.className = 'le-event';
  ev.innerHTML = `
    <div class="le-date"><time><span class="le-day"></span><span class="le-month"></span></time></div>
    <div class="le-content">
      <div class="le-title"></div>
      <div class="le-desc"></div>
      <div class="le-additional"><button class="le-show-more">Show more</button><div class="le-information" hidden></div></div>
      <div class="le-buttons le-buttons--mobile">${BTNS}</div>
    </div>
    <div class="le-buttons-desktop"><div class="le-buttons">${BTNS}</div></div>`;
  ev.querySelector('.le-day').textContent = day || '';
  ev.querySelector('.le-month').textContent = monthBits.join(' ');
  // Experience Workspace contract: MOVE authored nodes into the template's slot wrappers
  if (title) ev.querySelector('.le-title').append(title);
  if (desc) ev.querySelector('.le-desc').append(desc);
  if (extra) ev.querySelector('.le-information').append(extra);
  const toggle = ev.querySelector('.le-show-more');
  const info = ev.querySelector('.le-information');
  toggle.addEventListener('click', () => {
    const open = !info.hidden;
    info.hidden = open;
    toggle.textContent = open ? 'Show more' : 'Show less';
  });
  return ev;
}

export default async function decorate(block) {
  const rows = [...block.children];
  let allLink = null;
  if (rows.length && rows[0].querySelectorAll('a').length === 1 && !rows[0].querySelector('h1, h2, h3, h4')
      && rows[0].textContent.trim() === rows[0].querySelector('a').textContent.trim()) {
    allLink = rows.shift().querySelector('a');
  }

  const list = document.createElement('div');
  list.className = 'listing-events';
  const head = document.createElement('div');
  head.className = 'le-head';
  head.innerHTML = '<h2 class="le-headline"></h2>';
  if (allLink) {
    const a = document.createElement('a');
    a.className = 'le-all';
    a.href = allLink.href;
    const par = allLink.closest('p');
    if (par) {
      a.append(par); // the <p> holds the prose index; the header link wraps it
      allLink.replaceWith(...allLink.childNodes);
    } else {
      const s = document.createElement('span');
      s.textContent = allLink.textContent.trim();
      a.append(s);
    }
    a.insertAdjacentHTML('beforeend', '<span class="le-all-icon"></span>');
    head.append(a);
  }
  list.append(head);
  rows.forEach((row) => list.append(buildEvent(row)));
  block.replaceChildren(list);
}
