# Run Prep OS from GitHub Pages

This is a **static, local-first** app. The repository contains app code and a 102-reading curriculum *title list*, but **does not include the private PDF textbooks**. Import your own legal copies in the running browser app.

## Easiest route: new GitHub repository from your computer

1. Download `Prep_OS_GitHub_Pages.zip` from the ChatGPT response and extract it. Open the resulting `prep-os` folder.
2. Sign in to [github.com/new](https://github.com/new). Create a repository named **`prep-os`**. Choose a public repository if you want free public GitHub Pages hosting on GitHub Free. **Do not add a README or license** when creating it; this bundle already contains a README.
3. In Terminal inside the extracted `prep-os` folder, run the following commands. Replace `YOUR_USERNAME`:

   ```bash
   git init
   git branch -M main
   git add .
   git commit -m "Launch Prep OS v0.1"
   git remote add origin https://github.com/YOUR_USERNAME/prep-os.git
   git push -u origin main
   ```

   You need Git installed and GitHub authentication enabled (Git Credential Manager, browser or GitHub CLI). If `git push` asks for a password, GitHub no longer accepts your regular account password for HTTPS pushes; sign in using a supported Git credential flow.
4. Open your new GitHub repository → **Settings** → **Pages** → under **Build and deployment**, select **Source: GitHub Actions**.
5. Open the **Actions** tab and find **Test and deploy Prep OS**. If it has not run after enabling Pages, select **Run workflow** from that workflow page. The action tests and publishes the **app files only**.
6. The published site URL is normally **`https://YOUR_USERNAME.github.io/prep-os/`**, after the workflow completes. The exact URL is also shown in the Pages settings and the deployment action.

## Alternative: upload in the GitHub website

Create `prep-os` first. In the repository page choose **Add file → Upload files**. Upload the **contents** of the extracted folder, rather than the parent `prep-os` folder. **Important:** the hidden `.github/workflows/deploy.yml` may be omitted by file pickers, so you may need to create that file with **Add file → Create new file**, entering the exact path `.github/workflows/deploy.yml` and pasting its contents. A local `git push` is simpler and more reliable for preserving nested files.

## What is public and what remains private

- GitHub Pages hosts only the source code, design, general curriculum reading titles and original practice questions.
- PDF uploads in the app are stored **locally in your current browser/device using IndexedDB**, not committed to the GitHub repository.
- Annotations, notes and flashcards currently live in that same browser's local storage. They will **not appear automatically on another device**. You must export and restore the JSON backup until cloud sync is added.
- Do **not** upload the CFA curriculum PDFs, Kaplan Schweser PDFs, commercial question banks, your exam result PDF, or other private files into the GitHub repository.
- Do **not** put OpenAI API secrets, authentication admin credentials or service-account keys in GitHub Pages JavaScript.
- The AI tutor and Firebase cloud sync **are not connected yet**.
- The PDF viewer downloads Mozilla PDF.js from a CDN on first use; online access may be needed to render PDFs.

## Update future versions

Change files locally, then run:

```bash
git add .
git commit -m "Update Prep OS"
git push
```

Each push to `main` triggers the GitHub Actions test-and-deploy workflow.

## Troubleshooting

- **Blank page / 404:** verify the files are at the root of the repository, the workflow completed, and the repo's Settings → Pages shows GitHub Actions.
- **App works but PDFs don't open:** allow the PDF.js CDN to load on the first use and check the browser's network settings.
- **Lost progress after using another device:** local-first persistence is per browser; export a JSON backup on the original device and restore on the new one.
- **App updated but old UI persists:** service-worker caches can temporarily retain old files. Refresh once online; if required, clear the site-specific cached data **only after exporting a JSON backup**. Clearing site data can delete local annotations and PDFs.
