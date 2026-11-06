# Prep OS — Source-grounded teaching / knowledge engine (future phase)

The user wants exhaustive coverage of the CFA Level I May 2027 syllabus, using the 2026 CFA Institute curriculum, 2026 SchweserNotes and updated 2027 learning outcomes. The 2023 SchweserNotes are expressly excluded. A production system must never imply that it has already ingested or understood every page when it has not.

## Source hierarchy

1. Verified 2027 CFA Institute learning outcome statements, module outlines and exam updates: determine scope.
2. Privately stored 2026 CFA Institute PDFs: authoritative detail where still aligned.
3. Privately stored 2026 SchweserNotes Books 1–4: concise teaching and study sequencing.
4. User's own handwritten annotations and original notes: personal memory cues, not externally verified claims.
5. Historical mocks and legacy reference files: optional, clearly labelled and separately classified.

## Required ingestion audit trail

For each PDF, record file hash, edition, rights, title, number of pages, page text extraction status, page image inspection status, tables/equations/figures status, extraction confidence, date and indexing version. Retain exact page number and PDF page label. Scanned or formula-heavy pages must be flagged for visual verification. Do not claim fully indexed until pages are processed and exceptions are reviewed.

For each current 2027 LOS, record current official wording, exact curriculum edition, all textbook pages that teach it, concept list (definitions, assumptions, formulae, examples, exceptions), coverage audit status, updates relative to 2026, and test items generated or mapped. `reading.title` alone is not a complete LOS.

## Learning-flow requirement

1. Display original PDF source page (private) with highlights and scribbles.
2. Retrieve topic-relevant verified excerpts and refer to book + PDF page.
3. Explain each concept point by point, with examples and formula derivations when relevant.
4. Explicitly mark original AI-generated worked examples as such.
5. Verify numerical solutions via deterministic code or calculator, rather than relying only on LLM arithmetic.
6. Quiz with original practice questions; label copyrighted/provider questions and usage rights.
7. Track wrong answers, misconceptions, concept mastery and spaced repetition.
8. Do not mark LOS complete from page-reading alone.

## Annotation roadmap

- v1: freehand pen, highlight strokes, erase, undo, notes/flashcards anchored to file UUID + page
- v2: selectable text spans with precise character/text-box anchors, comments, annotation colors, handwritten layer PDF export, cloud conflict resolution
- v3: AI 'Explain selected span', 'Make 5 flashcards', 'Generate numerical practice', source-backed citations, automatic concept graph

## Privacy / deployment

- Store copyrighted PDFs privately with per-user access control, never publish them in static GitHub Pages.
- Keep model/API secrets on authenticated backend; add per-user quotas, rate limits and audit logs.
- Make citations transparent: `(Book / 2026 edition, page X)` and `2027 LOS revision`.
- Require explicit user approval for major study schedule changes or destructive actions.
- Retain a JSON backup including notes, annotation coordinates, question logs, flashcard history and optionally document bytes; test round-trip restore across browsers.
