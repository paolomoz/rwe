/**
 * contacts — article aside contact cards (con01 replica). Template-slotted.
 *
 * Authoring rows — one per contact person:
 *   cell 1: portrait <picture>
 *   cell 2: <h2>name</h2> + <h3>role</h3> + <p><a href="tel:…">phone</a></p> +
 *           CTA <p><strong><a>Send e-mail</a></strong></p>
 * Optional final row (single text cell, no picture): consent/social note
 * (rendered as the aside social placeholder).
 */

export default async function decorate(block) {
  const rows = [...block.children];
  const out = [];
  rows.forEach((row) => {
    const pic = row.querySelector('picture, img');
    const tel = row.querySelector('a[href^="tel:"]');
    if (!pic && !tel) {
      // social/consent note
      const note = document.createElement('div');
      note.className = 'social-placeholder';
      const content = document.createElement('div');
      content.className = 'content';
      // Experience Workspace contract: MOVE the authored paragraphs, don't copy text
      [...row.children].forEach((cell) => content.append(...cell.childNodes));
      note.append(content);
      out.push(note);
      return;
    }
    const name = row.querySelector('h2, h3, h4');
    const headings = [...row.querySelectorAll('h2, h3, h4')];
    const role = headings[1];
    const cta = row.querySelector('a.button, p strong a') || [...row.querySelectorAll('a')].find((a) => !a.href.startsWith('tel:'));

    const card = document.createElement('div');
    card.className = 'contact-card';
    if (pic) {
      const fig = document.createElement('figure');
      const img = pic.matches('img') ? pic : pic.querySelector('img');
      if (img) img.setAttribute('loading', 'lazy');
      fig.append(pic);
      card.append(fig);
    }
    // Experience Workspace contract: MOVE authored headings into class-bearing wrappers
    if (name) {
      const hw = document.createElement('div');
      hw.className = 'headline';
      hw.append(name);
      card.append(hw);
    }
    if (role) {
      const sw = document.createElement('div');
      sw.className = 'subheadline';
      sw.append(role);
      card.append(sw);
    }
    if (tel) {
      const contact = document.createElement('div');
      contact.className = 'contact';
      const phone = document.createElement('div');
      phone.className = 'phone';
      const icon = document.createElement('span');
      icon.className = 'phone-icon';
      phone.append(icon, tel.closest('p') || tel);
      contact.append(phone);
      card.append(contact);
    }
    if (cta && cta !== tel) {
      const wrap = document.createElement('div');
      wrap.className = 'cta';
      cta.className = 'button primary';
      wrap.append(cta.closest('p') || cta); // the <p> holds the prose index
      card.append(wrap);
    }
    out.push(card);
  });
  block.replaceChildren(...out);
}
