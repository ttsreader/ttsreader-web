// The test UI's DOM and network side. Everything that can be pure lives in logic.js.
// The hash is the state (#/search?q=…, #/pg/1342, #/lv/71, #/snapshot): every view can be
// linked and reloaded. Text from the API is only ever set as text, never as HTML.
import {
  PAGE_SIZE, LANGUAGES, parseHash, formatHash, searchPath, pageInfo,
  formatDuration, formatBytes, formatCount, formatMs, groupFiles, roleName, lvPersonName, lifeDates,
  sectionTitle, readerName, languageLabel, sourceName, debounce,
} from './logic.js';

const $ = (sel) => document.querySelector(sel);
const view = $('#view');
const form = { q: $('#q'), kind: $('#kind'), lang: $('#lang') };
let lastSearch = parseHash('');
let controller = null; // aborts the previous view's requests when the hash changes

/** h('a', { href }, 'text', child…): an element; null/false children are skipped. */
function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs ?? {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') el.className = v; else if (k in el && k !== 'list') el[k] = v; else el.setAttribute(k, v);
  }
  for (const c of children.flat(Infinity)) if (c !== null && c !== undefined && c !== false && c !== '') el.append(c);
  return el;
}
const ext = (href, text) => h('a', { href, target: '_blank', rel: 'noopener noreferrer' }, text ?? href);
const join = (items, sep = ', ') => items.flatMap((x, i) => (i ? [sep, x] : [x]));
const fact = (label, ...value) => (value.flat().some((v) => v !== null && v !== undefined && v !== '' && v !== false)
  ? [h('dt', {}, label), h('dd', {}, ...value)] : []);

class ApiError extends Error {}

// Set only by the hosted test page (bin/build-test-page.js): { base, headers(), hint401 }, the
// cloud service's URL and the signed-in user's Authorization header. Unset, as when the service
// serves /ui itself, every request goes to this page's own server, exactly as before.
const remote = globalThis.CATALOGUE_API;

async function api(path, { allow404 = false } = {}) {
  const res = await fetch(remote ? remote.base + path : path,
    { signal: controller.signal, headers: { accept: 'application/json', ...(remote ? await remote.headers() : {}) } });
  let body;
  try { body = await res.json(); } catch { throw new ApiError(`${res.status} ${res.statusText}: not JSON`); }
  if (!res.ok && !(allow404 && res.status === 404)) {
    const hint = res.status === 401 ? (remote?.hint401 ?? ' (this page needs the service to run with AUTH=none)') : '';
    throw new ApiError(`${res.status}: ${body.error?.message ?? res.statusText}${hint}`);
  }
  return body;
}

const nodes = (...xs) => xs.flat(Infinity).filter((x) => x !== null && x !== undefined && x !== false && x !== '');
const errorNode = (e) => h('p', { class: 'error' }, e instanceof ApiError ? e.message : `Could not reach the service: ${e.message}`);
const served = (r) => h('span', {}, 'server ', h('b', {}, formatMs(r.ms)), ' · snapshot ', h('b', {}, r.snapshot));

// ---- the search form --------------------------------------------------------------------------

for (const code of LANGUAGES) form.lang.append(h('option', { value: code }, languageLabel(code)));

function ensureLangOption(code) {
  if (code && ![...form.lang.options].some((o) => o.value === code)) form.lang.append(h('option', { value: code }, languageLabel(code)));
}

function fromForm() {
  return { view: 'search', q: form.q.value, kind: form.kind.value, lang: form.lang.value, offset: 0 };
}

const typed = debounce(() => location.replace(formatHash(fromForm())), 250);
form.q.addEventListener('input', typed);
for (const sel of [form.kind, form.lang]) sel.addEventListener('change', () => { typed.cancel(); location.hash = formatHash(fromForm()); });
$('#search').addEventListener('submit', (e) => { e.preventDefault(); typed.cancel(); location.hash = formatHash(fromForm()); });

function syncForm(r) {
  // While the box has focus the person typing is the source of truth: the hash trails it.
  if (document.activeElement !== form.q) form.q.value = r.q;
  form.kind.value = r.kind;
  ensureLangOption(r.lang);
  form.lang.value = r.lang;
}

// ---- views ------------------------------------------------------------------------------------

const EXAMPLES = ['pride and prejudice', 'sherlock holmes', 'canterville', 'dickens', 'miserables', 'tolstoy war'];

async function searchView(r) {
  lastSearch = r;
  syncForm(r);
  document.title = r.q ? `${r.q} – Book catalogue` : 'Book catalogue';
  const path = searchPath(r);
  if (!path) {
    return nodes(
      h('p', {}, 'Search Project Gutenberg texts and LibriVox audiobooks by title, author, subject or summary. ',
        'The last word matches as a prefix; there is no typo tolerance.'),
      h('p', { class: 'muted' }, 'Try: ', join(EXAMPLES.map((q) => h('a', { href: formatHash({ ...r, q }) }, q)))),
    );
  }
  const res = await api(path);
  const page = pageInfo({ total: res.total, offset: res.offset, limit: res.limit, count: res.results.length });
  const pager = h('div', { class: 'pager' },
    page.prev === null ? h('span') : h('a', { href: formatHash({ ...r, offset: page.prev }) }, '← Previous'),
    page.next === null ? h('span') : h('a', { href: formatHash({ ...r, offset: page.next }) }, 'Next →'));
  return nodes(
    h('p', { class: 'status' },
      res.total === 0 ? h('b', {}, 'No results') : [h('b', {}, `${formatCount(page.from)}–${formatCount(page.to)}`), ' of ', h('b', {}, formatCount(res.total))],
      ' · ', served(res)),
    h('ul', { class: 'results' }, res.results.map(resultItem)),
    res.total > 0 && pager,
  );
}

function resultItem(b) {
  const langs = b.languages.length ? b.languages.map(languageLabel).join(', ') : b.language;
  return h('li', {},
    h('div', {}, h('span', { class: `badge ${b.source}` }, sourceName(b.source)),
      h('a', { class: 'title', href: formatHash({ view: b.source, id: b.id }) }, b.title),
      b.subtitle && h('span', { class: 'sub' }, ' ', b.subtitle)),
    h('div', { class: 'meta' },
      b.authors.length > 0 && h('span', {}, b.authors.join('; ')),
      langs && h('span', {}, langs),
      b.source === 'pg' && b.type !== 'Text' && h('span', {}, b.type),
      b.source === 'pg' && h('span', {}, `${formatCount(b.downloads)} downloads`),
      b.source === 'lv' && h('span', {}, b.totalSecs ? formatDuration(b.totalSecs) : 'not yet catalogued'),
      b.source === 'lv' && h('span', {}, `${b.numSections} sections`),
      b.source === 'lv' && b.pgId && h('a', { href: formatHash({ view: 'pg', id: b.pgId }) }, `text: Gutenberg #${b.pgId}`)));
}

async function pgView(id) {
  const [res, links] = await Promise.all([api(`/book/pg/${id}`), api(`/links/pg/${id}`, { allow404: true })]);
  const b = res.book;
  document.title = `${b.title} – Gutenberg #${b.id}`;
  const creators = b.creators.map((c) => h('li', {},
    c.name, h('span', { class: 'muted' }, ' — ', roleName(c.role), lifeDates(c.birth, c.death) && `, ${lifeDates(c.birth, c.death)}`),
    c.aliases.length > 0 && h('div', { class: 'muted small' }, 'also: ', c.aliases.join('; '))));
  const recordings = links.links ?? [];
  return nodes(
    backLink(),
    h('div', {}, h('span', { class: 'badge pg' }, 'Gutenberg'), h('span', { class: 'muted' }, `#${b.id}`)),
    h('h1', {}, b.title), b.subtitle && h('p', { class: 'muted' }, b.subtitle),
    h('p', { class: 'status' }, served(res)),
    h('dl', { class: 'facts' },
      fact('Type', b.type), fact('Issued', b.issued), fact('Languages', b.languages.map(languageLabel).join(', ')),
      fact('Downloads', formatCount(b.downloads)), fact('LoC class', b.locc.join(', ')),
      fact('Also titled', b.alternativeTitles.join('; ')), fact('Rights', b.rights),
      fact('Live page', ext(b.url))),
    h('h2', {}, 'Creators'), creators.length ? h('ul', {}, creators) : h('p', { class: 'muted' }, 'None listed.'),
    b.summary && [h('h2', {}, 'Summary'), h('p', { class: 'prose' }, b.summary)],
    b.descriptions.length > 0 && [h('h2', {}, 'Notes'), h('ul', {}, b.descriptions.map((d) => h('li', {}, d)))],
    b.subjects.length > 0 && [h('h2', {}, 'Subjects'), h('ul', { class: 'chips' }, b.subjects.map((s) => h('li', {}, s)))],
    b.bookshelves.length > 0 && [h('h2', {}, 'Bookshelves'), h('ul', { class: 'chips' }, b.bookshelves.map((s) => h('li', {}, s)))],
    h('h2', {}, `LibriVox recordings (${recordings.length})`),
    recordings.length ? h('ul', {}, recordings.map((l) => h('li', {},
      h('a', { href: formatHash({ view: 'lv', id: l.lvId }) }, l.title),
      h('span', { class: 'muted' }, ` — ${l.language}, ${l.totalSecs ? formatDuration(l.totalSecs) : 'not yet catalogued'}, ${l.numSections} sections`))))
      : h('p', { class: 'muted' }, 'None.'),
    h('h2', {}, `Files (${b.files.length})`),
    h('div', { class: 'files' }, groupFiles(b.files).map((g) => [
      h('h3', {}, `${g.label} (${g.files.length})`),
      h('ul', {}, g.files.map((f) => h('li', {}, ext(f.url, f.url.replace(/^https?:\/\/(www\.)?gutenberg\.org/, '')),
        h('span', { class: 'muted small' }, [formatBytes(f.bytes), f.mime.includes(';') ? f.mime.split(';')[1].trim() : '', f.modified?.slice(0, 10)].filter(Boolean).join(' · '))))),
    ])),
  );
}

async function lvView(id) {
  const res = await api(`/book/lv/${id}`);
  const b = res.book;
  document.title = `${b.title} – LibriVox #${b.id}`;
  const person = (p) => [lvPersonName(p), lifeDates(p.dob, p.dod) && h('span', { class: 'muted' }, ` (${lifeDates(p.dob, p.dod)})`)];
  const readers = new Map();
  for (const s of b.sections) for (const r of s.readers) readers.set(r.id, r);
  const sectionsNote = b.numSectionsDeclared !== null && b.numSectionsDeclared !== b.numSections
    ? ` (LibriVox declares ${b.numSectionsDeclared})` : '';
  const u = b.urls;
  return nodes(
    backLink(),
    h('div', {}, h('span', { class: 'badge lv' }, 'LibriVox'), h('span', { class: 'muted' }, `#${b.id}`)),
    h('h1', {}, b.title),
    h('p', { class: 'status' }, served(res)),
    h('dl', { class: 'facts' },
      fact('Authors', join(b.authors.map((p) => h('span', {}, person(p))))),
      fact('Translators', join(b.translators.map((p) => h('span', {}, person(p))))),
      fact('Language', b.languageCode ? languageLabel(b.languageCode) : b.language),
      fact('Total time', b.totalSecs ? formatDuration(b.totalSecs) : 'not yet catalogued'),
      fact('Sections', `${b.numSections}${sectionsNote}`),
      fact('Readers', readers.size > 0 && `${readers.size}: ${[...readers.values()].slice(0, 12).map(readerName).join(', ')}${readers.size > 12 ? ', …' : ''}`),
      fact('Copyright year', b.copyrightYear),
      fact('Read from', b.pgId && [h('a', { href: formatHash({ view: 'pg', id: b.pgId }) }, b.pgTitle ?? `Gutenberg #${b.pgId}`),
        b.pgTitle === null && h('span', { class: 'muted' }, ' (not in this snapshot)')]),
      fact('Text source', !b.pgId && u.textSource && ext(u.textSource)),
      fact('Live page', u.librivox && ext(u.librivox)),
      fact('Elsewhere', join([u.iarchive && ext(u.iarchive, 'archive.org'), u.rss && ext(u.rss, 'RSS'), u.zip && ext(u.zip, 'ZIP'),
        u.project && ext(u.project, 'project'), u.other && ext(u.other, 'other')].filter(Boolean), ' · '))),
    b.genres.length > 0 && [h('h2', {}, 'Genres'), h('ul', { class: 'chips' }, b.genres.map((g) => h('li', {}, g.name)))],
    b.description && [h('h2', {}, 'Description'), h('p', { class: 'prose' }, b.description)],
    h('h2', {}, `Sections (${b.sections.length})`),
    h('ol', { class: 'sections' }, b.sections.map((s) => h('li', {},
      h('span', { class: 'num' }, s.sectionNumber),
      h('div', {},
        h('div', {}, sectionTitle(s)),
        h('div', { class: 'meta' },
          s.readers.length > 0 && h('span', {}, s.readers.map(readerName).join(', ')),
          s.playtimeSecs !== null && h('span', {}, formatDuration(s.playtimeSecs)),
          s.language !== b.language && h('span', {}, s.language))),
      s.listenUrl ? h('audio', { controls: true, preload: 'none', src: s.listenUrl }) : h('span', { class: 'muted small' }, 'no audio file')))),
  );
}

async function snapshotView() {
  document.title = 'Snapshot – Book catalogue';
  const res = await api('/health');
  const counts = [];
  for (const [k, v] of Object.entries(res.counts)) {
    if (v && typeof v === 'object') for (const [k2, v2] of Object.entries(v)) counts.push([`${k}.${k2}`, v2]);
    else counts.push([k, v]);
  }
  const lv = res.sources.librivox, pg = res.sources.gutenberg;
  return nodes(
    h('h1', {}, `Snapshot ${res.snapshot}`),
    h('p', { class: 'status' }, 'server ', h('b', {}, formatMs(res.ms))),
    h('dl', { class: 'facts' },
      fact('Status', h('span', { class: res.passed ? 'pass' : 'fail' }, res.passed ? 'all checks pass' : 'checks failed')),
      fact('Built', `${res.builtAt} (${res.ageHours} h ago)`), fact('Schema version', String(res.schemaVersion)),
      fact('LibriVox run', `${lv.fullRun}${lv.incrementalRuns.length ? ` + ${lv.incrementalRuns.join(', ')}` : ' (no incremental runs)'}`),
      fact('Gutenberg run', `${pg.run} (RDF archive of ${pg.rdfLastModified})`)),
    h('h2', {}, 'Counts'),
    h('div', { class: 'scroll' }, h('table', {}, h('tbody', {}, counts.map(([k, v]) => h('tr', {}, h('td', {}, k), h('td', { class: 'n' }, formatCount(v))))))),
    h('h2', {}, 'Checks'),
    h('div', { class: 'scroll' }, h('table', {},
      h('thead', {}, h('tr', {}, ['', 'Check', 'Value', 'Baseline'].map((t) => h('th', {}, t)))),
      h('tbody', {}, res.checks.map((c) => h('tr', {},
        h('td', { class: c.pass ? 'pass' : 'fail' }, c.pass ? '✓' : '✗'),
        h('td', {}, c.name, c.rule && h('div', { class: 'muted small' }, c.rule)),
        h('td', { class: 'n' }, formatCount(c.value), c.of !== undefined && h('span', { class: 'muted' }, ` / ${formatCount(c.of)}`)),
        h('td', { class: 'n' }, formatCount(c.baseline), c.baselineOf !== undefined && h('span', { class: 'muted' }, ` / ${formatCount(c.baselineOf)}`))))))),
  );
}

function backLink() {
  return h('p', { class: 'small' }, h('a', { href: formatHash(lastSearch) }, lastSearch.q ? `← Results for “${lastSearch.q}”` : '← Search'));
}

// ---- routing ----------------------------------------------------------------------------------

let renders = 0;
async function render() {
  const mine = ++renders;
  controller?.abort();
  controller = new AbortController();
  const r = parseHash(location.hash);
  const tab = r.view === 'snapshot' ? 'snapshot' : 'search';
  for (const a of document.querySelectorAll('nav a')) {
    if (a.dataset.nav === tab) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  }
  let out;
  try {
    if (r.view === 'search') out = await searchView(r);
    else if (r.view === 'pg') out = await pgView(r.id);
    else if (r.view === 'lv') out = await lvView(r.id);
    else if (r.view === 'snapshot') out = await snapshotView();
    else out = [h('p', { class: 'error' }, `No such view: ${r.path || location.hash}`), h('p', {}, h('a', { href: '#/search' }, 'Back to search'))];
  } catch (e) {
    if (e.name === 'AbortError') return;
    out = [errorNode(e)];
  }
  if (mine !== renders) return; // a newer hash has taken over
  view.replaceChildren(...out);
  if (r.view === 'pg' || r.view === 'lv') window.scrollTo(0, 0);
}

window.addEventListener('hashchange', render);
render().then(() => { if (parseHash(location.hash).view === 'search' && !form.q.value) form.q.focus(); });
