// TTSReader: the OCR engine shared by the extension's frames — the Kindle OCR frame (frame.js, this folder) and the PDF
// reader frame (public/pdf-reader/frame.js). Moved out of frame.js unchanged (2026-10-02), so the two frames cannot
// drift: one Tesseract worker setup, one pinned model list, one download-verify-store path, one cache layout.
//
// ⚠️ A change here changes both frames: run e2e/kindle/ocr-frame.e2e.mjs (and the PDF frame's tests) after it.
//
// Files resolve from THIS module's URL, not the page's, so a frame in another folder finds them.
//
// Where a downloaded model is kept: Tesseract.js's own cache (IndexedDB "keyval-store"/"keyval", the idb-keyval
// defaults), under its key "<cachePath>/<model>.traineddata". The worker runs with cacheMethod "readOnly": it reads the
// copy this module verified and stored, and never downloads or writes anything itself. (Handing it the bytes as
// {code, data} is broken in tesseract.js 7.0.0 when switching language: `initialize` joins `l.data` instead of `l.code`.)
//
// Errors carry a code: unsupported | unavailable (no model host set) | download | integrity | storage | storageFull | engine.

/* global Tesseract */

const HERE = new URL("./", import.meta.url).href

const MAX_RECTS = 4
export const BUNDLED = "eng"
const DOWNLOAD_TIMEOUT_MS = 120000
const DB_NAME = "keyval-store"
const STORE = "keyval"

export const coded = (message, code) => Object.assign(new Error(message), { code })

// ---- the pinned model list ----

let listPromise = null
function modelList() {
    if (!listPromise) {
        listPromise = fetch(new URL("./models.json", HERE))
            .then((r) => r.json())
            .catch((error) => {
                listPromise = null
                throw error
            })
    }
    return listPromise
}

const cachePathOf = (list) => `ttsreader-kindle-ocr/${list.version}`

// ---- IndexedDB, laid out as idb-keyval lays it out (what Tesseract.js reads) ----

function idb(mode, use) {
    return new Promise((resolve, reject) => {
        const open = indexedDB.open(DB_NAME)
        open.onupgradeneeded = () => open.result.createObjectStore(STORE)
        open.onerror = () => reject(open.error)
        open.onsuccess = () => {
            const db = open.result
            const tx = db.transaction(STORE, mode)
            const request = use(tx.objectStore(STORE))
            tx.oncomplete = () => {
                db.close()
                resolve(request?.result)
            }
            tx.onerror = tx.onabort = () => {
                db.close()
                reject(tx.error)
            }
        }
    })
}
const idbGet = (key) => idb("readonly", (store) => store.get(key))
const idbSet = (key, value) => idb("readwrite", (store) => store.put(value, key))
const idbDelete = (key) => idb("readwrite", (store) => store.delete(key))

const hex = (buffer) => [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("")

// ---- preparing a model: bundled, stored, or downloaded once ----

const preparing = new Map()

export function prepare(model, onProgress = () => {}) {
    if (model === BUNDLED) return Promise.resolve({ source: "bundled" })
    if (!preparing.has(model)) {
        preparing.set(model, prepareOnce(model, onProgress).finally(() => preparing.delete(model)))
    }
    return preparing.get(model)
}

async function prepareOnce(model, onProgress) {
    const list = await modelList()
    const entry = list.models?.[model]
    if (!entry) throw coded(`no model for ${model}`, "unsupported")
    const key = `${cachePathOf(list)}/${model}.traineddata`
    if ((await idbGet(`${key}.sha256`)) === entry.sha256 && (await idbGet(key))) return { source: "cache" }
    if (!list.base) throw coded("model downloads are not set up (models.json has no base)", "unavailable")

    try { navigator.storage?.persist?.() } catch (_e) { /* best effort */ }
    // A stalled download must end, or every later prepare() would wait on it until the page reloads.
    const abort = new AbortController()
    const timer = setTimeout(() => abort.abort(), DOWNLOAD_TIMEOUT_MS)
    try {
        return await download(entry, key, abort.signal, onProgress)
    } catch (error) {
        if (abort.signal.aborted) throw coded(`${entry.path}: download timed out`, "download")
        throw error
    } finally {
        clearTimeout(timer)
    }
}

async function download(entry, key, signal, onProgress) {
    const list = await modelList()
    let response
    try {
        response = await fetch(new URL(entry.path, list.base), { cache: "no-store", signal })
    } catch (error) {
        throw coded(`${entry.path}: ${error?.message || error}`, "download")
    }
    if (!response.ok || !response.body) throw coded(`${entry.path}: HTTP ${response.status}`, "download")

    const bytes = new Uint8Array(entry.bytes)
    let at = 0
    let lastProgress = 0
    const reader = response.body.getReader()
    for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        if (at + value.length > entry.bytes) throw coded(`${entry.path}: larger than pinned`, "integrity")
        bytes.set(value, at)
        at += value.length
        if (Date.now() - lastProgress > 200) {
            lastProgress = Date.now()
            onProgress(at, entry.bytes)
        }
    }
    onProgress(at, entry.bytes)
    if (at !== entry.bytes) throw coded(`${entry.path}: ${at} of ${entry.bytes} bytes`, "integrity")
    if (hex(await crypto.subtle.digest("SHA-256", bytes)) !== entry.sha256) throw coded(`${entry.path}: checksum mismatch`, "integrity")

    try {
        await idbSet(key, bytes)
        await idbSet(`${key}.sha256`, entry.sha256)
    } catch (error) {
        throw coded(`${entry.path}: ${error?.message || error}`, error?.name === "QuotaExceededError" ? "storageFull" : "storage")
    }
    return { source: "download" }
}

// ---- the engine ----

let workerPromise = null
let currentModel = BUNDLED

export function getWorker() {
    if (!workerPromise) {
        workerPromise = modelList().then((list) => {
            const base = HERE
            return Tesseract.createWorker(BUNDLED, Tesseract.OEM.LSTM_ONLY, {
                workerPath: base + "worker.min.js",
                corePath: base + "core/tesseract-core-simd-lstm.wasm.js",
                langPath: base + "lang",
                workerBlobURL: false,
                cacheMethod: "readOnly",
                cachePath: cachePathOf(list),
                gzip: true,
            })
        }).catch((error) => {
            workerPromise = null
            throw coded(String(error?.message || error), "engine")
        })
    }
    return workerPromise
}

async function workerFor(model) {
    await prepare(model)
    const worker = await getWorker()
    if (currentModel !== model) {
        try {
            await worker.reinitialize(model)
        } catch (error) {
            // A stored copy the engine cannot use: forget it, so the next attempt downloads it again.
            const list = await modelList()
            await idbDelete(`${cachePathOf(list)}/${model}.traineddata.sha256`).catch(() => {})
            throw coded(String(error?.message || error), "engine")
        }
        currentModel = model
    }
    return worker
}

const box = (b) => ({ x0: b.x0, y0: b.y0, x1: b.x1, y1: b.y1 })

function simplify(blocks) {
    return (blocks || []).flatMap((block) => (block.paragraphs || []).map((paragraph) => ({
        bbox: box(paragraph.bbox),
        lines: (paragraph.lines || []).map((line) => ({
            bbox: box(line.bbox),
            // The line's baseline as Tesseract measured it (carries the page's tilt; the PDF reader deskews with it).
            baseline: line.baseline ? box(line.baseline) : null,
            words: (line.words || []).map((word) => ({ text: word.text, confidence: word.confidence, bbox: box(word.bbox) })),
        })),
    })))
}

const isRect = (r) => r && ["left", "top", "width", "height"].every((k) => Number.isFinite(r[k])) && r.width > 0 && r.height > 0

export async function recognize({ image, rects, model = BUNDLED }) {
    if (!(image instanceof Blob)) throw new Error("image must be a Blob")
    if (!Array.isArray(rects) || !rects.length || rects.length > MAX_RECTS || !rects.every(isRect)) throw new Error("bad rects")
    const worker = await workerFor(model)
    const columns = []
    for (const rect of rects) {
        const { data } = await worker.recognize(image, { rectangle: rect }, { blocks: true, text: false })
        columns.push({ rect, paragraphs: simplify(data.blocks) })
    }
    return columns
}
