# Fit OS 2.0 — All-in-one update (Sports first)

## Quick deployment

1. **Before deploying**, open the currently working Fit OS on each device and download a JSON backup in **Data & Android app**. Keep the backups private and off GitHub.
2. Download a copy of the currently deployed repository. This package is built from the latest **Smartwatch & Activity** source available in this conversation; if you've edited source afterward, compare your changes before replacing files.
3. Upload the **contents of this folder** (not the containing folder) to your existing `Bhupendra028/fit-os` GitHub repository. Preserve the `assets/` folder, including `assets/seed-data.js` and both icon PNGs.
4. Commit to `main`. Under **Actions**, check that `pages build and deployment` is green.
5. Open `https://bhupendra028.github.io/fit-os/` in **Android Chrome Incognito** to verify. Once correct, reopen the installed PWA. Existing service worker updates on reload; do **not** clear site data.
6. Verify both local backup restore and cross-device Firebase sync with disposable test entries before relying on sync.

## Features shipped, in sidebar order

- **Multi-Sport Hub**: football, badminton, cricket, basketball, tennis, table tennis, squash, volleyball, kabaddi, hockey, swimming, cycling, running, hiking, boxing, yoga and a custom sport builder. Sport-dependent stats, duration, RPE, session load and history. Previously entered `football[]` remains untouched and is visible with a `Legacy` marker.
- **Progressive Overload**: existing `workouts[]` plus new set-by-set `strengthSessions[]`, personal best volume, estimated one-rep max and compact trends.
- **Weekly Fitness Intelligence**: observed seven-day mean weight/calories/protein/sleep/steps, sport load, activity records, missing-data coverage and prior-week comparisons.
- **Recovery & Readiness**: subjective check-ins from 1–5, using existing sleep and habits data. The indicator is a simple transparent heuristic; **not** a medical assessment or injury prediction.
- **Smart Meal Planner**: ranks existing recipes by remaining calories, protein and budget/mess-friendly heuristics; lets you choose portions and add the selected recipe to your food diary. Mess dishes shown for reference, with no fabricated nutrition values.
- **Offline & Sync Reliability**: local persistence continues as before, the PWA app shell is cached offline, Firebase manual initial activation, revision-checked transaction writes, conflict pause rather than silent overwrite, pending edits retried on reconnect, and visible sync status. Full-state Firestore storage still has a roughly 1 MiB document limit; this release conservatively pauses auto-sync when JSON exceeds 840 KB.

### Browser data structures

The existing `fit-os-local-v3` localStorage key and original arrays remain unchanged. New properties are added only when needed: `sportSessions[]`, `customSports[]`, `strengthSessions[]`, `recoveryLogs[]`. They are included automatically in JSON backup and restore, and in Firestore whole-state uploads where size permits. No automatic migration or destructive reset is performed.

### Firebase safety details

The Firestore path stays `users/{uid}/documents/fit-os-state` and your existing Firebase app config stays unchanged. The security rules must allow authenticated users to access only their own `/users/{uid}/...` documents. This package does NOT deploy or relax Firebase rules. Do not put Firebase service account credentials, exported personal fitness JSON or sensitive private files in the public repository.

Cloud sync **cannot be verified without your authenticated Firebase project**. When signed in for the first time, manually choose `Upload local` or `Restore cloud`. Concurrent edits on different devices can produce a conflict; **export both local backups** before choosing which device overwrites the other. This version prevents silent overwrites but **does not perform automatic multi-device record merging**. It retains the single-document-size limitation.

### Mobile compatibility

Retains `mobile-ui.js`, the Account & Sync dropdown and phone-sized entry dialogs. `fitos-v2.css` contains isolated responsive designs and 16px input font sizes. `smartwatch.js` and `smartwatch.css` remain installed and unchanged.

### Test checklist

- Android 320/360/390/430px: no horizontal overflow in dashboard, sports, strength, weekly insights, recovery, meal planner, and dialogs.
- Save, edit, delete a badminton session; create a custom sport; check cricket-specific fields.
- Check existing football entries still appear in Sports Hub and Legacy Football.
- Log a detailed strength exercise; verify volume and trend.
- Log one recovery check-in; verify readiness uses existing sleep and does not invent missing values.
- Plan a recipe with chosen servings; verify it appears in Food & Nutrition for the chosen date.
- Export JSON; restore in an isolated browser profile, verify all new/old arrays and records; keep main device unchanged.
- Make a cloud backup; test offline edit -> online retry -> second-device read; test conflicting edits **only after both devices have backups**.

### Important limitations

- No automatic boAt Crest/Health Connect integration or native Android APIs are included; watch data is manual.
- Fitness readiness and body-composition charts are estimates, not a medical evaluation.
- No claim is made that Firestore cloud sync has been verified in your account. A true cross-device sync pass requires your two devices and Firebase authentication.
