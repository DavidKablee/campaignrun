# Changelog

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
