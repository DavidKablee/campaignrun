# Batch 5 plan — Edo, Abia, Benue, Ondo (research only, nothing built; first and second pass 28 Oct 2026)

Calendar unlock (already in `packages/content/data/calendar.json`): Edo and Benue 23 Nov 2026, Abia and Ondo 30 Nov 2026. **Approved by the user 28 Oct 2026 (all recommendations, including Edo danfo and Benue hilux → keke); built in the order Edo, Ondo, Abia, Benue (C69–C72).** Dossiers: `docs/research/states/{edo,abia,benue,ondo}.md`.

**How reliable this is.** Wikipedia (Benin City, Edo, Aba, Abia, Makurdi, Benue, Akure, Ondo, Idanre Hill, Benin Moat, Ilaje, Oba Market, Ring Road) and Wikivoyage (Benin City, Makurdi, Akure, Aba) pages were read, and about 25 searches cross-checked rides, markets, floods, fires and dress. Three Wikipedia pages (Ring Road, Zaki Biam Yam Market, Oba Market) carry a "suspected AI-generated" notice, so they are used for orientation only and every fact taken from them is marked. What is solid: Benin's Ring Road and the 2013 okada ban, the Benin Moat and its condition, Aba's Ariaria market clusters and 2026 okada ban, the Old Bridge at Makurdi, Zaki Biam's role, Idanre Hill's inselbergs and the Ilaje coast. What stays **thin** (no state-specific source in reach): everyday dress and house form in all four states, keke and bus colours, the form of the second Makurdi bridge, and how the Igbokoda waterfront looks today. Each dossier lists these in section 13 for a local reviewer.

## 1. Why these four

Sixteen states have worlds; 22 are still the stock Lagos look (21 real states and `dummy`). Batch 5 spreads over four zones and four environments the game does not have yet:
- **Edo (South-South):** red-earth rainforest city, rubber and oil palm, a ring road. First Edo/Bini look.
- **Abia (South-East):** the shoe-and-garment factory town. A working-city look, not a farm or palm look (Anambra and Imo are the farm-and-palm Igbo states).
- **Benue (North Central):** the first Middle Belt river-savanna state: a steel river bridge, yam barns, Tiv striped cloth.
- **Ondo (South-West):** the first cocoa-and-inselberg state, with a stilted lagoon edge (Ilaje).

Left for later batches (not researched): Cross River, Osun, Ekiti, Kogi, Niger, Adamawa, Taraba, Gombe, Jigawa, Kebbi, Zamfara, Yobe, Nasarawa, Bayelsa, Ebonyi, FCT. Cross River and Adamawa are the first alternates; Osun's draft landmark is a sacred grove (the Olumo rule) and would need a full rewrite.

## 2. What the research changed

| State | Draft landmarks | Verdict | Recommended five (segment 0 → 4) | Venue types |
|---|---|---|---|---|
| **Edo** | New Benin Market, Benin City Walls, Ring Road, Ogba Gardens, Ikpoba Hill Crossing | New Benin Market is a real market, but markets in Benin burn repeatedly and the Oluku market tanker fire was reported in Oct 2026, so the venue goes generic. The Walls are the real Benin Moat (a protected national monument, degraded, no sacred role); keep as a green rampart road gap. Ring Road is real (about 25 km, "King's Square"). "Ogba Gardens" has no source (Ogba Zoo exists and is poor; no animals). Ikpoba Hill is a real market area but "crossing" has no source. | Produce Market (generic), Brass Casters' Row (craft street, no heads or regalia), Moat Gate (the rampart cut by a road), Ring Road Junction, Township Stadium (generic) | market, landmark, bridge, square, stadium |
| **Abia** | Ariaria International Market, Ngwa Road Square, Azumini Blue River, Aba River Crossing, Umuahia Township Stadium | Ariaria is real and well documented (nine leather clusters, about 37,000 shops), but it has fires and floods on record and "International" is a name. Ngwa Road Square has no source; Ngwa Road is a real flooded corridor. Azumini is real (clear water, canoes). The real stadium is the club's name. | Shoe Cluster Market (generic), Fabric Market, Blue River Landing, Drain Channel Bridge, Township Stadium (generic) | market, market, waterfront, bridge, stadium |
| **Benue** | Wurukum Market, River Benue Bridge, Zaki Biam Yam Market, Wadata Waterside, Makurdi Township Stadium | Wurukum is real (outdoor, "raw, intense"). The Old Bridge (rail and road, 1932) is the true icon. Zaki Biam is 100+ km from Makurdi and sits in Ukum LGA; keep as a generic "Yam Market" piece. The real stadium is person-named. Wadata is a real Hausa-speaking quarter (a waterside there has no source). | Market (generic), Old Bridge (steel rail-road bridge), Yam Market, Riverbank Landing, Township Stadium (generic) | market, bridge, market, waterfront, stadium |
| **Ondo** | Oja Oba Akure, Idanre Hills, Igbokoda Waterside, Owena River Crossing, Akure Township Stadium | Oja Oba sits beside the palace; the market itself is real but the draft is "Oba's market" (a palace tie) so it goes generic. Idanre Hill is real but holds shrines, the old palace, burial grounds and steps named in myth, so only the rock outline and a generic stair appear. Igbokoda is the real Ilaje HQ with a large fish market and boat yard. Owena has no source for a crossing. | Cocoa Market (generic), Hill Steps (inselberg outline, no shrine), Lagoon Landing (Ilaje), River Crossing (generic), Township Stadium (generic) | market, landmark, waterfront, bridge, stadium |

Pack changes (all `verified: false`; a ride change also needs `pnpm content:roads`):
- **`signatureRide`:** Edo danfo → hold for your call (decision 3). Abia keke stands (keke is allowed in daytime; okada is banned). Benue hilux → keke or hold (decision 3). Ondo okada stands (day use allowed; 7 pm–6 am curfew since March 2026).
- **Palettes** (hexes to be distance-checked at build): Abia accent `#D98324` is near party orange, so use deep tan `#9A6A3C` (Sokoto already has leather brown); Ondo accent the same `#D98324`, so use cocoa brown `#6B4226`; Edo accent `#B8860B` is a mustard gold, keep and check; Benue accent `#D4A017` is also gold, so use river teal `#2F6F8F`. Grounds: Edo red earth `#8A4B32`; Abia the draft green `#3F6B3A` repeats Imo and Akwa Ibom, so use wet grey-red `#8B6F5A`; Ondo the same draft green, so use forest `#3A5F34`; Benue savanna green-yellow `#8E9A58`.
- **Skylines:** `edo-rubber` (a rubber-tree line with the moat's tree-lined bank), `abia-sheds` (low shed roofs and mast lights), `benue-hills` (low Ushongo-type ridge and a mango line), `ondo-inselbergs` (two rounded granite domes and cocoa canopy).
- **Welcome and farewell:** Edo: the draft "Obokhian!" is not verified; use English only until a Bini speaker supplies a line. Abia: "Nnọọ!" is already in the pack; "Daalụ" matches Igbo thanks (needs a native check). Benue: English only (Tiv and Idoma need a speaker). Ondo: "Ẹ káàbọ̀ sí Oǹdó!" and "Ẹ ṣeun, Ondo!" are standard Yoruba (needs a native check for the tone marks).

## 3. Decisions I need from you

1. **Markets by name or generic.** Recommendation: generic role names for all four (Benin's markets burn, Ariaria has flood and fire history, Oja Oba is next to a palace, Wurukum's trade is generic).
2. **Edo's brass casters.** Igun Street is real, public and famous, but the guild is the palace's and its output is portraits of the Oba and court. Recommendation: draw the row (crucibles, wax moulds, ingots, workshops, no figures) and name it "Brass Casters' Row"; keep every head, plaque and regalia out.
3. **Rides.** Edo danfo: a real Benin ride is the wine-and-yellow minibus, but the pack's danfo is the Lagos yellow-and-black body; options (a) keep danfo; (b) keke (tricycles are limited to named zones and need a permit); (c) hilux. Recommendation: **(a) keep danfo for Edo**, since okada is banned in the whole metropolis and keke is zone-restricted, and flag the Lagos livery to a local reviewer. Benue hilux: Makurdi has no commercial taxis and relies on okada and keke (Daily Trust, one source); recommendation: **hilux → keke**.
4. **Benue's "cattle-crossing".** Herder imagery with a conflict that killed 100+ in June 2025 (Yelwata). Recommendation: drop the hazard; use cart-weave (yam carts) as Bauchi did.
5. **Ondo's Idanre.** Recommendation: only the inselberg outline and a plain concrete stair; no shrines, palace, belfry, steps-by-name, or burial ground.
6. **Stadiums.** Generic "Township Stadium" (`stadiumBlock`) for all four.
7. **Floods and fires.** Aba and Benin both flood or burn on record, and Makurdi floods on the river. Recommendation: wet-road cues only, never burning stalls, tankers or fuel.
8. **Calendar.** Already fixed in `calendar.json` (above); no change.
9. **Research depth.** Done to the batch-4 standard; remaining thin points need a local reviewer.

## 4. Libraries and what each state reuses

| State | Library | Reuse | New |
|---|---|---|---|
| Edo | extend **`forest-hills`** with `edo.*` | red-earth laterite road, oil palm, bungalow and block lots, Ogun slab road base | `edo-red` road, `edo-rubber` skyline, rubber tree rows (flora), moat-gate piece, brass casters' row kerbside |
| Abia | extend **`farmland-river`** with `abia.*` | Igbo block shops and plazas, `igbo-city` dress, oil palm | `abia-wet` road (grey-red, puddle patches), `abia-sheds` skyline, shoe rack and sewing-machine kerbside, fabric-roll stall |
| Benue | extend **`guinea-savanna`** with `benue.*` | savanna flora (mango, shea, acacia), bungalows, Hausa quarter lots | `benue-sand` road, `benue-hills` skyline, yam-barn lot, steel truss bridge piece, Tiv `a-nger` striped dress |
| Ondo | extend **`forest-hills`** (or `creek-delta` for the lagoon districts) with `ondo.*` | rainforest flora, Yoruba dress base (`yoruba-southwest`), `ogun-slab` | `ondo-green` road, `ondo-inselbergs` skyline, cocoa drying mats and pods, stilt-house lot |

`forest-hills` would carry six states; if the file gets unwieldy, split at build time.

## 5. Shared work to do once, first
- `stadiumBlock` exists; reuse it four times.
- A Tiv-stripe (black and white) dress set and a rubber-tree flora entry are new.
- A "cart-weave" cue as yam carts (and shoe-rack handcarts for Abia).
- Re-check every dress and lot colour against the party colours (distance above 48), especially the gold and orange accents.
- Write each pack's `scenery` strings so that none matches a `case` in `world.ts` (the Oyo pitfall, C57): "bronze-casters' row", "red laterite banks", "shoemakers' sheds", "tailoring rows", "yam barns", "river sandbanks", "cocoa belt", "hill staircase" need a grep check first.
- A hazard visual already exists for dust, mist and wet roads (C68 client-only atmosphere); rain-slick is the one used in three of the four states.

## 6. Order, size and risks

Proposed build order: **Edo → Ondo → Abia → Benue** (Edo and Ondo share a library and rainforest flora; Abia is the most distinct city shape; Benue needs the most new work: bridge, striped cloth and yam barns).
- Each is about the size of a batch-4 state: 5 pieces, 3–4 new lots, a road, a skyline, a shop set, a dress set, one chunk doc, one e2e tour.
- Highest risk: thin evidence (decision 9). Edo and Ondo can read as one rainforest look; the red earth, rubber rows and brass row mark Edo, and cocoa, inselbergs and the stilted lagoon mark Ondo. Abia can read as Anambra's market; sheds, leather and fabrics are what separate it.
- Every landmark, name, line and colour stays `verified: false` until a local reviewer signs off.
