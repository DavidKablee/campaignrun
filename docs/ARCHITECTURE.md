# Architecture

## Packages

```
apps/game          Vite + React + Three.js client (PWA later)
packages/sim       Pure deterministic 60 Hz fixed-timestep core
packages/content   Zod schemas + JSON packs
tools              size-check, content-lint, hash-blocklist
```

## Data flow

1. Touch/keyboard → bitmask (`Btn`) each tick.
2. `step(state, input, config)` mutates sim only (integers).
3. App copies prev/current snapshots for interpolation.
4. Renderer, HUD, audio **read** snapshots; they never write sim state.
5. Input log is delta-encoded for later ghosts/server replay (C12).

## Coordinate contract

- Sim: `laneX` 0..2000 (1000 = centre). World X mm = `(laneX - 1000) * laneSpacingMm / 1000`.
- Entity lanes: 0|1|2 → centre X = `(lane - 1) * laneSpacingMm`.
- `z` is millimetres travelled. Renderer: `world = mm * MM_TO_UNITS` (0.001).
- Road curvature/hills are **renderer-only** offsets. Collisions use flat integer AABB.

## Determinism rules (`packages/sim`)

- Integer state only. No `Math.random`, `Date`, `performance`, DOM, Three, Pixi.
- No transcendental `Math.*` (sin/cos/exp/pow/…). Lint-enforced.
- PRNG: sfc32. Speeds in µm/tick. Ratios in permille (1000 = 1.0).

## Performance budgets

- First load ≤ 4 MB gzip. State pack ≤ 3 MB. Biome-kit model bundle ≤ 1.5 MB gzip (ADR-0009) — lazy-loaded per biome, never part of first load.
- ≤ 150 draw calls, ≤ 120k tris on screen.
- DPR ≤ 1.5 (1.0 data-saver). No realtime shadow maps.
- 60 fps target / 30 fps floor on 2 GB Android.
- Environment CC0 assets (`apps/game/public/models/`) load once via `assets.ts` (`loadAsset`/a biome's combined promise) and are placed either as cheap `template.clone(true)` copies (low counts per chunk — `world.ts` palms/parasols) or via `buildInstancedProp` (one `InstancedMesh` per sub-mesh, for genuinely repeated high-count props). `clone()` shares geometry/material buffers; only disposed when the *source* template itself is torn down, never per-placement. Characters, rides and gameplay props stay procedural (never CC0) per ADR-0005/0007/0008.
- `vite.config.ts` Workbox: `.glb`/biome-kit assets are excluded from the precache `globPatterns` (same as `states/**`) and instead covered by a `CacheFirst` `runtimeCaching` rule (`cr-biome-models`) — cached the first time a run actually fetches them, available offline from then on. Never force these into the initial service-worker install.

## Visual & feel rebuild track (C20–C25)
Characters, movement, world/environment and the landing page were rebuilt in `apps/game/src/render/` and `apps/game/waitlist.html` without touching `packages/sim`, `packages/content` schemas, or any C0–C11 gameplay/accounts code. See `docs/chunks/C20.md`–`C25.md` and ADR-0008/0009 for the full history; `docs/STATUS.md` has the current state and what's still open (CC0 buildings, sidewalk/curb decals, LOD, a real phone pass).
