// public/widget.js
class FindReplaceWidget {
  constructor() {
    this.quill = window.quill;
    this.matches = []; // unified: each entry has { index, length, range }
    this.currentIndex = -1;
    this.visible = false;
    this._findTimer = null;
    this._replacing = false; // suppresses text-change re-search during replace ops
    this.container = document.querySelector('.main-app-container');
    this._highlightSupported = typeof CSS !== 'undefined' && CSS.highlights != null;
    this._createUI();
    this._addEventListeners();
    this.hide();
  }

  _createUI() {
    this.widget = document.createElement('div');
    this.widget.className = 'fr-widget';
    this.widget.innerHTML = `
      <div class="fr-widget-header">
        <span class="fr-widget-title">Find & Replace</span>
        <button class="fr-widget-close">&times;</button>
      </div>
      <div class="fr-input-group">
        <input type="text" placeholder="Find" class="fr-find-input">
        <span class="fr-match-count">0 / 0</span>
      </div>
      <div class="fr-button-group">
        <button class="fr-prev-btn">&lt; Prev</button>
        <button class="fr-next-btn">Next &gt;</button>
      </div>
      <div class="fr-options-group">
        <label><input type="checkbox" class="fr-regex-cb"> Regex</label>
        <label><input type="checkbox" class="fr-case-cb"> Case sensitive</label>
        <label><input type="checkbox" class="fr-whole-cb"> Whole word</label>
      </div>
      <div class="fr-input-group">
        <input type="text" placeholder="Replace" class="fr-replace-input">
      </div>
      <div class="fr-button-group">
        <button class="fr-replace-btn">Replace</button>
        <button class="fr-replace-all-btn">Replace All</button>
      </div>
    `;
    this.container.style.position = 'relative';
    this.container.appendChild(this.widget);

    // Cache UI elements
    this.findInput = this.widget.querySelector('.fr-find-input');
    this.replaceInput = this.widget.querySelector('.fr-replace-input');
    this.matchCountEl = this.widget.querySelector('.fr-match-count');
    this.prevBtn = this.widget.querySelector('.fr-prev-btn');
    this.nextBtn = this.widget.querySelector('.fr-next-btn');
    this.replaceBtn = this.widget.querySelector('.fr-replace-btn');
    this.replaceAllBtn = this.widget.querySelector('.fr-replace-all-btn');
    this.closeBtn = this.widget.querySelector('.fr-widget-close');

    // Cache options checkboxes
    this.regexCb = this.widget.querySelector('.fr-regex-cb');
    this.caseCb = this.widget.querySelector('.fr-case-cb');
    this.wholeCb = this.widget.querySelector('.fr-whole-cb');
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
    this.widget.style.display = 'flex';
    this.findInput.focus();
    this.findInput.select();
    // Re-run find if there's an existing query so highlights reappear on toggle
    if (this.findInput.value) {
      this.find();
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
    this.widget.style.display = 'none';
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

  focusNext() {
    if (this.matches.length === 0) return;
    this.currentIndex = (this.currentIndex + 1) % this.matches.length;
    this._focusCurrent();
    this._updateUI();
  }

  focusPrev() {
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
