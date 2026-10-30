# Review of C13–C19: which of them earn their cost

Written 2026-10-28, 79 days before the 15 Jan 2027 close (the vote is 16 Jan). Judged on one question: does it change what a player does tomorrow, or what happens on 16 Jan? What each costs is the build, but also the moderation, legal and running cost that never ends.

## Where each one stands today
| Chunk | Original scope | What already exists | Still missing |
|-------|----------------|---------------------|---------------|
| C12 | Replay verification, ghosts, friends, Boosts, Wave | Server replay check on `POST /api/scores`; client ghosts (C29) | Friends, Boosts, Wave; all need a live API |
| C13 | Running mates / teams, chants, Live Feed, report queue | Username filter (hashed blocklist) | Everything social |
| C14 | Rally Map, 200-unique gate, Practice, consent | Campaign map, standings with a player floor, practice mode, Contender consent, weekly state tally (C78) | Other players' Contenders on the map (needs the API and consent) |
| C15 | Ledger, Paystack, cosmetics, Pass | Local coins and the Convoy Yard | The server ledger and any real money |
| C16 | Rides, rivals, remaining Integrity events | All 7 rides (C26), rivals and events (C28), traffic (C49), the balance bot per ride class (C26) and on the hardest roads (C45) | Nothing: **closed**. The first version of this review wrongly listed the per-ride balance pass as missing |
| C17 | Sponsor slots, self-serve portal, PSAs, prize OTP flow | Nothing | All of it |
| C18 | State Coordinator, Weekly Tour, weather and NEPA, Rally Saturday | Weekly packs (C10), weather and time of day (C30), **Rally Saturday's double Crowd in the sim (6–9 pm Lagos, replay-safe)**, a remote calendar and notice (C78) | A weekly rhythm players can see. The first version missed that Rally Saturday already existed; it was only invisible. Built as the Weekly Tour banner and a Rally Saturday announcement in C81 |
| C19 | FCT finale, Final Week, 15 Jan auto-close, archive | Auto-close and practice mode after the close (C78, via `flags.json`) | An FCT world, a Final Week, the finale itself |

## Verdict
**Build, in this order**
1. **C19 (lite), because it is the reason the game exists.** The one fixed date in the product. It gives urgency every day until then, a story to share, and a clean end. Needs an FCT world (one of the 12 states with no world), a Final Week run in the last 7 days, and the close already built. Skip the 150k load test unless the API is public by then. "Protect the Count" must keep guardrail 3: defending the count, never the player committing fraud or violence.
2. **C18 (lite), because it is what brings people back.** A weekly rhythm: a featured state and one road modifier per week, "Rally Saturday", announced through `flags.json` with no server and no moderator role. Weather and NEPA already exist, so the work is the schedule and a banner. Skip the State Coordinator role (it is a moderation job).
3. **C14 (finish), only once the API is live.** The state-versus-state feeling is already there through the weekly tally, counts only, with no one's Contender shown. Add other players' Contenders only if people ask, because it needs the consent flow, the 200 gate and a legal sign-off.
4. **C16 (close out).** Already done; see the table.

**Defer until there is proof that people play**
- **C15 payments.** Card and wallet spend per Nigerian mobile player is small; real money, refunds, fraud, tax and a politics-themed game on the Play Store are a lot to carry before day-7 retention is known. Revisit when D7 is measured. The idempotent-webhook and no-negative-balance rules in the original "done when" are right and should survive.
- **C17 sponsor slots.** Plausible later, but with the guardrails (no ad targeted by Contender, banned categories) it needs a review queue. Do not build a self-serve portal first.

**Skip**
- **C13 Live Feed, report queue, teams.** The Contender-choice data is sensitive, the feed would be user-made content in a political game, and the Cybercrimes Act has been used against online satire. It needs a moderator and a legal answer for every post, and it would not change what a player does on day 2 more than a WhatsApp challenge already does. Friends in C12 are covered by the challenge link.
- **C17 prizes and the OTP flow.** Prizes with a phone verification are a lottery and data question (gaming regulation, personal data), and would break "no paid randomness" in spirit. Not worth it.

## What would change this verdict
- A real-player test showing the first run is not understood: then fix that before anything here.
- A hosted API with real players: then C14 and C15 get re-priced on real D1 and D7.
- A lawyer's view that any of C13 is safe: still skip unless the product needs it.

## The honest dependency
None of this reaches anyone until the client is hosted (`docs/DEPLOY-CLIENT-ONLY.md`). Every week without a public link is a week less of the countdown.

## Update, 2026-10-30 (C81)
C19-lite, C18-lite and the C14 check were built; C16 turned out to be closed already. See `docs/chunks/C81.md`.
