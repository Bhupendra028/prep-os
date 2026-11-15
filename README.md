# Fit OS 2.0 — Multi-Sport + Fitness Intelligence

**New:** Multi-Sport Hub, offline/sync safeguards, progressive overload, weekly insights, recovery, smart meal planning.

**Start with [README_FIT_OS_2.md](README_FIT_OS_2.md) for safe deployment, backups and test steps.**

See [CHANGELOG_2_0.md](CHANGELOG_2_0.md) for the phase list and test status.

---

# Fit OS — Recipe Builder + Full Mess Food Database + Firebase Sync

Your current Firebase setup is preserved (`fit-os-private`). The website still runs on GitHub Pages. The app ships with 24 ingredient-measured recipes and a searchable food database that now includes the full weekday menu's named dishes (approximately 100 mess-specific reference entries).

**Before changing files:** make a local JSON backup in the existing Fit OS Data & Android App screen; do not put private JSON backups on a public GitHub repository.

**Deploy:** extract ZIP, upload files to the root of `Bhupendra028/fit-os` preserving assets folder, commit to `main`. The `firebase-sync.js` file must be in the root and `assets/seed-data.js` in `assets/`. After redeployment use hard refresh or close/reopen the installed PWA.

**Recipes:** Recipes → Create recipe → select saved ingredient names, enter weights in each food reference's unit, select servings prepared, optionally record total cooked weight. The app derives per-portion nutrient totals; unverified micronutrient fields remain Unknown. Save, then Log portion in servings or cooked grams. To build a meal from new ingredient, add the ingredient first to Food database.

**Mess food:** Food database → search e.g. 'Uttapam', 'Kadhi pakoda', 'Paneer Kolhapuri' → Log → choose Breakfast/Lunch/Snack/Dinner → amount. Reference portions are ESTIMATES. Recipes cooked by mess cannot have reliable micronutrient values or exact macros without ingredient weights/oil amounts. Update or override individual references if you learn actual portion data.

**Bulk foods:** Food database → Import food CSV; use `Food_Import_Template.csv` as a schema, fill as many nutrient columns as genuinely known. Do NOT enter 0 in unknown fields. Missing values remain Unknown. Existing references matching on food name are updated according to the importer.

**Firebase:** sign in, upload local only from device with authoritative records. On second device restore cloud. During simultaneous editing the single-document cloud sync may overwrite recent changes; keep periodic private JSON backups. Verify the live Firebase project connection before relying on it.

**No-fridge note:** bulk raw meats and opened dairy must not be stored without appropriate refrigeration.

# Fit OS — measured recipe & transformation upgrade

## Install on the existing GitHub Pages site
1. Save a private JSON backup from the current Fit OS website before changing any files.
2. Extract this ZIP and replace the website files in the root of `Bhupendra028/fit-os`. Keep `assets/` as a folder. Upload the updated `assets/seed-data.js` and all SVGs/icons. The extra CSV/JSON templates are optional; don't upload personal logs to a public repository.
3. Commit to `main`. Refresh the live site and if an installed Android PWA shows old content, close and reopen it after the new service worker activates.
4. Log meals and daily activities directly in the app. Data stays in the same browser (`fit-os-local-v3`) on that device.

## What is new
- **Recipes & builder**: 24 starter recipes with measured ingredient lists, edit existing recipes, or create new ones. Recipe macros/micros are calculated from ingredient reference nutrition values. Select the number of portions to log. If you weighed the cooked batch, you can log grams from that batch.
- **Food database**: add a food's serving size and as many of 30+ nutrients as supplied; food diary scales by servings, grams, ml and product units. Food CSV import/export and an example template are included. For a 450 g chicken pack, log 250 g **raw** if that is what you weighed; do not confuse 250 g raw with 250 g cooked.
- **Forecast**: conservative, focused and stretch scenarios. Stretch mathematically models ~17% body fat at 6 months and ~10% at 12 months, but is not a guarantee, and may be medically/athletically inappropriate for some people. No automatic aggressive calorie cuts.
- **Morning weight**: quick record, same-date update preserves other measurements.
- **Watch & steps**: daily step entry and CSV import (Date,Steps,Sleep Hours). This is manual import, **not automatic boAt Crest integration**.
- **Groceries**: existing per-pack Zepto and Blinkit prices remain editable, and first-basket and weekly-consumption totals recalculate.

## Limits, privacy, and sources
- This is a static installable PWA hosted on GitHub Pages. It does not have a private cloud account or bi-directional sync, and it cannot directly access boAt Crest, Bluetooth watch private data, or Health Connect. Android native Health Connect integration requires additional Android code/permissions; source compatibility must be confirmed.
- Official boAt support for Lunar Discovery says steps, not all sensor data, can be shared to Google Fit. It does not guarantee boAt Crest exports CSV. CSV template is for manually prepared or legitimately exported dated steps.
- Google Fit REST APIs are being retired in 2026; don't build a new Google Fit REST integration.
- Recipe micronutrients are only as complete as the underlying food references. Unknown values remain unknown, never assumed zero. Edible yield/weight and raw-vs-cooked selection affect accuracy. Spices not included in a recipe ingredient list do not contribute calculated nutrients until you add them.
- Milk, fish, chicken, curd, rice and cooked egg dishes require proper food safety. With no hostel refrigerator, don't batch-store perishable cooked dishes or raw meats.
- For real body recomposition, use morning weight averages, waist measurement, consistent photos, training performance and recovery. Visual body-fat percentages are inaccurate.
- Do not commit JSON backups, meal logs or personalized Excel data to a public GitHub repo. Export private backups frequently.

## Daily workflow
Record morning weight, log meals by weighed ingredient or recipe portion, enter water/sleep, workouts/football, steps, and grocery purchases. Review 7-day averages and compare changes with the aspirational forecast; do not change intake based solely on the graph.
