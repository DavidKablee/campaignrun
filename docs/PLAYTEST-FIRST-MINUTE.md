# First-minute playtest (8–10 players)

Why: the whole product rides on whether a stranger understands the game, finishes a run and sends it on within their first few minutes. Nothing so far has measured that. Every check to date was by the people who built it, plus one phone driven by synthetic touches. This is the kit for the real thing. It needs people; an agent cannot run it.

## Who
- 8–10 adults (the game is 18+), Nigerian, mostly on their own mid-range Android phone. At least 2 on an older or 2 GB phone, 1–2 on an iPhone, ages spread across 18–50.
- Not friends of the project, and not people who have seen it. Do not explain anything beforehand.
- Mix of states if you can (the state worlds are a hook; a Kano player should see Kano).

## Setup
- A hosted HTTPS build (see `docs/DEPLOY-CLIENT-ONLY.md`), or the LAN address for a few people in the same room.
- Their phone, their data or Wi-Fi, their browser. Note the model, browser and connection.
- Screen recording only with their spoken consent, and only of the screen, not their face. No name, number or account is needed. Write the player as P1, P2… on the sheet.

## Script (read exactly, then stay quiet)
1. "I'll send you a link. Open it and play as you normally would with a new game. Say out loud what you're thinking. I can't help, and nothing you do is wrong."
2. Send the link by WhatsApp (this tests the link preview and the open-from-chat path).
3. Watch the first 5 minutes without speaking. Time things with a stopwatch.
4. After the first run ends, ask nothing for 20 seconds and see what they do.
5. Then the questions below.

## What to log per player
| Moment | Record |
|--------|--------|
| Link opened | Did the WhatsApp preview show the image and title? Seconds to first paint. |
| Splash | Did they find Play without help? Did they read the disclosure? |
| First card | Did they get the lane flick on the first try? Seconds to the first lane change. |
| First pickup | Did they brake before or after reaching the zone? Did they work out "flick down and hold" without help? |
| First venue | Did they unload? Did they notice the beat? |
| First hit | Reaction (laugh, frown, quit?). |
| Finish or breakdown | Reached the end? Their reaction to the score. |
| After the result | What did they tap first? Did they send a challenge, start a second run, or put the phone down? |
| Second run | Did it happen without prompting? |
| Phone | Frame rate feel (smooth, choppy), heat, battery, anything that failed. |

## Questions (after, in this order)
1. "What was the game about?" (their words)
2. "What did you do to load people? What did you do to unload?"
3. "What was confusing or annoying?"
4. "Would you send this to someone? Who, and how?" Then: "Send it to them now" and watch what they tap.
5. "Which state did you want to play? Did it look like it?" (only if they saw a non-Lagos state)
6. "Was anything in the game uncomfortable or wrong to you?" (legal and cultural flags; write down exactly what they say)
7. Pidgin: switch on Settings → Naija Pidgin on the road for one run. "Does that sound right?" Record their rewrites; they feed `docs/research/pidgin-review.md`.

## Targets (our own, not industry benchmarks)
These are bars to learn from, not guarantees. With 10 players one person is 10%, so look for patterns, not percentages.
- At least 8 of 10 change lane within 10 seconds of the first card.
- At least 7 of 10 load at the first pickup without help.
- At least 7 of 10 finish or break down their first run and then start a second one unprompted.
- At least 4 of 10 tap a challenge button when asked to send it, and the WhatsApp message arrives readable.
- No one reports a device that overheats, freezes or cannot load the page on their connection.

Reference only: public 2025 mobile retention data put median Day-1 retention around 22% and Day-7 around 4% (GameAnalytics via [gamedevreports](https://gamedevreports.substack.com/p/gameanalytics-hypercasual-games-metrics)). A 10-person session cannot measure retention. The launch funnel (`pnpm --filter @cr/api report`) can, once there are visitors.

## After
- Group every confusion by moment. Fix the earliest moment first: a player lost at the lane flick never reaches the brake.
- Anything a player calls wrong or uncomfortable goes to `docs/research/` with the state or screen and their words, and is fixed or ruled out before launch.
- Rerun with 5 new players after the fixes. A fix that was never retested is a guess.

## Sign-off
Run by: —  Date: —  Players: —  Status: not run
