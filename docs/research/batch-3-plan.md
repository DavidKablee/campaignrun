# Batch 3 plan — Enugu, Plateau, Katsina, Ogun (research only, nothing built)

Calendar unlock: 9 Nov 2026 (`packages/content/data/calendar.json`). Dossiers: `docs/research/states/{enugu,plateau,katsina,ogun}.md`, each in the 14-section template, written by research agents. I read the recommendations and design briefs of Enugu, Plateau and Katsina in full, read the Ogun agent's report, and re-checked three claims by search (see section 6). Every landmark stays `verified: false`.

## 1. What the research changed

As in batch 2, the draft packs were mostly unusable: almost every draft landmark fails a rule (person-named, religious, recent incident, invented or unverifiable), and only a few survive in the recommended fives.

| State | Draft landmarks | Verdict | Recommended five (segment 0 → 4) | Venue types |
|---|---|---|---|---|
| **Enugu** | Ogbete Main Market, Milken Hill, Nike Lake Waterside, Coal Camp, Enugu Township Stadium | Ogbete: Jul 2023 protest with deaths, a 2025 fire, a shooting. Milken Hill is person-named. Coal Camp: Dec 2023 fire, state relocation order. | New Haven Market · Central Station Sky Bridge · Township Stadium (generic) · Nike Lake · Udi Hills Lookout (rock-cut hairpin road) | market, bridge, stadium, waterfront, landmark |
| **Plateau** | Jos Main Market, Shere Hills, Rayfield Lakeside, Wildlife Park Gate, Jos Township Stadium | Jos main market: fires in Apr and Dec 2025, bombings in 2010 and 2014. Rayfield Lakeside is only a hotel listing and a blog, and Rayfield holds the state's government houses. The stadium name is a convention (the real stadium is person-named). | Highland Produce Market (generic) · Jos Wildlife Park Gate · Tower Roundabout (generic) · Jos Township Stadium · Shere Hills (bare landform, conditional) | market, park, square, stadium, landmark |
| **Katsina** | Central Market, Kofar Durbi Gate, Gobarau Minaret, Ajiwa Lakeside, Township Stadium | Gobarau is a mosque minaret. The real stadium is person-named and had a violence-and-ban episode in 2025 and a death in 2026. The two underpasses flooded in 2023. | Katsina Central Market (conditional; fallback a generic grain market) · Old City Wall and Gate (red Kofar Sauri section) · Old Katsina College (red-baked clay, 1921) · GRA Flyover · Ajiwa Lakeside | market, landmark, landmark, bridge, waterfront |
| **Ogun** | Olumo Rock, Kuto Market, Ogun River Crossing, Itoku Adire Row, Abeokuta Sports Ground | Olumo is a living shrine site. Kuto had a 2024 fire and a ruler-named formal title. "Itoku Adire Row" and "Abeokuta Sports Ground" are invented names. | Kemta-Itoku Adire Market · Ogun River bank at the old and new bridges · Gateway Monument Park at Sagamu Interchange (conditional) · Ibara Flyover and Panseke Footbridge · Ilaro Stadium (single-source) | market, waterfront, park, bridge, stadium |

Pack data changes beyond landmarks (all in `data/states/*.json`; the ride change also needs `pnpm content:roads`):
- **`signatureRide`:** Katsina okada → keke, Plateau hilux → keke, Ogun danfo → keke; Enugu keke stays. The dossiers' reasons: Enugu bans okada in the metropolis and a pickup in Plateau could read as a security vehicle; Ogun shows no danfo tradition. After this, keke is the signature ride of seven states, so the keke livery should differ per state (Katsina cream with brown roof, Enugu dull ochre with charcoal roof, Borno mustard with black roof).
- **Palettes** (accents move off party-adjacent colours; all hexes were distance-checked by the agents):
  - Enugu: sky `#9FBACB`, fog `#CCD6CE`, ground `#7A4A2E`, accent coal charcoal `#34383B`.
  - Plateau: sky `#9DBFD6`, fog `#DCE3E1`, ground pale highland grass `#9DB279`, accent granite slate `#707A84`.
  - Katsina: sky `#CFDBE0`, fog `#EFE0CC`, ground rose-red sand `#AB7F66`, accent `#A0564A` (the draft orange `#C45C26` is shared by five Hausa states).
  - Ogun: sky `#B4C8D2`, fog `#E3E0D3`, ground `#9A8E7C`, accent adire indigo ink `#2B3045` (the draft `#D98324` is only about 34 from party orange).
- **Welcome and farewell:** Enugu "Nnọọ!" with an English line; Plateau and Katsina Hausa ("Barka da zuwa …!", "Na gode, …!"; no "Sai …" lines, which echo real slogans); Ogun "Ẹ káàbọ̀ sí Ògùn!" / "Ẹ ṣeun, Ògùn!" (the pack's farewell lacks tone marks); never "Ẹ kú ìrìn àjò".

## 2. Decisions I need from you before building

1. **Katsina's first venue.** The Central Market burned in March 2021 and I could not confirm it has been rebuilt. My recommendation: a role-named generic "Grain Market" (stalls of sacks and calabashes), no real market name.
2. **Ogun's third venue.** Gateway Monument Park at the Sagamu Interchange is flagged: tanker fires nearby in 2019 and 2025 and a head-of-state opening. My recommendation: replace it with a generic "Interchange Park" (a lawn, a plain monument shaft and the cement-works skyline) and say nothing about the real interchange.
3. **Olumo Rock.** It is a living shrine site. My recommendation: not a venue; a bare, unlabelled granite dome in Ogun's skyline only (the same rule as Sobi Hill, but stricter because it is also a pilgrimage site). Plateau's Shere Hills follows the Sobi rule (bare natural landform, nothing on it); the fallback is a plain boulder outcrop.
4. **Showpiece infrastructure.** Enugu's sky bridge (opened 2025) and Katsina's GRA flyover (commissioned 2023) are both state-government projects. My recommendation: build both as role-named, unlabelled structures with no plaque, name board or person, and say so in the reviewer notes. Enugu's terminals sit in a district whose name is religious, so the board reads "Central Station".
5. **`signatureRide` to keke** for Katsina, Plateau and Ogun as above. Do you want Rivers (danfo vs keke) fixed in the same pass? The `signatureRideBonusPermille` question also remains.
6. **Single-source venues.** Ogun's Ilaro Stadium and Enugu's New Haven Market each rest on one weak source. My recommendation: build them as generic "Township Stadium" and "Hillside Market" shapes (the dossiers already give these fallbacks), so a wrong name costs nothing.

None of these block the shared work in section 4.

## 3. Libraries and what each state reuses

| State | Library | Reuse | New |
|---|---|---|---|
| Enugu | extend **`forest-hills`** with `enugu.*` | `hill-asphalt` road, `cutbank`, `boulder`, oilpalm, mango, teak, shea; lots colonial-bungalow, tiled-villa, plaza-block, shophouse, flatroof-shopfront, zinc-bungalow, factory-shed, works-shed | lots `hillside-terrace`, `gra-cottage`, `slab-tower`, `welding-shed`; flora `pine`; props yellow minibus, bus shelter, steel-gate stack, spare-part barrow, chevron boards; skyline `udi-cuesta` (three layered flat-topped ridges); dress `igbo-enugu` (recolour of Anambra's); pieces `enugu.market`, `enugu.skybridge`, `enugu.stadium`, `enugu.lake`, `enugu.lookout` |
| Plateau | extend **`forest-hills`** with `plateau.*` | `hill-asphalt`, `boulder`, `inselberg-ridge`, neem, mango; shophouse, plaza-block, market-block, market-shed | pale-grass ground, `pine` and eucalyptus flora, boulder-wall, potato terraces, spoil mounds, tin-pit pond disc (distant and fenced); skyline `jos-domes`; dress `jos-layers` (jackets, beanies); pieces `plateau.produce-market`, `plateau.wildlife-gate`, `plateau.tower-roundabout`, `plateau.stadium`, `plateau.shere-hills` |
| Katsina | **`sahel-savanna`** (new facade and lot styles so it does not read as Kano or Borno) | acacia, neem, millet, `ambient: dust`; `redbrown-avenue` road and colonial-bungalow, tiled-villa, plaza-block for the GRA and city avenues | facade set (rose-cream relief render, red laterite wall); lots `relief-compound`, `redbrick-hall`, `wall-rampart`, `interchange`, `irrigation-plot`; keke in cream and brown; flat-horizon skyline; pieces for the five venues |
| Ogun | extend **`forest-hills`** with `ogun.*` | rust-bungalow, compound-row, factory-shed, market-block, boulder, cocoa, teak, okada and adireline; rice and keke from `farmland-river`; sawmill-shed and plank-lockups from `creek-delta` | adire-yard, boulder-house, silo-works lots; rubber flora; pale concrete-slab road (the expressway section is reinforced concrete); granite-dome skyline; river-bridge, monument-spire and long-footbridge pieces; block-yard and tipper props; dress with indigo/adire patterns checked against party colours |

`forest-hills` carries three states, so it is the most loaded library. Its district table is big; if the file gets unwieldy, split `ogun.*` into its own library at build time rather than before.

## 4. Shared work to do once, first

- **`pine` flora** (Enugu, Plateau) and a tall thin eucalyptus.
- **Granite dome and boulder-heap pieces** (Plateau, Ogun skyline; Kwara's twin-cone is the template).
- **Stadium and flyover builders:** reuse `states/common.ts` (`flyoverDeck`) and the Kwara/Borno stadium shapes; one parametrised stadium would save a copy per state.
- **Keke livery** per state, and a cream/brown keke mesh colour option.
- **Dress and lot palettes re-checked against the six party colours** (>48 distance) before any painter work. Ogun's pale indigo is at 55 and its tipper ochre at 60, so they have the smallest margin.
- **Scenery strings:** write the packs' `scenery` with strings that match no `case` in `world.ts` (the Oyo pitfall, C57).

## 5. Order, size and risks

Proposed build order: **Enugu → Plateau → Katsina → Ogun**.
- Enugu first: `pine`, the hairpin road and the layered ridge are new but sit on a library I know.
- Plateau second: reuses the pine and ridge work and adds the dome and boulder pieces Ogun needs.
- Katsina third: a new facade and lot family on `sahel-savanna`, with the weakest visual evidence of the four, so it benefits from a decision on Q1.
- Ogun last: most new pieces and the pale road, and it reuses the dome work.

Each state is one chunk (C59–C62) with the same flow: dossier read, pack changes, world block, set pieces, e2e tour with screenshots, review, docs. Same budgets (≤150 draws, ≤120k tris). Expect similar size to Oyo for Enugu and Ogun, Kaduna-size for Plateau and Katsina.

Top risks:
1. **Insecurity:** Katsina's rural banditry and mosque attacks; Plateau's recurring communal violence including at Jos markets; Ogun's cult violence and corridor kidnappings plus a 2026 polytechnic abduction; Enugu's kidnappings near the lake. Rural and corridor segments stay generic: no herds, uniforms, weapons, checkpoints, schools, burnt buildings or motorcycle swarms.
2. **Religion in the skyline:** no domes, minarets or crosses anywhere, even far off. Plateau's skyline is named `jos-domes` for granite domes; keep the name out of any player-facing text. Ogun's Olumo is skyline-only and unlabelled.
3. **Thin visual evidence.** Katsina has no text describing street scenes, gate forms or the college facade. Ogun's bridge names, roof colours and taxi colours are inference. Every shape is an interpretation until a local reviewer checks it; the dossiers list 12–17 questions each.
4. **Keke fatigue:** seven states on one signature ride makes them feel alike in the HUD and radio lines; the livery and the road, not the ride, carry the difference.
5. **Shared obstacles** (the red-and-white barrier and tyre piles) can still read as a checkpoint in the northern states; see C58.

## 6. How far to trust these dossiers

- Written by research agents using web search and page fetches; no photos were viewed in Katsina's case (the browser returned unrelated images), and several pages returned 403/404/429, so some claims rest on search summaries and are tagged single-source or inference.
- I re-checked three claims by search: the Enugu sky bridge is real (about 400 m, opened Aug 2025 with the bus terminals); Katsina's GRA flyover is the state's first (commissioned 2023); the Jos Wildlife Park has a pine entrance and a 2023 report says it holds almost no animals (so no animals are drawn). I did not re-check the incident dates behind the rejections.
- Three of the four research agents hit a session limit before reporting; their dossiers were already complete on disk, and the Ogun agent was resumed and finished. I checked that each file has all 14 sections.
