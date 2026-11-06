# Manual acceptance checks — Prep OS Phase 1

## Run / navigation
- [ ] Serve via `python -m http.server 8000`; open in desktop Chrome / Safari / Firefox.
- [ ] Dashboard shows 102 readings; all main routes work.
- [ ] Narrow viewport (<760 px) offers a working side-menu.

## Reading Studio
- [ ] Import one of your own PDFs and confirm first page renders (first run requires network access to PDF.js CDN).
- [ ] Flip page, zoom in/out, switch books; page count and notes update.
- [ ] Draw a pen mark and a highlighter mark using mouse or stylus.
- [ ] Navigate away and back: annotations remain on the correct page; undo/eraser works.
- [ ] Add a page note, reload and confirm the note remains.
- [ ] Create a flashcard on a PDF page; click Source to return to the book and page.

## Learning
- [ ] Change a reading to Learning / Practicing / Mastered; reload to verify.
- [ ] Answer a Practice Lab question; explanation appears, answer is recorded.
- [ ] Review a card, rate Again or Remembered; next due date updates.
- [ ] Log study minutes and verify the weekly-hour total.

## Local search
- [ ] Index a PDF with selectable text and search for a known phrase.
- [ ] Open the resulting page; confirm reference works.
- [ ] For a scanned PDF with no text, ensure user understands search limitation.

## Backup / restore
- [ ] Export JSON with PDFs; import in a separate clean browser profile, verify notes, drawings, flashcards, answers, progress, session logs and PDF files.
- [ ] Export JSON without PDF bytes; import and re-import original PDFs under the same filenames to relink saved notes/annotations.
- [ ] Verify no copyrighted PDFs appear in the public Git repository or source ZIP.

## Limitations still requiring manual device testing
- Browser screenshot automation was unavailable in the build environment; layout and PDF rendering need live-browser acceptance before production release.
- Fonts use system fallbacks; live API calls, Firebase sync, PDF annotation export and AI tutoring are not implemented.
- This is a functional early prototype, not a certified exam content database or an audited 2027 LOS coverage product.
