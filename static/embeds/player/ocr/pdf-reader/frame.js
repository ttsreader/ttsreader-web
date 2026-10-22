// TTSReader: reads a PDF open in a Chrome tab — the engine half, in the extension's own origin (a hidden frame the
// content script adds to the PDF tab; see src/content-script/pdf/README.md).
//
// This frame DECIDES nothing (clone decision, 2026-10-02): it opens the bytes it is given and answers questions about
// them — a page's raw text runs, a page rendered and recognised. Whether a page needs OCR, which way up a scan is,
// the columns, the paragraphs, the document: all decided by the content script with the shared core, the rules iOS
// and Android use. Nothing leaves the machine; Tesseract and its models are the Kindle OCR engine (../kindle-ocr/engine.js).
//
// Who may use it: the frame is web-accessible with use_dynamic_url, so only the extension's own content script — which
// knows the session's dynamic URL — can load it; a page embedding the static URL is refused (measured, Chrome 153).
// And it answers only its parent, once (below).
//
// Protocol: {type: CONNECT} with a MessagePort, then over the port:
//   → {id, type: "open", data: ArrayBuffer}                 ← {id, ok, pages}
//   → {id, type: "textContent", page}                         ← {id, ok, view, items: [{str, dir, width, height, transform, hasEOL}]}
//   → {id, type: "render", page, scale, rotation, thumbScale} ← {id, ok, imageW, imageH, pageW, pageH, thumb: {width, height, data}}
//   → {id, type: "recognize", page, model, rects}             ← {id, ok, columns}        (the page last rendered)
//   → {id, type: "countChars", page, model, rotation, scale}  ← {id, ok, chars}          (orientation probe)
//   → {id, type: "prepare", model}                            ← {type: "progress", …}… then {id, ok, source}
//   → {id, type: "close"}                                     ← {id, ok}
//   Failures: {id, ok: false, error, code}: tooLarge | password | invalid | noDocument | engine, or the engine's codes.

import * as pdfjs from "./pdfjs/pdf.min.mjs"
import { prepare, recognize } from "../kindle-ocr/engine.js"

const CONNECT = "ttsreader-pdf-reader/connect"
const MAX_BYTES = 300 * 1024 * 1024
const MAX_PAGES = 5000
const MAX_RENDER_PIXELS = 40e6 // one page at RENDER_SCALE: an A0 poster would be 280 MP — refuse, do not crash
const CONFIDENT_WORD = 60

const PDFJS = new URL("./pdfjs/", import.meta.url).href
pdfjs.GlobalWorkerOptions.workerSrc = PDFJS + "pdf.worker.min.mjs"

const coded = (message, code) => Object.assign(new Error(message), { code })

let doc = null
let rendered = null // { page, blob }

async function open(data) {
    if (!(data instanceof ArrayBuffer)) throw coded("no PDF data", "invalid")
    if (data.byteLength > MAX_BYTES) throw coded(`${data.byteLength} bytes`, "tooLarge")
    await close()
    try {
        doc = await pdfjs.getDocument({
            data: new Uint8Array(data),
            cMapUrl: PDFJS + "cmaps/",
            cMapPacked: true,
            standardFontDataUrl: PDFJS + "standard_fonts/",
            wasmUrl: PDFJS + "wasm/",
            isEvalSupported: false,
        }).promise
    } catch (error) {
        throw coded(String(error?.message || error), error?.name === "PasswordException" ? "password" : "invalid")
    }
    if (doc.numPages > MAX_PAGES) throw coded(`${doc.numPages} pages`, "tooLarge")
    return { pages: doc.numPages } // nothing more up front: page 1 is read as soon as the document opens
}

async function page(n) {
    if (!doc) throw coded("no document open", "noDocument")
    if (!Number.isInteger(n) || n < 1 || n > doc.numPages) throw coded(`no page ${n}`, "invalid")
    return doc.getPage(n)
}

async function textContent(n) {
    const p = await page(n)
    const content = await p.getTextContent()
    return {
        view: p.view,
        items: content.items
            .filter((i) => typeof i.str === "string")
            .map((i) => ({ str: i.str, dir: i.dir, width: i.width, height: i.height, transform: i.transform, hasEOL: i.hasEOL })),
    }
}

/** The page drawn as it is shown (its /Rotate, plus `rotation`), at `scale` pixels per point. */
async function draw(n, scale, rotation) {
    const p = await page(n)
    const viewport = p.getViewport({ scale, rotation: (p.rotate + (rotation | 0)) % 360 })
    if (viewport.width * viewport.height > MAX_RENDER_PIXELS) throw coded("page too large to recognise", "tooLarge")
    const canvas = document.createElement("canvas")
    canvas.width = Math.ceil(viewport.width)
    canvas.height = Math.ceil(viewport.height)
    const context = canvas.getContext("2d", { willReadFrequently: true })
    context.fillStyle = "#fff" // a scan's transparency is paper, as both apps fill it
    context.fillRect(0, 0, canvas.width, canvas.height)
    // As pdf.js renders pages for printing: this frame is never drawn, so it gets no animation frames (measured
    // 2026-10-02 in a PDF tab: requestAnimationFrame never ran; timers did), and display rendering waits on them — every
    // scanned page timed out. Print rendering needs none.
    await p.render({ canvasContext: context, viewport, intent: "print" }).promise
    const unscaled = p.getViewport({ scale: 1, rotation: (p.rotate + (rotation | 0)) % 360 })
    return { canvas, context, pageW: unscaled.width, pageH: unscaled.height }
}

async function render(n, scale, rotation, thumbScale = 0.25) {
    const { canvas, pageW, pageH } = await draw(n, scale, rotation)
    const blob = await new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(coded("could not draw the page", "engine"))), "image/png"))
    rendered = { page: n, blob }
    const thumb = document.createElement("canvas")
    thumb.width = Math.max(1, Math.round(canvas.width * thumbScale))
    thumb.height = Math.max(1, Math.round(canvas.height * thumbScale))
    const tc = thumb.getContext("2d", { willReadFrequently: true })
    tc.drawImage(canvas, 0, 0, thumb.width, thumb.height)
    const pixels = tc.getImageData(0, 0, thumb.width, thumb.height)
    return { imageW: canvas.width, imageH: canvas.height, pageW, pageH, thumb: { width: pixels.width, height: pixels.height, data: pixels.data } }
}

async function recognizeRendered(n, model, rects) {
    if (!rendered || rendered.page !== n) throw coded(`page ${n} is not rendered`, "invalid")
    return recognize({ image: rendered.blob, rects, model })
}

async function countChars(n, model, rotation, scale) {
    const { canvas } = await draw(n, scale, rotation)
    const blob = await new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(coded("could not draw the page", "engine"))), "image/png"))
    const columns = await recognize({ image: blob, rects: [{ left: 0, top: 0, width: canvas.width, height: canvas.height }], model })
    let chars = 0
    for (const c of columns) for (const p of c.paragraphs) for (const l of p.lines) for (const w of l.words) {
        if ((w.confidence ?? 0) >= CONFIDENT_WORD) chars += String(w.text || "").trim().length
    }
    return chars
}

async function close() {
    rendered = null
    if (doc) {
        try { await doc.destroy() } catch (_e) { /* already gone */ }
        doc = null
    }
}

// One connection, from the page that holds this frame (where our content script runs), and only once. use_dynamic_url
// stops other pages from LOADING this frame; it does not stop another window that can reach it (window.open, then
// w[i]) from messaging it — measured 2026-10-02 (e2e frame-hijack): such a window connected and was answered.
let connected = false
window.addEventListener("message", (event) => {
    if (connected || event.source !== window.parent || window.parent === window) return
    if (event.data?.type !== CONNECT || !event.ports?.[0]) return
    connected = true
    const port = event.ports[0]
    port.onmessage = async ({ data }) => {
        if (!data || typeof data.id !== "number") return
        const reply = (body) => port.postMessage({ id: data.id, ok: true, ...body })
        try {
            switch (data.type) {
                case "open": return reply(await open(data.data))
                case "textContent": return reply(await textContent(data.page))
                case "render": {
                    const r = await render(data.page, data.scale, data.rotation, data.thumbScale)
                    return port.postMessage({ id: data.id, ok: true, ...r }, [r.thumb.data.buffer])
                }
                case "recognize": return reply({ columns: await recognizeRendered(data.page, data.model, data.rects) })
                case "countChars": return reply({ chars: await countChars(data.page, data.model, data.rotation, data.scale) })
                case "prepare": {
                    const { source } = await prepare(data.model, (loaded, total) => port.postMessage({ type: "progress", id: data.id, model: data.model, loaded, total }))
                    return reply({ source })
                }
                case "close": await close(); return reply({})
                default: return port.postMessage({ id: data.id, ok: false, error: "unknown request", code: "invalid" })
            }
        } catch (error) {
            port.postMessage({ id: data.id, ok: false, error: String(error?.message || error), code: error?.code || "engine" })
        }
    }
    port.postMessage({ type: "ready" })
})
