# Fit OS 3.1 — Calories, Nutrients & Meal Logging

This package was built from **Bhupendra028/fit-os**, GitHub `main` branch, tree SHA `886819a077c9046f624121ba3f1b5d26ee3aea5b` (verified against the source package). It does **not** include or modify Prep OS.

## What's included

- Screenshot-inspired navigation: **CALORIES / NUTRIENTS / MACROS** tabs and day navigation.
- Nutrient report with **TOTAL / GOAL / LEFT** columns, a progress bar, and coverage indicator. Nutrient categories include protein, carbs, fibre, fat subdivisions, vitamins, and **all 16 minerals** mentioned in your screenshots.
- 60 screenshot-derived food references in `assets/mineral-foods.js`, including rajma, chana, oats, eggs, milk, curd, spinach, potatoes, fish, seeds and nuts. The source quantities and values are general estimates. Unverified nutrients remain unknown instead of being invented as zeros.
- **Breakfast, Lunch, Dinner, Snack, Pre-workout, Post-workout** diary with searchable foods and logged grams/ml or serving count. A sample end-to-end test logged 170 g of rajma under Lunch and confirmed the corresponding 900 mg potassium reference entry.
- Your new-user baseline targets: 78 kg, 32-inch waist, approx. 2,400 kcal, 150 g protein, 293 g carbs, 70 g fat, gym four sessions and football twice weekly. These defaults do NOT overwrite existing user profile and daily logs.
- Existing training, sports, meal recipes, grocery, smartwatch and cloud modules remain intact.

## How to deploy to GitHub Pages

1. Open your **existing Fit OS** on every device and export **Data & Android app → full JSON backup**. Save it privately (do not put a personal backup into a public repo).
2. Extract `Fit_OS_3_1_GitHub_Ready_2026-11-15.zip` locally. Upload **the contents** (not the ZIP itself or an extra enclosing folder) to the **root of `Bhupendra028/fit-os`**. Include `app.js`, `index.html`, `nutrition-v3.css`, `service-worker.js`, and the `assets/` directory (including `assets/mineral-foods.js`). Preserve everything else. Commit to `main`.
3. Wait for GitHub Pages deployment. Hard-refresh the browser, then reopen the installed PWA if applicable. Don't clear the browser's storage without a backup. The service worker has a new cache version, so it should fetch updated assets after activation.
4. Open **Food & nutrition**. Check the 3 tabs. In **Nutrients** confirm that **All 16 Essential Minerals** appears and includes sodium, potassium, chloride, magnesium, iodine, iron, zinc, copper, phosphorus, selenium, calcium, chromium, molybdenum, manganese, sulfur, and fluoride.
5. Search `rajma`, `potato`, `spinach`, `ragi`, `oysters` in the **Food database**, and try recording grams/ml or servings in Lunch or Breakfast. Confirm totals change. Verify that your prior meals, workouts and recipes are still there.
6. Only then verify your authenticated cloud sync on two devices using a disposable test entry. There is no claim that Firebase was remotely tested; local browser tests do not verify your cloud configuration.

## Managing foods from GitHub

- The master reference list is `assets/mineral-foods.js` and its editable source is `Mineral_Foods_Catalog.csv` (regenerate with `build_mineral_catalog.py` if needed). Commit edits to GitHub. The PWA fetches updated code and reference data after deployment/reload.
- New catalog foods are merged into existing browser data. **Unedited** catalog foods can be refreshed, while any food manually edited in the app remains locally customized. Meals already logged are not retrospectively rewritten when you edit the central catalog.
- GitHub hosts your app code and reference catalog, not your personal meal diary. Personal data are retained in browser storage and (only if configured/authenticated) Firebase. GitHub edits cannot live-sync personal meal entries.

## Safety and data quality

- Screenshots contain selected examples, not verified comprehensive nutrition tables. Actual nutrient amounts vary with raw/cooked form, food brand, recipe and serving size.
- The report shows **Unknown**, partial coverage, or a dash where data are missing. A nutrient intake shown as incomplete is NOT a diagnosis of deficiency.
- Sodium is an *upper-limit guidance*, not an amount to deliberately reach. Some mineral reference values mix Indian and U.S. adult standards and may not reflect individual medical conditions. Sulfur and fluoride have no automatic target. Supplements should not be recommended solely from an app gap.
- If you previously customized calorie or macro goals in your app, the update deliberately preserves them; edit Settings to adopt newer goals.

## Test coverage

- Node syntax check for `app.js` and service worker.
- Chromium DOM-based mobile (390 px) and desktop (1365 px): no horizontal overflow, tabs switch, day navigation changes dates, 16 mineral rows, food library searches, and meal-modal opening.
- Tested logging 170 g rajma under Lunch and checking that potassium tracks 900 mg in the Nutrients report; no page exceptions in those tests.
- Actual GitHub Pages deployment and Firebase multi-device sync are NOT performed by this package.
