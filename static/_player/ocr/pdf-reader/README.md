# PDF reader frame (a PDF open in a Chrome tab)

Chrome draws a PDF in its own viewer, and the text is never in the page, so TTSReader reads the file itself.
- The content script fetches the bytes from the tab, as a same-origin request with the user's cookies.
- This folder's frame turns them into each page's text runs, or OCRs a scanned page.
- The shared core (`corePdf*`) lays the pages out and assembles the document: the same rules iOS and Android use.
- The text opens in the editor. See `src/content-script/pdf/README.md`.

## `pdfjs/`: pdf.js 5.3.93, vendored, copied into the build as is

| File | From (npm `pdfjs-dist@5.3.93`) | SHA-256 |
|---|---|---|
| `pdf.min.mjs` | `build/pdf.min.mjs` | `fe96c1c6e85369499948d99200e05f070c85a847adadc4c345a5588bb880527d` |
| `pdf.worker.min.mjs` | `build/pdf.worker.min.mjs` | `ff6f6b3f94ada9d398c1c48f2b50ce7b8adeaf014f395ae32d6c463ae2acd7a2` |
| `wasm/openjpeg.wasm` | `wasm/` (JPEG 2000 images, common in scans) | `cb031f36245b389e1f5bffc59d10eed35bb0f85d7368b46c3f0b462042ec8e9e` |
| `wasm/qcms_bg.wasm` | `wasm/` (colour profiles) | `6017eca5939cde1836e88e6d8cd27ae039246f206515ea4487bdfd0e3fb16e26` |
| `cmaps/` | `cmaps/` (text of CID-keyed fonts: CJK, some Hebrew/Arabic producers) | — |
| `standard_fonts/` | `standard_fonts/` (rendering pages whose fonts are not embedded, for OCR) | — |

- The size is 4.1 MB.
- The licence is Apache-2.0 (`LICENSE`, plus `wasm/LICENSE_*` for OpenJPEG and QCMS).
- Nothing is fetched from a CDN: the frame passes `cMapUrl`, `standardFontDataUrl`, `wasmUrl` and `workerSrc` as
  extension URLs.
- The no-WebAssembly fallback (`openjpeg_nowasm_fallback.js`) isn't shipped, since the extension allows
  `'wasm-unsafe-eval'`.
