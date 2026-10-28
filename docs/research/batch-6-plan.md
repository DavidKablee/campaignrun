# Batch 6 plan — Osun, Adamawa, Jigawa, Cross River (built 28 Oct 2026; research pass 28 Oct 2026)

Calendar unlock (already in `packages/content/data/calendar.json`): Osun and Adamawa on 23 Nov 2026, Jigawa on 30 Nov 2026, Cross River on 7 Dec 2026 (Calabar Carnival week). Dossiers: `docs/research/states/{osun,adamawa,jigawa,cross-river}.md`. **Approved by the user 28 Oct 2026 ("use best recommendation", including Cross River keke); BUILT in the order Osun, Adamawa, Jigawa, Cross River (C73–C76).** A second, deeper research pass the same day changed two things, listed in section 6.

**How reliable this is.** Wikipedia (Osogbo, Osun State, Adire, Adamawa State, Yola, Jimeta, Sukur, Jigawa State, Dutse, Kazaure, Cross River State, Calabar, Calabar Carnival) and Wikivoyage (Yola) pages were read, and about 30 searches cross-checked rides, markets, fires, floods, dress and recent events. Several pages carry gaps: the Yola page has mismatched citations, the Dutse landscape section has no citations, and the Calabar page has no market, bridge or stadium detail. One search result (a Wikipedia mirror) carried embedded instructions to the reader; they were ignored and that page was not used. What is solid: Osogbo as the adire city on the Lagos–Kano railway, the Hadejia–Nguru wetlands and Jigawa's rock-and-dune terrain, the Mandara and Shebshi highlands and the Benue at Yola, Calabar's rivers, the okada ban and the carnival. What stays **thin** (no state-specific source in reach): everyday dress and house form in all four states, bus, taxi and keke colours, the form of the Yola–Jimeta bridges and of any Osogbo or Calabar bridge, and the real carnival route. Each dossier lists these in section 13.

## 1. Why these four

Twenty states have worlds; sixteen real states do not. The calendar decides the order: Osun, Adamawa and Jigawa unlock earlier than any other state still on the stock Lagos look, and Cross River is next, in Carnival week. Batch 6 adds environments the game does not have yet:
- **Osun (South-West):** the adire dye city: indigo cloth, a murky river, a railway crossing, a ring road.
- **Adamawa (North-East):** the first highland state: Mandara granite terraces, a wide Benue, a lake and dam.
- **Jigawa (North-West):** rock domes, dunes, date palms and the Hadejia rice wetlands (a different Hausa world from Kano and Sokoto's walled cities).
- **Cross River (South-South):** a rainforest port city on two rivers with a harbour and a carnival avenue.

Left for later batches (not researched): Niger, Gombe, Ebonyi, Kebbi, Ekiti, Kogi, Taraba, Bayelsa, Nasarawa, Yobe, Zamfara, FCT.

## 2. What the research changed

| State | Draft landmarks | Verdict | Recommended five (segment 0 → 4) | Venue types |
|---|---|---|---|---|
| **Osun** | Osun-Osogbo Sacred Grove, Oja Oba Osogbo, Osun River Crossing, Ife Cultural Ground, Osogbo Township Stadium | The Grove is a UNESCO-listed shrine of the river goddess (religious), Oja Oba is a former palace with a fire on record, and Ife's ground has the Ooni's palace and sacred sites, so three go. The river and the dye trade are real. | Dye Market (generic), Osun River Bridge (plain), Rail Crossing, Ring Road Interchange, Township Stadium (generic) | market, bridge, landmark, square, stadium |
| **Adamawa** | Jimeta Modern Market, Sukur Hill Terraces, Numan Bridge, Kiri Lakeside, Yola Township Stadium | The Jimeta markets have fire and flood history and the newest is named for a person. Sukur is a UNESCO site (palace, sacred and burial parts) 290 km away: keep only generic stone terraces. No source for a bridge at Numan; the verified bridge-like items are the Total Junction flyover and the Yola–Jimeta link bridges. Kiri Dam is real. | Market (generic), Mandara Terraces, Junction Flyover, Lakeside Dam, Township Stadium (generic) | market, landmark, bridge, waterfront, stadium |
| **Jigawa** | Dutse Central Market, Birnin Kudu Rock Shelters, Hadejia Wetlands, Kazaure Gate, Dutse Township Stadium | No source for a Dutse Central Market. The rock shelter's paintings are real but the look is unsourced: draw the outcrop only. The Hadejia wetlands are real, with deadly floods in 2024: draw dry-season paddies and a canal. Kazaure's wall is real (Britannica) but the gate is not sourced: draw a generic Hausa gate. | Market (generic), Rock Shelter, Wetland Paddies, Town Gate, Township Stadium (generic) | market, landmark, waterfront, square, stadium |
| **Cross River** | Marina Waterfront, Carnival Route, Watt Market, Tinapa Grounds, Calabar Township Stadium | The Marina Resort closed after a 2023 boat accident. The carnival route is real but a driver killed 14 people at the 2022 bikers' event and the carnival was cancelled in 2020–21. Watt and Marian markets have burned repeatedly. Tinapa was repossessed in Nov 2025 and is idle (no disaster). | River Quay, Carnival Road (no crowd, no vehicles in a crowd), Central Market (generic), Trade Hall, Township Stadium (generic) | waterfront, square, market, landmark, stadium |

Pack changes (all `verified: false`; a ride change also needs `pnpm content:roads`):
- **`signatureRide`:** Osun okada stands (okada operates in Osogbo; no 2025–26 ban found). Adamawa hilux → keke after the second pass (section 6). Jigawa keke stands (a night motorcycle curfew exists). Cross River danfo → keke (decision 3, approved).
- **Palettes** (hexes distance-checked against the six party colours; all more than 48): Osun ground `#5E7A3A` and accent adire indigo `#2B3A6B` (the draft ground `#3F6B3A` repeats five states); Adamawa keeps ground `#8A6038` and accent `#5E8A46`; Jigawa accent date-palm brown `#8C5A2B` (the draft `#C45C26` is only 20 from party orange and would fail the content lint); Cross River ground rainforest `#2F5D3A` and accent plum `#7A2E4A` (the draft `#E0319A` is 34 from party magenta and would fail).
- **Skylines:** `osun-forest`, `adamawa-mandara`, `jigawa-inselbergs`, `calabar-canopy`.
- **Welcome and farewell:** the existing pack lines stay (Yoruba, Hausa, Hausa, English); Cross River gains an English farewell; a native speaker should check Osun's tone marks.

## 3. Decisions I need from you

1. **Markets by name or generic.** Recommendation: generic role names for all four (Oja Oba is a former palace, Jimeta and Watt both burn, Dutse has no source).
2. **Osun's sacred sites.** Recommendation: no grove, shrine, goddess, priestess, festival or waterfall; the dye trade, a plain river, a rail crossing and an interchange carry the state.
3. **Rides.** Cross River danfo: the evidence (one travel guide, plus keke protests in 2026) says pool taxis and keke carry Calabar, with okada banned and no scheduled buses. Options (a) keep danfo; (b) keke; (c) hilux. Recommendation: **(b) keke**. Others unchanged.
4. **Calabar Carnival.** Recommendation: draw the avenue with bunting, a grandstand and flags, never a crowd, bikers, floats or vehicles, because of the 2022 tragedy.
5. **Adamawa's Sukur.** Recommendation: generic stone terraces and round clay huts on a granite hill, with no palace, wall circuit, gate stones or burial grounds.
6. **Jigawa's rock shelter and wetlands.** Recommendation: the outcrop without paintings; paddies and canal in the dry season, no flood.
7. **Stadiums.** Generic "Township Stadium" (`stadiumBlock`) for all four.
8. **Floods and fires.** Jimeta, Hadejia, Osogbo and Calabar all flood or burn on record. Recommendation: wet-road cues only, never fire, flood water or evacuation.
9. **Libraries.** `forest-hills` already holds six states (83 KB); Osun would be the seventh. Recommendation: add Osun and keep a note to split later; Adamawa to `guinea-savanna`, Jigawa to `sahel-savanna`, Cross River to `creek-delta`. Say if you would rather split `forest-hills` first.
10. **Build order.** By unlock date: Osun, Adamawa, Jigawa, Cross River.
11. **Research depth.** Done to the batch-5 standard; thin points need a local reviewer.

## 4. Libraries and what each state reuses

| State | Library | Reuse | New |
|---|---|---|---|
| Osun | extend **`forest-hills`** with `osun.*` | Yoruba block lots and shops, `ogun`/`oyo` dress base, cocoa and oil palm flora | `osun-green` road, `osun-forest` skyline, dye-yard lot (pits and cloth lines), rail-crossing piece, adire kerbside |
| Adamawa | extend **`guinea-savanna`** with `adamawa.*` | savanna flora (baobab, neem, acacia), Hausa lots, `boulder-wall` | `adamawa-dust` road, `adamawa-mandara` skyline, terrace-wall op, dam-wall piece, flyover piece |
| Jigawa | extend **`sahel-savanna`** with `jigawa.*` | Hausa mud-brick lots, date palms, reed bed, irrigation crops | `jigawa-sand` road, `jigawa-inselbergs` skyline, boulder-dome piece, paddy-canal op, mud gate piece |
| Cross River | extend **`creek-delta`** with `cross-river.*` | mangrove, raffia, creek quay, tin-roof lots | `calabar-wet` road, `calabar-canopy` skyline, harbour-crane quay, avenue-with-grandstand piece, exhibition-hall piece |

## 5. Risks and what stays open

- Everyday dress and house form are thin in all four states; a local reviewer must see every state before anything is marked verified.
- Sim-level questions from earlier rounds are untouched and need your call: `signatureRideBonusPermille` against "no home-state bonuses", and Rivers danfo → keke.
- No real-phone test yet (you deferred it).
- After Batch 6, twelve real states still have the stock look.

## 6. Second research pass (28 Oct 2026, before building)

Thin points were searched again (about 15 more searches and four page reads). What changed:
- **Adamawa ride: hilux → keke.** A travel guide and a resident's account say yellow Keke Napep are the usual way to move in Jimeta and Yola, motorcycles were banned and minibuses and shuttle buses have largely given way to keke; no source mentions a hilux fleet. Same standard as Benue. Hazards (switchback, rocky-ridge, go-slow) stay. The faster.ng page also said keke lead, but it is credited to an AI writer and cites nothing, so it is not counted.
- **Cross River ride: danfo → keke** (as approved); evidence is the 2026 keke protests and pool taxis plus keke in a travel guide. A 2013 report said keke were once restricted to suburbs; no current rule found.
- **Calabar's quay is fully generic.** The Marina Resort stands on the site of a former slave port and a museum on the Marina documents that history, so the quay shows only a plain jetty, crane and mangroves.
- **Osun houses.** A study of 406 Osogbo households found 80% live in "face-me-I-face-you" rooming houses (a long block with a corridor and a row of doors), 14.8% in Western-style apartments and 1.2% in courtyard houses. The lot kit gets a long rooming house with a shared veranda.
- **Hausa walls and roofs (Jigawa).** Studies of Hausa housing (Kano) record mud walls 600–1000 mm thick giving way to 150–225 mm block, and thatch giving way to timber and zinc. Jigawa lots use cream block and zinc, with one mud-brick compound.
- **Rock art (Jigawa).** Dutsen Habude's paintings include cattle and some sites are sacred to the community, so the outcrop is drawn bare, with no painting and no cattle.
- **Osun rail.** The Lagos–Osogbo narrow-gauge line runs; its track was washed out in May 2025 and repaired. No level-crossing source: the piece is a rail line beside the road with a barrier and a signal, generic.
- **Keke and bus colours.** Still unsourced for every state. Jimeta's keke are described as yellow; elsewhere the pack's generic keke body is used. A local reviewer must check.
- **Still thin after the second pass:** everyday dress in all four states, Yola and Calabar street scenes, Dutse and Hadejia markets, and the real Yola–Jimeta bridge forms.
