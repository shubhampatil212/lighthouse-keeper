# Phase 10 — QA, balance & release

**Goal:** a stable, balanced 1.0 build, deployed to a public URL.

## Read first
All of `docs/`, especially `PROGRESS.md` and `balance-report.md`.

## Tasks
1. **Test sweep:** extend the Playwright tests to cover: the first-launch flow, finishing a level (with a debug fast-win hook that only exists in test builds), shop purchases, settings saved after a reload, save import and export, endless mode start and end. Run them in Chromium, WebKit and Firefox at phone and desktop sizes.
2. **Balance pass:** run the bot play-tester across all levels and difficulties, fix outliers, check that the economy matches CONTENT.md §8, and update `balance-report.md` with a short summary at the top.
3. **Content check:** proofread every string, check the logbook entries, make sure all 30 levels have a briefing and bonus objective, and that the credits list the fonts with their licenses.
4. **Error handling:** a global error handler that shows a gentle "Something went wrong — reload" message instead of a frozen screen, and keeps the save safe.
5. **Build:** a production build with version number and build date shown on the title screen, and source maps kept out of the public deploy. Report the bundle size and compare it to the budget.
6. **Deploy:** add a GitHub Actions workflow that runs all checks, then deploys `dist/` to GitHub Pages (or Netlify/Vercel if the owner prefers — ask). Write the steps in `docs/DEPLOY.md`.
7. **Release notes:** `docs/RELEASE_NOTES.md` for 1.0 in plain language.
8. Write a **Known issues & ideas for 1.1** list in PROGRESS.md (for example: leaderboards, more regions, the store wrapper).

## Acceptance checklist
- [ ] All automated tests pass in all three browsers.
- [ ] The owner has played the full campaign (or a large part of it) on Keeper with no blocking bugs.
- [ ] The game is live at a public URL and works offline after the first visit.
- [ ] Release notes and DEPLOY.md exist.
