# Design bible (Gate 1)

## Look

**Stylized low-poly 3D with toon lighting.** Flat-shaded / toon meshes, palette-driven materials, soft fog, per-state sky. Ankara/adire tiling on a few hero props. Not flat-vector 2D; not photoreal.

## UI language — "Lagos Life" menus, night-road run (C38, written down in C87)

Two layers, on purpose, and this is what ships. Menus (splash, Yard, roster, Account, About, result) are Lagos Life: a navy page, white surface cards, green pills, yellow display headlines. The run itself (glass meters, pause card, coach card, pickup banner) keeps the dark night-road look so it reads over the 3D scene. Colours are the owner's and are not changed by layout work.

| Token | Role |
|-------|------|
| `--cr-green` `#107a3d` | Primary action pill |
| `--cr-surface` / `--cr-surface-ink` / `--cr-surface-dim` | Cards, ghost pills and their text |
| `--cr-lift`, `--cr-lift-lg`, `--cr-ring`, `--cr-radius-card` | Soft shadow and radius for menu cards |
| `--cr-danfo` `#F5C518` | Headlines on the dark page, brand, pickup banner |
| `--cr-ink` `#0B1220` / `--cr-indigo` `#1B2A4A` | Page and night road |
| `--cr-jollof` `#E85D04` | Accents / danger |
| `--cr-adire` `#2A6F97` | Secondary, Integrity |
| `--cr-paper` `#F7F1E3` | Coach card surface |

- Display: **Archivo Black** (self-hosted). Body: **DM Sans**.
- 48 px min touch targets. Safe-area insets. Portrait column centred on desktop.
- Every control that is only a glyph gets a word beside it (Settings, Board). The run's Pause stays an icon.
- The Briefing's actions never share one wrapping row: Start the run is full width on top, the alternatives sit under it.
- Integrity is defined once, on the first-run coach card.
- No purple-gradient AI cliché. No glassmorphism. No emoji UI.

## Motion

- Chase cam FOV kick with speed, lean on lane change, shake + hit-stop on dent.
- Coin arcs, confetti on Full House, supporters pile onto ride.
- Respect `prefers-reduced-motion` and Settings → Reduce motion.

## Models

Procedural builders in `apps/game/src/render/models/`. Registry: `assetId → builder | glTF`. Swap assets without code changes.

Road vehicles (danfo, keke, okada, car, lorry) are built in `apps/game/src/render/vehicles.ts`: one merged body per variant, one small pivoted mesh per axle so the wheels turn, lamp halos as additive quads. Models face -z; oncoming traffic is the same model with its root turned round. Anything that moves on the road is a sim entity (`packages/sim/src/traffic.ts`) — never decoration — so a player can read it as a threat.
