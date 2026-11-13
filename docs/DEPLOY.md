# Publishing Lighthouse Keeper

The game is published on **GitHub Pages**, from the repository `https://github.com/shubhampatil212/lighthouse-keeper`.

- **Live address:** https://shubhampatil212.github.io/lighthouse-keeper/
- **How it updates:** every push to `master` runs the checks and, if they pass, publishes the new version. A failed check publishes nothing, so the live game stays as it was.

## One-time setup (already done once; repeat only on a new computer or repository)

1. **The repository:** on github.com, `shubhampatil212/lighthouse-keeper`, **Public**, created empty.
2. **Pages:** in the repository, go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.
3. **Keep your email private:** in GitHub's **Settings → Emails**, tick **Keep my email addresses private** and **Block command line pushes that expose my email**. This project commits with GitHub's private address: `git config user.email` in the project folder shows `121785571+shubhampatil212@users.noreply.github.com`.
4. **Log in from this computer:**
   ```
   sudo apt install gh
   gh auth login
   ```
   Answer the questions with **GitHub.com → HTTPS → Yes → Login with a web browser**, then approve in the browser.
5. **Connect the project** (already done here):
   ```
   git remote add origin https://github.com/shubhampatil212/lighthouse-keeper.git
   ```

## Publishing a new version

```
cd "/home/asuna/Swami's Work/Game DEV/lighthouse-keeper"
git push -u origin master
```

The first push needs the `-u origin master`; after that, `git push` is enough.

Then open the repository's **Actions** tab. The **Deploy** run takes about 8–10 minutes:
1. **check-and-build:** installs, typecheck, lint, unit tests (about 5 minutes), browser smoke tests, production build.
2. **deploy:** publishes `dist/` to Pages.

When both have a green tick, the new version is live. If a step fails (red cross), click it to see why. Nothing is published until it passes.

To publish again without changing anything, use **Actions → Deploy → Run workflow**.

## What gets published

- `npm run build` makes `dist/`: the page, the game code (about 190 KB gzipped), fonts with their licences, icons, the app manifest and the offline service worker. The first load is about 0.46 MB gzipped; ART_AUDIO's budget is 1.5 MB.
- **No source maps** (`build.sourcemap: false` in `vite.config.ts`), so the public copy doesn't carry the readable source.
- All paths are relative (`base: './'`), so the same build works at the site's root or under `/lighthouse-keeper/`.
- The title screen shows the version from `package.json` and the date of the build.

## Releasing a new version number

1. Change `"version"` in `package.json` (and the two matching lines at the top of `package-lock.json`).
2. Add a section to `docs/RELEASE_NOTES.md`.
3. Commit and push.

## After an update, phones keep the old version for one visit

The offline copy is replaced in the background. A phone that already has the game shows the old version once more, then the new one next time it opens the game online. This is normal for installable web apps.

## Checking a build on this computer first

```
npm run build
npm run preview
```

Open the address it prints. This is the only way to try the offline and install features before publishing, because the service worker is off in `npm run dev`.
