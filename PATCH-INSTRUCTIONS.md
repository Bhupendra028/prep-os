# Prep OS cloud patch v4 — no terminal

This is the **complete repository**, not a partial patch. Upload the contents, preserving folders, to the root of `Bhupendra028/prep-os` on `main` and overwrite matching files. **Do not upload the ZIP itself.**

1. In GitHub **Settings → Pages → Build and deployment**, select **GitHub Actions** as Source.
2. In **Actions**, run **Test and deploy Prep OS** on `main`, or wait for the push-triggered run. Confirm the run is for the **new commit** and build/deploy are green.
3. Visit `https://bhupendra028.github.io/prep-os/?v=20261106-v4#settings` in Incognito. Bottom-right should show `Prep OS cloud patch v4`; Settings should show **Continue with Google**.
4. If not, check `https://bhupendra028.github.io/prep-os/index.html` for `Prep OS cloud patch v4`, and `https://bhupendra028.github.io/prep-os/js/app.js` for `Continue with Google`. If missing, the site is not serving the new release. Review Actions run and Pages source.

**Never clear browser data, delete IndexedDB, or uninstall the existing PWA** before exporting a backup from your normal browser profile. Incognito does not contain your normal study records. No study data is modified by this patch. Google sign-in and **manual** progress upload/restore are included; automatic sync is not yet implemented. PDFs are not included in this public repository.
