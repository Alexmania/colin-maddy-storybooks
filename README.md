# Colin & Maddy's Storybook Library

A password-gated storybook library on GitHub Pages, collecting every
Colin & Maddy picture book in one place: browse the catalog, tap a book,
read it, and press **Listen** for the narrated, auto-page-turning version.

- **Live site:** https://alexmania.github.io/colin-maddy-storybooks/
- **Password:** family password (SHA-256 hash checked in `gate.js`; the
  password itself is never stored in this repo). Unlocking is remembered for
  the tab session (`sessionStorage`). This is a light lock for a static
  site — the underlying files are technically public to anyone who guesses
  a direct URL.

## Layout

```
index.html            Catalog page (password gate + searchable book grid)
gate.js               Shared password-gate logic (hash check + overlay)
catalog.json          Book catalog data — the catalog page renders from this
settings.html         "Book settings" page: view/edit the generation brief
settings/
  story-settings.md   The generation brief future books are written from
books/
  <slug>/             One folder per book: the book's complete bundle
    index.html        (gate snippet injected: locked visitors bounce to /)
    styles.css  app.js  narration.js  book.js
    images/p01..p12.webp
    audio/p01..p12.mp3
.nojekyll             Serve files exactly as-is
```

`catalog.json` entries:

```json
{"title": "...", "date": "YYYY-MM-DD", "slug": "colin-and-maddy-s-...",
 "truck": "firefighting" | "police", "plot": "one-line summary",
 "cover": "books/<slug>/images/p01.webp", "type": "site", "url": null}
```

Gemini-era books use `"type": "gemini"`, `"cover": null`, and `"url"` set to
their `share.gemini.google` link; they render in the "Earlier books" section.

## Adding a new book (nightly)

1. Stage the book bundle (same format as the existing ones: `index.html`,
   `styles.css`, `app.js`, `narration.js`, `book.js`, 12 images, 12 mp3s).
2. Publish it with the helper in `.tools/`:
   - Convert page images to WebP (max width 1600, quality 80) into
     `books/<slug>/images/pNN.webp`; copy the mp3s as-is.
   - Rewrite image references from `.png` to `.webp` in the bundle's text
     files, inject the gate snippet from `.tools/build_site.py` into the
     book's `index.html` right after `<head>`, and add the "← Library"
     back link after `<body>`.
   - Prepend/append the book's entry to `catalog.json` (site section is
     newest-first).
3. Upload the changed files to this repo (the working copy lives at
   `~/workspace/storybooks-site/`; publishing uses the GitHub Git Data API
   via `.tools/upload.py` — blob → tree → commit → update `main`), in one
   commit per night.
4. GitHub Pages serves `main` from the repo root; new books appear once the
   Pages build finishes.

## Book settings

`settings.html` (behind the same password) shows `settings/story-settings.md`
in an editor. Saving commits the file back to this repo through the GitHub
Contents API, using a fine-grained personal access token that the reader
pastes into the page once (scoped to this repo, Contents read/write). The
token is kept only in the browser's localStorage.
