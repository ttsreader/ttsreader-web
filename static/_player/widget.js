// src/findreplace/widget.js
class FindReplaceWidget {
  constructor() {
    this.quill = window.quill;
    this.matches = [];
    this.currentIndex = -1;
    this.container = document.querySelector('.main-app-container');
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
    this.container.style.position = 'relative'; // Needed for absolute positioning of widget
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
    // Use a single listener for find input changes
    this.findInput.addEventListener('input', () => this.find());

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

    // Keyboard shortcut to show widget (e.g., Ctrl+F)
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        this.show();
      }
    })

    this.quill.on('text-change', (delta, oldDelta, source) => {
      if (source === 'user') {
        this.find();
      }
    });
  }

  show() {
    this.widget.style.display = 'flex';
    this.findInput.focus();
    this.findInput.select();
  }

  toggle() {
    if (this.widget.style.display === 'none') {
      this.show();
    } else {
      this.hide();
    }
  }

  hide() {
    this.widget.style.display = 'none';
    this._clearHighlights();
  }

  find() {
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

    const regex = new RegExp(searchString, flags);
    this.matches = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      this.matches.push({ index: match.index, length: match[0].length });
    }

    if (this.matches.length > 0) {
      this.currentIndex = 0;
      this._highlightAll();
      // Do not focus on the first match automatically, just highlight
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

    this.quill.deleteText(match.index, match.length);
    this.quill.insertText(match.index, replaceText);

    // After replacing, re-run find to update matches
    this.find();

    // Find the next match after the replacement position
    const nextMatchIndex = this.matches.findIndex(m => m.index > originalIndex);
    this.currentIndex = (nextMatchIndex !== -1) ? nextMatchIndex : 0;

    if (this.matches.length > 0) {
      this._focusCurrent();
    }
    this._updateUI();
  }

  replaceAll() {
    const replaceText = this.replaceInput.value;
    // Go backwards to avoid index shifting issues
    [...this.matches].reverse().forEach(match => {
      this.quill.deleteText(match.index, match.length);
      this.quill.insertText(match.index, replaceText);
    });
    this._clearHighlights();
    this.matches = [];
    this.currentIndex = -1;
    this._updateUI();
  }

  _highlightAll() {
    this.matches.forEach(match => {
      this.quill.formatText(match.index, match.length, 'highlight', true, 'silent');
    });
  }

  _focusCurrent() {
    if (this.currentIndex === -1) return;
    this._highlightAll(); // Re-apply base highlight to all
    const match = this.matches[this.currentIndex];
    this.quill.formatText(match.index, match.length, 'background', '#ffb100', 'silent'); // Active highlight
    this.quill.setSelection(match.index, match.length, 'user');
    this.findInput.focus(); // Return focus to the find input
  }

  _clearHighlights() {
    this.quill.formatText(0, this.quill.getLength(), 'highlight', false, 'silent');
    this.quill.formatText(0, this.quill.getLength(), 'background', false, 'silent');
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
