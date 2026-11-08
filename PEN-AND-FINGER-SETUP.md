# Prep OS v6.2 — Stylus ink + finger navigation

Based on the v6.2 beta stylus-only app.js.

## Install
Upload js/app.js and styles.css to the same paths in the GitHub repository. Commit and wait for GitHub Pages deployment. Do not delete existing data.

## Behavior
- PDF annotation pen, highlighter and eraser only accept PointerEvent.pointerType === "pen".
- Finger touch can scroll/pan/pinch through the reader using native touch gestures.
- Finger taps continue to operate flashcard review buttons and controls.
- This version has no freehand ink canvas on flashcards, so there is no flashcard ink to restrict yet. Future flashcard ink must use the same stylus guard.
- Stylus drawing and native touch gestures can vary by browser; test on the OnePlus Pad before depending on it.
- The app's existing zoom and page buttons remain functional. Native pinch may zoom the browser viewport rather than changing the app's PDF zoom setting.

## Test
1. Finger swipe over PDF: scroll without drawing.
2. Finger pinch: zoom without drawing.
3. Stylus: write, highlight, erase.
4. Finger: cannot write, highlight, erase.
5. Flashcards: finger can reveal and grade.
6. Refresh and verify annotations and cloud sync remain intact.
