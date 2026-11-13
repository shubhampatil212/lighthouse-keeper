# Future to-do

Open items waiting for a decision or a later version. Details and numbers are in `docs/balance-report.md` (run `npm run playtest` to refresh it) and `docs/PROGRESS.md`.

## Done in phase 10

- [x] **The economy was far too generous (CONTENT.md §8).** Owner left it to Claude: coins per ship halved (CONTENT.md §2) and the shop's cost growth raised from 0.6 to 1 (§4). A ★★★ region now pays 0.8–1.6× the cost of maxing Brighter lamp (about 1.2× on average), and everything in the shop becomes affordable during region 4.

## Balance (after human play-tests)

- [ ] **A few levels are still off the bot targets** (listed in the report's "Outliers" section). The sweeper bot fails too often on the finales 3-6 and 4-6 and on 4-5 "Moonless", and too rarely on 3-4, 5-3 and 5-5. 5-3 was made busier in phase 10, which helped the careful bots more than the sweeper. Wait for human play-tests before tuning these further.
- [ ] **The smart bot knows where every rock is,** so real first-time players will find levels harder than its numbers suggest. Check the bot numbers against human play-tests before tuning further.
