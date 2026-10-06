# Gate 1 playtest

## Setup

```bash
pnpm install
pnpm verify   # must be green
pnpm dev      # open LAN URL on phone
```

## Checklist

1. Splash shows disclosure + **I'm 18+ · Play** (one tap).
2. Roster: six Contenders with distinct colours/props; pick one.
3. One-thumb: swipe lanes, flick hop, hold Gas/Brake.
4. Brake in glowing Pickup Zone ~1 s → supporters load; capacity clamps.
5. Brake at Rally Venue → Crowd increases; Full House / On Beat toasts if earned.
6. Hit → dent icon fills, ~25% supporters peel off, slowdown; 3 dents → breakdown → Result.
7. Finish line → Result with Crowd (delivered, not carried).
8. Feels ≥ 30 fps on your older Android; data-saver if needed.
9. Kill switch: set `apps/game/public/flags.json` `"killSwitch": true` → Back soon.

## Tune here (JSON only)

| Feel | File / key |
|------|------------|
| Lane change speed | `sim.json` `laneChangeMmPerTick` |
| Hop | `hopTicks`, `hopHeightMm` |
| Speeds | `baseSpeedUm`, `maxSpeedUm`, accel/brake |
| Load window | `zones.loadTicks`, `zones.brakeSpeedUm` |
| Momentum | `momentum.*` |
| Spawn gaps | `spawn.gapMinMm` / `gapMaxMm` |
