# Batch 2 plan — Oyo, Borno, Delta, Kwara (research only, nothing built)

Calendar unlock: 2 Nov 2026 (`packages/content/data/calendar.json`). Dossiers: `docs/research/states/{oyo,borno,delta,kwara}.md`, each in the 14-section template, written by research agents and spot-checked by me (see "How far to trust these"). Every landmark stays `verified: false`.

## 1. What the research changed

The draft packs were mostly unusable. Every state needs landmark swaps; two need a sim-data change.

| State | Draft landmarks | Verdict | Recommended five (segment 0 → 4) | Venue types |
|---|---|---|---|---|
| **Oyo** | Cocoa House, Bower's Tower, Mapo Hall, Agodi Gardens, Bodija Market | Bower's Tower is person-named. Mapo Hall has hosted party conventions and a rally. Bodija Market sits in the district hit by a Jan 2024 explosion. | Dugbe Market · Mokola Flyover · Agodi Gardens · Cocoa House · Asejire Reservoir | market, bridge, park, landmark, waterfront |
| **Borno** | Monday Market, Borno State Museum, El-Kanemi Stadium, Sanda Kyarimi Park, Ramat Polytechnic | All five fail. The market's roundabout was a bomb site on 16 Mar 2026 (I confirmed this with a search); the stadium, park and polytechnic are person-named. | Cap & Cloth Market · Flyover Road · City Gate · Main Stadium · Ngadda Riverbank (dry-season low water), all role-named and generic | market, bridge, landmark, stadium, waterfront |
| **Delta** | Niger Bridge (Asaba head), Effurun Roundabout, Sapele Waterside, Warri Township Stadium, Nelson Mandela Gardens | The gardens are person-named. "Sapele Waterside" is not a name any source uses. | Niger Bridge (Asaba head) · Sapele Timber Wharf · Effurun Roundabout · Warri Stadium · Ogheye Floating Market | bridge, waterfront, square, stadium, market |
| **Kwara** | Sobi Hill, Owu Falls, Kwara State Stadium, Oja Oba Market, Post Office Roundabout | Oja Oba is the emir's market (palace-linked). Owu Falls is remote and its access road had kidnappings in 2026. | Dada Pottery Market, Okelele · Post Office Junction · Ilorin Township Stadium · University Zoological Garden · Sobi Hill (conditional) | market, square, stadium, park, landmark |

Pack data changes beyond landmarks (all in `data/states/*.json`, no sim code):
- **Borno `signatureRide: okada` → `keke`.** Okada are banned in the city; the keke is the city's ride. Delta also has okada phased out, and keke stays its signature.
- **Rivers `signatureRide: danfo` → `keke`** is the same kind of fix, still pending from the last batch. `signatureRideBonusPermille` sits awkwardly with "no home-state bonuses", so this is your call, not mine.
- **Accents move off party-adjacent colours:** Oyo `#2E7D32` → cocoa brown `#6F4A2E`; Delta `#2A6F97` → `#4D6F86`; Borno palette turns paler (sky `#DCD3BD`, fog `#ECE3CD`, ground `#C9B38C`, accent `#8B5A2B`) so it does not read as Kano.
- **Welcome and farewell lines:** Oyo "Ẹ káàbọ̀ …" and "Ẹ ṣeun"; the farewell must not be "Ẹ kú ìrìn àjò" (sources disagree on its meaning). Kwara "Ẹ káàbọ̀ sí Kwara!" / "Ẹ ṣé, Kwara!". Borno keeps the Hausa pair only; no Kanuri line is safe. Delta: Pidgin and English only until a native speaker checks Urhobo, Itsekiri, Ijaw and Igbo forms.

## 2. Decisions I need from you before building

1. **Borno: draw Maiduguri at all?** The dossier found every major named public place there has a recent attack, fire or flood. My recommendation: a generic Kanuri-sahel town with role-named venues and no real place names on screen, no mosque, no checkpoint, smoke, uniform, tent or flood. The alternative is dropping Borno from this batch and swapping in the Nov 9 set (Enugu, Katsina, Ogun, Plateau), which has its own research still to do.
2. **Sobi Hill (Kwara):** keep as a bare natural landform with no summit structures, no crosses and no pilgrims, or demote to skyline scenery and take the reserve (Asa Dam waterfront)?
3. **Delta's fifth venue.** The Ogheye Floating Market is the most distinctive thing found but its opening is unconfirmed. The fallback is Ogbe-Ogonogo Market in Asaba. I lean to the floating market, with the fallback ready.
4. **The `signatureRide` changes above:** approve keke for Borno, and say whether to fix Rivers at the same time?

None of these block the shared infrastructure work in section 4.

## 3. Libraries and what each state reuses

| State | Library | Reuse | New |
|---|---|---|---|
| Oyo | **new `forest-hills`** (no hills library exists) | zinc-bungalow, flatroof-shopfront, market-block, plaza-block, colonial-bungalow, mansion, factory-shed; oilpalm, mango, banana, cashew, raffia, cassava, maize; `inselberg-ridge` skyline | lots `compound-row`, `afro-brazilian-storey`, `laterite-compound`; flora cocoa, kola, iroko, teak, bamboo; props cocoa-sacks, adire-line, korope; Cocoa House tower slab; skyline `ibadan-roofsea`; road `hill-asphalt`; dress `yoruba-southwest` |
| Delta | add `delta.*` districts to **`creek-delta`** | `oil-flares` and `niger-bluffs` skylines, `waterEdge`, stilt-house, shophouse, flatroof-shopfront, nipa, mangrove, oilpalm | lots `sawmill-shed`, `plank-lockups`; flora `forest-giant`; kerbside log, plank, jerrycan, sachet; steel through-truss bridge piece; generic flyover pier |
| Kwara | **`guinea-savanna`** extended with `kwara.*` districts | shophouse, flatroof-shopfront, tiled-villa, plaza-block, market-shed, factory-shed, colonial-bungalow, thatch-hut; oilpalm, cashew | lots `ilorin-compound` (parapeted flat front, low zinc gable behind, no horns), `veranda-range`; facade `earth-plaster`; pot-wall and pot-yard, loom shed, twin-cone inselberg piece; flora shea, pawpaw; kerbside tomato crates, vulcanizer; dress `ilorin-blend` |
| Borno | **`sahel-savanna`** extended with `borno.*` districts | flatroof-shopfront, shophouse, plaza-block, neem, acacia, millet, `waterEdge`, `ambient: dust` | lots `kanuri-compound` (flat parapet, dark arched door, no horns), `lockup-row`; wall `clay-low` (not Kano's earthen wall, which reads as a security berm); flora `reedbed`; crop `masakwa`; props water-bag stall, cap-rack, mat-screen, donkey-cart, one camel; skyline `chad-plain`; road `sahel-sand`; dress `kanuri-north` |

## 4. Shared work to do once, first

- **Flyover/bridge pier piece:** Oyo (Mokola Flyover), Borno (Flyover Road) and Delta (Effurun) all need a deck on piers. One parametrised builder, then three wrappers.
- **Hill/slope support** for Oyo: today roads are flat. The dossier wants "hill-and-valley" and a rust-roof sea; I would fake it with raised ground planes and a layered skyline rather than change road geometry, because sim lanes are fixed.
- **Dress colours** and lot palettes re-checked against the six party colours (>48 RGB distance): Oyo rust roofs are only 65 from party orange, Delta George-wrapper blues and Borno keke yellow need muted values. This is the main source of test failures last batch, so these go in first.
- **Pidgin and Yoruba shop-sign sets** for the regional shop textures.

## 5. Order, size and risks

Proposed build order: **Delta → Kwara → Oyo → Borno**.
- Delta first (most reuse; proves the flyover pier and steel truss).
- Kwara second (extends a library I already know).
- Oyo third (new library and the Ibadan skyline; largest).
- Borno last, once your decision on item 2 is in, because its venues are the most constrained.

Each state is one chunk (C55–C58) with the same flow as before: dossier read, pack changes, world block, set pieces, e2e tour with screenshots, review, docs. Same budgets (≤150 draws, ≤120k tris). Expect similar size to Kaduna per state; Oyo about 1.5× (new library).

Top risks:
1. **Insecurity is current in Borno, Kwara North, Oyo's Ogbomoso/Oke-Ogun/Ibarapa and Delta's contested Warri areas.** Rural segments stay generic: no uniform, camouflage, weapon, herd, school or checkpoint imagery.
2. **Religion and palaces sit inside the natural skyline** (Ilorin's mosque domes, Ibadan church hills, Sobi's prayer vigils). Rule: no domes, minarets or crosses on any skyline, even far off.
3. **Thin visual evidence.** Delta's, Kwara's and Borno's street furniture, taxi colours, poles and kerbs, and Borno's and Kwara's vernacular roof forms, are inference tagged `[inf]`. Every shape is an interpretation until a local reviewer checks it. Each dossier lists 16–17 reviewer questions.
4. **Colour collisions** with party colours (see section 4).
5. **Overlap:** Delta's Asaba bridge is a steel through-truss on a rise, deliberately unlike Anambra's concrete Second Niger Bridge.

## How far to trust these

- **Verified by me:** all four files exist with 14 sections; a grep of each for a short list of person, politician and party terms found only rejected-candidate mentions (e.g. Oyo's "Bower's Tower"); this is a sample, not a full name audit. One open item: Kwara's "Dada Pottery Market" may be a person's name, so a reviewer must check it; the Borno 16 Mar 2026 blasts are confirmed by news reports (Channels TV, AllAfrica, Vanguard).
- **Not verified:** the individual building shapes, the Ibadan and Ilorin street details, the Delta floating market's status, and the Kwara Owu Falls access-road kidnappings; I relied on the agents' tagged sources for those. Single-source `[1]` and inference `[inf]` tags are kept in each dossier.
- **Not checkable here:** Yoruba tone marks, Hausa and Pidgin wording, the Urhobo/Itsekiri/Ijaw/Igbo forms, and everything that needs a local reviewer.
