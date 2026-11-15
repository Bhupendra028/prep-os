# Fit OS — Mobile UI Repair (5 November 2026)

This package fixes the mobile interface while retaining the existing Fit OS features, local data format, Firebase project configuration, and nutrition, training, and recipe logic.

## What changed

1. The mobile header uses two rows: a readable page title, then the date, **Account & Sync** dropdown, and profile shortcut. Google sign-in / sign-out, **Upload local**, **Restore cloud**, and Android & backup live in the same dropdown on Android. The original button IDs and event handlers are unchanged.
2. Every form uses a full-width, scrollable, phone-size bottom sheet. Text/number/date/select controls use at least 16px fonts to help prevent mobile auto-zoom when focusing inputs.
3. The food/nutrition page's nutrient grids no longer force a 650px-wide layout on a narrow phone. Large nutrition tables scroll **inside their own cards**, rather than causing the entire website to pan sideways.
4. The app shell and grids have explicit `min-width: 0` limits, and the dropdown opens within the device viewport.
5. The service-worker cache version has been changed, and `mobile-ui.js` is included in the offline shell so phones can receive the fix after updating.

## Deployment to your existing GitHub repository

1. In Fit OS on the **original device**, download a **JSON backup** (Android app & backup > Download full JSON backup). Do this before installing or replacing the site. Never publish personal backups in the public repository.
2. Extract the ZIP and upload its **contents** (not the ZIP itself) into the **root** of your existing `Bhupendra028/fit-os` GitHub repository's `main` branch. Keep `assets/` as a folder and overwrite files of the same name.
3. The **minimal patch** only needs `index.html`, `styles.css`, `mobile-ui.js`, and `service-worker.js` if you want to preserve every other repository file exactly.
4. When GitHub Pages has deployed the commit, open `https://bhupendra028.github.io/fit-os/` on Android. Exit/reopen the installed PWA. If the old layout still appears, relaunch after an ordinary refresh while online. **Do not clear site storage**: that can erase your unsynchronized fitness entries.
5. Tap **Account & Sync** to reveal the sign-in and cloud options. Check food, workout, sleep, water and grocery data forms.

## Important cloud-sync note

This is a **mobile presentation and usability fix**. It does not alter `firebase-sync.js` or fix a separate Firestore upload problem if your older website still shows **Cloud is empty** after an upload. Keep local backups until cloud syncing has been independently confirmed.

## Validation performed

- Chromium responsive layout tests at 320, 360, 390, 430, 580, 768, 850 and desktop widths.
- All 15 navigation sections checked for horizontal overflow at 320, 390, and 430 pixels.
- Log food, workouts, football, body measurements, sleep, watch steps and grocery purchase entry popups checked for overflow and 16px fields.
- Sync dropdown opens within 320px and 390px screens; desktop cloud buttons remain visible.
- `app.js`, `mobile-ui.js`, and `service-worker.js` passed JavaScript syntax checks.

This does not constitute verification on your specific Android handset or against your live Firebase database; after deploying, please test on the phone. No local user data is included inside this ZIP.
