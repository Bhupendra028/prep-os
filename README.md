# Prep OS — Phase 1 working PWA

An installable, **local-first** browser application for learning and exam preparation. It is named **Prep OS**, not CFA Prep OS; CFA Level I May 2027 is its first study profile.

## Included and working

- Responsive dashboard (desktop / tablet / mobile) with local study metrics
- 102 reading *titles* imported from your uploaded 2027 Excel study planner
- Progress states: not started, learning, practicing, mastered
- Private PDF import: save PDFs as blobs in IndexedDB (not uploaded to a server)
- PDF.js-based page viewer (Internet needed for first PDF.js library load)
- Pen and highlighter overlays, erase-by-tapping-stroke, and undo; annotations saved by normalized page coordinates
- Page-specific autosaved notes, and flashcards linked to document and page
- Flashcard recall with simplified spaced repetition
- Original 12-question beginner practice set, scoring and explanations
- Manual study-hour logging against 22.5 h/week goal
- Local exact keyword search across PDF page text after manually indexing each document
- Installable PWA app-shell offline caching
- JSON backup and restore; optional full backup including PDFs

## Not included in Phase 1

- Connected generative AI tutor, trusted server-side API, agentic curriculum auditing
- Cloud sync / Firebase login
- AI semantic/vector search, automatic mapping of PDF pages to LOS
- PDF-export of annotations or selected-text highlights
- Official question-bank imports, complete mocks, or licensed content distribution
- Guaranteed full, individually verified 2027 learning outcome coverage

No PDF textbook content, copyrighted question banks, or old 2023 Schweser books are included in this repository. You import your legally accessible PDFs *within the app*. The preloaded reading titles are from your user-supplied May 2027 planner, and **have not been audited LOS by LOS**.

## Publish on GitHub Pages

See **[GITHUB-PAGES-SETUP.md](GITHUB-PAGES-SETUP.md)**. The included `.github/workflows/deploy.yml` tests the app and publishes a curated, static-file-only artifact on every push to `main`. The source can be hosted in a public repository, but **never include PDFs or private study notes in git**.

## Run locally

Requires a modern browser and a local HTTP server (do not double-click `index.html` for IndexedDB / service worker testing):

```bash
python -m http.server 8000
```

Open http://localhost:8000. Or publish the **contents** of this folder to GitHub Pages. PWA install prompts vary by browser and require HTTPS outside localhost.

On first PDF open, the PDF.js module and worker are fetched from a pinned CDN (`pdfjs-dist` 4.10.38 via Cloudflare). The app shell can work offline afterward, but PDF rendering is not guaranteed offline unless those CDN dependencies are available in the browser cache. A later deployment should vendor and locally cache the PDF.js build.

## How to begin with your own books

1. Go to **Knowledge Library** or **Reading Studio**, click **Import PDFs**, select your 2026 CFA/Schweser PDFs.
2. Choose a PDF to open, annotate a page with the pen/highlighter, and write a page note.
3. Click **+ Flashcard** while on the page; the saved card will retain that PDF/page as its source.
4. In **Knowledge Library**, click **Index text**, then search for terms across locally indexed PDF pages.
5. Mark a syllabus reading **Learning** or **Mastered**, solve original problems in **Practice Lab**, and log actual study time.
6. Go to **Settings & Backup** and export a JSON backup. Check **Include imported PDF bytes** to ensure the backup can restore PDFs as well as notes and flashcards.

## Data design

- `IndexedDB(prep-os-local-v1) / kv` stores app state (topics, notes, flashcards, annotations, activity, settings)
- `IndexedDB / pdfs` stores imported PDF Blob bytes keyed by a UUID
- `IndexedDB / indexes` stores local page-text search indexes
- Each annotation stroke stores `{tool, points:[{x,y}]}`, with normalized 0..1 coordinates per `docId:page`
- Source-linked cards store `docId`, `page`, `readingId`, `front`, `back`, due date and recall history

Local persistence can be lost when clearing browser storage. Export backups frequently. For very large full backups, the JSON may require substantial memory. The restore process replaces existing local records.

## Roadmap

1. **Phase 1:** working local-first syllabus, reader, annotations, flashcards, practice, backup (this build).
2. **Phase 2:** bundled PDF.js, text selection highlights, page-anchored questions, robust PDF exports, advanced lesson builder, import question rights/permissions.
3. **Phase 3:** secure backend, private RAG knowledge base, source-grounded generative AI tutor, automatic per-LOS coverage audits, verified calculations, and AI-origin labeling.
4. **Phase 4:** agentic revision planning with user approval, Firebase authenticated sync and conflicts, full mock exam simulator, accessibility and exhaustive testing.

## Security note

Do **not** commit third-party copyrighted textbooks to the public GitHub repository. Do **not** put OpenAI or Firebase admin secrets in browser JS. API access will require a secure server backend, authorization, quotas, and page-level source controls.

## Attribution

Uses Mozilla PDF.js, an Apache-2.0 licensed library, loaded via CDN when the reading interface is first needed. See https://mozilla.github.io/pdf.js/ .
