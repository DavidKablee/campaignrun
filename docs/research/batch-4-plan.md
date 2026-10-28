# Batch 4 plan — Bauchi, Akwa Ibom, Imo, Sokoto (research only, nothing built; second pass 28 Oct 2026)

Calendar unlock: 16 Nov 2026 (`packages/content/data/calendar.json`). Dossiers: `docs/research/states/{bauchi,akwa-ibom,imo,sokoto}.md`.

**How reliable this is.** The first pass (about 32 searches, summaries only) was thin, so a second pass read pages where the tools allowed (Wikipedia, Wikivoyage, Vanguard, Lupi9ja) and cross-checked facts in two or more outlets elsewhere (Daily Trust, Sun and Tribune could not be fetched in full; their facts come from search summaries and are marked). What is solid now: Bauchi's nine hills, nine gates and ride rule; Sokoto's eight gates, Central Market and fires, floodplain farming; Uyo's layout, Ibom Plaza, Ikot Ekpene's raffia trade, Ibeno; Owerri's streets, markets, hotels and transport rules; Oguta Lake. What stays **thin** (no Bauchi-, Sokoto-, Annang- or Imo-specific source exists in reach): everyday dress, vernacular house form, the form of the Yankari and Sokoto gates, the Sokoto river bridge, and keke colours. Those are marked in each dossier and still need a local reviewer.

**Corrections to the first pass.** Sokoto's gates are real (eight, Kofar Rini among them); "no evidence" was wrong. Bauchi has nine real gates and nine hills, which change a venue and the skyline. Owerri Municipal bans okada and restricts keke; Uyo bans okada and restricts keke on named roads.

## 1. What the research changed

| State | Draft landmarks | Verdict | Recommended five (segment 0 → 4) | Venue types |
|---|---|---|---|---|
| **Bauchi** | Central Market, Yankari Reserve Gate, Wikki Warm Spring, Railway Quarters Square, Township Stadium | Central Market: bombed Dec 2014. Railway Quarters Square is unverified, so a rebuilt old city gate (one of nine, real) replaces it. The real stadium is person-named. Yankari and Wikki are real and clean. | Grain & Produce Market (generic), Yankari Reserve Gate, Wikki Warm Spring, Old City Gate (generic), Township Stadium (generic) | market, park, waterfront, landmark, stadium |
| **Akwa Ibom** | Itam Market, Ibom Plaza, Ibeno Beach, Ikot Ekpene Raffia Row, Uyo Township Stadium | Itam: a minor undated lock-up fire. Ibeno: a 2010 oil spill, so no rigs or flares. The real stadium is person-named. Ibom Plaza and the raffia craft are real. | Itam Market (or generic), Ibom Plaza, Ibeno Beach, Raffia Craft Row, Township Stadium (generic) | market, square, waterfront, landmark, stadium |
| **Imo** | Relief Market, Oguta Lake, Mbari Cultural Centre, Wetheral Square, Owerri Township Stadium | Oguta is sacred to a goddess and a civil-war surrender site (the Olumo rule). Mbari is art of deities. Wetheral is a colonial person name. Heroes Square holds statues of figures. | Produce Market (generic), Lake Jetty (generic), Hotel Row (now evidenced: 25+ Owerri hotels), Central Roundabout, Township Stadium (generic) | market, waterfront, landmark, square, stadium |
| **Sokoto** | Central Market, Kofar Rini Gate, River Crossing, Takalmawa Leather Row, Township Stadium | The eight gates are real (the first pass was wrong) but the conquest story on Rini and the palace tie on Taramniya favour a generic gate. The Central Market burned in 2021 and 2024. No source for the bridge or "Takalmawa". The Central Mosque and the palace are barred. Leather, the river plains and harmattan are real. | Grain Market (generic), Leather Row, River Bridge (generic), City Gate (generic), Township Stadium (generic) | market, square, bridge, landmark, stadium |

Pack changes (all `verified: false`; a ride change also needs `pnpm content:roads`):
- **`signatureRide`:** Bauchi hilux → keke (okada banned since 2020 and the state gave out 345 keke, from two outlets). **Sokoto: keep okada.** The only hard fact is a 2020 curfew after 11 pm on motorcycles and tricycles alike, which means both run by day; the "okada banned in the capital" claim is one undated outlet. So there is no reason to change the pack, and keke would be the ride of 13 of 16 states. Akwa Ibom keeps keke (banned only on named roads; okada is banned everywhere in Uyo). **Imo is the open point:** Owerri Municipal bans okada (about 18 years) and keke (15+ years), and buses are its main transport; a yellow keke guide covers the wider state. See decision 4.
- **Skyline:** Bauchi's `yankari-ridge` becomes `bauchi-hills` (scattered bare rock hills; Yankari is 100+ km away and is not the city backdrop).
- **Palettes** (accents move off party-adjacent colours; hexes to be distance-checked before build): Bauchi accent `#8E6B3E`; Akwa Ibom accent raffia straw `#B89C5A`; Imo ground red earth `#8A5A3A`, accent lake teal `#2E6E73`; Sokoto accent leather brown `#7A4A2B`.
- **Welcome and farewell:** Bauchi and Sokoto in Hausa ("Barka da zuwa …!", "Na gode, …!"); Imo "Nnọọ!" with English; Akwa Ibom English only until a native speaker supplies a line.

## 2. Decisions I need from you

1. **Markets by name or generic.** Itam Market (minor, undated fire, single source) and Relief Market (rain damage, single source) could stay named; Bauchi's and Sokoto's central markets cannot (bombing, no evidence). Recommendation: generic role names for Bauchi, Sokoto and Imo; keep Itam Market named only if you want one real market (it is the weakest flag).
2. **Oguta Lake.** It is a living sacred lake and a war-surrender site, with a resort and golf course on its bank. Recommendation: no "Oguta" venue; a generic "Lake Jetty" with boats, palms and a golf lawn and no shrine or deity imagery (the same rule as Olumo and Sobi).
3. **Bauchi's "cattle-crossing" hazard.** Cattle are herder-coded and the Kaduna rule was to avoid that imagery. Recommendation: show the cue as a goat flock with a child and hand-carts, not cattle and herders.
4. **Rides (changed by research).** Bauchi hilux → keke stands. Sokoto: I recommend **keeping okada** (you approved keke on an unconfirmed premise; the premise did not hold up). Akwa Ibom keeps keke. **Imo:** the research shows keke and okada both barred in Owerri Municipal, with buses as the main transport. Options: (a) keep keke, since it is the game's default Nigerian ride and the wider state uses it; (b) danfo, the minibus (tier 4, ₦120,000 price) — but Rivers already has it and it moves Imo up the ride ladder; (c) coaster (tier 5, ₦300,000) is unused but is a big economy change. **Settled 28 Oct 2026: Imo stays keke (user's call).** Changing it later is one line in the pack plus `pnpm content:roads`.
5. **Stadiums.** Every state's real stadium is person-named or unverified. Recommendation: generic "Township Stadium" for all four (one shared builder, `stadiumBlock`).
6. **Security.** Sokoto and Bauchi have recent banditry and a 2014 bombing. Recommendation: no uniformed figures, checkpoints, security vehicles, or cordons in any scene, and no "go-slow" cue drawn as a roadblock.
7. **Ibeno.** Keep the beach, with no rigs, flares, boats of the oil trade, or spill hints.
8. **Colour accents.** Approve the replacements above (to be distance-checked against the six party colours at build).
9. **Research depth.** Done (second pass). Remaining thin points are listed in each dossier's section 13 and need a local reviewer; the build marks them `verified:false`.

## 3. Libraries and what each state reuses

| State | Library | Reuse | New |
|---|---|---|---|
| Bauchi | extend **`guinea-savanna`** with `bauchi.*` | Hausa compound and shopfront lots, baobab, neem, acacia, `hausa` dress base, keke | `bauchi-sand` road, `bauchi-hills` skyline, spring and cliff piece, a rebuilt-gate-between-houses piece |
| Sokoto | extend **`sahel-savanna`** with `sokoto.*` | Kano/Katsina/Borno lots, flora and kerbside, dust ambient | `sokoto-pale` road, `sokoto-plain` skyline, leather racks and dye tubs kerbside, rice and onion plot crops |
| Akwa Ibom | extend **`creek-delta`** with `akwa-ibom.*` | raffia, nipa, mangrove and oil palm flora, `delta-wet` road, plaza-block, keke | `ibom-clean` road, planted median kerbside, raffia-furniture kerbside, beach strip piece |
| Imo | extend **`farmland-river`** with `imo.*` | Anambra's oil palm, red-earth, bungalow and block lots, `isiagu`, keke | `imo-red` road, hotel-block lot, lake jetty piece, `imo-palms` skyline |

`creek-delta` and `sahel-savanna` already carry two and three states; if a file gets unwieldy, split at build time.

## 4. Shared work to do once, first
- `stadiumBlock` already exists (`states/common.ts`); reuse it four times.
- A keke livery option per state (cream, brown, yellow variants).
- A "goat flock and handcart" hazard cue for Bauchi (and later states).
- Re-check every dress and lot colour against the party colours (distance above 48).
- Write each pack's `scenery` strings so that none matches a `case` in `world.ts` (the Oyo pitfall, C57). The drafts' "game-reserve escarpment", "baobab line", "raffia palm stands", "coastal rain squalls", "palm belt", "lake jetty", "deleb palm line" and "tannery yards" need a grep check first.
- Radio callouts still say "Okada/Danfo" for every state (known gap); fix in the same pass if you agree.

## 5. Order, size and risks

Proposed build order: **Bauchi → Sokoto → Akwa Ibom → Imo** (the two northern states reuse the Hausa lots and skyline work; the two southern states need new city lots, with Akwa Ibom's coast first).
- Each is about the size of a batch-3 state: 5 pieces, 3–4 new lots, a road, a skyline, a shop set, a dress set, one chunk doc, one e2e tour.
- Highest risk: thin evidence (decision 9). Sokoto can read as Kano or Katsina again; the leather row and river plots are what separate it. Imo and Akwa Ibom can read alike (both green and keke), so Imo uses red earth and Akwa Ibom uses coast and raffia.
- Every landmark, name, line and colour stays `verified: false` until a local reviewer signs off.
- The mobile pass (C63) is done; the new states will be tested on the A16 afterwards.
