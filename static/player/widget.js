// public/widget.js
class FindReplaceWidget {
  constructor() {
    this.quill = window.quill;
    this.matches = []; // unified: each entry has { index, length, range }
    this.currentIndex = -1;
    this.visible = false;
    this._findTimer = null;
    this._replacing = false; // suppresses text-change re-search during replace ops
    // The bar stands in the Reader's text area, between the editor's tools and the text's card, as wide as the card
    // (2026-11-18; Ronen: "can the search widget be in between these pills and the textbox?").
    this.container = document.querySelector('.tab-root .Text-box-container');
    this._highlightSupported = typeof CSS !== 'undefined' && CSS.highlights != null;
    this._createUI();
    this._addEventListeners();
    this._updateUI(); // nothing is found yet: Previous, Next, Replace and Replace all start as they are, not usable
    this.hide();
  }

  /** A word of the page's own language (the string table in index.html), else the English one. */
  _t(key, fallback) {
    try {
      const row = document.querySelector('#JS_STRINGS [data-ws-string-key="' + key + '"]');
      const value = row && row.getAttribute('data-ws-string-value');
      return value && value !== key ? value : fallback;
    } catch (e) {
      return fallback;
    }
  }

  /**
   * One line: Find, the count, previous and next, Replace, Close (Ronen, 2026-11-18: "our search can now add a bar -
   * single line between the title to [the editor's tools]. collapsable of course"). Replace opens a second line:
   * what to replace with, and the three ways to match. Most people only search, so they see one line.
   */
  _createUI() {
    const ICON = {
      search: '<svg class="fr-ic" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="M20 20l-3.500-3.500"></path></svg>',
      up: '<svg class="fr-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 15l6-6 6 6"></path></svg>',
      down: '<svg class="fr-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"></path></svg>',
      close: '<svg class="fr-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"></path></svg>',
    };
    this.widget = document.createElement('div');
    this.widget.className = 'fr-widget';
    this.widget.setAttribute('role', 'search');
    this.widget.innerHTML = `
      <div class="fr-line fr-line--find">
        <span class="fr-lead">${ICON.search}</span>
        <input type="text" class="fr-find-input" autocomplete="off" spellcheck="false">
        <span class="fr-match-count" aria-live="polite"></span>
        <button type="button" class="fr-round fr-prev-btn">${ICON.up}</button>
        <button type="button" class="fr-round fr-next-btn">${ICON.down}</button>
        <button type="button" class="fr-more" aria-expanded="false" aria-controls="frReplaceLine"><span class="fr-more-text"></span>${ICON.down}</button>
        <button type="button" class="fr-round fr-widget-close">${ICON.close}</button>
      </div>
      <div class="fr-line fr-line--replace" id="frReplaceLine" hidden>
        <input type="text" class="fr-replace-input" autocomplete="off" spellcheck="false">
        <button type="button" class="fr-pill fr-replace-btn"></button>
        <button type="button" class="fr-pill fr-replace-all-btn"></button>
        <span class="fr-options-group">
          <label class="fr-chip"><input type="checkbox" class="fr-case-cb"><span></span></label>
          <label class="fr-chip"><input type="checkbox" class="fr-whole-cb"><span></span></label>
          <label class="fr-chip"><input type="checkbox" class="fr-regex-cb"><span></span></label>
        </span>
      </div>
    `;
    // Before the card, so after the editor's own tools. Where there is no card of the container's own: first, as it was.
    const card = Array.from(this.container.children).find((n) => n.id === 'editor');
    this.container.insertBefore(this.widget, card || this.container.firstChild);
    // The editor's side tools hang from the card's top (the page moves them into the editor), and the open bar
    // pushes the card down: they are told how much room the bar takes, and stand over it by that much
    // (src/css/shellNav.css reads --fr-height). Measured again whenever the bar's own size changes: its second
    // line, a narrower window that wraps it.
    try {
      if (typeof ResizeObserver === 'function') new ResizeObserver(() => this._tellHeight()).observe(this.widget);
    } catch (e) { /* it is told when the bar opens, closes and shows its second line */ }

    // Cache UI elements
    this.findInput = this.widget.querySelector('.fr-find-input');
    this.replaceInput = this.widget.querySelector('.fr-replace-input');
    this.matchCountEl = this.widget.querySelector('.fr-match-count');
    this.prevBtn = this.widget.querySelector('.fr-prev-btn');
    this.nextBtn = this.widget.querySelector('.fr-next-btn');
    this.replaceBtn = this.widget.querySelector('.fr-replace-btn');
    this.replaceAllBtn = this.widget.querySelector('.fr-replace-all-btn');
    this.closeBtn = this.widget.querySelector('.fr-widget-close');
    this.moreBtn = this.widget.querySelector('.fr-more');
    this.replaceLine = this.widget.querySelector('.fr-line--replace');

    // Cache options checkboxes
    this.regexCb = this.widget.querySelector('.fr-regex-cb');
    this.caseCb = this.widget.querySelector('.fr-case-cb');
    this.wholeCb = this.widget.querySelector('.fr-whole-cb');

    // The words, in the page's language. Set as text and attributes, never as markup.
    const find = this._t('d20261118_find_placeholder', 'Find in the text');
    const replace = this._t('d20261118_find_replace', 'Replace');
    const name = (el, text) => { el.setAttribute('aria-label', text); el.title = text; };
    this.widget.setAttribute('aria-label', find);
    this.findInput.placeholder = find;
    this.findInput.setAttribute('aria-label', find);
    name(this.prevBtn, this._t('d20261118_find_previous', 'Previous match'));
    name(this.nextBtn, this._t('d20261118_find_next', 'Next match'));
    name(this.closeBtn, this._t('d20261008_close', 'Close'));
    this.moreBtn.querySelector('.fr-more-text').textContent = replace;
    name(this.moreBtn, replace); // on a narrow bar only its arrow is drawn
    const replaceWith = this._t('d20261118_find_replace_with', 'Replace with');
    this.replaceInput.placeholder = replaceWith;
    this.replaceInput.setAttribute('aria-label', replaceWith);
    this.replaceBtn.textContent = replace;
    this.replaceAllBtn.textContent = this._t('d20261118_find_replace_all', 'Replace all');
    this.caseCb.nextElementSibling.textContent = this._t('d20261118_find_match_case', 'Match case');
    this.wholeCb.nextElementSibling.textContent = this._t('d20261118_find_whole_word', 'Whole word');
    this.regexCb.nextElementSibling.textContent = this._t('d20261118_find_regex', 'Regex');
  }

  /** The second line: shown or not. Opening it puts the cursor in "Replace with". */
  _setReplaceOpen(open) {
    this.replaceLine.hidden = !open;
    this.moreBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    this.widget.classList.toggle('fr-widget--replace', open);
    this._tellHeight();
    if (open) this.replaceInput.focus();
  }

  /** The room the open bar takes over the card, its own margins with it; nothing while it is closed or not drawn. */
  _tellHeight() {
    try {
      const drawn = this.visible ? this.widget.offsetHeight : 0;
      // said on the Reader's panel: the side tools (in the card) and the "not synced yet" chip (beside the text area) both read it
      const panel = this.container.closest('.App') || this.container;
      if (!(drawn > 0)) { panel.style.removeProperty('--fr-height'); return; }
      const cs = getComputedStyle(this.widget);
      const room = drawn + (parseFloat(cs.marginTop) || 0) + (parseFloat(cs.marginBottom) || 0);
      panel.style.setProperty('--fr-height', room + 'px');
    } catch (e) { /* the tools stay where the card puts them */ }
  }

  _addEventListeners() {
    // Debounced find on input changes
    this.findInput.addEventListener('input', () => this._debouncedFind());

    // Listen for changes on checkboxes
    this.regexCb.addEventListener('change', () => this.find());
    this.caseCb.addEventListener('change', () => this.find());
    this.wholeCb.addEventListener('change', () => this.find());

    // Button listeners
    this.closeBtn.addEventListener('click', () => this.hide());
    this.moreBtn.addEventListener('click', () => this._setReplaceOpen(this.replaceLine.hidden));
    this.nextBtn.addEventListener('click', () => this.focusNext());
    this.prevBtn.addEventListener('click', () => this.focusPrev());
    this.replaceBtn.addEventListener('click', () => this.replace());
    this.replaceAllBtn.addEventListener('click', () => this.replaceAll());

    // Keyboard handling — Enter/Shift+Enter in find, Enter in replace, Escape
    this.findInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (e.shiftKey) {
          this.focusPrev();
        } else {
          this.focusNext();
        }
      }
    });

    this.replaceInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.replace();
      }
    });

    // Prevent all widget keydown events from leaking to the app
    this.widget.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Escape') {
        this.hide();
      }
    });
  }

  _debouncedFind() {
    clearTimeout(this._findTimer);
    this._findTimer = setTimeout(() => this.find(), 150);
  }

  show() {
    this.visible = true;
    // By classes: the page's styles say how the open bar is laid out, and where it is not shown (a recording open).
    // The inline "none" that hides it (below) is taken off, nothing is put in its place.
    this.widget.style.display = '';
    this.widget.classList.add('is-open');
    this.container.classList.add('fr-open');
    this._tellHeight();
    this.findInput.focus();
    this.findInput.select();
    // Re-run find if there's an existing query so highlights reappear on toggle
    if (this.findInput.value) {
      this.find();
    } else {
      this._updateUI();
    }
  }

  toggle() {
    if (!this.visible) {
      this.show();
    } else {
      this.hide();
    }
  }

  hide() {
    this.visible = false;
    this.widget.classList.remove('is-open');
    this.container.classList.remove('fr-open');
    // …and hidden by its own style too: a browser still holding an older stylesheet for it (one that shows it by
    // default) must not show a bar nobody asked for.
    this.widget.style.display = 'none';
    this._tellHeight();
    this._clearHighlights();
    this.quill.focus();
  }

  find() {
    if (!this.visible) return;
    this._clearHighlights();
    const query = this.findInput.value;
    if (query.length < 1) {
      this.matches = [];
      this.currentIndex = -1;
      this._updateUI();
      return;
    }

    const text = this.quill.getText();
    const flags = this.caseCb.checked ? 'g' : 'gi';
    let searchString = this.regexCb.checked ? query : query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (this.wholeCb.checked && !this.regexCb.checked) {
      searchString = `\\b${searchString}\\b`;
    }

    let regex;
    try {
      regex = new RegExp(searchString, flags);
    } catch (e) {
      this.matches = [];
      this.currentIndex = -1;
      this._updateUI();
      return;
    }

    // Build unified matches array — only keep entries where DOM range succeeds
    this.matches = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      if (match[0].length === 0) { regex.lastIndex++; continue; }
      const entry = { index: match.index, length: match[0].length, range: null };
      try {
        const start = this._quillIndexToNode(entry.index);
        const end = this._quillIndexToNode(entry.index + entry.length);
        if (start && end) {
          const range = document.createRange();
          range.setStart(start.node, start.offset);
          range.setEnd(end.node, end.offset);
          entry.range = range;
        }
      } catch (e) {
        // DOM range failed — entry.range stays null
      }
      this.matches.push(entry);
    }

    if (this.matches.length > 0) {
      this.currentIndex = 0;
      this._highlightAll();
      this._focusCurrent();
    } else {
      this.currentIndex = -1;
    }
    this._updateUI();
  }

  /**
   * What was found no longer stands in the page: the text was put there again since (another document, a recording
   * opened and closed over the bar). Its places are dead: they are looked for again before anything is done with them.
   */
  _refreshIfStale() {
    // A place whose text was taken out of the page does not vanish: the browser folds it onto what is left, empty
    // (a live range collapses onto the parent of the nodes removed). A place found is never empty.
    const stale = this.matches.some((m) => m.range && (m.range.collapsed || !m.range.startContainer.isConnected));
    if (stale) this.find();
    return stale;
  }

  focusNext() {
    if (this._refreshIfStale()) return; // found again, at the first of them
    if (this.matches.length === 0) return;
    this.currentIndex = (this.currentIndex + 1) % this.matches.length;
    this._focusCurrent();
    this._updateUI();
  }

  focusPrev() {
    if (this._refreshIfStale()) return;
    if (this.matches.length === 0) return;
    this.currentIndex = (this.currentIndex - 1 + this.matches.length) % this.matches.length;
    this._focusCurrent();
    this._updateUI();
  }

  replace() {
    if (this.currentIndex === -1 || this.matches.length === 0) return;

    const match = this.matches[this.currentIndex];
    const replaceText = this.replaceInput.value;
    const originalIndex = match.index;

    // Atomic replace via single Delta for clean undo history
    this._replacing = true;
    const Delta = Quill.import('delta');
    let delta = new Delta();
    if (match.index > 0) {
      delta = delta.retain(match.index);
    }
    delta = delta.delete(match.length);
    delta = delta.insert(replaceText);
    this.quill.updateContents(delta, 'user');
    this._replacing = false;

    // Re-run find directly to update matches
    this.find();

    // Find the next match after the replacement position
    const nextMatchIndex = this.matches.findIndex(m => m.index >= originalIndex + replaceText.length);
    if (nextMatchIndex !== -1) {
      this.currentIndex = nextMatchIndex;
    } else if (this.matches.length > 0) {
      this.currentIndex = 0;
    }

    if (this.matches.length > 0) {
      this._focusCurrent();
    }
    this._updateUI();
  }

  replaceAll() {
    if (this.matches.length === 0) return;
    const replaceText = this.replaceInput.value;

    // Build a single batched Delta for undo-as-one-operation
    this._replacing = true;
    const Delta = Quill.import('delta');
    let delta = new Delta();
    let pos = 0;
    for (const match of this.matches) {
      if (match.index > pos) {
        delta = delta.retain(match.index - pos);
      }
      delta = delta.delete(match.length);
      delta = delta.insert(replaceText);
      pos = match.index + match.length;
    }
    this.quill.updateContents(delta, 'user');
    this._replacing = false;

    // Re-run find so self-matching replacements show up
    this.find();
  }

  _quillIndexToNode(index) {
    const [leaf, offset] = this.quill.getLeaf(index);
    if (!leaf || !leaf.domNode) return null;
    const node = leaf.domNode;
    if (node.nodeType === Node.TEXT_NODE) {
      return { node, offset };
    }
    // Element node — try to use its first text child
    if (node.firstChild && node.firstChild.nodeType === Node.TEXT_NODE) {
      return { node: node.firstChild, offset };
    }
    return null;
  }

  _highlightAll() {
    if (!this._highlightSupported) return;
    const ranges = this.matches.map(m => m.range).filter(Boolean);
    if (ranges.length === 0) return;
    CSS.highlights.set('fr-search', new Highlight(...ranges));
  }

  _focusCurrent() {
    if (this.currentIndex === -1 || !this._highlightSupported) return;
    const range = this.matches[this.currentIndex]?.range;
    if (!range) return;

    // Set active highlight on current match only (priority 1 so it paints over fr-search)
    const activeHighlight = new Highlight(range);
    activeHighlight.priority = 1;
    CSS.highlights.set('fr-active', activeHighlight);

    // Scroll the match into view
    const rect = range.getBoundingClientRect();
    const editorRect = this.quill.root.getBoundingClientRect();
    if (rect.top < editorRect.top || rect.bottom > editorRect.bottom) {
      const scrollContainer = this.quill.root;
      scrollContainer.scrollTop += rect.top - editorRect.top - editorRect.height / 3;
    }

    this.findInput.focus();
  }

  _clearHighlights() {
    if (!this._highlightSupported) return;
    CSS.highlights.delete('fr-search');
    CSS.highlights.delete('fr-active');
  }

  _updateUI() {
    const hasMatches = this.matches.length > 0;
    if (hasMatches) {
      this.matchCountEl.textContent = `${this.currentIndex + 1} / ${this.matches.length}`;
    } else {
      this.matchCountEl.textContent = this.findInput.value ? '0 / 0' : '';
    }
    this.prevBtn.disabled = !hasMatches;
    this.nextBtn.disabled = !hasMatches;
    this.replaceBtn.disabled = !hasMatches;
    this.replaceAllBtn.disabled = !hasMatches;
  }
}
