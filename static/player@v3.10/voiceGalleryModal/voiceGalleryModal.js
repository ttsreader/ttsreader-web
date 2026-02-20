const state = {
    allVoices: [],
    language: "",
    search: "",
    gender: "",
    sort: "az",
    pinnedOnly: false,
    pinned: new Set(
        JSON.parse(localStorage.getItem("pinnedVoices") || "[]")
    ),
    selectedVoiceId: localStorage.getItem("selectedVoiceId") || null
};


async function loadVoices() {
    const res = await fetch("voiceGalleryModal/azure_voices_list_20251225.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to load JSON: ${res.status}`);

    const voices = await res.json(); // array
    state.allVoices = voices;

    // Build language dropdown from the data
    populateLanguageSelect(voices);

    // Initial render
    applyFiltersAndRender();
}

function populateLanguageSelect(voices) {
    const select = document.getElementById("languageSelect");
    if (!select) return;

    // Build unique list by Locale (more precise) with label LocaleName
    const map = new Map(); // key: Locale, value: LocaleName
    for (const v of voices) {
        if (!v.Locale) continue;
        if (!map.has(v.Locale)) map.set(v.Locale, v.LocaleName || v.Locale);
    }

    // Sort options by displayed name
    const options = Array.from(map.entries())
        .sort((a, b) => a[1].localeCompare(b[1]));

    // Reset and insert options
    select.innerHTML = `<option value="">All languages</option>` +
        options.map(([locale, label]) => `<option value="${escapeHtml(locale)}">${escapeHtml(label)}</option>`).join("");

    select.onchange = (e) => {
        console.log("languageSelect changed ✅", e.target.value);
        state.language = e.target.value;
        applyFiltersAndRender();
    };

}

function applyFiltersAndRender() {
    let filtered = state.allVoices;
    filtered = filtered.filter(v => v.VoiceType === "Neural");

    // Language filter: match primary Locale OR SecondaryLocaleList
    if (state.language) {
        filtered = filtered.filter(v => {
            const primaryMatch = v.Locale === state.language;
            const secondary = Array.isArray(v.SecondaryLocaleList) ? v.SecondaryLocaleList : [];
            const secondaryMatch = secondary.includes(state.language);
            return primaryMatch || secondaryMatch;
        });
    }

    // Gender filter
    if (state.gender) {
        filtered = filtered.filter(v => {
            return (v.Gender || "").toLowerCase() === state.gender.toLowerCase();
        });
    }
    // Search filter (name, shortName, localeName)
    if (state.search) {
        const q = state.search.toLowerCase();
        filtered = filtered.filter(v => {
            const name = (v.DisplayName || "").toLowerCase();
            const shortName = (v.ShortName || "").toLowerCase();
            const localeName = (v.LocaleName || "").toLowerCase();
            return name.includes(q) || shortName.includes(q) || localeName.includes(q);
        });
    }

    // Sorting
    if (state.sort === "az") {
        filtered = [...filtered].sort((a, b) =>
            (a.DisplayName || "").localeCompare(b.DisplayName || "", undefined, { sensitivity: "base" })
        );
    } else if (state.sort === "za") {
        filtered = [...filtered].sort((a, b) =>
            (b.DisplayName || "").localeCompare(a.DisplayName || "", undefined, { sensitivity: "base" })
        );
    }
    //pinned only filter
    if (state.pinnedOnly) {
        filtered = filtered.filter(v => state.pinned.has(v.ShortName));
    }
    // Count shown
    const meta = document.getElementById("resultsMeta");
    if (meta) meta.textContent = `${filtered.length} voices`;

    const { mainLanguage, extraCount } = getLanguageBadgeData(filtered);

    const badgeEl = document.getElementById("languageBadge");
    if (badgeEl) {
        badgeEl.textContent =
            extraCount > 0
                ? `${mainLanguage} +${extraCount}`
                : mainLanguage;
    }
    renderVoices(filtered);
}

function renderVoices(voices) {
    const grid = document.getElementById("voicesGrid");
    if (!grid) return;

    grid.innerHTML = voices.map(v => {
        const id = v.ShortName;
        const voiceURI ="azure." + id;
        const isPinned = state.pinned.has(id);
        const name = v.DisplayName || "";
        const initials = (name || "")
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map(p => p[0])
            .join("")
            .toUpperCase() || "V";

        const { c1, c2 } = stringToGradient(v.ShortName || name);
        const primaryLabel = v.LocaleName || v.Locale || "";
        const secondary = Array.isArray(v.SecondaryLocaleList) ? v.SecondaryLocaleList : [];
        const extra = secondary.filter(l => l && l !== v.Locale).length; // כמה נוספים מעבר ל-primary
        const pillText = extra > 0 ? `${primaryLabel} +${extra}` : primaryLabel;
        const scenarios = v.VoiceTag?.TailoredScenarios ?? [];
        const personalities = v.VoiceTag?.VoicePersonalities ?? [];
        const isSelected = state.selectedVoiceId === id;
        return `
<article class="settings-sidebar voice-card ${isSelected ? "is-selected" : ""}"
    data-voice-id="${escapeHtml(id)}"
    data-ws-voiceURI="azure.${escapeHtml(id)}"
    data-ws-audio-src="server"
    data-ws-voiceName="${escapeHtml(v.DisplayName || id)}">
        <header class="voice-header">
        <div class="voice-avatar" style="--c1:${c1}; --c2:${c2}">
        <span class="voice-avatar-letter">${escapeHtml(initials)}</span>
        </div>
        <div class="voice-meta">
        <div class="voice-name">${escapeHtml(v.DisplayName || "")}</div>
        <div class="voice-gender">${escapeHtml(v.Gender || "")}</div>
        </div>

        <div class="sidebar-voice-actions Playback-buttons-bar">
            <button class="sidebar-voice-btn ${isPinned ? "is-pinned" : ""}" title="Pin" data-pin="${escapeHtml(id)}">
            <svg
            viewBox="0 0 24 24"
            class="icon pin-icon"
            aria-hidden="true"
            >
            <path
                fill="currentColor"
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M16.4746 4.3747L19.6474 7.55072C20.6549 8.55917 21.4713 9.37641 21.9969 10.0856C22.5382 10.8161 22.8881 11.5853 22.6982 12.4634C22.5083 13.3415 21.8718 13.8972 21.0771 14.3383C20.3055 14.7665 19.2245 15.1727 17.8906 15.6738L15.9136 16.4166C15.1192 16.7151 14.9028 16.8081 14.742 16.9474C14.6611 17.0174 14.5887 17.0967 14.5263 17.1837C14.4021 17.3568 14.329 17.5812 14.1037 18.4L14.0914 18.4449C13.8627 19.2762 13.6739 19.9623 13.4671 20.4774C13.2573 21.0003 12.974 21.4955 12.465 21.786C12.1114 21.9878 11.7112 22.0936 11.3041 22.093C10.7179 22.0921 10.227 21.8014 9.78647 21.4506C9.35243 21.1049 8.8497 20.6016 8.24065 19.9919L6.65338 18.403L2.5306 22.53C2.23786 22.823 1.76298 22.8233 1.46994 22.5305C1.1769 22.2378 1.17666 21.7629 1.4694 21.4699L5.59326 17.3418L4.05842 15.8054C3.45318 15.1996 2.9536 14.6995 2.61002 14.2678C2.26127 13.8297 1.97215 13.3421 1.96848 12.7599C1.96586 12.3451 2.07354 11.9371 2.28053 11.5777C2.57116 11.0731 3.06341 10.7919 3.58296 10.5834C4.09477 10.3779 4.77597 10.1901 5.60112 9.96265L5.6457 9.95036C6.46601 9.7242 6.69053 9.65088 6.86346 9.52638C6.9526 9.4622 7.0337 9.38748 7.10499 9.30383C7.24338 9.14144 7.33502 8.92324 7.62798 8.12367L8.34447 6.16811C8.83874 4.819 9.23907 3.72629 9.66362 2.9461C10.1005 2.14324 10.654 1.49811 11.5357 1.30359C12.4175 1.10904 13.1908 1.46156 13.9246 2.0063C14.6375 2.53559 15.4597 3.35863 16.4746 4.3747Z"
            />
            </svg>
            </button>
            <button id="testBtn" class="sidebar-voice-btn" title="Test voice"
                onclick="
                        event.stopPropagation();
                        const card = this.closest('.voice-card');
                        const voiceId = card.getAttribute('data-voice-id'); 
                        const fullUri = 'azure.' + voiceId;
                        card.setAttribute('data-ws-voiceuri', fullUri);
                        card.setAttribute('data-ws-voiceURI', fullUri);
                        card.dataset.wsVoiceuri = fullUri;
                        card.setAttribute('data-ws-audio-src', 'server'); 
                        if (window.parent && window.parent.appMethods) {
                            if (typeof window.parent.appMethods.testVoice === 'function') {
                                window.parent.appMethods.testVoice(card, fullUri);
                            }
                        }
                    "
                aria-label="Test voice">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polygon points="5,3 19,12 5,21" />
                            </svg>
            </button>
            <button
            class="sidebar-voice-btn"
            title="Copy voice settings"
            aria-label="Copy voice settings"
            data-ws-voiceURI=${escapeHtml(id)}
            onclick="window.parent.appMethods.copyVoice(this); event.stopPropagation();">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                style="pointer-events:none">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            </button>
    </div>
    </header>
            <div class="tags-container">

            <div class="tags-row">
                <span class="tag tag-voice">${escapeHtml(pillText)}</span>
            </div>

            ${scenarios.length ? `
                <div class="tags-row">
                ${scenarios.map(s =>
            `<span class="tag tag-scenario">${escapeHtml(s)}</span>`
        ).join("")}
                </div>
            ` : ""}

            ${personalities.length ? `
                <div class="tags-row">
                ${personalities.map(p =>
            `<span class="tag tag-personality">${escapeHtml(p)}</span>`
        ).join("")}
                </div>
            ` : ""}

            </div>
                </article>
                `;
    }).join("");

    console.log("Rendering finished, hiding loader...");
    if (typeof window.hideLoader === 'function') {
        window.hideLoader();
    }
}


function getLanguageBadgeData(voices) {
    const localesMap = new Map();

    voices.forEach(v => {
        if (!localesMap.has(v.Locale)) {
            localesMap.set(v.Locale, v.LocaleName || v.Locale);
        }
    });

    const locales = Array.from(localesMap.values());

    return {
        mainLanguage: locales[0],
        extraCount: Math.max(0, locales.length - 1)
    };
}

function stringToGradient(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    const hue = Math.abs(hash) % 360;

    const c1 = `hsl(${hue}, 90%, 62%)`;
    const c2 = `hsl(${(hue + 20) % 360}, 90%, 52%)`;

    return { c1, c2 };
}

function escapeHtml(str) {
    return String(str)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function getGenderIconPath(gender) {
    const g = (gender || "").toLowerCase();

    if (g === "female") return "./icons/hairstyle.svg";
    if (g === "male") return "./icons/man.svg";

    // fallback (pick one, or add a neutral icon if you have)
    return "./icons/man.svg";
}

document.addEventListener("DOMContentLoaded", () => {

    // Theme from URL param
    const params = new URLSearchParams(window.location.search);
    const theme = params.get('theme') || 'light';

    document.body.classList.remove('theme-light', 'theme-dark');
    document.body.classList.add(`theme-${theme}`);


    // Search listener
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            state.search = e.target.value.trim().toLowerCase();
            applyFiltersAndRender();
        });
    }

    // Gender buttons listener
    document.querySelectorAll(".gender-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            state.gender = btn.dataset.gender || "";
            document.querySelectorAll(".gender-btn").forEach(b => b.classList.remove("is-active"));
            btn.classList.add("is-active");
            applyFiltersAndRender();
        });
    });

    // Sort select listener
    const sortSelect = document.getElementById("sortSelect");
    if (sortSelect) {
        sortSelect.addEventListener("change", (e) => {
            state.sort = e.target.value || "rec";
            applyFiltersAndRender();
        });
    }

    // ✅ pinnedOnly checkbox listener
    const pinnedOnlyEl = document.getElementById("pinnedOnly");
    if (pinnedOnlyEl) {
        pinnedOnlyEl.addEventListener("change", (e) => {
            state.pinnedOnly = e.target.checked;
            applyFiltersAndRender();
        });
    }

    const grid = document.getElementById("voicesGrid");

    if (grid) {
        grid.addEventListener("click", async (e) => {
            console.log("CLICK TARGET:", e.target);
            console.log("CLOSEST BUTTON:", e.target.closest("button"));
            console.log("CLOSEST PLAY:", e.target.closest("button[data-play]"));
            // PIN (toggle)
            const pinBtn = e.target.closest("[data-pin]");
            if (pinBtn) {
                e.stopPropagation();
                const id = pinBtn.dataset.pin;

                if (state.pinned.has(id)) {
                    state.pinned.delete(id);
                } else {
                    state.pinned.add(id);
                }

                localStorage.setItem(
                    "pinnedVoices",
                    JSON.stringify([...state.pinned])
                );

                applyFiltersAndRender();
                return;
            }

            // COPY
            const copyBtn = e.target.closest("[data-copy]");
            if (copyBtn) {
                e.stopPropagation();

                const voiceId = copyBtn.dataset.copy;

                try {
                    await navigator.clipboard.writeText(voiceId);
                    pulseButton(copyBtn);
                    alert("Copied to clipboard:\n\n" + voiceId);
                } catch (err) {
                    alert("Failed to copy to clipboard");
                    console.error(err);
                }

                return;
            }

            // SELECT VOICE (toggle)
            const card = e.target.closest(".voice-card");
            if (!card) return;

            const id = card.dataset.voiceId;

            // toggle selection
            if (state.selectedVoiceId === id) {
                state.selectedVoiceId = null;
                localStorage.removeItem("selectedVoiceId");
            } else {
                state.selectedVoiceId = id;
                localStorage.setItem("selectedVoiceId", id);
            }

            // Update save button state
            const saveBtn = document.getElementById("saveBtn");
            if (saveBtn) {
                saveBtn.disabled = !state.selectedVoiceId;
            }

            applyFiltersAndRender();
        });
    }

    // --- Save Button Logic ---
    const saveBtn = document.getElementById("saveBtn");
    if (saveBtn) {
        saveBtn.addEventListener("click", () => {
            if (!state.selectedVoiceId) return;

            // 1. Prepare full URI for Azure engine
            const voiceURI ="azure." + state.selectedVoiceId;
            const parentMethods = window.parent.appMethods;

            // 2. Execute app selection logic
            if (parentMethods && typeof parentMethods.setVoiceUriDirectly === "function") {
                // Direct update of engine and player label
                console.log("Setting voice URI directly via parent method:", voiceURI);
                parentMethods.setVoiceUriDirectly(voiceURI);

            // Close modal via app method
                if (typeof window.parent.closeVoiceGalleryModal === "function") {
                    window.parent.closeVoiceGalleryModal();
            }

            } else {
                // Fallback: Message passing and window close
                window.opener?.postMessage({ type: "VOICE_SELECTED", voiceURI }, "*");
                window.close();
            }
        });
    }

    // --- Initialize ---
    loadVoices().catch(err => {
        console.error(err);
        const grid = document.getElementById("voicesGrid");
        if (grid) grid.textContent = "Failed to load voices. Check Console.";
    });
});

// --- UI Helpers ---
function pulseButton(btn, ms = 350) {
    btn.classList.add("is-active");
    setTimeout(() => btn.classList.remove("is-active"), ms);
}