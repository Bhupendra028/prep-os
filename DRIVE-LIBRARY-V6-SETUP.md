# Prep OS Google Drive Library v6 — setup

1. In Prep OS on your **original browser profile**, export Settings & Backup → Export JSON backup. Include PDF bytes if you want an independent backup. **Do not clear site data, IndexedDB, or unregister the service worker.**
2. Google Cloud project `prep-os-learning-2027`: enable Drive API, create a Web OAuth client with Authorized JavaScript origin `https://bhupendra028.github.io`, add `https://www.googleapis.com/auth/drive.file` to Data access, and set OAuth Audience to Production (already completed by user).
3. Upload the five files in this patch to GitHub `main` preserving paths: `index.html`, `sw.js`, `drive-config.js`, `js/app.js`, `js/drive.js`. **Do not upload or overwrite cloud-config.js**. Keep the existing `js/cloud.js` for Firebase sign-in and manual study-progress backup. This patch does not use Firebase Storage for PDFs.
4. Wait for the latest green `Deploy Prep OS` GitHub Actions run. Open `https://bhupendra028.github.io/prep-os/?v=drive-v6#settings`.
5. Under Settings, sign into Firebase Google (for progress features) if desired, then click **Connect Google Drive** and authorize `drive.file`. A separate Drive OAuth consent is required. No client secret is used.
6. Open Knowledge Library → **Upload PDF to cloud** or **Upload existing local PDFs**. Test with a small PDF first; confirm it appears in Google Drive and under the app library.
7. On a second device, open Prep OS, choose **Connect Google Drive** using the SAME Google account, then **Sync cloud library**. Select Read to download a PDF locally. Files stay in private Google Drive, not public GitHub.

## Limitations and precautions
- Drive OAuth access tokens are held only in memory. Reconnect after reloading each device. Firebase Google Sign-In and Drive authorization are separate.
- Drive API `drive.file` only sees app-created or app-opened files; it does not automatically import all existing Drive PDFs.
- Uploads are resumable in 8 MiB chunks; if an upload fails, the app does not delete your local PDF. Resume across browser reload is not yet implemented.
- Study progress, annotations, and flashcards do **not** automatically synchronize across devices. Existing manual Firebase progress backup remains separate.
- Google Drive quotas and account storage limits apply. Private textbook uploads must comply with publisher license terms.
- This patch was syntax-checked and tested against existing unit tests; it has **not** been live-tested against your Google Drive account.
- Do not publish a Google OAuth **client secret**, service-account private key, GitHub PAT, or personal textbooks to your public repository.
