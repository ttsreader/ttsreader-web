# Export a post to PDF

Turns any post — a page bundle (`content/en/blog/<post>/index.md` + its images) or a standalone
`.md` — into a shareable/printable PDF with a branded cover, all images embedded, and the alt text
of each image as its caption.

Used for the iPhone launch post (`ttsreader-for-iphone`): 19 screenshots → a 12-page A4 PDF.

## Run it

```bash
cd ~/Development/Projects/TTSReader/ttsreader_hugo_doks_site
python3 ~/.claude/skills/md-to-pdf/scripts/md2pdf.py content/en/blog/<post>/index.md \
        --logo static/player@v3.13/logo_512.png
```

The PDF lands on the **Desktop**, named after the post. In Claude Code you can just say
*"make a PDF of this post"* — it's wired up as the `md-to-pdf` skill.

### Options

| Flag | Default | What it does |
|---|---|---|
| `--out FILE` | `~/Desktop/<post>.pdf` | where to write |
| `--logo FILE` | none | image for the cover + end card |
| `--page` | `a4` | `a4` or `letter` |
| `--image-width MM` | `128` | figure width; 128mm fits two 4:3 screenshots per A4 page |
| `--one-per-page` | off | one figure per page, larger — poster style |
| `--no-cover` | off | skip the title page |
| `--strict` | off | exit non-zero if any image can't be found |
| `--keep-html` | off | keep the intermediate HTML to tweak the CSS |

## Why it does NOT write into the post folder

A PDF sitting next to `index.md` would become a Hugo **page resource** and get published with the
site. That's why the default output is the Desktop. If you *want* it published at the post's URL,
move it into the bundle deliberately.

## How it works (and its limits)

Markdown → HTML → **headless Google Chrome** → PDF. This machine has no pandoc, wkhtmltopdf or
weasyprint; Chrome's print engine handles the paged-media CSS (page-break control, `@page`) fine.

Images are **inlined as base64 data URIs**, so the PDF can't come out with holes where pictures
should be. Paths resolve both ways used on this site: relative filenames against the post's own
folder (page bundles), and `/images/...` against `static/` (standalone posts like
`copyright.md`, `kindle.md`). The `![alt](src 'title')` form works — the title becomes the caption
when there's no alt text.

Headings, lists, code blocks, blockquotes and tables are all styled. **Hugo shortcodes are not
rendered** (`{{< … >}}` passes through as literal text) — no post uses them today.

The script prints what it embedded, e.g. `19 figures · 19 images embedded`, and names anything it
couldn't resolve. If you see `MISSING`, fix the path before sharing the file.

## Front matter it uses

`title`, `excerpt` (falls back to `description`), `date`, `contributors` — for the cover page. See
[write_blog.md](write_blog.md) for the full front matter of a post.
