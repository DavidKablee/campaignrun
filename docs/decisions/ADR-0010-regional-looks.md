# ADR-0010: Regional looks are procedural, driven by data

## Context
Every state rendered the same Lagos world (C34 noted "Sokoto looks exactly like Lagos today"). The renderer built one endless strip whose theme order, buildings, shop signs, road, kerbs, bridges and people were fixed, and `biomeKit` and each landmark's `venueType` were read by nothing. States differed by a colour tint and a billboard list.

The ask is that each state differ in the build of the world, the road, the clothes of the people and its signature landmarks, and that states without Lagos' kind of building (earthen compounds, stilt houses, huts) look like themselves. Real photographs were suggested as the source.

## Decision
- **No photographs ship.** Photographs, and descriptions of them, are *research*. Each state gets a dossier (`docs/research/states/<id>.md`) with sources, the physical form of its buildings, roads, vegetation and dress, and a landmark shortlist. The game then draws **original, stylised, low-poly models built from primitives in code**, as it already does for every texture, character, ride and vehicle (ADR-0005/0007/0008). Nothing is downloaded, traced or committed, so there is no licence to track and no credits screen to build, and the toon style stays consistent. ADR-0009's CC0 kits remain the only third-party art, for background dressing only.
- **Content names, the renderer builds.** A state may carry a `world` block (`packages/content/src/world.ts`): an ordered list of 8 *districts* (one per course segment), a start and finish district, a road style, a dress set, a sign pool, set pieces bound to its landmarks, a skyline and an ambient effect. Districts, road styles and dress sets live in a lazy shared per-biome library (`data/world/<name>.json`). JSON never describes geometry; it chooses registered builders (`lots`, `flora`, `bazaar`, set pieces, skylines) and their numbers.
- **Lagos is the default and must not move.** A state with no `world` block, and Lagos itself, resolve to `LAGOS_WORLD` (`data/world-defaults.json`), which reproduces the old theme order exactly. Chunk RNG is `seed ^ salt` with salt 0 for Lagos, and regional builders draw from a second stream so adding one never shifts a Lagos roll. `apps/game/test/worldGolden.test.ts` fingerprints the Lagos world (geometry, materials, every texture painter's call log, people, venue, gate) against a golden.
- **Landmark `i` belongs to segment `i`.** The district a segment runs through is the one that carries its landmark, and the landmark's set piece stands by that segment's rally stage.
- **Equal gameplay.** A look changes how a state is drawn and nothing the sim reads. Gameplay differences between states remain the existing hazard weights (GUARDRAILS: no home-state bonuses).
- **Dignity rule.** Every state includes at least one contemporary city district, so no state is shown only as huts or stilts. Villains and the Contenders are never regionalised; bystander dress sets avoid party colours and political caps.
- **Verification.** Every landmark stays `verified: false` until a local reviewer signs the dossier off. Welcome and farewell lines only in a language the state speaks.

## Consequences
- Adding a state's look is data plus, at most, a few new builders and a dossier. The registry test (`apps/game/test/worldRegistry.test.ts`) fails if data names a builder that does not exist.
- Builder code lives in the main bundle for now (first load is far inside the 4 MB budget); the data is lazy and runtime-cached with the state packs.
- A `?debug` URL can show any state without unlocking it: `debugState`, `debugWeather`, `debugSeed`, `debugZ`.
- Without shipped photographs, resemblance to a real place is judged by the dossier and by eye; the tests prove that Lagos did not change and that each state's world differs and stays inside the mobile budget, not that it looks right.
