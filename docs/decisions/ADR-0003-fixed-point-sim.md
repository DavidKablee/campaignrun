# ADR-0003: Fixed-point deterministic sim

## Decision
`packages/sim` is pure: integer state (mm, µm/tick, permille), sfc32 RNG, 60 Hz `step`. Lint bans Math.random/Date/DOM/Three and transcendental Math.

## Why
Safari JSC vs V8 float drift would break server replay (C12) and ghosts.

## Consequences
Projection, curves, hills live only in the renderer. Tunables in `packages/content/data/sim.json`.
