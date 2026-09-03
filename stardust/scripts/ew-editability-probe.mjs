#!/usr/bin/env node
/**
 * ew-editability-probe.mjs — reproduce Experience Workspace (da.live) inline-edit
 * instrumentation against a locally served EDS page and report, per block, which
 * authored text elements survive decorate() and would therefore be editable.
 *
 * Mirrors da-nx nx/public/plugins/quick-edit (setBody → loadPage → editors):
 *   1. intercept the document response, stamp `data-prose-index` on every
 *      OUTERMOST h1-h6/p/ol/ul/pre/blockquote inside <main>, `data-image-index`
 *      on every <img>, `data-block-index` on every block div (as
 *      editor-utils.getInstrumentedHTML does);
 *   2. let the page's own scripts.js decorate the instrumented body;
 *   3. an authored text is EDITABLE iff exactly one element still carries its
 *      `data-prose-index` (createEditor → querySelector + replaceWith), and DEAD
 *      otherwise. Duplicates (carousel clone slides) make the editor attach to the
 *      first copy only, so they are reported separately.
 *
 *   4. --simulate-editor additionally performs the editor swap the way
 *      prose.js createEditor does (element → div.prosemirror-editor > div.ProseMirror
 *      > <same tag, no classes/spans>) and reports per text any computed-style or
 *      height drift between published and edit mode — a class on the authored
 *      element (or on an inner <span>) dies in that swap; wrapper-descendant
 *      selectors survive it.
 *
 * Usage:
 *   node stardust/scripts/ew-editability-probe.mjs <url> [<url> ...] [--json] [--verbose] [--simulate-editor]
 *       [--exempt block-a,block-b]   blocks whose authored rows are config / index fallback
 *                                    (still reported, excluded from the exit code)
 *   e.g. node stardust/scripts/ew-editability-probe.mjs http://localhost:3005/ --verbose --simulate-editor
 *
 * Exit code 0 = every authored text editable, 1 = some dead, 2 = probe error.
 */
import { chromium } from 'playwright';

const args = process.argv.slice(2);
const json = args.includes('--json');
const verbose = args.includes('--verbose');
const simulate = args.includes('--simulate-editor');
const QE_CSS = 'https://raw.githubusercontent.com/adobe/da-nx/main/nx/public/plugins/quick-edit/quick-edit.css';
const exemptIdx = args.indexOf('--exempt');
const exempt = new Set(exemptIdx > -1 ? args[exemptIdx + 1].split(',') : []);
const urls = args.filter((a, i) => !a.startsWith('--') && !(exemptIdx > -1 && i === exemptIdx + 1));
if (!urls.length) { console.error('usage: ew-editability-probe.mjs <url> [--json] [--verbose]'); process.exit(2); }

const EDITABLE = 'h1, h2, h3, h4, h5, h6, p, ol, ul, pre, blockquote';

// Runs in a scratch page: instrument like editor-utils.getInstrumentedHTML.
function instrument(EDITABLE_SEL) {
  const main = document.querySelector('main');
  if (!main) return { html: document.documentElement.outerHTML, texts: [] };
  const texts = [];
  let n = 1;
  // prose2aem keeps the <p> inside every block cell; the published pipeline unwraps a
  // single-paragraph cell to bare text. Restore the <p> so the cell looks like the
  // workspace's instrumented HTML (decorate() sees it either way: the runtime's
  // wrapTextNodes wraps bare text into a fresh <p> on published pages).
  main.querySelectorAll(':scope > div > div[class] > div > div').forEach((cell) => {
    if (cell.children.length === 0 && cell.textContent.trim()) {
      const p = document.createElement('p');
      p.append(...cell.childNodes);
      cell.append(p);
    }
  });
  const blockOf = (el) => {
    const section = el.closest('main > div');
    const block = [...(section?.children ?? [])].find((c) => c.contains(el));
    if (!block) return 'default';
    return block.classList.length ? block.classList[0] : 'default';
  };
  main.querySelectorAll(EDITABLE_SEL).forEach((el) => {
    if (el.parentElement?.closest(EDITABLE_SEL)) return; // outermost only
    n += 1;
    el.setAttribute('data-prose-index', String(n));
    texts.push({ index: n, tag: el.tagName.toLowerCase(), block: blockOf(el), text: el.textContent.trim().slice(0, 70) });
    n += el.textContent.length + 1;
  });
  main.querySelectorAll('img').forEach((img) => { n += 1; img.setAttribute('data-image-index', String(n)); });
  main.querySelectorAll(':scope > div > div[class]').forEach((b) => { n += 1; b.setAttribute('data-block-index', String(n)); });
  return { html: document.documentElement.outerHTML, texts };
}

// Runs in the decorated page: which indices survived, and where.
function survey(texts) {
  return texts.map((t) => {
    const hits = [...document.querySelectorAll(`[data-prose-index="${t.index}"]`)];
    const first = hits[0];
    const visible = first ? first.getClientRects().length > 0 : false;
    const liveText = first ? first.textContent.trim().slice(0, 70) : null;
    return { ...t, hits: hits.length, visible, liveText, sameText: first ? liveText === t.text : false };
  });
}

// Runs in the decorated page: swap every surviving element for a ProseMirror-shaped
// editor (prose.js createEditor) and measure style/height drift.
function simulateEditor(texts) {
  const rec = (el) => {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return { h: Math.round(r.height), fontSize: cs.fontSize, fontWeight: cs.fontWeight, fontFamily: cs.fontFamily.split(',')[0], lineHeight: cs.lineHeight, color: cs.color };
  };
  const blockRect = {};
  document.querySelectorAll('main .block').forEach((b) => { blockRect[b.dataset.blockName] = Math.round(b.getBoundingClientRect().height); });
  const before = {};
  texts.forEach((t) => { const el = document.querySelector(`[data-prose-index="${t.index}"]`); if (el) before[t.index] = rec(el); });
  texts.forEach((t) => {
    const el = document.querySelector(`[data-prose-index="${t.index}"]`);
    if (!el || el.querySelector('img, picture')) return; // images are edited via data-image-index, not a text editor
    const parent = document.createElement('div');
    parent.className = 'prosemirror-editor';
    parent.setAttribute('data-prose-index', t.index);
    const pm = document.createElement('div');
    pm.className = 'ProseMirror';
    pm.setAttribute('contenteditable', 'true');
    // ProseMirror renders the DOC node, not the DOM: same tag, no classes, inline marks only.
    const node = document.createElement(el.tagName);
    node.innerHTML = el.innerHTML;
    // decorateButtons() replaced the authored <strong>/<em> with button classes; the
    // editor renders the DOC, which still has the marks — restore them for the swap.
    node.querySelectorAll('a.button').forEach((a) => {
      const mark = a.classList.contains('accent') ? ['em', 'strong'] : a.classList.contains('primary') ? ['strong'] : a.classList.contains('secondary') ? ['em'] : [];
      let outer = a;
      mark.forEach((m) => { const w = document.createElement(m); outer.replaceWith(w); w.append(outer); outer = w; });
    });
    // presentational block spans stand for authored hard breaks: restore the <br>
    node.querySelectorAll('span').forEach((sp) => {
      const src = el.querySelectorAll('span')[[...node.querySelectorAll('span')].indexOf(sp)];
      const block = src && getComputedStyle(src).display === 'block' && sp.nextElementSibling?.tagName === 'SPAN';
      sp.replaceWith(...sp.childNodes, ...(block ? [document.createElement('br')] : []));
    });
    node.querySelectorAll('*').forEach((n) => { [...n.attributes].forEach((a) => { if (!(n.tagName === 'A' && a.name === 'href')) n.removeAttribute(a.name); }); });
    pm.append(node);
    parent.append(pm);
    el.replaceWith(parent);
  });
  const after = {};
  texts.forEach((t) => { const node = document.querySelector(`.prosemirror-editor[data-prose-index="${t.index}"] > .ProseMirror > *`); if (node) after[t.index] = rec(node); });
  const blockDelta = {};
  document.querySelectorAll('main .block').forEach((b) => { const h = Math.round(b.getBoundingClientRect().height); blockDelta[b.dataset.blockName] = h - (blockRect[b.dataset.blockName] ?? h); });
  const drift = texts.filter((t) => before[t.index] && after[t.index]).map((t) => {
    const b = before[t.index]; const a = after[t.index]; const d = [];
    ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'color'].forEach((k) => { if (b[k] !== a[k]) d.push(`${k} ${b[k]} → ${a[k]}`); });
    if (Math.abs(b.h - a.h) > 2) d.push(`height ${b.h} → ${a.h}`);
    return { index: t.index, block: t.block, tag: t.tag, text: t.text, drift: d };
  });
  return { drift, blockDelta };
}

const browser = await chromium.launch();
let anyDead = false;
const results = [];
try {
  for (const url of urls) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const scratch = await ctx.newPage();
    const page = await ctx.newPage();
    let texts = [];
    await page.route('**/*', async (route) => {
      const req = route.request();
      if (req.resourceType() !== 'document' || req.url().split('?')[0] !== url.split('?')[0]) return route.continue();
      const resp = await route.fetch();
      const html = await resp.text();
      await scratch.setContent(html);
      const out = await scratch.evaluate(instrument, EDITABLE);
      texts = out.texts;
      await route.fulfill({ response: resp, body: out.html, headers: { ...resp.headers(), 'content-type': 'text/html; charset=utf-8' } });
    });
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => [...document.querySelectorAll('main .section')].every((s) => s.dataset.sectionStatus === 'loaded'), null, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(500);
    const rows = await page.evaluate(survey, texts);
    let sim = null;
    if (simulate) {
      const css = await fetch(QE_CSS).then((r) => (r.ok ? r.text() : '')).catch(() => '');
      if (css) await page.addStyleTag({ content: css });
      sim = await page.evaluate(simulateEditor, texts);
    }
    const byBlock = {};
    rows.forEach((r) => {
      const b = byBlock[r.block] ??= { block: r.block, authored: 0, editable: 0, dead: 0, duplicated: 0, textDrift: 0, deadItems: [] };
      b.authored += 1;
      if (r.hits === 1) { b.editable += 1; if (!r.sameText) b.textDrift += 1; } else if (r.hits > 1) { b.duplicated += 1; b.editable += 1; } else { b.dead += 1; b.deadItems.push(`<${r.tag}> ${r.text}`); }
    });
    if (sim) {
      sim.drift.forEach((d) => { const b = byBlock[d.block]; if (!b) return; b.editDrift = (b.editDrift ?? 0) + (d.drift.length ? 1 : 0); if (d.drift.length) (b.driftItems ??= []).push(`<${d.tag}> ${d.text.slice(0, 40)} :: ${d.drift.join('; ')}`); });
      Object.entries(sim.blockDelta).forEach(([name, delta]) => { if (byBlock[name]) byBlock[name].blockHeightDelta = delta; });
    }
    const blocks = Object.values(byBlock);
    const totals = blocks.reduce((a, b) => ({ authored: a.authored + b.authored, editable: a.editable + b.editable, dead: a.dead + b.dead, duplicated: a.duplicated + b.duplicated }), { authored: 0, editable: 0, dead: 0, duplicated: 0 });
    if (blocks.some((b) => b.dead && !exempt.has(b.block))) anyDead = true;
    results.push({ url, totals, blocks, rows, sim });
    if (!json) {
      console.log(`\n${url}  authored=${totals.authored} editable=${totals.editable} dead=${totals.dead} duplicated=${totals.duplicated}`);
      console.log(`block            authored editable dead dup drift${sim ? '  editDrift blockΔh' : ''}`);
      blocks.forEach((b) => console.log(`${b.block.padEnd(16)} ${String(b.authored).padStart(8)} ${String(b.editable).padStart(8)} ${String(b.dead).padStart(4)} ${String(b.duplicated).padStart(3)} ${String(b.textDrift).padStart(5)}${sim ? `  ${String(b.editDrift ?? 0).padStart(9)} ${String(b.blockHeightDelta ?? 0).padStart(7)}` : ''}`));
      if (verbose) blocks.filter((b) => b.deadItems.length).forEach((b) => { console.log(`\n  DEAD in ${b.block}:`); b.deadItems.forEach((d) => console.log(`    ${d}`)); });
      if (verbose && sim) blocks.filter((b) => b.driftItems?.length).forEach((b) => { console.log(`\n  EDIT-MODE DRIFT in ${b.block}:`); b.driftItems.forEach((d) => console.log(`    ${d}`)); });
    }
    await ctx.close();
  }
} catch (e) { console.error(e); process.exit(2); } finally { await browser.close(); }
if (json) console.log(JSON.stringify(results, null, 2));
process.exit(anyDead ? 1 : 0);
