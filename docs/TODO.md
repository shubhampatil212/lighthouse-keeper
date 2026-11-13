# Future to-do

Open items waiting for a decision or a later phase. Details and numbers are in `docs/balance-report.md` (run `npm run playtest` to refresh it) and `docs/PROGRESS.md`.

## Needs the owner's decision

- [ ] **The economy is far too generous (CONTENT.md §8).** With the coin and price numbers in CONTENT.md, a ★★★ region pays 2–4× the target. A keeper can afford every upgrade (about 1,200 coins) by region 2–3. The numbers have not been changed. Options:
  - halve the coins per ship (CONTENT.md §2)
  - steepen upgrade prices (the shop's cost growth, 0.6, in CONTENT.md §4)
  - both

  After deciding, update CONTENT.md and `src/data/`, then rerun `npm run playtest` and check the economy table.

## Balance (phase 10 balance pass)

- [ ] **Some balance numbers are off target** (all listed in the report's "Outliers" section):
  - The "smart" bot gets close to ★★★ on many levels.
  - The "sweeper" bot fails too often on 3-6, 4-5, 4-6 and 5-2, and too rarely on 3-4, 5-3 and 5-5 (target: fails 20–40% of region 3–5 levels on Keeper).
- [ ] **The smart bot knows where every rock is,** so real first-time players will find levels harder than its numbers suggest. Check the bot numbers against human play-tests before tuning further.
