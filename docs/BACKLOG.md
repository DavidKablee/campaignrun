# Backlog

Work only the current chunk (`docs/STATUS.md`). Do not start later chunks early.

## Spec chunks

| Chunk | Status | Notes |
|-------|--------|-------|
| C00–C04 | done | Foundations through rides/stars |
| C05 | done | Perks + balance bot ±3% |
| C06 | done | Integrity villains + meter |
| C07–C08 | done | State packs + local meta |
| C09 | done | Share card, PWA, daily challenge, username filter, local board |
| C10 | done | Weekly packs (26 Oct), travel caps (client), live counters |
| C11 | done | Guest→save, Contender consent log, export/delete (client) |
| **C12** | **next** | Ghosts / server verification |
| C82 | built | Mobilise places (`docs/chunks/C82.md`). Redesign built (Locals, coach card, talk tray, invite link). Follow-ups: shared pub/sub if the API scales past one instance; state-specific scenery per place; a place-activity strip on the Board; moderation review of reports; Open Graph preview page for invite links |
| C83 | built | First-minute fixes (`docs/chunks/C83.md`). A finished-trial player who never picked still returns to the Briefing (left as is on purpose, see the note); revisit after the first-minute playtest, which is not run |
| C84 | built | Mobilise lock at 1,000 Following, one way back (`nav.ts`), settings that work (`docs/chunks/C84.md`) |
| C85 | built | One word per idea, guarded by `vocabulary.test.ts` (`docs/chunks/C85.md`) |
| C86 | built | Board says it is a game, Practice/Live tag, flat map without WebGL (`docs/chunks/C86.md`) |
| C87 | built | Integrity explained, Briefing layout, words beside icons, no colour changes (`docs/chunks/C87.md`) |
| C88 | built | UI/UX fix pass (`docs/chunks/C88.md`) |
| C89 | built | Contender avatars in Mobilise, opt-in (`docs/chunks/C89.md`) |
| C89–C93 | planned | Mobilise v2: Contender avatars (opt-in), rooms and friends, Campaign Phone + jobs + streak, preset packs, typed chat after 24 h (dark) |
| C13–C19 | reviewed | See `docs/research/c13-c19-review.md`. C19-lite, C18-lite and the C14 check are built (C81) and C16 was already closed. Deferred: C15, C17. Skipped: C13, the prize flow |

## Outside the current chunk

- Community Rally Map / other players’ Contenders (C14 + C11 consent).
- Real-money / ads / server scores.
- glTF meshopt swaps, recorded audio stems, Playwright visual baselines, Cloudflare/waitlist.

## Needs a person (C78, C81)

- A reviewer from the capital checks `docs/research/states/fct.md` and the FCT world.
- Look at the Weekly Tour and Final Week bonuses on a real phone and tune the amounts once there is play data.
- Run `docs/PLAYTEST-FIRST-MINUTE.md` with 8–10 Nigerian players on mid-range phones, then fix the earliest confusion first.
- A native Pidgin speaker marks `docs/research/pidgin-review.md`.
- A lawyer reviews the privacy text (events, corrections) before anything that collects data goes public.
- Host the client (`docs/DEPLOY-CLIENT-ONLY.md`), then deploy the API so the tally, counts and corrections are live. Drive them from the UI once it is up.

## Every state its own world (remaining 25 states)

Kano (C51), Rivers (C52), Anambra (C53), Kaduna (C54), Delta (C55), Kwara (C56), Oyo (C57), Borno (C58), Enugu (C59), Plateau (C60), Katsina (C61), Ogun (C62), Bauchi (C64), Sokoto (C65), Akwa Ibom (C66), Imo (C67), Edo (C69), Ondo (C70), Abia (C71), Benue (C72), Osun (C73), Adamawa (C74), Jigawa (C75), Cross River (C76) and FCT (C81) are built; every one still needs a local reviewer. Dossiers exist for all four in `docs/research/states/`; each is a draft to be checked against the template before building (the Kaduna one suggests accent `#B9663A`). Do one state at a time, with screenshots for review before the next. Both sim questions are closed in C77 (Rivers keke; ride bonus removed). Batch 5 is built (C69–C72); Batch 6 is built (C73–C76); eleven states are left without worlds (Batch 7 candidates: Niger, Gombe, Ebonyi, Kebbi, Ekiti, Kogi, Taraba, Bayelsa, Nasarawa, Yobe, Zamfara). Do not write `scenery` strings for a new state without checking the `case` list in `world.ts`.

Recipe per state:
1. Write `docs/research/states/<id>.md` from `_TEMPLATE.md` (sources, built form, road, vegetation, dress, avoid list, landmark shortlist with rule flags, route table, welcome/farewell in a language the state speaks). Cross-check; mark single-source claims.
2. Replace weak landmarks with the five chosen (all `verified: false`; closed `venueType` list; no palace/religious/person-named/disaster).
3. Add the district/road/dress entries to `data/world/<biomeKit>.json` (or a new library); add a `world` block to `data/states/<id>.json` (8 route districts, start/finish, `billboards`, skyline, ambient, `pieces` on side -1 for venue pieces: the rally stage stands on the right).
4. Write any new builder: lot style, flora, set pieces (`render/world/states/<id>.ts`, registered in `world.ts`), skyline, road/facade/shop painters in `regionalTextures.ts`. The registry test fails if data names a builder that does not exist.
5. Keep shop boards, awnings and dress colours clear of the party colours (a content test checks district/dress palettes; textures are by eye) and avoid saturated red/green/royal blue and green-and-white anywhere.
6. Run `states.spec.ts` for the id (add it to `STATES`), read the screenshots, check the draw/triangle numbers, run the Lagos golden.
7. Every state keeps one contemporary city district; never regionalise villains or Contenders.

Known gaps in the foundation: pickup and venue crowds and Contenders are not dressed regionally; `flatroof-shopfront`'s kerbside goods and the `bazaar` default palette are neutral rather than per-state; the `hazardCues` ops of the plan are partly built (C68 tints fog and dust per hazard; wet-road sheen, flood sheets and parked barrows are not); Data Saver does not yet skip optional layers beyond the dust cloud; a sky for harmattan is a tint only.

## Polish notes

- denser Lagos set-pieces; Border Gate welcome beat; coin arcs / hit-stop.
- Live board stays game Crowd / open / locked — never poll percentages.
- Wire `StateDef.palette` / `biomeKit` into the Three.js world (packs carry the data already).
- Server-side travel caps + global live counters + cloud Contender table (C12+).
- Lawyer sign-off on privacy/terms before public launch.
- `packages/sim/src/collide.ts` keys the magnet perk off a hard-coded contender id (`captain-kobo`) instead of the perk id. Renamed in C31, not fixed.
- Add the legal review's real-name list to `private/blocklist.plain.txt` and re-run `tools/hash-blocklist.mjs` (C31 seeded retired fictional forms only).
- Consider deleting `RENAMED_IDS` in `contenderStore.ts` before launch to purge the retired name strings (safe while no real device holds an old save).
- No shadow map in the gameplay world (C33 added them to the studio/portraits only). A world shadow map costs real frame time on the target device, and `patchBend`'s vertex displacement is not applied to the depth material, so shadows would misalign with the road curve — it needs the bend patched into a custom depth material first.
- `StudioScene`'s camera still uses a literal `0.92` eye height. C32 made the portrait camera measure the rig's bounds instead; this one was left as-is and is the same shape of bug waiting on the next proportion change.
- `RIG.widestTopR` (C33) is maintained by hand because the radii it summarises are literals inside a `switch`. Worth deriving from the geometry if the tops list grows.
- A properly sculpted gele. C33's is a cap plus three slabs — an improvement on the pagoda brim, not a model of the real thing.
- Fact-check the C34 landmark names with someone who knows each state; they all carry `verified: false` and were written from general knowledge. Least certain: Gombe's `Tudun Wada Square`, Zamfara's `Damba Square`, Kebbi's `Old City Gate`, Yobe's `Gashua Dune Road`, and Edo's `Obokhian!` greeting.
- Author `farewellLine` for the 9 states that have none (South-South, Benue, Kogi, FCT) — needs a speaker of the language, which is why C34 left them on the neutral sign rather than guessing.
- Give `hazards` real mechanics. The vocabulary is a closed 20-value enum as of C34 and every pack uses it, but nothing in the sim or renderer reads the field yet.

