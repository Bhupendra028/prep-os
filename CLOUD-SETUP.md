# Prep OS — Easy Google Sign-In Setup (no Terminal needed)

The public site is GitHub Pages (`https://bhupendra028.github.io/prep-os/`). The Firebase project is `prep-os-learning-2027`, separate from Fit OS.

1. Firebase Console → Authentication → Sign-in method → **Google** → Enable. Set public name to `Prep OS`, select a support email, and save.
2. Firebase Console → Authentication → Settings → Authorized domains → add `bhupendra028.github.io`.
3. Update the app using GitHub **Code → Add file → Upload files** in the browser, dragging the **contents** of the extracted Prep OS folder (including its `js`, `icons`, and `.github` folders). Commit the changes to `main`. The existing GitHub Actions workflow deploys the app. Do not upload the ZIP itself.
4. Visit `https://bhupendra028.github.io/prep-os/#settings` and press **Continue with Google**.

### Existing Email/Password user

If you already created a user through Email/Password, keep that identity and associated cloud data by first signing in under **Already created an Email/Password account?**, then selecting **Link Google to this account**. Once linked, you can use Continue with Google on future devices.

### Private books are not yet in the cloud

The Google login and public Firebase web config don't upload the user-provided PDF files. Firebase Cloud Storage generally requires a Blaze project/billing configuration and storage rules. Use only private Storage paths; never commit copyrighted textbooks to this public GitHub repository. The included `admin-import/` is a separate future import utility that requires administrator credentials to remain local/private.

### Current limitations

Manual cloud progress upload/restore (not continuous sync), private books pending Storage setup and one-time import, and no AI tutor or verified book-wide LOS indexing. Google sign-in is implemented with the Firebase popup flow; a browser may block the popup and the website must be an authorized domain.

Never share passwords, Firebase service-account credentials, GitHub tokens, or private API keys. Firebase *web* configuration in `cloud-config.js` is public by design; the security rules enforce access.
