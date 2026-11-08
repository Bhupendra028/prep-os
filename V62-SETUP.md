# Prep OS v6.2 Universal Sync — BETA

## Safety before installation
1. On EACH device, export a JSON backup including PDF bytes and save it outside the browser.
2. Do not clear browser data or delete the old backups.
3. First test with a disposable note, flashcard, and PDF page; do not immediately use for irreplaceable study records.

## Install
Upload changed files from this ZIP into your existing repository, preserving folder paths. GitHub Actions deploys Pages. The ZIP includes a full repository snapshot for convenience; do not upload private PDFs or secrets.

## Firestore rules
In Firebase Console > Firestore Database > Rules, add the match block from FIRESTORE-V62-RULES.txt within the existing database match, preserving any existing rules. Publish. The code uses `users/{uid}/sync/v62`. The account must be signed in to Firebase; Drive authorization alone is not enough.

## Behavior
- Automatically attempts synchronization on Firebase sign-in and every 12 seconds while the tab is open, plus on return to the tab.
- Reading page is remembered when changing page, opening a book, or selecting a page. Reading position uses Drive file ID when available.
- Notes, annotations, flashcards, answers, sessions, curriculum status, daily tasks, preferences and book metadata are included.
- PDF bytes remain in Google Drive/IndexedDB; local PDF text indexes are not uploaded.
- Offline edits remain in IndexedDB, and upload is retried while the app is open after reconnection.
- Conflict copies are kept locally in Settings > Check sync conflicts; export backup before resolving manually.

## Important limitations — beta
- Firestore single-document maximum size is 1 MiB. Large annotations or extensive notes can exceed this limit; sync then displays pending/error, local data is retained. This needs sharded records before large-scale use.
- Sync is periodic, not instant or background when the app is closed.
- Conflict copies are local to the device, not yet a complete interactive merge UI.
- Existing local data on a second device can produce conflicts on first sync. Always back up both devices first.
- The app has a single local IndexedDB profile; do not switch between unrelated Firebase accounts without exporting and clearing account-specific local data safely. Do NOT clear it casually.
- This update has passed syntax and existing core tests, but has NOT been live-tested against your Firebase project or with two browsers.
- Book metadata sync does not download PDF bytes automatically; connect Drive as before.
