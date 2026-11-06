# Prep OS — Google Sign-In edition

**GitHub Pages:** https://bhupendra028.github.io/prep-os/  
**Firebase:** `prep-os-learning-2027`, separate from Fit OS.

This is an updated version of the existing local-first Prep OS with a **Continue with Google** button, an optional one-time Email/Password-to-Google account linking flow, and the private cloud library/download integration scaffold. Google sign-in is browser-based; no Terminal or npm installation is needed for the user.

To publish: unzip, open your GitHub repository, **Add file → Upload files**, drag the extracted folder's **contents** (not the ZIP), and commit to `main`. GitHub Actions runs the tests and deploys GitHub Pages. See `CLOUD-SETUP.md`.

**Important:** The user-provided copyrighted textbooks are intentionally not included in this public source ZIP or GitHub Pages. A one-time *private* Firebase Storage import is still needed; actual cross-device cloud progress backup is manual, not automatic. The AI tutor/complete document indexing is not implemented yet. Your local notes and imported PDFs stay on your current device unless backed up or explicitly synchronized.

The existing original app features remain: dashboard, 102-reading checklist, PDF annotations, flashcards, practice questions, study planner, JSON backups.
