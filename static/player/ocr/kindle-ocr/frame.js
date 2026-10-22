// TTSReader: OCR for Kindle Cloud Reader pages that have no text layer (signed-in books; see
// src/content-script/kindle/README.md).
//
// This page runs inside the extension, in a hidden frame that the Kindle reader adds to read.amazon.com. So Tesseract's
// worker, its WebAssembly and the English model all load from the extension's own files (this folder; see README.md).
// It recognizes the page images it is sent and answers with words and their boxes. Nothing leaves the machine — except
// a one-time download of a language model other than English, from the host in models.json (data, not code), checked
// against the size and SHA-256 pinned there before it is stored.
//
// Protocol: the embedding page sends {type: CONNECT} with a MessagePort; everything else goes over that port.
//   → {id, type: "warmup"}                                    ← {id, ok, ms}
//   → {id, type: "prepare", model}                            ← {type: "progress", id, model, loaded, total}…
//                                                             ← {id, ok, ms, source: "bundled" | "cache" | "download"}
//   → {id, type: "recognize", image: Blob, rects: [{left, top, width, height}, …], model}
//                                                             ← {id, ok, ms, columns: [{rect, paragraphs}]}
//   Failures: {id, ok: false, error, code}, code one of unsupported | unavailable (no model host set) | download |
//   integrity | storage | storageFull | engine.
// Columns are recognized one rectangle at a time, in the order given: Tesseract reads straight across a two-column page
// otherwise (measured 2026-10-02: 80% of words out of order on the public sample, 3.7% with one rectangle per column).
//
//
// The engine (Tesseract, the models, recognition) is ./engine.js, shared with the PDF reader frame.

import { getWorker, prepare, recognize } from "./engine.js"

const PARENT_ORIGINS = new Set(["https://read.amazon.com"])
const CONNECT = "ttsreader-kindle-ocr/connect"

window.addEventListener("message", (event) => {
    if (!PARENT_ORIGINS.has(event.origin) || event.data?.type !== CONNECT || !event.ports?.[0]) return
    const port = event.ports[0]
    port.onmessage = async ({ data }) => {
        if (!data || typeof data.id !== "number") return
        const started = performance.now()
        const ms = () => Math.round(performance.now() - started)
        try {
            if (data.type === "warmup") {
                await getWorker()
                port.postMessage({ id: data.id, ok: true, ms: ms() })
            } else if (data.type === "prepare") {
                const { source } = await prepare(data.model, (loaded, total) => {
                    port.postMessage({ type: "progress", id: data.id, model: data.model, loaded, total })
                })
                port.postMessage({ id: data.id, ok: true, ms: ms(), source })
            } else if (data.type === "recognize") {
                const columns = await recognize(data)
                port.postMessage({ id: data.id, ok: true, ms: ms(), columns })
            } else {
                port.postMessage({ id: data.id, ok: false, error: "unknown request" })
            }
        } catch (error) {
            port.postMessage({ id: data.id, ok: false, error: String(error?.message || error), code: error?.code || "engine" })
        }
    }
    port.postMessage({ type: "ready" })
})
