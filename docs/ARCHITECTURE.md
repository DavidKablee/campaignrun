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

- First load ≤ 4 MB gzip. State pack ≤ 3 MB.
- ≤ 150 draw calls, ≤ 120k tris on screen.
- DPR ≤ 1.5 (1.0 data-saver). No realtime shadow maps.
- 60 fps target / 30 fps floor on 2 GB Android.
