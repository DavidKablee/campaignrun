# Design bible (Gate 1)

## Look

**Stylized low-poly 3D with toon lighting.** Flat-shaded / toon meshes, palette-driven materials, soft fog, per-state sky. Ankara/adire tiling on a few hero props. Not flat-vector 2D; not photoreal.

## UI language — "Naija street-poster"

| Token | Role |
|-------|------|
| `--cr-danfo` `#F5C518` | Primary CTA, brand |
| `--cr-ink` `#0B1220` | Text / night road |
| `--cr-indigo` `#1B2A4A` | Panels |
| `--cr-jollof` `#E85D04` | Accents / danger |
| `--cr-adire` `#2A6F97` | Secondary |
| `--cr-paper` `#F7F1E3` | Card surfaces |
| `--cr-stripe` black/yellow | Danfo stripe motif |

- Display: **Archivo Black** (self-hosted). Body: **DM Sans**.
- Chunky depth buttons (3–4 px offset), 48 px min touch targets.
- Safe-area insets. Portrait column centred on desktop.
- No purple-gradient AI cliché. No glassmorphism. No emoji UI.

## Motion

- Chase cam FOV kick with speed, lean on lane change, shake + hit-stop on dent.
- Coin arcs, confetti on Full House, supporters pile onto ride.
- Respect `prefers-reduced-motion` and Settings → Reduce motion.

## Models

Procedural builders in `apps/game/src/render/models/`. Registry: `assetId → builder | glTF`. Swap assets without code changes.

Road vehicles (danfo, keke, okada, car, lorry) are built in `apps/game/src/render/vehicles.ts`: one merged body per variant, one small pivoted mesh per axle so the wheels turn, lamp halos as additive quads. Models face -z; oncoming traffic is the same model with its root turned round. Anything that moves on the road is a sim entity (`packages/sim/src/traffic.ts`) — never decoration — so a player can read it as a threat.
