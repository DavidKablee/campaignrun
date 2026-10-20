# Changelog

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
