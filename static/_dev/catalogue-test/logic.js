// The pure parts of the test UI: hash routing, API query building, paging, and display
// formatting. No DOM and no network, so test/ui-logic.test.js imports it under Node.

export const PAGE_SIZE = 20;
export const MAX_OFFSET = 10_000; // the API's own limit (README § API)
export const KINDS = ['all', 'text', 'audio'];

// The API has no list of languages, so this is the snapshot's own (2026-10-05): every code in
// pg_book_languages and lv_books.language_code, most books first. Any 2–3 letter code still works
// when typed into the URL; the page adds it to the menu.
export const LANGUAGES = [
  'en', 'fr', 'fi', 'de', 'es', 'nl', 'it', 'pt', 'hu', 'zh', 'sv', 'el', 'la', 'eo', 'ca', 'da', 'ru',
  'pl', 'tl', 'ja', 'grc', 'he', 'no', 'fy', 'af', 'cy', 'cs', 'bg', 'enm', 'cu', 'ro', 'fur', 'ga',
  'is', 'te', 'uk', 'ar', 'ang', 'sl', 'ceb', 'gla', 'ko', 'sr', 'gl', 'ilo', 'mi', 'myn', 'nah', 'nai',
  'nav', 'arp', 'brx', 'fa', 'hi', 'oc', 'ta', 'ale', 'bgs', 'bo', 'br', 'csb', 'et', 'hai', 'hr', 'ia',
  'id', 'iu', 'jv', 'kha', 'kld', 'lb', 'lt', 'luo', 'lv', 'mk', 'nap', 'oji', 'rmq', 'sa', 'sco', 'ur',
  'yi', 'yue',
];

const EMPTY_SEARCH = Object.freeze({ view: 'search', q: '', kind: 'all', lang: '', offset: 0 });
const ID = /^[1-9]\d{0,14}$/;

/** location.hash → a route: search, pg, lv, snapshot, or notfound. Never throws. */
export function parseHash(hash) {
  const h = String(hash ?? '').replace(/^#/, '');
  const [path, query = ''] = splitOnce(h, '?');
  if (path === '' || path === '/' || path === '/search') {
    const p = new URLSearchParams(query); // lenient: a broken escape decodes to U+FFFD, never throws
    const q = p.get('q') ?? '';
    const kind = KINDS.includes(p.get('kind')) ? p.get('kind') : 'all';
    const lang = (p.get('lang') ?? '').toLowerCase();
    const off = p.get('offset') ?? '';
    const offset = /^\d{1,15}$/.test(off) ? Math.min(MAX_OFFSET, Number(off)) : 0;
    return { ...EMPTY_SEARCH, q, kind, lang: /^[a-z]{2,3}$/.test(lang) ? lang : '', offset };
  }
  if (path === '/snapshot') return { view: 'snapshot' };
  const m = /^\/(pg|lv)\/([^/]*)$/.exec(path);
  if (m && ID.test(m[2])) return { view: m[1], id: Number(m[2]) };
  return { view: 'notfound', path };
}

/** A route → its hash; search parameters at their default are left out. */
export function formatHash(r) {
  if (r.view === 'pg' || r.view === 'lv') return `#/${r.view}/${r.id}`;
  if (r.view === 'snapshot') return '#/snapshot';
  const p = new URLSearchParams();
  if (r.q) p.set('q', r.q);
  if (r.kind && r.kind !== 'all') p.set('kind', r.kind);
  if (r.lang) p.set('lang', r.lang);
  if (r.offset) p.set('offset', String(r.offset));
  const s = p.toString();
  return s ? `#/search?${s}` : '#/search';
}

/** The /search URL for a search route, or null when there is nothing to search. */
export function searchPath({ q, kind = 'all', lang = '', offset = 0, limit = PAGE_SIZE }) {
  const words = String(q ?? '').trim().replace(/\s+/g, ' ');
  if (!words) return null;
  const p = new URLSearchParams({ q: words });
  if (kind !== 'all') p.set('kind', kind);
  if (lang) p.set('lang', lang);
  p.set('limit', String(limit));
  if (offset) p.set('offset', String(offset));
  return `/search?${p}`;
}

/** The range a page of results shows (1-based) and the offsets of the pages either side. */
export function pageInfo({ total, offset, limit, count }) {
  const from = count > 0 ? offset + 1 : 0;
  const to = count > 0 ? offset + count : 0;
  const prev = offset > 0 ? Math.max(0, offset - limit) : null;
  const n = offset + limit;
  const next = n < total && n <= MAX_OFFSET ? n : null;
  return { from, to, prev, next };
}

const pad2 = (n) => String(n).padStart(2, '0');

/** Seconds → "m:ss" under an hour, "h:mm:ss" above; '' when not a non-negative number. */
export function formatDuration(secs) {
  if (typeof secs !== 'number' || !Number.isFinite(secs) || secs < 0) return '';
  const s = Math.floor(secs);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  return h > 0 ? `${h}:${pad2(m)}:${pad2(r)}` : `${m}:${pad2(r)}`;
}

/** Bytes → "77.6 kB", decimal units as gutenberg.org shows them; '' when unknown. */
export function formatBytes(n) {
  if (typeof n !== 'number' || !Number.isFinite(n) || n < 0) return '';
  if (n < 1000) return `${n} B`;
  const units = ['kB', 'MB', 'GB', 'TB'];
  let v = n / 1000, i = 0;
  while (i < units.length - 1 && Number(v.toFixed(1)) >= 1000) { v /= 1000; i++; }
  return `${v.toFixed(1)} ${units[i]}`;
}

export const formatCount = (n) => (typeof n === 'number' ? n.toLocaleString('en-US') : '');
export const formatMs = (ms) => (typeof ms === 'number' ? `${Number(ms.toFixed(2))} ms` : '');

export const mimeBase = (mime) => String(mime ?? '').split(';')[0].trim().toLowerCase();

const FORMATS = {
  'text/html': 'HTML', 'application/epub+zip': 'EPUB', 'application/x-mobipocket-ebook': 'Kindle',
  'text/plain': 'Plain text', 'application/zip': 'ZIP', 'application/pdf': 'PDF',
  'application/rdf+xml': 'RDF metadata', 'image/jpeg': 'JPEG image', 'image/png': 'PNG image',
  'image/gif': 'GIF image', 'image/tiff': 'TIFF image', 'audio/mpeg': 'MP3 audio', 'audio/ogg': 'Ogg audio',
  'audio/mp4': 'MP4 audio', 'audio/midi': 'MIDI', 'audio/x-wav': 'WAV audio', 'audio/x-ms-wma': 'WMA audio',
  'text/x-rst': 'reStructuredText', 'application/prs.tei': 'TEI', 'application/prs.tex': 'TeX',
  'text/xml': 'XML', 'text/rtf': 'RTF', 'application/msword': 'Word', 'application/postscript': 'PostScript',
  'application/octet-stream': 'Other (octet-stream)', 'application/x-musescore': 'MuseScore',
};

export const formatLabel = (mime) => FORMATS[mimeBase(mime)] ?? String(mime);

/** Files → [{ mime, label, files }] by base mime type, groups in the order first seen. */
export function groupFiles(files) {
  const groups = new Map();
  for (const f of files) {
    const key = mimeBase(f.mime);
    if (!groups.has(key)) groups.set(key, { mime: key, label: formatLabel(f.mime), files: [] });
    groups.get(key).files.push(f);
  }
  return [...groups.values()];
}

// MARC relator codes as they occur in the Gutenberg RDF.
const ROLES = {
  aut: 'author', trl: 'translator', ill: 'illustrator', edt: 'editor', ctb: 'contributor',
  aui: 'author of introduction', aft: 'author of afterword', com: 'compiler', cmm: 'commentator',
  ann: 'annotator', dub: 'dubious author', oth: 'other', egr: 'engraver', pht: 'photographer',
  prf: 'performer', cmp: 'composer', pbl: 'publisher', adp: 'adapter', art: 'artist', lbt: 'librettist',
  arr: 'arranger', unk: 'unknown role', prt: 'printer', trc: 'transcriber', cnd: 'conductor',
  clb: 'collaborator', res: 'researcher', frg: 'forger',
};
export const roleName = (code) => ROLES[code] ?? String(code);

export const lvPersonName = (p) => [p.firstName, p.lastName].filter(Boolean).join(' ');

/** Birth and death (numbers or LibriVox's free text) → "1854–1900", "1854–", "–1900" or ''. */
export function lifeDates(birth, death) {
  const b = birth ?? '', d = death ?? '';
  return b === '' && d === '' ? '' : `${b}–${d}`;
}

export const sectionTitle = (s) => s.title ?? `Section ${s.sectionNumber}`;
export const readerName = (r) => r.displayName ?? `Reader #${r.id}`;
export const sourceName = (source) => ({ pg: 'Gutenberg', lv: 'LibriVox' })[source] ?? String(source);

let names;
/** "English (en)"; a code Intl cannot name shows bare. */
export function languageLabel(code) {
  names ??= new Intl.DisplayNames(['en'], { type: 'language', fallback: 'none' });
  const name = safe(() => names.of(code));
  return name && name !== code ? `${name} (${code})` : code;
}

/** fn delayed until `ms` pass with no further call; .cancel() drops a pending call. */
export function debounce(fn, ms) {
  let timer = null;
  const d = (...args) => { clearTimeout(timer); timer = setTimeout(() => { timer = null; fn(...args); }, ms); };
  d.cancel = () => { clearTimeout(timer); timer = null; };
  return d;
}

function splitOnce(s, sep) {
  const i = s.indexOf(sep);
  return i < 0 ? [s] : [s.slice(0, i), s.slice(i + 1)];
}

function safe(fn) { try { return fn(); } catch { return null; } }
