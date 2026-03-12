const state = {
    allVoices: [],
    language: "en",
    accent: "US",
    speed: 1.0, 
    selectedVoiceId: "en-US-AndrewMultilingualNeural",
    search: "",
    gender: "",
    sort: "az",
    pinnedOnly: false,
    pinned: new Set(
        JSON.parse(localStorage.getItem("pinnedVoices") || "[]")
    ),
};

const showLanguage = false;
let showCopyButton = true;

let popularityMap = {};

async function loadPopularity() {
  const res = await fetch("voiceGalleryModal/popularity.json", { cache: "no-store" });
  if (res.ok) {
    popularityMap = await res.json();
  }
}

// Approximate population (millions) by country code, for sorting accents
const countryPopulation = {
    "CN": 1425, "IN": 1428, "US": 335, "ID": 277, "PK": 230, "NG": 224, "BR": 216,
    "BD": 173, "RU": 144, "MX": 128, "ET": 126, "JP": 125, "PH": 117, "EG": 105,
    "VN": 99, "IR": 87, "TR": 85, "DE": 84, "TH": 72, "GB": 67, "TZ": 65,
    "ZA": 60, "IT": 59, "MM": 54, "KE": 55, "KR": 52, "CO": 52, "ES": 48,
    "AR": 46, "DZ": 45, "IQ": 44, "AF": 42, "CA": 40, "PL": 38, "SA": 37,
    "UA": 37, "MA": 37, "UZ": 36, "MY": 34, "GH": 34, "PE": 34, "NP": 30,
    "VE": 29, "AU": 26, "TW": 24, "LK": 22, "RO": 19, "CL": 19, "KZ": 19,
    "NL": 18, "EC": 18, "GT": 18, "SO": 18, "KH": 17, "BE": 12, "TN": 12,
    "BO": 12, "CZ": 11, "DO": 11, "JO": 11, "GR": 10, "PT": 10, "AZ": 10,
    "SE": 10, "HU": 10, "AE": 10, "HN": 10, "IL": 10, "AT": 9, "CH": 9,
    "LA": 8, "RS": 7, "BG": 7, "HK": 7, "PY": 7, "NI": 7, "SG": 6, "DK": 6,
    "FI": 6, "SV": 6, "NO": 5, "CR": 5, "IE": 5, "NZ": 5, "SK": 5, "OM": 5,
    "PS": 5, "LB": 5, "KW": 4, "PA": 4, "GE": 4, "HR": 4, "UY": 4,
    "BA": 3, "AM": 3, "LT": 3, "PR": 3, "QA": 3, "AL": 3, "MN": 3,
    "LV": 2, "SI": 2, "MK": 2, "BH": 2, "EE": 1, "MT": 1, "IS": 1
};

// Called by parent (App.js) when pinnedVoices changes externally
function refreshPinnedVoices() {
    state.pinned = new Set(JSON.parse(localStorage.getItem("pinnedVoices") || "[]"));
    if (voicesLoaded) applyFiltersAndRender();
}

let voicesLoaded = false;
let accentFromUrl = false;
function getCurrentLocale() {
    if (!state.language || !state.accent) return "";
    return `${state.language}-${state.accent}`;
}
function parseLocaleName(localeName) {
    if (!localeName) return { language: "", accent: "" };

    const match = localeName.match(/^(.+?)\s*\((.+?)\)$/);

    if (!match) {
        return { language: localeName, accent: "" };
    }

    return {
        language: match[1], // English
        accent: match[2]    // United States
    };
}

function isNativeVoice(voice, selectedLocale) {
    return voice.Locale === selectedLocale;
}

function resolveAccentForLanguage(language) {
    if (accentFromUrl) return;

    if (language === "en") {
        state.accent = localStorage.getItem("accent_en") || "US";
        return;
    }

    const savedAccent = localStorage.getItem(`accent_${language}`);
    if (savedAccent) {
        state.accent = savedAccent;
        return;
    }

    const voice = state.allVoices.find(v =>
        typeof v.Locale === "string" &&
        v.Locale.startsWith(language + "-")
    );

    if (voice) {
        state.accent = voice.Locale.split("-")[1];
    }
}

function updateUrlParams() {
    const params = new URLSearchParams(window.location.search);
    params.set("locale", getCurrentLocale());
    params.set("rate", state.speed);

    history.replaceState(null, "", "?" + params.toString());
}

async function loadVoices() {
    const res = await fetch("voiceGalleryModal/azure_voices_list_20251225.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to load JSON: ${res.status}`);

    const voices = await res.json(); // array
    state.allVoices = voices;

    // Build language dropdown from the data
    populateLanguageSelect(voices);
    resolveAccentForLanguage(state.language);
    populateAccentSelect();
    // Initial render
    applyFiltersAndRender();
    voicesLoaded = true;
}

function populateLanguageSelect(voices) {
    const select = document.getElementById("languageSelect");
    if (!select) return;

    const map = new Map();

    for (const v of voices) {
        if (!v.Locale || !v.LocaleName) continue;

        const [langCode] = v.Locale.split("-");
        const { language: label } = parseLocaleName(v.LocaleName);

        if (!map.has(langCode)) {
            map.set(langCode, label);
        }
    }

    select.innerHTML = [...map.entries()]
        .sort((a, b) => a[1].localeCompare(b[1]))
        .map(([code, label]) =>
            `<option value="${escapeHtml(code)}">${escapeHtml(label)}</option>`
        )
        .join("");

    if (!map.has(state.language)) {
        state.language = map.keys().next().value || "";
    }

    select.value = state.language;

    select.onchange = e => {
        state.language = e.target.value;
        state.accent = state.language === "en" ? "US" : "";
        populateAccentSelect();
        applyFiltersAndRender();
        updateUrlParams();
        notifyParentLocaleChange();
    };
}
function populateAccentSelect() {
    const select = document.getElementById("accentSelect");
    if (!select) return;

    const accents = [];
    const seen = new Set();

    state.allVoices.forEach(v => {
        if (!v.Locale) return;

        const [lang, accentCode] = v.Locale.split("-");
        if (lang !== state.language) return;
        if (seen.has(accentCode)) return;

        let label = accentCode;

        // Extract accent name from LocaleName: text inside parentheses
        if (v.LocaleName) {
            const match = v.LocaleName.match(/\(([^)]+)\)/);
            if (match) {
                label = match[1]; // e.g. "Germany"
            }
        }

        seen.add(accentCode);
        accents.push({ code: accentCode, label });
    });

    // Priority overrides for specific accents
    const accentPriority = {
        "en-US": 9999, "en-GB": 9998,
        "es-ES": 9999, "es-MX": 9998,
        "pt-BR": 9999, "pt-PT": 9998
    };
    const getScore = (code) => {
        const fullLocale = state.language + "-" + code;
        if (accentPriority[fullLocale] !== undefined) return accentPriority[fullLocale];
        return countryPopulation[code] || 0;
    };

    // Sort accents by priority/population descending
    accents.sort((a, b) => getScore(b.code) - getScore(a.code));

    // Default accent logic (skip if accent was provided via URL param)
    if (accentFromUrl) {
        accentFromUrl = false;
    } else if (state.language === "en") {
        state.accent = "US";
    } else if (!state.accent && accents.length) {
        state.accent = accents[0].code;
    }

    select.innerHTML = accents
        .map(a =>
            `<option value="${escapeHtml(a.code)}">${escapeHtml(a.label)}</option>`
        )
        .join("");

    select.value = state.accent;
    select.onchange = e => onAccentChange(e.target.value);
}

function onAccentChange(newAccent) {
    state.accent = newAccent;

    // Persist user choice per language
    localStorage.setItem(
        `accent_${state.language}`,
        newAccent
    );

    applyFiltersAndRender();
    updateUrlParams();
    notifyParentLocaleChange();
}

function notifyParentLocaleChange() {
    const locale = getCurrentLocale();
    if (!locale) return;
    try { window.parent?.appMethods?.handleLanguageChange?.({ currentTarget: { value: locale } }); } catch(e) {}
}

let currentTestingVoiceId = null;

function handleTestVoiceClick(btn) {
    const card = btn.closest('.voice-card');
    const voiceId = card.getAttribute('data-voice-id');
    const fullUri = 'azure.' + voiceId;

    // If same voice is already playing, stop it
    if (currentTestingVoiceId === voiceId && card.classList.contains('isPlaying')) {
        card.classList.remove('isPlaying');
        currentTestingVoiceId = null;
        try { window.parent?.appMethods?.stopAnyTestOrOtherPlay?.(); } catch(e) {}
        return;
    }

    // Clear previous isPlaying from all cards
    document.querySelectorAll('.voice-card.isPlaying').forEach(el => el.classList.remove('isPlaying'));

    // Set attributes needed by parent's testVoice
    card.setAttribute('data-ws-voiceuri', fullUri);
    card.setAttribute('data-ws-voiceURI', fullUri);
    card.dataset.wsVoiceuri = fullUri;
    card.setAttribute('data-ws-audio-src', 'server');

    // Mark this card as playing
    card.classList.add('isPlaying');
    currentTestingVoiceId = voiceId;

    // Call parent testVoice
    try {
        if (window.parent?.appMethods?.testVoice) {
            window.parent.appMethods.testVoice(card, fullUri);
        }
    } catch(e) {}

    window.parent.postMessage({
        type: 'TEST_VOICE',
        voiceURI: fullUri,
        locale: getCurrentLocale(),
        rate: state.speed
    }, '*');
}

// Called by parent when test audio finishes
function clearTestingState() {
    document.querySelectorAll('.voice-card.isPlaying').forEach(el => el.classList.remove('isPlaying'));
    currentTestingVoiceId = null;
}

function applyFiltersAndRender() {
    console.log("language:", state.language);
    console.log("voices total:", state.allVoices.length);
    const selectedLocale = `${state.language}-${state.accent}`;

    let filtered = state.allVoices;
    filtered = filtered.filter(v => v.VoiceType === "Neural");

filtered = filtered.filter(v => {
    if (v.Locale === selectedLocale) return true;

    if (Array.isArray(v.SecondaryLocaleList)) {
        return v.SecondaryLocaleList.includes(selectedLocale);
    }

    return false;
});


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
    } else if (state.sort === "recommended") {
        const selectedLocale = `${state.language}-${state.accent}`;

        filtered = [...filtered].sort((a, b) => {
            const aIsNative = isNativeVoice(a, selectedLocale);
            const bIsNative = isNativeVoice(b, selectedLocale);
            // Native before Multilingual
            if (aIsNative !== bIsNative) {
                return aIsNative ? -1 : 1;
            }

            // Popularity (high → low)
            const aPopularity = popularityMap[a.ShortName] || 0;
            const bPopularity = popularityMap[b.ShortName] || 0;

            return bPopularity - aPopularity;
        });
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
    console.log("voices after filter:", filtered.length);

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
        const extra = secondary.filter(l => l && l !== v.Locale).length; 
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
            <button id="testBtn" class="sidebar-voice-btn voice-test-btn" title="Test voice"
                onclick="event.stopPropagation(); handleTestVoiceClick(this);"
                aria-label="Test voice">
                            <svg class="voice-test-play" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polygon points="5,3 19,12 5,21" />
                            </svg>
                            <svg class="voice-test-stop" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                                <rect x="4" y="4" width="16" height="16" rx="2" />
                            </svg>
            </button>
            ${showCopyButton ? `
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
            ` : ""}

    </div>
    </header>
            <div class="tags-container">

            ${showLanguage ? `
            <div class="tags-row">
                <span class="tag tag-voice">${escapeHtml(pillText)}</span>
            </div>
            ` : ""}

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
    const accents = new Set();

    voices.forEach(v => {
        if (!v.Locale) return;
        const [, accent] = v.Locale.split("-");
        if (accent) accents.add(accent);
    });

    const accentsArr = Array.from(accents);

    return {
        mainLanguage: state.language.toUpperCase(),
        extraCount: Math.max(0, accentsArr.length - 1)
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
    // Show copy button param
    const showCopyParam = params.get("showCopy");
    showCopyButton = showCopyParam !== "false";
if (!localStorage.getItem("language") && !params.get("locale")) {
    state.language = "en";
    state.accent = "US";
}

// localStorage overrides
const savedLanguage = localStorage.getItem("language");
if (savedLanguage) {
    state.language = savedLanguage;
}

const savedRate = parseFloat(localStorage.getItem("rate"));
if (!isNaN(savedRate)) {
    state.speed = savedRate;
}

// URL params override everything
const localeFromUrl = params.get("locale");
if (localeFromUrl) {
    if (localeFromUrl.includes("-")) {
        const [lang, accent] = localeFromUrl.split("-");
        state.language = lang;
        state.accent = accent;
        accentFromUrl = true;
    } else {
        state.language = localeFromUrl;
    }
}

const rateFromUrl = parseFloat(params.get("rate"));
if (!isNaN(rateFromUrl)) {
    state.speed = rateFromUrl;
}

const voiceFromUrl = params.get("voice");
if (voiceFromUrl) {
    state.selectedVoiceId = voiceFromUrl;
}
// Load popularity FIRST, then voices
loadPopularity()
    .then(() => {
        console.log("Popularity loaded:", popularityMap);
        return loadVoices();
    })
    .then(() => {
        const sortSelect = document.getElementById("sortSelect");
        state.sort = sortSelect?.value || "rec";

        applyFiltersAndRender();
        // Update speed UI AFTER voices & DOM are ready
        const speedValueEl = document.getElementById("speedValue");
        if (speedValueEl) {
            speedValueEl.textContent = state.speed.toFixed(1);
        }
    })
    .catch(err => {
        console.error(err);
        const grid = document.getElementById("voicesGrid");
        if (grid) grid.textContent = "Failed to load voices.";
    });


const speedMinus = document.getElementById("speedMinus");
const speedPlus = document.getElementById("speedPlus");
const speedValue = document.getElementById("speedValue");

function updateSpeedUI() {
    const el = document.getElementById("speedValue");
    if (el && Number.isFinite(state.speed)) {
        el.textContent = state.speed.toFixed(1);
    }
}


if (speedMinus && speedPlus && speedValue) {

    updateSpeedUI(); // initial render

    speedMinus.addEventListener("click", () => {
        state.speed = Math.max(0.5, state.speed - 0.1);
        state.speed = Number(state.speed.toFixed(1));
        localStorage.setItem("rate", state.speed);
        updateSpeedUI();
        updateUrlParams();
        try { window.parent?.appMethods?.setRateDirectly?.(state.speed); } catch(e) {}
    });

    speedPlus.addEventListener("click", () => {
        state.speed = Math.min(2.0, state.speed + 0.1);
        state.speed = Number(state.speed.toFixed(1));
        localStorage.setItem("rate", state.speed);
        updateSpeedUI();
        updateUrlParams();
        try { window.parent?.appMethods?.setRateDirectly?.(state.speed); } catch(e) {}
    });
}

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

    // pinnedOnly checkbox listener
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

                // Notify parent to update sidebar pin state
                try {
                    if (state.pinned.has(id)) {
                        window.parent?.appMethods?.pinVoice?.(id);
                    } else {
                        window.parent?.appMethods?.unpinVoice?.(null, id);
                    }
                } catch(e) {}

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
                window.parent.postMessage(
                    {
                        type: "VOICE_SETTINGS",
                        voiceURI,
                        rate: state.speed,
                        locale: getCurrentLocale()
                    },
                    "*"
                );


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
});

// --- UI Helpers ---
function pulseButton(btn, ms = 350) {
    btn.classList.add("is-active");
    setTimeout(() => btn.classList.remove("is-active"), ms);
}

const scrollBtn = document.getElementById('scrollTopBtn');
const scrollArea = document.querySelector('.scroll-area');

scrollArea.addEventListener('scroll', () => {
  if (scrollArea.scrollTop > 200) {
    scrollBtn.classList.add('is-visible');
  } else {
    scrollBtn.classList.remove('is-visible');
  }
});

scrollBtn.addEventListener('click', () => {
  scrollArea.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
});
