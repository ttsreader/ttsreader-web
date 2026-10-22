# Kindle OCR frame (signed-in Kindle Cloud Reader books)

Signed-in Kindle books on read.amazon.com carry no text in the page, only page images (measured 2026-10-02; see
`src/content-script/kindle/README.md`). This folder is the extension page that recognizes those images, on the
user's machine. The Kindle reader adds `frame.html` to read.amazon.com in a hidden frame, and talks to it over a
MessagePort (`src/content-script/kindle/kindleOcrClient.js`).

Copied into the build as is (Vite `public/`). Nothing here is fetched from the network.

| File | What | From |
|---|---|---|
| `frame.html`, `frame.js` | Ours: the frame and its protocol | — |
| `tesseract.min.js` | Tesseract.js 7.0.0 browser build | npm `tesseract.js@7.0.0` `dist/` |
| `worker.min.js` | Tesseract.js 7.0.0 worker | npm `tesseract.js@7.0.0` `dist/` |
| `core/tesseract-core-simd-lstm.wasm.js` | Tesseract engine, WebAssembly SIMD, LSTM only | npm `tesseract.js-core@7.0.0` |
| `lang/eng.traineddata.gz` | English model, `4.0.0_best_int` | npm `@tesseract.js-data/eng@1.0.0` |
| `licenses/` | Apache-2.0 licences of the above | — |
| `models.json` | Pinned list of the downloadable models: `{ version, base, models: { code: { path, bytes, sha256 } } }` | `scripts/kindle-ocr-models.mjs` |

SHA-256 (2026-10-02):

    000c27d9cd0def655f77b36c72a389c0ab13793aa31cb4d7aab56d09c0afbc7e  tesseract.min.js
    576b7df7e3393e137e51849357c9adb53fe7ac1bb69bfa06cf3d61520f182c6d  worker.min.js
    c58b46a4c796c0b8afccf77591d5b875b6896b45d402bbce8caa6f5362447b38  core/tesseract-core-simd-lstm.wasm.js
    45b4cb346724ac1774f1c36f42f182b887bcdb28ebe63e6fff90ac41f3fcff91  lang/eng.traineddata.gz

Size: 6.7 MB. Only the SIMD engine is shipped (`frame.js` names it, so Tesseract does not pick another); WebAssembly
SIMD has been in Chrome since 91.

The manifest needs `'wasm-unsafe-eval'` for extension pages: without it, the engine never starts and never reports an
error (measured), which is why every call from the content script has a timeout.

Accuracy and speed, measured 2026-10-02 on 14 pages of the public sample, scored against Amazon's own text layer:
3.7% word error with one pass per column, before joining line-end hyphens (122 of the 159 errors); 1.7 s per two-column
page in headless Chrome 148 on Ronen's Mac.

## Other languages (downloaded once)

- **Where they come from.** `models.json` pins 54 models: `@tesseract.js-data/<code>/4.0.0_best_int`, 0.4–3.1 MB
  each, 93.6 MB in all.
  - They're downloaded from `base`, our host, never from a third party at run time.
  - Each is checked for the pinned size and SHA-256. A mismatch is refused and never stored (measured in Chrome).
  - It's stored in Tesseract.js's own IndexedDB cache (`keyval-store`), and the engine runs `cacheMethod: "readOnly"`,
    so it reads only what `frame.js` verified.
  - Measured in Chrome: after the first download, a fresh frame loads the model from storage with the server stopped.
  - `navigator.storage.persisted()` was false in headless Chrome, so survival under storage pressure is unverified.
- **Ronen's step: hosting.**
  1. Run `node scripts/kindle-ocr-models.mjs --base https://<host>/kindle-ocr-models/1/`.
  2. Upload `dist/kindle-ocr-models/1/` to that host.
  3. Set `Access-Control-Allow-Origin` on the host: `*`, or the extension's origin.

  Until `base` is set, only English works; other languages say "Reading Kindle pages in <Language> isn't
  available yet."
