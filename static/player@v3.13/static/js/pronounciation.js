<!-- Pronunciation Dictionary JavaScript -->

// Pronunciation Dictionary Manager
(function() {
    let pronunciationDict = [];
    const STORAGE_KEY = 'ttsreader-pronunciation-dict';

    // Load from localStorage
    function loadDictionary() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            pronunciationDict = stored ? JSON.parse(stored) : [];
        } catch (e) {
            pronunciationDict = [];
        }
        updateDictionaryDisplay();
    }

    // Save to localStorage
    function saveDictionary() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(pronunciationDict));
        } catch (e) {
            console.warn('Could not save pronunciation dictionary:', e);
        }
    }

    // Add new pronunciation
    window.addPronunciation = function() {
        const originalWord = document.getElementById('originalWord');
        const pronunciationWord = document.getElementById('pronunciationWord');

        if (!originalWord || !pronunciationWord) return;

        const original = originalWord.value.trim();
        const pronunciation = pronunciationWord.value.trim();

        if (!original || !pronunciation) {
            alert('Please enter both original word and pronunciation');
            return;
        }

        // Check if word already exists
        const exists = pronunciationDict.find(entry =>
            entry.original === original
        );

        if (exists) {
            if (confirm(`"${original}" already exists. Update pronunciation?`)) {
                exists.pronunciation = pronunciation;
                exists.enabled = true;
            } else {
                return;
            }
        } else {
            pronunciationDict.push({
                id: Date.now(),
                original,
                pronunciation,
                enabled: true
            });
        }

        // Clear inputs
        originalWord.value = '';
        pronunciationWord.value = '';

        saveDictionary();
        updateDictionaryDisplay();
    };

    // Remove pronunciation
    window.removePronunciation = function(id) {
        pronunciationDict = pronunciationDict.filter(entry => entry.id !== id);
        saveDictionary();
        updateDictionaryDisplay();
    };

    // Toggle pronunciation enabled/disabled
    window.togglePronunciation = function(id) {
        const entry = pronunciationDict.find(e => e.id === id);
        if (entry) {
            entry.enabled = !entry.enabled;
            saveDictionary();
            updateDictionaryDisplay();
        }
    };

    // Edit pronunciation
    let editingPronunciationId = null;

    window.editPronunciation = function(id) {
        const entry = pronunciationDict.find(e => e.id === id);
        if (!entry) return;

        editingPronunciationId = id;

        // Populate the edit form
        document.getElementById('editOriginalWord').value = entry.original;
        document.getElementById('editPronunciationWord').value = entry.pronunciation;

        // Show the edit widget
        document.getElementById('pronunciationEditWidget').style.display = 'flex';

        // Focus on the first input
        document.getElementById('editOriginalWord').focus();
    };

    // Save pronunciation edit
    window.savePronunciationEdit = function() {
        if (!editingPronunciationId) return;

        const originalWord = document.getElementById('editOriginalWord');
        const pronunciationWord = document.getElementById('editPronunciationWord');

        if (!originalWord || !pronunciationWord) return;

        const original = originalWord.value.trim();
        const pronunciation = pronunciationWord.value.trim();

        if (!original || !pronunciation) {
            alert('Please enter both original word and pronunciation');
            return;
        }

        // Find and update the entry
        const entry = pronunciationDict.find(e => e.id === editingPronunciationId);
        if (entry) {
            entry.original = original;
            entry.pronunciation = pronunciation;
            saveDictionary();
            updateDictionaryDisplay();
        }

        closePronunciationEditWidget();
    };

    // Close pronunciation edit widget
    window.closePronunciationEditWidget = function() {
        document.getElementById('pronunciationEditWidget').style.display = 'none';
        editingPronunciationId = null;

        // Clear the form
        document.getElementById('editOriginalWord').value = '';
        document.getElementById('editPronunciationWord').value = '';
    };

    // Pronunciation highlighting functions
    function highlightPronunciationWords() {
        if (!window.quill) return;

        // Clear existing pronunciation highlights
        clearPronunciationHighlights();

        // Get enabled pronunciation words
        const enabledWords = pronunciationDict
            .filter(entry => entry.enabled)
            .map(entry => entry.original);

        if (enabledWords.length === 0) return;

        const text = window.quill.getText();

        // Process each enabled word
        enabledWords.forEach(word => {
            highlightWordInEditor(word);
        });
    }

    function highlightWordInEditor(word) {
        if (!window.quill) return;

        const text = window.quill.getText();

        // Create regex pattern for whole-word, case-sensitive matching
        // \b ensures word boundaries (whole word matching)
        // No 'i' flag means case-sensitive matching
        const wordRegex = new RegExp(`\\b${escapeRegex(word)}\\b`, 'g');
        let match;

        while ((match = wordRegex.exec(text)) !== null) {
            const start = match.index;
            const length = match[0].length;

            // Apply pronunciation highlight format
            try {
                window.quill.formatText(start, length, 'pronunciation-highlight', true, 'silent');
            } catch (e) {
                // Ignore formatting errors
                console.warn('Could not highlight word:', word, e);
            }
        }
    }

    function clearPronunciationHighlights() {
        if (!window.quill) return;

        try {
            const text = window.quill.getText();
            const length = text.length;

            // Remove all pronunciation highlights
            window.quill.formatText(0, length, 'pronunciation-highlight', false, 'silent');
        } catch (e) {
            // Ignore clearing errors
            console.warn('Could not clear pronunciation highlights:', e);
        }
    }

    function escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // Update dictionary display
    function updateDictionaryDisplay() {
        const list = document.getElementById('pronunciationList');
        const count = document.getElementById('dictCount');

        if (!list || !count) return;

        count.textContent = pronunciationDict.length;

        if (pronunciationDict.length === 0) {
            list.innerHTML = `
        <div class="pronunciation-empty">
          <p>No pronunciations defined yet.</p>
          <p>Add words above to build your dictionary.</p>
        </div>
      `;
            return;
        }

        const filteredDict = filterDictionary();

        // Sort entries alphabetically by original word (case-insensitive)
        const sortedDict = filteredDict.sort((a, b) => {
            return a.original.toLowerCase().localeCompare(b.original.toLowerCase());
        });

        list.innerHTML = sortedDict.map(entry => `
      <div class="pronunciation-entry ${entry.enabled ? '' : 'disabled'}">
        <input type="checkbox" class="pronunciation-toggle"
               ${entry.enabled ? 'checked' : ''}
               onchange="togglePronunciation(${entry.id})">
        <div class="pronunciation-words">
          <div class="pronunciation-original">${escapeHtml(entry.original)}</div>
          <div class="pronunciation-separator">/</div>
          <div class="pronunciation-phonetic">${escapeHtml(entry.pronunciation)}</div>
          <button class="pronunciation-test-btn" title="Test pronunciation" onclick="window.appMethods.pronounceTestVoice('${escapeHtml(entry.pronunciation)}')" aria-label="Test pronunciation">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="5,3 19,12 5,21"></polygon>
            </svg>
          </button>
          <button class="pronunciation-edit-btn" title="Edit pronunciation" onclick="editPronunciation(${entry.id})" aria-label="Edit pronunciation">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
        </div>
        <div class="pronunciation-actions">
          <button class="pronunciation-action-btn delete"
                  onclick="removePronunciation(${entry.id})"
                  title="Delete"
                  aria-label="Delete pronunciation">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 6h18"></path>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
    `).join('');

        // Update pronunciation highlighting in editor
        highlightPronunciationWords();
    }

    // Filter dictionary based on search
    function filterDictionary() {
        const search = document.querySelector('.pronunciation-search');

        if (!search) return pronunciationDict;

        const searchTerm = search.value.trim();
        if (!searchTerm) return pronunciationDict;

        return pronunciationDict.filter(entry => {
            const original = entry.original.toLowerCase();
            const pronunciation = entry.pronunciation.toLowerCase();
            const term = searchTerm.toLowerCase();

            return original.includes(term) || pronunciation.includes(term);
        });
    }

    // Helper functions
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Test function to verify pronunciation highlighting works
    window.testPronunciationHighlighting = function() {
        if (!window.quill) {
            console.log('Quill editor not available');
            return;
        }

        console.log('Testing pronunciation highlighting...');
        console.log('Active pronunciations:', pronunciationDict.filter(entry => entry.enabled));
        highlightPronunciationWords();
        console.log('Highlighting applied!');
    };


    // Function to initialize pronunciation highlighting when editor becomes available
    window.initPronunciationHighlighting = function() {
        if (window.quill && pronunciationDict.length > 0) {
            highlightPronunciationWords();
        }
    };

    // Set up event listeners
    function initPronunciationPanel() {
        // Search functionality
        const search = document.querySelector('.pronunciation-search');
        if (search) {
            search.addEventListener('input', updateDictionaryDisplay);
        }


        // Enter key support for inputs
        const originalWord = document.getElementById('originalWord');
        const pronunciationWord = document.getElementById('pronunciationWord');

        if (originalWord && pronunciationWord) {
            [originalWord, pronunciationWord].forEach(input => {
                input.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        addPronunciation();
                    }
                });
            });
        }

        // Load initial data
        loadDictionary();

        // Set up keyboard support for edit widget
        document.addEventListener('keydown', function(e) {
            const editWidget = document.getElementById('pronunciationEditWidget');
            if (editWidget && editWidget.style.display !== 'none') {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    closePronunciationEditWidget();
                } else if (e.key === 'Enter' && (e.target.id === 'editOriginalWord' || e.target.id === 'editPronunciationWord')) {
                    e.preventDefault();
                    savePronunciationEdit();
                }
            }
        });

        // Set up editor change listener for pronunciation highlighting
        // if (window.quill) {
        //   window.quill.on('text-change', function() {
        //     // Debounce the highlighting to avoid performance issues
        //     clearTimeout(window.pronunciationHighlightTimeout);
        //     window.pronunciationHighlightTimeout = setTimeout(() => {
        //       highlightPronunciationWords();
        //     }, 500);
        //   });
        // }

        // Listen for tab changes to update highlighting when pronunciation tab is shown
        document.addEventListener('click', function(e) {
            const tabBtn = e.target.closest('.settings-tab-btn');
            if (tabBtn && tabBtn.getAttribute('data-tab') === 'pronunciation') {
                // Delay highlighting to ensure tab content is visible
                setTimeout(() => {
                    highlightPronunciationWords();
                }, 100);
            }
        });

        // Update Highlight Button Event Listener
        const updateHighlightBtn = document.getElementById('updateHighlightBtn');
        if (updateHighlightBtn) {
            updateHighlightBtn.addEventListener('click', function() {
                try {
                    highlightPronunciationWords();

                    // Visual feedback - briefly change button text
                    const originalText = this.innerHTML;
                    this.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"></path></svg>';

                    setTimeout(() => {
                        this.innerHTML = originalText;
                    }, 1500);

                } catch (error) {
                    console.error('Error updating highlights:', error);
                    alert('Error updating highlights. Please try again.');
                }
            });
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPronunciationPanel);
    } else {
        initPronunciationPanel();
    }
})();
