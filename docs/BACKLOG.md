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
| C13–C19 | todo | Running mates, community Rally Map, ledger, rivals, ads, live-ops, finale |

## Outside the current chunk

- Community Rally Map / other players’ Contenders (C14 + C11 consent).
- Real-money / ads / server scores.
- glTF meshopt swaps, recorded audio stems, Playwright visual baselines, Cloudflare/waitlist.

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

