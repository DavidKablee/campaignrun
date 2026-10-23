# Changelog

## 2026-10-23 — C48 a Convoy Yard that explains itself

- **The only economy screen in the game named no source for any number on it.** Two currencies, five priced upgrades, a streak, a donation and seven gated rides, all bare figures. Following has exactly one source — one per supporter delivered — and the Yard never said so, which made "20000 Following" on the Danfo card a number with no action attached to it.
- **The upgrades were unjudgeable, and the shop could not have fixed that** without a fourth copy of each number: `meta.json` held the step, the client's `runModifiers()` re-typed every one as a literal (with the horn's base and floor existing *only* there), and the store re-typed the payout step a third time. Each upgrade now declares its effect in content, `packages/content/src/yard.ts` is the single place that turns a level into a number, and the client's copies are gone — so a row can read `Horn recharge 12.0s → 10.5s · Level 1 of 5` and a test can assert that figure is the one the sim is handed.
- **A fourth tab, How it works**, states what Funds and Following are, what each buys, what one finished rally pays line by line, and — plainly — that the rally streak buys nothing yet. It was also mislabelled "Day streak" while counting finished rallies, not days.
- **The three wallet tiles are one row of equal cards** on a shared three-row `subgrid`, so label, figure and source line share a baseline across all three however differently their text wraps. Equal to the pixel at 360, 390 and 1280 wide. The next-ride progress moved into its own bar underneath, which is what let the tiles get short enough to match.
- Locked rides now say what is missing in the unit a player can act on ("about 150 more supporters delivered"); goals say what they pay and that only a *finished* rally counts; an unaffordable upgrade says `₦100 short` instead of greying out.
- **Fixed: the loading text rendered against the left edge of the screen.** It was a bare paragraph borrowing the briefing screen's 560-px centred column — centred as a block, left-aligned as text. It is its own centred screen now, with a spinner, measured dead centre at both phone and laptop size.
- Seven new content tests, all about claims the screen now makes out loud — including that every ride gate is reachable and that a day of goals covers the cheapest upgrade. 312 tests (was 305).

## 2026-10-23 — C47 screens that fit a phone

- **The Convoy Yard was 3.7 phone screens tall.** Goals, then every upgrade, then a showroom card per ride with the five handling bars C44 added — so comparing two rides meant scrolling until they were too far apart to compare. It is tabbed now (Goals · Upgrades · Rides), about one screen per tab.
- **The briefing put Start the run below the fold.** The route trail was seven full-width cards and the ride picker was four rows of them; both grew in C44 and C45 with nobody measuring the result. Trail is wrapped pills, rides are a swipe strip, hazards are two-up, and Board / Start the run are pinned to the bottom of the screen. 1.84× → 1.14×, with Start visible at load.
- **The roster hid the roster**: a 5:4 half-body portrait plus six stacked cards put the Contenders you were choosing from entirely below the fold. The cards are a strip under the hero and the portrait is capped against the viewport. 1.66× → 1.11×.
- Two long card lists (the showroom, the briefing's ride picker) became horizontal snap strips on phones and revert to the original grid at 700 px. The map's 37 state chips and hex stage are capped at 36/34 vh; the chip list stays complete and keyboard-reachable, because the hex stage is `aria-hidden` and the chips are the only pointer-free way to pick a state.
- **About and Account were left long on purpose.** Their length is the disclosure, the privacy notice and the consent copy. A page of text that a reader scrolls is working; shortening it to win a screen would trade an obligation for a layout preference.
- Caught in passing: the briefing's one-line tip still told the player to press a BRAKE pad, which C46 removed.

## 2026-10-23 — C46 the run is driven with a thumb

- **The pads are gone; the thumb drives.** Flick left/right for a lane, flick up to hop, **flick down to brake — and the brake stays on while the thumb stays on the glass**. That last one is the whole chunk: a pickup needs a full second of braking and the old brake was a pad in the bottom-left corner, so holding it meant giving up the swipes that change lane. One thumb could not play the game it was shipped for.
- **The convoy drives itself.** With the gas pad gone, `controls.autoGas` holds the throttle and the brake is the player's only speed input. Gas beats brake inside the sim, so auto-gas stands down whenever the brake is on.
- **The beat finally says what it is.** It was an unlabelled pad holding the largest single bonus in the game (×1.5 crowd on a delivery) behind a window nothing told you was open. It is now a double tap, and the pad shows `double-tap · ×1.5` when idle and `n/2 taps` with a draining bar while the window is open. `bonuses.onBeatTaps` drops 4 → 2 so that one double tap earns it — the sim still counts real taps rather than crediting a gesture with taps nobody made.
- **Horn is a held finger. Perk keeps its pad** — it and the beat are the only two controls timed against something the player must see, which is why they are the only two left on screen. A `BRAKING` tell replaces the pad that used to light up.
- **Two flicks inside one frame used to become one.** The old controller ORed its one-shot bits and cleared them after a tick, and the sim is edge-triggered — so the second flick of a double-spawn dodge was swallowed. One-shots now queue with a blank tick behind each.
- **The gesture reader is pure** (`apps/game/src/input/gestures.ts`): pointer positions and a timestamp in, gestures out, no DOM. That is what lets a thumb-driven scheme have tests at all — ten of them run in the node environment. Every threshold lives in `packages/content/data/controls.json`, and content tests hold the invariants: a flick must clear the circle a tap may wander in, a hold must outlast the longest tap, and the brake's run-on after a lift must be shorter than a load, or a flick could load a pickup on its own.
- Caught in passing: the swipe buzz ignored the player's haptics setting outright; tabbing away mid-run left the brake and horn stuck on; a flick down on a phone was also a pull-to-refresh, and a held finger raised the platform's own long-press menu over the horn. 305 tests (was 287).

## 2026-10-22 — C45 the road decides which ride is right

- **A state's hazards now do something.** Thirty-eight packs listed three hazards each (C34 even closed them to an enum, calling them "the shortlist of road events the game is meant to grow") and nothing ever read one: Bayelsa's `flood-sheet` and Borno's `dust-storm` generated the same road from the same weighted table. Each of the twenty hazards now carries obstacle-weight multipliers and a road block (top speed, pickup, braking, lane change, spawn gap, double-spawn chance), composed per state into one profile.
- **No new rules — the road leans on the ones that existed.** A flood state is a state where `flood-patch` is four times as likely, and C26 already blocks size L on a flood patch; a cart-weave state is thick with light barriers, which a Danfo already ploughs. C26's three size rules fired on about 5% of spawns everywhere, equally, forever; they now vary by state, which is what makes C44's seven rides a choice rather than a ladder.
- **Go-slow is deliberately mild** — it is in 37 of the 38 packs, so it is what a Nigerian road is, not a difficulty setting. A test holds its numbers within 5% of neutral. The other two hazards are what tell one state from another.
- **The briefing names the hazards and gives a verdict on the ride you picked** ("Floodwater here stops a ride this big", "this ride hops the holes with room to spare"). Every line is read off the composed profile rather than written per state, so it cannot promise what the course generator will not do; the keke, being the yardstick every figure is measured against, says nothing at all.
- **Clamps on the composed road are load-bearing.** Three hazards multiply, and what they multiply towards is a road where a slow ride sits pinned at the coast speed and the gas pedal stops meaning anything. A content test walks all 38 packs × 7 rides to prove no shipped road gets there, and momentum was re-checked on every ride on every kind of road — the cliff C44 found was one bad number away again.
- The balance bots re-check guardrail 5 on three real roads now (Adamawa's bends, Borno's dust, Bayelsa's flood), because a state can multiply the four stats two of the six Contenders trade on. Still within ±3%.
- Caught in passing: `maxCrowdFor` bounds rival Crowd by how many entities fit at the tightest legal spacing, and a busy road packs them tighter than it assumed — the floor is now a config number (`course.roadGapFloorPermille`) that the road clamp is tested against, rather than a bound that would have started rejecting honest runs through Cross River. 287 tests (was 257).

## 2026-10-22 — C44 seven rides, not one ride with more seats

- **Every ride now handles differently.** A ride carries a `handling` block (lane change, pickup, top speed, braking, hop airtime) plus a scatter and a rival-draw figure, all permille of the sim's own numbers and all defaulting to 1000 — so a pack that omits them drives exactly as before. The sim knew four things about a ride before this, three of them held by one ride each, so a danfo was an okada with more seats and the Danfo's own flavour text ("slow lane change") had never been true.
- **Every ride now costs something.** A new `tradeoff` field sits beside `trait`: the okada is the fastest thing out and loses 40% more of its crowd to a knock; the Grand Convoy holds the most, ploughs barriers and has the widest magnet, and draws 60% more rival traffic. It read "Cosmetic flex; requires Spread badge" before, and the badge does not exist.
- **Momentum had never worked.** It grows while speed exceeds `maxSpeedUm × fastThresholdPermille`, and that threshold was 1050 permille of a speed the sim clamps to 1000 permille of — unsatisfiable by construction, so the multiplier sat at ×1.0 for every run ever played and the HUD showed a meter that could not move. It is now measured against the ride's own ceiling (otherwise a slow ride inherits the same cliff) with the threshold at 950. Crowd per run rises by up to 1.5×, so scores either side of this line are not comparable.
- The C05/C26 balance bots still hold the six Contenders within ±3% mean Crowd on all seven rides — now with the shipped handling applied, which it never was: the bot spelled the ride fields out by hand and had been testing a neutral version of every ride. `rideSimTraits()` replaces that copy and the two others (live run, ghost replay) that had already drifted apart.
- **The Convoy Yard became the showroom**: upside, cost, and a bar per stat measured against the keke — worse left of a centre line, better right. The keke shows no bars, which is what "Balanced" means. The briefing gets the two sentences only.
- Caught in passing: the first draft of the heavy rides' copy said "wades floods" when C26's rule has floods blocking exactly those rides (a test now ties every mechanical claim in ride copy to the mechanic); and the stat figures measured 4.49:1 against AA's 4.5, so the bars keep the bright colours and the figures are a shade darker. 257 tests (was 240).

## 2026-10-22 — C43 the page where you dress a Contender

- **You could not read the clothes.** C38 made the side panel a white card and left every control inside it painted for the dark ground it used to sit on, so the seven garment names, the back link and both perk chips were cream on white. The only option you could see was the selected one's outline — you picked clothes by tapping blanks and watching the model. Same failure as C40's daily chip: a colour that was right before the chrome moved.
- **The buttons were below the fold with nothing to scroll.** `.cr-screen` is `flex: 1` with no `min-height`, so the screen grew to 1072px on an 896px phone, and `grid-template-rows: … 1fr` is `minmax(auto, 1fr)`, so the panel track would not shrink either. The screen is now bounded, one scroller holds the content, and the action bar sits outside it.
- **It said "Campaign in Lagos" on all 37 states** — the bug the roster's state pill had before C40.
- The editor now says what you have changed: a dot on each edited tab, a Reset that is disabled until there is something to reset and names how many slots it will undo, and swatches labelled with the slot they paint. `changedSlots()` in `apps/game/src/studio.ts` is the one piece of logic and counts a recolour as a change, since recolouring a shirt you kept is the first edit most players make.
- Reset moved out of the action bar and in with the controls it undoes; two buttons down there cost a third of the scroller on a phone and clipped the state name off the one that matters.
- One line of fineprint answers what the page never did: the outfit stays on this device and does not change how the Contender plays. 240 tests (was 233).

## 2026-10-22 — C42 two ways to sign in

- **A board name is now enough to start.** `POST /api/auth/guest` makes a real server account with no address and no password, held by a random device key that lives in that device's storage and is stored hashed. `POST /api/auth/device` trades the key for a session once the cookie lapses, which is what a returning player hits — there is no login for an account with no password.
- That is said plainly rather than discovered later: a name is not a credential, so the account cannot be opened on another device, and clearing site data ends it. Both lines are on the sign-in screen and in Account.
- **Name-only runs are saved but stay off the public boards**, which needed no new code — C41 already counts confirmed addresses only. It is the right answer and not merely a convenient one: these accounts cost one POST, and what the 200-player floor withholds is other people's Contender choices.
- **Attaching an email** takes an address and a password together and turns the account into an ordinary one that can sign in anywhere. It refuses to overwrite an address that is already there, because that needs proof of control of the old one and this route asks for no password.
- **The ask comes back on a ladder** — after three banked runs, then 24 hours, 3 days, a week, with the last rung repeating. No permanent "never": the ask is the only route to a second device, so dismissing it forever would quietly promise a campaign the account cannot keep. The counter is in the database, so clearing site data does not reset it.
- `users.email`, `password_hash` and `password_salt` are nullable now, so the routes that had assumed otherwise say so: `no-email` from resend, `no-password` from change-password, and no Sign out button on an account that has nothing to sign back in with. The seven routes answering with a user object went through three different copies of its shape and now share one.
- 233 tests (was 202).

## 2026-10-22 — C41 the account layer stops being unsafe to ship

- **Rate limiting**, in two layers. An in-process window per client address on every auth route, and a lockout in the database keyed on the *address being attacked*, which survives restarts and IP rotation. Unknown addresses are counted too, or the lockout itself would say which addresses have accounts. A correct password does not open a locked account; a reset does.
- **Password reset and email verification.** One-time tokens stored as SHA-256, single-use by construction, a second request invalidating the first, and a reset that destroys every session on the account. `forgot` answers identically for an address that exists and one that does not. Verification has teeth: public boards and live standings count confirmed addresses only, because the 200-player privacy floor is a formality if 200 signups is an afternoon of scripting. There is no mail provider — the API refuses to boot in production without one rather than printing reset links into a log nobody reads.
- **Scores are checked against what the simulation can produce.** `isPlausibleRun` moved to `@cr/sim` and now runs server-side, with capacity read from the ride rather than the request. Turning it on exposed a bug in the check: its crowd ceiling was written in C09 and never learned about the PVC buff, Rally Saturday or the signature-ride bonus — another 2.4x — so enforcing it as-was would have rejected real Rally Saturday runs.
- Board `limit` clamped, cookie `SameSite`/domain made configurable and validated at boot, and one JSON log line per request with an id the player can quote. Nothing logs an address, a password, a token or a Contender id.
- Client: forgot-password, a reset form, an unconfirmed-email banner with resend, and change-password. The link token is stripped from the address bar on arrival — it is a credential, and URLs end up in history and `Referer`.
- The API moved from `apps/api` to `api/` at the repo root, so the server is a sibling of the frontend rather than one of its apps. `apps/` now holds the game alone.
- CI now runs Postgres and the e2e suite. 36 API tests and 3 browser tests had been green by never running. 202 tests (was 179).

## 2026-10-22 — C40 pick your Contender, and the page after a run

- The two screens on either side of a run moved into the C38/C39 language: one white hero card for the featured Contender with the perk and the trade-off named rather than left as two matching yellow pills, six white cards with a `Yours` chip and a `Locked` chip, and a result page led by one card (tier, Crowd, who ran) with the four figures as stat cards.
- Selecting a Contender and committing to one are now separate actions. The hero only changed on hover and a tap went straight to the studio, so on a phone the perk, trade-off and Party of the other five were unreachable — you picked from a name and a thumbnail. A tap now previews; only the hero's button writes a choice. That also fixes a tap on a locked Contender doing nothing at all, and the one free post-lock switch being spent on the first tap with no confirmation (`lockAfterFinish` never clears, so that tap settled a campaign-long choice).
- The result page could not scroll — `justify-content: center` and no `overflow`, the rule the C39 settings family was fixed out of — so at 390×844 about 120px of it, the board field and the navigation, had nowhere to go. The board-name input was also `--cr-ink` on a dark slab: you could not read what you typed. Both fixed and measured.
- Found on the way: `.cr-daily-chip` body text was dark-on-dark on every dark screen, so the daily challenge's label was invisible on the briefing and after a run; the campaign close date was a second hard-coded literal beside `calendar.closeAt`; the roster's state pill always said "Lagos". 179 tests (was 174).

## 2026-10-21 — C39 about, settings, account and the Convoy Yard

- The four pages you read rather than play were redesigned as one family in the C38 language: a shared menu shell (round back button, left-aligned title, white floating sheets), real switches, and left-aligned prose. They also now scroll — `.cr-screen--settings` centred its children with no overflow, so About, Settings and Account had been silently squeezed to the viewport on a phone. The Yard's progress bars left a three-column grid that stranded every bar against the right edge on desktop, and locked upgrades and rides now state their price or what they still need instead of ghosting out.
- Account stopped lying: it still read "Cloud sign-in comes later" two chunks after sign-in shipped, and could not answer whether you were signed in. It now shows the account, an offline/guest/signed-in chip, sign-out, and a delete-account row wired to `deleteOnlineAccount()`, which had had no caller since C37. The Contender switch now writes to the server as well as the device log — withdrawing consent while signed in used to leave Contender ids on the server.
- `legal.version` moves to 2026-10-21: the privacy notice now says that an account stores an email, a board name and scores on a server, and two strings that promised cloud sign-in "later" are gone. Everyone re-accepts, which is the point of the bump. The 200-player privacy floor moved into `map.json` so the About page and the API cannot drift apart.

## 2026-10-21 — C36-C38 world map, online accounts, new chrome

- **C36:** the board is a world map. Region outlines are generated by pushing every hex-lattice point off true, keyed on the point rather than the region so neighbours keep sharing edges — an invented continent with a real coastline, on open water with a graticule.
- **C37:** accounts, an API and a database. `api/` is Hono on Node over Postgres: email sign-up with scrypt passwords, httpOnly session cookies, posted runs, public region boards, and live party standings. Guardrail 10 is enforced in the database — a Contender id is only ever stored for an account that consented, and withdrawing consent erases what was shared. A region's party breakdown is withheld entirely below `CR_MIN_PLAYERS` (default 200), because an aggregate over a handful of players names them. Not deployed; no email verification, password reset or rate limiting yet.
- **C38:** UI chrome moved to the lagoslife.app language — rounded pills, green primary and white secondary actions, soft layered shadows, floating white cards. The 3D worlds are unchanged.

## 2026-10-21 — C35 parties and the campaign map

- The board is now a results map: all 37 calendar states as extruded hexes on an invented landmass in Three.js, each region coloured by the Party leading it. Six invented parties, one per Contender (Market Union, Toolbox Guild, Ledger Society, Lantern Circle, Speaker Collective, Chalkboard League), shown at the point of choice as well as on the map. Your tally in a region is your real best Crowd; the other five are generated from the state id, and the generated deal is balanced by construction so no Party can lead more than one region more than any other before anyone plays — the first version left one Party on 13 regions and another on 1. No percentages anywhere (guardrail 2), no slogan or symbol field on a Party (guardrail 3), and the legend says plainly that rival Crowd is generated for play, not collected.

## 2026-10-20 — C34 the remaining 28 state packs

- Every state the calendar unlocks now has content behind it: 28 packs authored (9 Nov through the 4 Jan finale), each with five landmarks, palette, scenery, hazards, signature ride and a welcome line. No landmark is named after a person and none is a palace. `hazards` became a closed enum, and `farewellLine` is a new optional field so a state only gets a farewell in a language it actually speaks. Playing a non-Lagos state for the first time exposed a bug the packs had been hiding: the border gate and finish line were hard-coded to "WELCOME TO LAGOS" and a Yoruba thank-you — both are now read from the pack.

## 2026-10-20 — C33 characters and city read as 3D

- The flatness was lighting: hemisphere light is not put through the toon ramp, so a 1.25/1.35 floor already saturated the ramp's top step and nothing could have a shadow side. Rebalanced both rigs, added real shadow maps and contact shadows to the studio and portrait bakes. Silhouette fixes: arms now sit outboard of the shoulders (they were inside the torso, so same-coloured tops rendered a character with no arms), shoulder yoke, visible neck, and headwear scaled to the head it sits on. Also fixed an intermittent blank-portrait bug — the picker created two WebGL contexts in one tick and browsers drop the oldest past the cap.

## 2026-10-20 — C32 portraits render

- Contender picker showed blank gradients: the portrait camera still used pre-chibi eye heights (C21), `headtie` was a full sphere that occluded the face plate, and the hero slot centre-cropped to the torso. Framing is now measured from the rig's bounds; the hero is a half-body shot showing each signature prop.

## 2026-10-20 — C31 roster names

- Roster restored to the original fictional six (Mama Ankara, Engineer Spark, Captain Kobo, Sister Beacon, Uncle Boombox, Madam Metronome); the previous names were phonetic echoes. Saves migrate by id. The hashed blocklist shipped empty and is now seeded, with a test so it cannot silently empty again.

## 2026-10-10 — C30 weather & time-of-day (track complete)

- Closes the content/gameplay upgrade track (C26–C30): spec section 6.8's "Nigerian rhythm" — NEPA night outages, harmattan haze (Dec-Jan, north), rainy-season mood (Apr-Oct, south), and the Rally Saturday ×2 Crowd window. All decided once per run by a single new pure function, `computeWeather(nowMs, zone, runSeed)` in `apps/game/src/weather.ts` — the only place in the whole client that reads a real clock for this; neither `packages/sim` nor the renderer's per-frame code ever does.
- Rally Saturday is a real, tested Crowd multiplier (a new `rallySaturdayMultiplierPermille` field on `SimState`, applied in `deliverCrowd`), not just a visual label — sim only ever applies the number it's given, keeping the no-Date/no-Math.random purity rule intact.
- `World.applyWeather()` drives a smooth day/night lighting blend, harmattan/rainy-season fog and sky-colour shifts (3 new sky gradient textures alongside the existing day one), and a NEPA outage adds a warm "phone torch" point light riding with the player.
- 6 new tests in `apps/game/test/weather.test.ts`, 1 new sim test for the Rally Saturday multiplier — 97 tests total.
- Both the visual & feel rebuild (C20-C25) and the content breadth & client-side gameplay upgrade (C26-C30) tracks are now complete. What's left (server replay verification, friends/teams, the community Rally Map, payments, ads, live-ops, the finale) all needs real backend infrastructure the user has to provision — see `docs/STATUS.md`.

## 2026-10-10 — C29 local ghost record/playback

- The client-side-only slice of C12: a translucent ghost of your own personal-best run for a state now races alongside you on your next run there. Input is recorded sparsely (on change, not every tick) throughout a run; a clean finish beating the stored best for that state is saved to `localStorage` (`ghostStore.ts`); the next run of that state decodes and replays the log once up front into a plain per-tick position array (`ghostReplay.ts`, fully deterministic, no live second sim), which the renderer indexes by the live run's own tick counter.
- Ghost renders as a translucent cyan silhouette (new `ghostMat()`, reusing the existing crowd-supporter geometry rather than the full character rig — cheap, no face-texture complexity) and disappears once the live run outlasts the ghost's recorded length.
- Friend ghosts and state top-5 ghosts stay backend-gated (the rest of spec C12) — this is "my own past best" only, which needs nothing but local storage.
- 7 new tests in `apps/game/test/ghost.test.ts` — 90 tests total.

## 2026-10-10 — C28 rival convoys + remaining 5 Integrity events

- The 5 Integrity events from the spec that C06 never shipped: Result Swapper, Network Glitch, Late Materials, Spot the Fake (all extend C06's exact round-robin hazard pattern — hit = integrity loss + kind-specific effect, dodge = success) and PVC pickup, correctly implemented as the positive collectible the spec describes (×1.1 Crowd buff for 10s), not another hazard.
- Rival Convoys (spec §4.6), scoped to the always-on core: NPC traffic that's touch-safe (small bump, never a dent/integrity hit/run-ender) with an Outpace Crowd bonus for a clean pass. The 3 situational sub-interactions (Contest a Venue, Face-off, Peace Salute) need bespoke mini-game UI and are deferred, documented in `docs/chunks/C28.md` rather than silently dropped.
- Rendering added for all of it so nothing ships invisible: a glowing PVC card, 4 new generic-villain variants matching the existing neutral-colours style, and rivals reusing the C26 ride models for free visual variety.
- `packages/sim/test/integrity.test.ts` extended accordingly — 86 tests total, all green.

## 2026-10-10 — C27 state pack batch 2 (Oyo, Borno, Delta, Kwara)

- Four new state packs matching the calendar's 2 Nov unlock week exactly, researched via web search for real landmark/cultural accuracy rather than placeholders (Cocoa House/Bower's Tower/Agodi Gardens for Oyo; Monday Market/Borno Museum/El-Kanemi Stadium for Borno; Niger Bridge/Effurun Roundabout/Warri Township Stadium for Delta; Sobi Hill/Owu Falls/Kwara State Stadium for Kwara). Every landmark is `verified: false` per the spec's own local-reviewer guardrail.
- Two content-safety calls made during research: no palaces used as landmark venues anywhere (the schema already has no `palace` venueType, confirmed by an existing test) — swapped for museums/stadiums/markets instead; and Borno's well-known Alau Dam was deliberately **not** used, since it catastrophically collapsed in September 2024 and flooded part of Maiduguri — using it as hazard flavour in a satirical game would trivialize a real, recent disaster.
- New content test mirrors the existing "ships the 26 Oct week" check for this batch: loads each pack, confirms `audioStem` matches `states-index.json`, every `venueType` is schema-valid, and `signatureRide` always resolves to a real (not dead) ride id.

## 2026-10-10 — C26 ride roster complete

- Starts the **content breadth & client-side gameplay upgrade track (C26–C30)**, following up the visual rebuild. Keke/Hilux/Danfo/Coaster/Grand Convoy flip from locked to playable, and their previously-flavour-text traits get real mechanics: ride size-class collision rules (narrow gaps block M/L, floods block L, light barriers ploughed by Danfo+), Hilux's free-hit-per-run, Coaster's wider magnet, and the state's Signature Ride +10% Crowd bonus (the `signatureRide` field existed in content since C07 but was never read by anything).
- Balance bot extended from trek-only to all 7 ride classes (6 Contenders × 120 runs each) — this is acceptance criteria #4 from the original spec, never actually checked past 2 of 7 rides before now. Still holds ±3%.
- Found and fixed a real gap outside the original plan: only `okada` had a 3D vehicle model, so the other 5 rides would have been selectable but rendered the character just walking — shipped-looking-broken. Added procedural models for all of them and generalized `GameRenderer.ts`'s one hardcoded ride check into a small per-ride visuals table.

## 2026-10-09 — C25 cross-cutting QA + perf hardening (visual rebuild track complete)

- Fixed a real PWA bug: the CC0 colormap texture (`.png`, matches the Workbox precache glob) was leaking into the service-worker's initial install because `models/` wasn't excluded. Added `models/**` to `globIgnores` and a `CacheFirst` `runtimeCaching` rule (`cr-biome-models`) mirroring the existing state-pack caching — models now cache on first use, not on first app load, and stay available offline after that.
- Confirmed via the Live Board that only Lagos is unlocked right now, so there's no live regression surface on other states to check yet.
- `docs/ARCHITECTURE.md` and `docs/PLAYTEST.md` updated with a visual-rebuild-track summary and a real-device QA checklist.
- **This closes the visual & feel rebuild track (C20–C25)**, started because character models, movement, world/environment and the landing page were flagged as low quality. Biggest open item: none of it has been checked on a real phone yet — only browser-preview emulation, which can't produce trustworthy fps numbers. See `docs/STATUS.md` Blockers.

## 2026-10-09 — C24 landing page polish

- Rewrote `apps/game/waitlist.html`: was a bare unstyled page with a stale pre-launch date ("the road opens October 19") even though the game already shipped and Lagos is playable today. Now on-brand (same palette/fonts as the in-game UI), honest "Lagos open now" copy, a Play-now CTA straight into `/`, and the approved disclosure line.
- Fixed a real bug in the old copy: the email input was `required` while the surrounding text called it optional.
- Reviewed the in-app splash and the live 3D showcase hero — no changes needed, since the hero drives the real `GameRenderer` and already inherited every C21–C23 visual improvement automatically.

## 2026-10-09 — C23 world: real CC0 integration (first pass)

- `world.ts` now actually uses the C20 Lagos biome kit: real CC0 palm trees on `park`/`island` themes, CC0 parasols mixed into market stalls, loaded once and cloned per placement (shared geometry, cheap). Chunks built before the kit resolves fall back to the procedural prop and pick up the CC0 one on their next recycle a few seconds later — no loading screen needed.
- Added a sun-glow sprite to the sky (the sky gradient itself was already decent — fixed the actual gap instead of redoing something that worked).
- New debug harness `/debug-assets.html?theme=park|island|market|...` jumps straight to a theme's course distance for visual/perf checks without surviving a full run. Measured draw calls/triangles there (the harness's fps readout is unreliable under the automated preview's throttled rAF): market 48 draws/34.4k tris, island 24 draws/36.5k tris — both well under budget.
- Explicitly deferred (see `docs/chunks/C23.md`): CC0 buildings (the existing procedural `buildings()` has real per-shop styling a straight swap would flatten), sidewalk/curb geometry, LOD on far chunk slots, and a real phone/throttled low-end pass.

## 2026-10-09 — C22 animation & movement feel

- `poseCharacter`'s run pose is now continuous in `speed01` (smoothstep-based amplitude/frequency) instead of a hard `stand`/`run` boolean switch that snapped at a fixed speed threshold — the main source of "robotic" movement. Secondary motion: torso/head trail the leg phase slightly.
- Hop tuck blends in/out via a continuous `hopAmt` instead of a hard overwrite past a threshold; landing now triggers a brief squash-stretch on the character plus a small camera dip.
- Camera position and FOV ease toward their targets every frame (previously hard-set, no lag); added a small eased roll on lane changes; hit shake switched from random jitter to a decaying oscillation.
- New speed-streak particle juice above 62% speed (off under reduce-motion/data-saver).
- Fixed a real bug found while in this code: the okada seat offset in `buildPlayer()` still used the pre-C21 skeleton's `HIP_Y = 0.94` instead of the chibi skeleton's `0.5` — would have seated every okada rider at the wrong height.

## 2026-10-09 — C21 chibi character rebuild

- Replaced the realistic ~7.2-head character (15+ overlapping primitive face parts, flat 2-tone shading — uncanny/lumpy on a real phone) with ADR-0008's chibi direction: ~4.3 heads tall, far fewer/bigger primitives, a single baked 2D face texture, and a real toon outline shader.
- Two real bugs found via a new debug harness (`debug-assets.html?face=1`) and fixed: (1) the face plate sat behind the cranium sphere's surface at its center, so the opaque sphere occluded the iris/pupil — fixed by pushing the plate out to clear the sphere everywhere it covers, not just at its own center; (2) the outline shader referenced `objectNormal`, which MeshBasicMaterial only declares under `USE_ENVMAP`/`USE_SKINNING` — silently failed to compile, so no outline ever rendered. Switched to the raw `normal` attribute (always declared).
- `'hi'` detail (player + studio) gets the textured face + outline; `'lo'` (baked crowds, always `'lo'`) stays a single merged vertex-coloured draw call with a simplified face — no extra cost for crowds.
- No API changes: `GameRenderer.ts`, `studio.ts`, `props.ts` untouched.

## 2026-10-09 — C20 visual pipeline foundations

- Starts the **visual & feel rebuild track (C20–C25)**: character models, movement, world/environment and the landing page were flagged as low quality, so this track rebuilds the render layer only — sim, content schemas and C0–C11 gameplay are untouched. See `docs/chunks/C20.md` and ADR-0008/ADR-0009.
- New CC0 environment-asset pipeline: `apps/game/src/render/assets.ts` (GLTFLoader + meshopt decoder, both already bundled in `three`, no new dependency), instanced via one `InstancedMesh` per sub-mesh so a multi-part prop still costs one draw call per part regardless of instance count.
- Lagos biome kit (19 Kenney CC0 models — buildings, market props, palm trees, grass, stone paths) under `apps/game/public/models/lagos/`, 63.2 KB gzip against a 1.5 MB/biome budget enforced by `tools/size-check.mjs`. First-load budget unaffected (still 296 KB gzip) — `models/` is excluded the same way `states/` is.
- `apps/game/debug-assets.html` is a dev-only pipeline sanity page, not shipped in `dist`.

## 2026-10-09 — Fix blank run view

- Memoized run landmarks so HUD updates no longer remount the WebGL renderer (blank road after Start).

## 2026-10-08 — C11 accounts and consent

- Guest identity with local save (Terms/Privacy gate), append-only consent log, Contender data in a separate `cr-contender` store.
- Export / delete local data; share and score helpers omit Contender id until Contender-share consent is granted.
- Versioned legal copy in content; Account screen from splash/settings/about.

## 2026-10-08 — C10 weekly packs

- Kano, Rivers, Anambra, and Kaduna ship as JSON packs with glob registration (no per-state game code).
- Live board opens a state only when calendar + pack agree; Rally here sets `activeStateId` for briefing/run/share/board.
- Client travel caps (`travel.json`), weekly mission row + week rollover, and Live board travel counters.

## 2026-10-08 — C09 share, daily, PWA

- Daily challenge rotates by Africa/Lagos day with a Yard/Briefing chip and Summary reward.
- Summary can export a 9:16 share card (disclosure + “not a poll”) and post finished runs to a device-local board after plausibility + username checks.
- Vite PWA + Workbox offline shell; first-load gzip still under the 4 MB budget.

## 2026-10-07 — C08 meta loop

- Added the local Convoy Yard, Trek-only Starting Stories, five capped upgrades, WAT daily donation and missions, weekly progress, streak state, save migration, and reward breakdowns.

## 2026-10-07 — C07 content pipeline

- State packs now have a schema-checked dynamic loader, with JSON-only pack coverage and size budgets. The Contender fairness bot now uses deterministic bot inputs, so it reliably catches a real course-balance regression.

## 2026-10-08 — C06 Integrity

- Ballot Box Snatcher, Vote Buyer, and Sleepy Voter spawn in equal rotation. Hit fails Integrity; dodge restores it. HUD meter + toasts. Generic looks, civic facts in content.

## 2026-10-08 — C05 Contender perks

- Six in-run perks and trade-offs run in the sim (weave, reboot, magnet, beacon horn, street party, steady beat). HUD PERK pad. Contender locks after first finish with one grace switch. Balance bot keeps trek means within ±3% on a clean course.

## 2026-10-08 — Live board + lean chrome

- Campaign map is an election-night style Live board: state cells, open vs pending, Crowd heat, focus panel. Still game scores, not a poll.
- Roster, briefing, yard, summary, and pause use denser poster chrome with less copy. HUD adds HORN.

## 2026-10-06 — Roster names

- The six Contenders are Baba Bullabaa, Mr Tiko, Mr Obiliki, Comrade Yale, Mr. Don, and Prof. Sarah. Each one is a role joke with a different face and clothes.

## 2026-10-06 — Campaign map and radio

- Splash and a campaign map show Lagos open now, later states with their Monday dates, and this device's best Crowd. The run HUD names the landmark you are leaving and the one you are heading to.
- Each state has a station. Music is generated in the browser and only the open state's station plays. Èkó Wave is Lagos.

## 2026-10-06 — C04 rides

- Trek and Okada are selectable. Okada unlocks at 150 Following. Result screen shows Foothold, Majority, or Landslide, scaled to the ride.

## 2026-10-06 — Parody names

- AGENTS.md allows parody names. A name or face that is close to a real person is still forbidden. The roster that day was six role names; it was replaced later the same day.

## 2026-10-06 — Lagos pass

- Full-page landscape layout (removed the 480 px portrait column).
- Recycling Lagos road and scenery for the whole course; barricades, tyre heaps, jersey barriers, roadworks, danfo.
- Original stylised characters, 3D studio (turn, top, trousers, footwear), Day 1 Lagos briefing.
- Quieter procedural audio. ADR-0007: no real-person likeness.

## 2026-10-06 — Gate 1

- `feat(c02-c03):` Gate 1 — sim v2 loop, Three.js toon world, UI system, touch, adaptive audio, handoff docs.
- Fix: Trek model crash (`children[4]` OOB) after Contender pick.
- Earlier same-day commits (pre-realign): `feat(c0-c1)` scaffold + sim, `feat(c2-c3)` Zustand/Three stub, `feat(c04)` React shell, `feat(c05)` supporter pickups. Those chunk numbers were provisional; treat this entry as the source of truth for C02/C03.

## Mapping (old commit → spec)

| Old label | Spec chunk |
|-----------|------------|
| c0-c1 foundations/sim | C00, C01 |
| c2-c3 zustand/three stub | superseded by Gate 1 C02 |
| c04 react shell | C02 shell (superseded) |
| c05 pickups | C03 (superseded by sim v2) |
| ui-splash | Live 3D hero splash, returning-player CTA, days-left pill; GL context released on dispose |
