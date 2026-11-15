# Deploy Fit OS 3.1 safely

**Repository:** https://github.com/Bhupendra028/fit-os

**Uploaded ZIP was Prep OS, not Fit OS.** This deliverable was instead constructed from the current GitHub `main` source of **Fit OS**, verified against an identical saved source ZIP. Do not upload these files to your Prep OS repository.

1. Export a **private JSON backup** from your currently installed Fit OS on each device.
2. Extract the deliverable ZIP and upload all its contents to the **root** of the Fit OS GitHub repository (`main` branch), keeping the existing folders and assets. Commit changes.
3. Confirm GitHub Pages has finished deploying. Hard refresh/reopen PWA without clearing site data.
4. Open **Food & nutrition**, switch Calories / Nutrients / Macros, verify all 16 minerals and log a test food (e.g. 170g cooked rajma at Lunch).
5. Verify existing recipes, activities, and local history remain intact. For Firebase, test authenticated sync separately before relying on cross-device updates.

For reference data updates, change `assets/mineral-foods.js`; the app preserves locally edited foods and existing food logs. Missing nutrients display as unknown. See `README_NUTRITION_3.md` for details.
