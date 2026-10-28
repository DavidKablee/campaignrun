# Borno — world research dossier

Status: DRAFT (research only; not reviewed by a local reviewer). Every landmark stays `verified: false` until someone from the state signs off in section 14.

Rules that bind this dossier (AGENTS.md, docs/GUARDRAILS.md, docs/chunks/C27.md, C34.md, ADR-0009):
- No photos are downloaded, traced, copied or committed. Record a text description and the source URL only.
- A venue is one of: market, stadium, square, park, bridge, landmark, waterfront. A palace is scenery only, never a venue. No religious building as a landmark. Nothing named after a person. No recent disaster. No real politicians, parties, slogans or party colours.
- Welcome and farewell lines only in a language the state actually speaks.

Evidence tags used below: **[2+]** two or more independent sources agree; **[1]** single source, treat as unconfirmed; **[inf]** inference or general knowledge that no fetched source confirmed. Person-named places, and the people they honour, are referred to by role ("the city's top-flight football ground", "the university") on purpose; where a source URL contains a person's name the slug is omitted and described instead. Casualty figures are deliberately not recorded.

## 1. Scope and date
Researched 2026-10-27 by one agent using WebSearch (standard, and extended for the thin topics: Kanuri vernacular architecture, Maiduguri housing types, Kanuri phrases) and WebFetch only: Wikipedia, Wikivoyage, Wikimedia Commons category and file pages (text, file names and captions only, no images opened), a Nigerian arts-journal paper on the state's museums, Things Nigeria, Daily Trust / Gazette / Guardian / Arise / BusinessDay news, ethnographic summaries (encyclopedia.com), and academic abstracts on the Chad Basin clay plains. Several pages returned 403/406/402/SSL errors (Britannica, kupi.com, the New Humanitarian hijab feature, Humanities Across Borders, one Guardian piece, the NJH cap-making paper as unreadable PDF binary); for those only search-result summaries were available and are tagged `[1]`. The search tool is US-only.

**Headline findings (read these first; they change the draft pack):**
1. **Every major named public node in Maiduguri has a recent disaster or insecurity history.** The Monday Market was destroyed by fire in February 2023, rebuilt, and then its roundabout was one of three coordinated blast sites on 16 March 2026 (seven months before this dossier) as well as a bombing site in 2014 [2+]. The gate of the teaching hospital and the post-office roundabout were the other two 2026 sites [2+]. The Gamboru market burned twice in 2023 [1]. The 2024 Alau dam failure flooded the zoo, post office, university, a market and the teaching hospital and destroyed some river bridges [2+]. A suicide bombing at a city mosque was reported in December 2025 [1, S1]. **Recommendation: use role-named, generic civic landmarks (a cap-and-cloth market lane, a flyover, a city gate, a main football ground, a dry-season riverbank) and no named real-world node at all.** The product owner should also decide whether Maiduguri should be the visible city at all, or whether Borno should be drawn as a generic Kanuri sahel town (see section 13, Q1).
2. **All five draft landmarks fail at least one rule.** Monday Market (bombing and fire history), the museum (undescribed, dilapidated, courtyard statue of a person), the stadium (named for an early-19th-century ruler), the park (named for a former traditional ruler; flooded in 2024), the polytechnic (named for a former head of state). See section 9.
3. **The pack's `signatureRide: "okada"` is wrong for Maiduguri.** Motorcycle taxis have been banned in the city since 2011 or 2014 (sources disagree) as a security measure [2+]; the city runs on yellow `keke` tricycles (reported 80,000 of them [1]). Use `keke`.
4. **Two of the angle's props are weaker than expected.** Bicycles: no source describes everyday cycling; the only bicycle hits are security-ban notices, so keep them as a rare background prop [inf]. Yedseram: it is a small seasonal river that is not seen in the city; the Ngadda is the river that runs through Maiduguri [2+: S15, S44].
5. **Do not reuse Kano's mudbrick compound unchanged.** Its horn pinnacles (zankwaye) are a Hausa feature [2+ in the Kano dossier]; no Kanuri source attests them.
6. **Pack colours.** The pack's palette is almost identical to Kano's (`#E7CE9C`/`#B8895A`). Borno needs a paler, hazier, sand-and-cream palette so the two sahel states do not read the same.

## 2. Sources
Accessed 2026-10-27 for all rows. "Search summary only" means the page itself could not be fetched.

| # | URL | Title | Supports | Single-source? |
|---|-----|-------|----------|----------------|
| S1 | https://en.wikipedia.org/wiki/Maiduguri | Maiduguri (Wikipedia) | founding 1907, two-city structure, markets, climate (BSh, 699 mm, Aug wettest, hot season mid-Mar to late May, record 47 C), neem planting, wide streets with sidewalks and drains, city gate and roundabout captions, Ngadda, institutions, ethnic mix, conflict items to avoid | no (core) |
| S2 | https://en.wikivoyage.org/wiki/Maiduguri | Maiduguri (Wikivoyage) | yellow keke, blue buses, markets list (incl. a caps market), museum, palace, restaurants and plaza names, power cuts and dark nights, checkpoints (to avoid), rail service not running | no (with S1, S36) |
| S3 | https://en.wikipedia.org/wiki/Borno_State | Borno State | state geography (Sahel north, Sudan savanna centre, Mandara plateau, Lake Chad NE), languages, 85% Muslim / ~7% Christian, formation 1976, Dec-Feb harmattan, rains Jun-Jul onward | no |
| S4 | https://commons.wikimedia.org/wiki/Category:Maiduguri | Commons category Maiduguri (filenames only) | existence of: city gate, express-way welcome sign, flyover at night, bridge with streetlights, neem shade, roundabouts, keke and street market, camels at the market, stalls at night, river, sunrise/sunset, railway terminus, old rail carriages, post office on a main road; five sub-categories | weak (names only) |
| S5 | https://commons.wikimedia.org/wiki/File:Truck_and_kekes_at_city_gate_maiduguri.jpg | File description | "Truck and Kekes (tricycles) at city gate Maiduguri", 19 Jul 2019, coordinates 11.831 N 13.151 E | yes |
| S6 | https://commons.wikimedia.org/wiki/File:Maiduguri_Bridge_in_Borno_State_(1).jpg | File description | caption: wayside, bridge and street lights; depicted: tree, streetlight, tricycle; river not named | yes |
| S7 | Commons files "Neem Tree shades in Maiduguri (1)", "Road at noon in Maiduguri (1)", "Maiduguri Flyover night (1)" | File pages (Wiki Loves Africa 2023, theme climate and weather) | neem shade exists; noon road; a flyover lit at night; no captions beyond titles | weak |
| S8 | https://britishempire.co.uk/article/maiduguristreets.htm | Notes on northern Nigeria 1948-1960 | one caption: many streets lined with neem trees | yes |
| S9 | https://thingsnigeria.com/2017/09/09/maiduguri/ | Maiduguri, a new capital for an old kingdom | Yerwa and Maiduguri twin settlements 1907, guild quarters (calabash makers, tanners, dyers, blacksmiths), palace of burnt brick by Kanuri masons with Arab borrowings, climate (>45 C Mar-Apr, <10 C harmattan nights), crops (sorghum, millet, rice, maize, cowpea), river called Alo | yes (places the river bank sides the other way round from S1; see section 3) |
| S10 | https://en.wikipedia.org/wiki/Monday_Market | Monday Market | early 1970s, large trade hub, 1979 fire, rebuilt 1985, 26 Feb 2023 fire (~13,000 shops) | no (with S11) |
| S11 | Gazette, 23 Oct 2023, article on the market reopening (slug names a politician; omitted) | Monday Market reopens | remodelled market reopened eight months after the fire; rent waiver | no |
| S12 | allafrica.com/stories/202603180242.html ; ewn.co.za/2026/03/17/ (Reuters/AP summaries) ; thecable.ng and aljazeera.com 2014 reports (search summaries only) | Maiduguri blasts 2014 and 16 Mar 2026 | blasts at the market roundabout (2014) and at the teaching-hospital gate, post office and market roundabout (2026) | no |
| S13 | Wikipedia article on the city's zoological park (slug contains a person's name; omitted) ; Commons zoo sub-category (slug likewise) | Zoological park | opened 1970, ~17 ha, named for a former traditional ruler, flood killed >80% of animals Sept 2024 | no (with S14) |
| S14 | allafrica.com/stories/202409100632.html ; media.un.org/unifeed/en/asset/d325/d3254504 ; africanews.com/amp/2024/09/13/ ; allafrica.com/stories/202602240640.html (search summaries) | Alau dam failure and Maiduguri flood, Sept 2024; bridge reconstruction 2026 | flood scale, institutions flooded, bridges destroyed and being rebuilt | no |
| S15 | https://en.wikipedia.org/wiki/Ngadda_River | Ngadda River | seasonal river, flows to Lake Chad basin, runs through the city, canoes, pollution, floods | yes (with S44) |
| S16 | https://en.wikipedia.org/wiki/University_of_Maiduguri | University of Maiduguri | founded 1975, 12 faculties, 2017 attacks, 27 km perimeter trench, renamed after a former president July 2025 | no (with S17) |
| S17 | icirnigeria.org, gazettengr.com and sahara reporters pieces on the university renaming, July 2025 (slugs name people; omitted; search summaries) | University renaming | confirms the rename | no |
| S18 | Wikipedia article on the state polytechnic (slug contains a person's name; omitted) | Polytechnic | founded 1973 as a technical college, renamed 1978 for the then head of state, polytechnic 1979 | yes |
| S19 | Wikipedia articles on the main stadium and the top-flight club (slugs contain a person's name; omitted) ; africanews.com/2016/02/05/maiduguri-s-football-team-hope-to-play-soon-at-home/ (summary) | Main stadium and club | ~10,000 seats, named for an early-19th-century ruler, club founded 1986, exiled to other cities 2014-16 | no (stub) |
| S20 | https://theartsjournal.net/2020/06/24/shallangwa/ | Museums and their relevance in Borno State (2020) | museum in city centre, courtyard statue of a historical figure, collections of raffia products and tools, decline from the late 1990s | yes |
| S21 | Daily Trust, April 2021, residents ask for the museum to be restored (search summary); Guardian Nigeria on the planned Kanem-Borno museum (403; summary) | Museum condition | dilapidated in 2021; a new federal museum announced | no |
| S22 | https://www.encyclopedia.com/humanities/encyclopedias-almanacs-transcripts-and-maps/kanuri | Kanuri (Countries and Their Cultures) | walled compounds, mud or grass-mat walls, conical thatch roofs, wards, clay for building, millet staple, donkeys, horses as prestige | yes (regional ethnography) |
| S23 | https://www.culturesofwestafrica.com/who-are-kanuri-people/ | Who are the Kanuri people | mudbrick palaces, arched doorways, geometric designs; old quarters with courtyards and domed roofs; gowns, embroidered caps; wrappers and headscarves | yes (popular source) |
| S24 | https://nnewicity.com/the-kanuri-people-of-bornu/ | The Kanuri people of Bornu | sun-dried mud brick, close-set houses, shared courtyards, babban riga with embroidered caps | yes (popular source; agrees with S23 on mud brick) |
| S25 | https://rexclarkeadventures.com/shehu-of-borno-palace-origins-architecture-travel-tips/ | The traditional ruler's palace | mud and clay, arched doorways, murals and carvings, slightly raised ground in a flat sandy landscape, old wall remnants | yes (promotional) |
| S26 | https://en.wikipedia.org/wiki/Kukawa | Kukawa | white-clay walled twin towns, 6 m (20 ft) mud wall, historic capital near Lake Chad, later conflict | yes |
| S27 | https://en.wikipedia.org/wiki/Lake_Chad | Lake Chad | ~2,000 km2, max depth 2 m, reed and papyrus, acacia/baobab/palm/jujube woodland, fishing, low water Jun-Jul and high Nov-Dec | no |
| S28 | https://en.wikipedia.org/wiki/Kanuri_people | Kanuri people | settled farmers and fishers, horsemanship, languages | no |
| S29 | https://en.wikipedia.org/wiki/Kanuri_language | Kanuri language | ~10.6 million speakers, dialects, orthography agreed in Maiduguri 1975, special letters, no greetings listed | no |
| S30 | https://en.wikivoyage.org/wiki/Kanuri_phrasebook | Kanuri phrasebook | "an outline"; thank you given as "Nyiro askǝrgǝna"; "Ndâ watu?" morning greeting; numerals | yes |
| S31 | polyglotclub.com Central Kanuri greetings (403; search summary only) | Greetings | "Ushé-ushé" hello, "Ndâ wadu?" morning greeting; a search summary of the same site gave "Nyiro zauro" for thanks (conflicts with S30) | yes |
| S32 | https://en.wikivoyage.org/wiki/Hausa_phrasebook | Hausa phrasebook | sannu, sannu da zuwa, barka da zuwa, na gode, sai an jima, kasuwa, don Allah | no (with the Kano and Kaduna dossiers) |
| S33 | https://en.wikipedia.org/wiki/Hausa_people | Hausa people | babban riga, hula, turban, zani, kallabi, gyale; no Borno detail | no |
| S34 | https://en.wikipedia.org/wiki/Boubou_(clothing) | Boubou | Kanuri call the gown "kulwu"; Hausa "babban riga"; large turban veiling the face (alasho) | yes |
| S35 | epub.uni-bayreuth.de/6015 (a 2002 study of the Malgwa in Maiduguri; search summary) | Hausa as second language in Maiduguri | Hausa has replaced Kanuri as the common second language in the city | yes (with S29 "declined" note) |
| S36 | https://watchlist.org/news/inside-maiduguri | Inside Maiduguri | queues of cars with bright keke weaving through, shoe-polishers on pavements, schoolgirls in dark green uniforms, boys selling bags of water at lights | yes |
| S37 | thenewhumanitarian.org/report/101137/wild-bunch-nigerias-tricycle-taxis ; world.time.com/?p=6920 ; icirnigeria.org and ripplesnigeria.com motorcycle-ban reports ; blueprint.ng and dailytrust.com tricycle-ban reports (search summaries) | Keke and the motorcycle ban | yellow tricycles, ~80,000 in the city, okada banned (2011 or 2014; sources differ), bicycles appear only in temporary vehicle bans | no |
| S38 | leadership.ng/?p=133403 ; africanreview.com/construction/roads/borno-starts-first-flyover-construction ; constructionreviewonline.com/2020/01/ ; africanews.com/2021/12/24/ (search summaries) ; Guardian Nigeria N4.3bn contract piece (summary) | Customs-roundabout flyover | ~2.4 km, upper and lower lanes, exits to the Bama and Dikwa roads, trumpet interchange, opened Dec 2021, first in the state | no |
| S39 | Guardian/NAN/New Telegraph stories on a N16bn dual carriageway with a six-span bridge over the Ngadda-Bul river (slugs name a politician; omitted; search summaries) | New expressway project | 7.1 km dual carriageway, six-span bridge, a new flyover, 8-10 month timeline | no |
| S40 | humanglemedia.com (Maiduguri solar street lights) ; newtelegraphng.com (1,500 solar poles installed) ; dailytrust.com/bemoaning-rising-tide-of-tree-destruction/ (summaries) | Solar lights and tree loss | 1,500 solar poles; trees on main roads from the airport to the post-office roundabout cleared for dualisation (column) | no (2 on solar) |
| S41 | https://dailytrust.com/why-maiduguri-needs-additional-markets/ | Why Maiduguri needs additional markets | Monday, Kasuwan Shanu and Custom markets named; crowding, grains/livestock/fish | yes |
| S42 | https://gazettengr.com/visibility-breathing-to-worsen-as-dust-haze-engulfs-north-nimet-warns/ ; radionigerialagos.gov.ng NiMet harmattan alert (summary) | Harmattan haze | Maiduguri named; visibility 500-3,000 m falling to 1,000 m or below; dust plume raised in Chad | no |
| S43 | publikationen.ub.uni-frankfurt.de/opus4/frontdoor/index/index/year/2006/docId/1886 ; ojs.ub.uni-frankfurt.de/fvss/index.php/fvss/article/view/16 (summaries) | Firgi plains and masakwa sorghum | Chad Basin clay plains ("firgi"), dry-season sorghum "masakwa" ("ngawuli firgibe" in Kanuri), fields green in the dry season | no |
| S44 | horizon.documentation.ird.fr (Chad atlas) ; lis.cblt.org wetlands page (search summaries) | Ngadda and Yedseram | small seasonal rivers, lower courses almost dry for part of the year, lost in marshes before the lake | no |
| S45 | njh.com.ng/admin/img/paper/NJH-32-2-2024-18-30.pdf (title only; PDF unreadable) ; voanews.com/amp/3489289.html ; dailytrust.com/how-cap-knitting-changed-our-lives-idps/ | Kanuri "rawaram" caps | multi-layer hand-sewn caps; many makers displaced from Bama | no |
| S46 | https://businessday.ng/art-and-travel/article/maiduguri-still-thrives-amidst-terror-threats/ | Maiduguri still thrives (30 Nov 2014) | spacious road layout, neem "dogonyaro", three markets, bank branches, suya stalls, dawn ~5:00 | yes (dated) |
| S47 | https://en.wikipedia.org/wiki/July_2014_Maiduguri_bombing | July 2014 Maiduguri bombing | the 2014 market-roundabout bombing | yes |
| S48 | nannews.ng/again-fire-guts-gamboru-market-in-borno/ ; humanglemedia.com (search summaries) | Gamboru market fires 2023 | two fires in 2023 | no |
| S49 | publikationen.ub.uni-frankfurt.de (docId 1813) ; ndarason / von.gov.ng Baga fish market pieces (summaries) | Trade goods; Baga fish market | historic cloth (turkudi), salt, natron, dried fish, livestock; the fish market sits on the road to a lake-shore town with 2014-15 attacks | no |
| S50 | thenewhumanitarian.org/2022/02/21/my-hijab-nigerian-muslim-women-faith-and-fashion ; english.fullerton.edu/publications/clnArchives/pdf/muzau_fabnnam-garments.pdf ; humanitiesacrossborders.org/taxonomy/term/45 ; joshuaproject.net Yerwa Kanuri (all search summaries) | Dress | hijab over floor-length gown; Kanuri roomy garments and caps; Kanuri dyers' tie-dye "Dongashou" in blue and black; festival robe-style dress | no |
| S51 | https://en.wikipedia.org/wiki/Chad_Basin_National_Park ; nigerianflightdeck.com park piece (summaries) | Chad Basin National Park | operations suspended 2021 for insecurity | no |
| S52 | arise.tv piece on a pedestrian underpass near the Gamboru market area, Sept 2023 (slug names a politician; omitted) | Underpass | tunnel-style pedestrian underpass | yes |

## 3. Built form
**What Maiduguri is:** two settlements founded in 1907 on a flat plain: the Kanuri capital Yerwa and a British garrison camp (Old Maiduguri), later merged; the railway arrived in 1964 [2+: S1, S9]. Sources disagree on which side is which: S1 puts Yerwa to the west and Old Maiduguri to the east; S9 puts Maiduguri on the south bank of the river and Yerwa on the north. Do not draw a bank-side convention. Elevation about 320 m (Commons category infobox). Ward names on aid-agency maps include Bolori, Bulabulin, Gwange, Hausari and Shehuri [1, search summary]; none has a source description, so district labels in section 12 are descriptive, not ward names.

**Old / vernacular (Yerwa Kanuri quarters)**
- Walled family compounds of mud or woven grass mat with conical thatched roofs; clay from low ground is the building and pot material [1 regional ethnography: S22]. This describes villages more than the capital.
- Urban old quarters: mud-brick houses, arched doorways, geometric/relief decoration, shared courtyards, and in two popular sources "domed roofs" [1 each: S23, S25]. S24 and S23 agree on sun-dried mud brick [2: S23, S24].
- **Roof-form conflict.** S22 says cone thatch; S23 says domed in Maiduguri's old quarters; the Hausa-region mud-roof literature found in the search describes flat roofs on split-palm (azara) beams and arched vaults [1, summaries of an ABU thesis]. **Modelling reading [inf]:** rendered mud-block compounds with a low parapet and a flat roof, a dark arched door set in a plain face, no horn pinnacles; cone-thatch huts only in a village strip. Ask the reviewer (Q4).
- Wall colour: Kukawa's historic town walls were "white clay" [1, S26]; a pale cream or sand render with a darker door is a safe default [inf]. A Commons-category title for a Kanuri palace is not a source for colour.
- Woven grass-mat screens and fences are attested as wall material [1, S22] and are a cheap Borno-specific prop.
- Guild quarters still exist by trade: calabash makers, tanners, dyers, blacksmiths [1, S9]. Use as stall types (leather, dyed cloth, metal, calabash) rather than as named districts.
- The traditional ruler's palace is of burnt brick by Kanuri masons with Arab-style borrowings [1, S9] or "mud and clay" with arched doorways, murals and carvings [1, S25]; the two disagree on material. Palace is scenery only; at most a far-field mass behind a wall.
- Historic wall remains are mentioned (the old Borno fortifications [1, S25]); Kukawa had a 6 m mud exterior wall [1, S26]. **Do not reuse the Kano `wall: earthen` op for Maiduguri**: a long raised earth bank reads as the 65 km security berm that was built around the city [1, S1] and the 27 km trench around the university [1, S16].

**Colonial**
- Founded as a garrison in 1907-08; a provincial school opened 1915; a WWII air base; tree planting (neem) was a colonial priority [2+: S1, S9, S8]. No source describes colonial house forms. **Thin.** Commons names a main-road post office building, a railway terminus and "old rail carriages" [1 each, filenames: S4]. A small number of hipped-roof veranda bungalows near a garrison quarter is [inf] and low-weight.

**Contemporary city**
- Wide, "spaciously laid" roads with sidewalks and flood-management ditches [2: S1, S46]; major bank branches and shops for phones, electronics and spare parts, often traders from southern states [1, S46]; suya stalls [1, S46].
- Restaurants and plazas: a named "plaza" with a patisserie and a "Lagos Street" bakery exist [1, S2]; hotels with terraces and generators [1, S2]. Electricity is patchy: grid, solar and generators [1, S1]; "very dark after nightfall" [1, S2, 2024 note].
- New commercial building: a concrete bus terminal with ~373 lock-up shops and ~220 market stalls on a main road (announced) [1, search summary]; a remodelled market after the 2023 fire [1, S11].
- Infrastructure: first flyover in the state with upper and lower lanes (opened Dec 2021) [2+: S38]; a six-span bridge and a second flyover under way [1, S39]; a tunnel-style pedestrian underpass [1, S52].
- Heights are not documented. Keep 1-3 floors with a few 4-5 storey plaza blocks [inf].
- **Hardening and conflict-era structures (to omit, see section 6):** high walls with barbed wire and armed guards at hotels [1, S2], earthen berm, trench, checkpoints, curfew notices.

**Rural edge (firgi clay plain and villages)**
- Settlements: hamlets every 1.5-3 km, villages every 8-10 km, farms radiating outward, scattered fields and pasture [1, S22]. Walled compounds of mud with thatch cones; later block and zinc [inf].
- Terrain and light make the rural edge feel very open: flat horizon, few buildings above the tree line.

## 4. Road
- **Surface and layout:** asphalt main roads, wide, sidewalks and drainage ditches [2: S1, S46]. Several roads are being dualised; a 7.1 km dual carriageway is announced [1, S39]. Trees on main roads from the airport to the post-office roundabout were cleared for dualisation, per a column [1, S40], so **new dual carriageways should have few trees; the neem canopy belongs on older avenues and side streets**.
- **Roundabouts:** many; the "Main Round about" and numerous "Round about" files exist [1 each, S4]. The market's roundabout, the post-office roundabout and the hospital gate were attack sites in 2014 and/or 2026 [2+: S12, S47]; the customs roundabout area had blasts in 2012-13 [1, search summary]. **Do not model any named roundabout.** A generic plain roundabout is acceptable only with no monument and no market beside it.
- **Flyover:** two-level, trumpet interchange, exits towards two provincial roads [2: S38]. Commons holds ten night photos of a flyover [1, S4], so night-lit flyover piers are on-brand.
- **Bridges:** a road bridge with streetlights [1, S6]; the new six-span bridge over a river [1, S39]; river bridges destroyed in the 2024 flood and being rebuilt (reconstruction began Feb 2026, 18-month timeline) [1, S14]. Do not show a bridge under reconstruction.
- **Streetlights and poles:** solar poles, ~1,500 installed [2: S40]; older concrete/wood poles with sagging wires [inf]. Patchy at night.
- **Kerbs, markings, signs:** no source. [inf] low concrete kerbs on the dual avenues, none on side streets; sandy shoulder; green/white direction boards; a "Welcome to Maiduguri express way" sign exists [1, S4]. Zebra bars only at big junctions.
- **City gate:** a "Maiduguri City Gate" exists on Commons and a "Borno Express Gate" [1 each, S4]; one photo is of trucks and kekes at the city gate (2019) [1, S5]. Shape unknown.
- **Roadside activity:** pavement shoe-polishers; adults and teens selling sachet/bags of water to drivers at traffic lights; schoolgirls crossing in uniform [1, S36]; suya grills [1, S46]; trucks delivering to markets [1, S46]; **camels at a market** [1, filename S4] (a single laden camel at a market edge is plausible; it is a Sahel prop). Donkeys as draft animals [1, S22].
- **Vehicles:** yellow keke tricycles are the signature [2: S2, S37]; reported ~80,000 [1, S37]; one report says kekes were adopted in mid-2014 after motorcycle taxis were banned [1], another says the ban dates from 2011 [1]; either way **okada are absent** [2+]. Blue buses [1, S2]. Long trucks on the border-bound route (Commons "Border Bound Trucks") [1, S4]. Cars at parking slots [1, S4]. Bicycles: **no evidence of everyday use**; use sparingly [inf].
- **Local nickname for the tricycles:** one source uses a nickname derived from a former state official's name [1, S36]. Do not use it in any text.
- **Trains:** the city is the rail terminus but passenger service is not running [1, S2]. Do not show moving trains.

## 5. Vegetation, terrain, water, light and season
- **Terrain:** flat semi-arid plain; Sahel north of the city, Sudan savanna south [1, S3]; sandy soils around the palace [1, S25]; clay plains ("firgi") across the Chad Basin [2: S43, S44]. No hills near Maiduguri; the hills (Mandara, Gwoza) and the volcanic Biu plateau are far away and conflict-associated, so **keep the horizon flat**.
- **Trees:** neem ("dogon yaro"), planted under colonial policy, shade major roads and "line almost every street" [2+: S1, S8, S46; tourism summary]; described as the city's welcoming tree [1, S1]. Around Lake Chad the woodland is acacia, baobab, palm and Indian jujube [1, S27]. Typical Sahel trees such as Balanites and Faidherbia are [inf] (the fetched sources were about Mali). Date palm is plausible [inf]. Zoo and botanical garden exist but are rejected (section 9).
- **Crops (rainy-season and dry-season):** sorghum, millet, rice, maize, cowpea [1, S9]; groundnut for sale [1, S22]; **masakwa**, a dwarf dry-season sorghum on the clay plains, shows as large bright-green fields in the dry season [2: S43 two articles]. This is the best "green in the dry season" visual Borno has.
- **Livestock and fishing:** horses valued, donkeys as draft animals [1, S22]; fishing on Lake Chad and the Yobe river [1, S22]; Lake Chad fish are dried, pickled or smoked [1, S27]. Cattle are present in Borno but see the avoid list.
- **Water:**
  - The Ngadda is a **seasonal** river through the city; locals use traditional canoes on it [1, S15]; it is polluted [1, S15]. Lower Ngadda and Yedseram are almost dry for part of the year and are lost in marshes before the lake [2: S44, IRD atlas]. In the dry season the bed is sand with scattered pools [inf].
  - The Yedseram is a separate seasonal river from the south-east hills; one source calls the Ngadda a tributary of it [1, a dam article summary]. It is not in the city. **Do not use the Yedseram as a named place.**
  - Lake Chad: ~2,000 km2 and at most 2 m deep, reed and papyrus fringe, sand-dune islands in the east; low in Jun-Jul, high in Nov-Dec [1, S27]. A flat, hazy shoreline of reed and open water is the visual.
  - **Flood warning:** the Sept 2024 dam failure flooded much of the city [2+: S14]. Do not draw flood water, mud lines, sandbags, boats in streets, or the dam.
- **Climate (BSh hot semi-arid) [2+: S1, S9]:** ~699 mm rain, Jun-Sep, Aug wettest, essentially none Nov-Feb; hot season mid-March to late May (typical highs 39-41 C; records 47 C) [S1, S2]; coldest in January (lows ~15 C typical; S9 says <10 C on harmattan nights); dawn ~5:00, sunrise ~6:00 [1, S46].
- **Light by season:**
  - Harmattan (Dec-Feb): thick dust haze, visibility 500-3,000 m falling to 1,000 m or below, dust raised in Chad, 3-day cycles [2: S42, S9]. Pale-disc sun, cream-grey sky, trees as silhouettes. **This is the season the three hazards describe; use it.**
  - Hot dry (Mar-May): heat shimmer, bleached ground.
  - Rains (Jun-Sep): clouds and rain; fields green; river fuller [2+]. Do not draw river overflow.
- **Compared with Kano and Kaduna:** Kano has a near-treeless red-tan plain with dye pits and baobab; Kaduna is greener with red laterite and hills. Borno is paler and greyer: pale sand, thin neem canopy over wide streets, flat horizon, a hazier sky and green masakwa squares at the edge.

## 6. Dress
**Men [2+: S23, S24, S34, S50]:** long flowing gown (Kanuri: **kulwu**; Hausa: **babban riga**), often embroidered at neck and chest [S33, S34]; embroidered or multi-layer sewn cap (the Kanuri **rawaram** cap [1, S45]); loose turban wrapped off the face; trousers and shirt for work; leather sandals. Colours: white, cream, sky-grey, sand, faded indigo, dark indigo. The Kanuri are historically the people most tied to the gown [1, S34].
**Women [1 each: S23, S50]:** floor-length gown with hijab/headscarf (common in Maiduguri), or wrapper and blouse with headtie and shawl; henna on hands; plain or small-print cloth; shoulder bags. School girls: dark green uniform dresses with white [1, S36]. Colours: cream, mid-blue-grey, olive, brown, indigo prints.
**Craft cloth:** hand-dyed blue-and-black tie-dye ("Dongashou") from Kanuri dyers [1, S50]; historic woven indigo "turkudi" cloth [1, S49]. Use as stall goods.
**Children:** school uniforms (dark green and white for girls [1]); boys in shirt and shorts or small gowns [inf]. Do not show children working at the road edge; use teens/adults for water sellers and shoe-polishers.
**Working dress:** market traders in gowns or shirts with caps; leather workers in aprons; dyers with stained hands and forearms [inf]; truck loaders in vests; tea or suya sellers in apron and cap.
**Footwear:** sandals, slippers, canvas shoes; no boots.
**Avoid list**
- **Party colours:** nothing in `#D4621B`, `#1FA98F`, `#3B6FD4`, `#F5CE2E`, `#C23FA0`, `#8257C8` and nothing within a few steps of them, especially in repeated clothing blocks. The keke body yellow is the one real collision: use a darker mustard (`#D9A22B`) with black roof and trim and confirm the real colour with a reviewer (Q6). School-uniform green must be dark and muted (`#3F5A45`), never `#1FA98F`. Indigo must be dark (`#2F4560`), not `#3B6FD4`.
- **Political caps and looks:** solid-colour fila caps, red caps, caps in a single saturated colour repeated across a crowd, a babban riga + matching cap + dark glasses + staff/fan "politician" look, matching-colour crowd kits, sashes.
- **Conflict-coded imagery (zero tolerance):** uniforms and camouflage of any force; police, soldiers, civilian-vigilante or hunter dress; weapons; bandoliers; masked or fully veiled faces (do not use the face-veiling turban form, alasho); black clothing as a crowd block; flags other than a plain neutral banner; checkpoints, road barriers, sandbag posts, armoured vehicles, barbed wire, blast walls, watch-towers, drones; the earthen berm and trench; curfew signs; burnt, charred, collapsed or bullet-marked buildings; smoke columns; ruins.
- **Displacement and aid imagery:** tents or rows of white tarpaulin shelters, agency logos on tarps/tanks/jerrycans, ration or cash queues, firewood bundles carried for sale, jerrycan queues at taps, handwashing stations. Cap-making and cloth stalls must not be shown as relief projects.
- **Disaster imagery:** flooded streets, water lines on walls, boats in streets, stranded animals, collapsed bridges or dams, fire at a market, shop shells.
- **Herd and herder imagery:** herders, cattle drives, staffs, calabashes slung on shoulders; the cattle market. A single camel or donkey at a market edge with a trader is fine.
- **Religious markers:** prayer scenes, mats, beads, mosque or church silhouettes, clerical dress, Arabic calligraphy as sign art, Quranic slates.
- **Ethnic stereotype:** scarification or face marks, "tribal" costume, thatched hut as the only picture of the state.
- **Motorcycles:** no okada, and no motorcycle in any crowd (banned in the city).

## 7. Signs and language
Street languages: English on official signs and boards; Hausa as the common second language in Maiduguri [2+: S35, S29 note]; Kanuri as the home language of the old quarters and the villages [2+: S3, S29]; Shuwa Arabic, Bura, Marghi and others in the state [1, S3, S1]; Pidgin informally [inf]. Arabic-script signs exist [inf] but are avoided here (religious reading risk). Do not put a Kanuri or minority-language line on any sign without a native speaker.

| Word / phrase | Language | Meaning | Confidence | Needs native speaker |
|---|---|---|---|---|
| Kasuwa | Hausa | market | high [2+: S32, plus the Kaduna dossier's Wiktionary check] | no |
| Barka da zuwa | Hausa | welcome | high [S32] | light check |
| Sannu da zuwa | Hausa | welcome (arrival) | high [S32] | light check |
| Na gode | Hausa | thank you | high [S32] | no |
| Sai an jima | Hausa | goodbye | high as a phrase [S32] but starts with "sai" (campaign-slogan form) | avoid |
| Don Allah | Hausa | please | medium [S32]; religious wording | avoid on signs |
| Shago | Hausa | shop | medium [inf; carried from the Kaduna dossier] | yes |
| Dogon yaro | Hausa | neem tree | high [2+: S46 "dogonyaro", S1 / Kaduna dossier] | no |
| Kulwu | Kanuri | gown | medium [1, S34] | yes |
| Rawaram | Kanuri | a type of embroidered cap | low-medium [1, S45 title only] | **yes** |
| Firgi / ngawuli firgibe | Kanuri | clay plain / "sorghum of the firgi" (masakwa) | medium [S43] | yes |
| Dongashou | Kanuri | blue-and-black tie-dye cloth | low [1 search summary] | **yes** |
| Ushé-ushé | Kanuri | hello | low [1, S31] | **yes** |
| Nyiro askǝrgǝna / Nyiro zauro | Kanuri | thank you (two forms from two sources) | **low; the sources conflict** [S30 vs S31] | **yes; do not use** |
| Ndâ watu? / Ndâ wadu? | Kanuri | how is the morning? | low; spelling varies | yes |
| Kasuwu (market) | Kanuri | market | not found in any source | **yes** |
| Pure Water, Provisions, Chemist, Barbing Salon, Tailoring, Vulcanizer, Recharge Cards, POS, Cold Drinks, Phone Repairs, Electrical, Spare Parts, Cap & Cloth Stores | English / Pidgin | common street-trade boards | medium [inf; Nigeria-wide norm, not Maiduguri-specific] | light check |
- Billboard themes: telecom data, cement and roofing, solar lamps and inverters, sachet water, noodles and biscuits, phones and electronics, spare parts, schools, "Welcome to Maiduguri express way" style gateway boards. **Fictional brand names only.** Do not use real bank names (S46 lists several); invent them.
- Do not use any "Sai ..." slogan form. Do not use "Home of ..." state slogans. Avoid festival greetings (religious).

## 8. Landmark candidates
Venue types allowed: market, stadium, square, park, bridge, landmark, waterfront. Flag legend: P person-named, R religious, PAL palace, D recent disaster or insecurity incident, POL politician/party link, 1 single-source.

| Name | What it is | venueType | Why iconic | Silhouette in <=5 primitives | Rule flags | Question for the local reviewer |
|------|-----------|-----------|-----------|------------------------------|----|----|
| Cap & Cloth Market (generic trade-lane name) | A lane of stalls for hand-sewn caps, dyed cloth, leather and metal goods; a caps market is listed on a main road [1, S2]; cap-making and dyers' and tanners' guild crafts are attested [2: S45, S9, S50] | market | Kanuri craft identity; indigo and white cloth against pale sand | 1 low long box (counter row), 2 four thin cyl posts, 3 sloped box awning (cream), 4 stacked flat boxes (indigo and white bolts), 5 cyl rack with small half-spheres (caps) | name is a trade not a place; site not verified [1]; all named Maiduguri markets have fire/blast history so **do not use a real market name** | Which lane or market do residents mean? Is "Cap & Cloth Market" a safe, neutral name? Are cap makers shown without any relief-project reading? |
| Flyover road (the two-level flyover at a major junction) | First two-level flyover in the state, ~2.4 km, trumpet interchange, opened Dec 2021 [2+: S38] | bridge | Modern civic pride; night-lit piers appear in Commons [1, S4] | 1 long flat box deck, 2 two box parapets, 3 four cyl piers, 4 two sloped box ramps, 5 box lamp heads on thin cyl poles (solar) | **D?** the junction's wider "customs" area had blasts in 2012-13 [1]; opened by a head of state (POL, no plaque shown); name tied to a customs office, not a person | Is it safe to feature? Do residents have a neutral name for it? What colour is the deck and railing? |
| Maiduguri City Gate | A gate monument on a main entry road [1: S4, S5, S1 caption] | landmark | Entry symbol for visitors; photographed with trucks and kekes | 1 two box pylons, 2 box lintel beam, 3 flat box sign board, 4 two small cone caps, 5 low box plinth | shape unknown [inf]; may stand where checkpoints are reported [1, S2]; **do not show any checkpoint** | What does the gate look like, and where? Do people use it as a meeting point? |
| Main stadium (the city's top-flight football ground) | ~10,000-seat football ground; the club played away in other cities in 2014-16 [2: S19] | stadium | Football is the common civic pastime; floodlights give a skyline | 1 two stepped box stands, 2 four cyl floodlight masts, 3 four box lamp heads, 4 flat box pitch, 5 low box perimeter wall | **P** (named for an early-19th-century ruler); the club's exile is conflict history (not an incident at the ground) | By what generic name do people call it? Is "Main Stadium" fine? |
| Ngadda riverbank (dry-season low water) | The seasonal river through the city: sand bed, shallow channel, reed clumps, canoes [1, S15; 2: S44] | waterfront | The Chad Basin river that is dry half the year; canoes | 1 wide flat box (sand bed), 2 thin flat box (water channel), 3 cone/box reed clumps, 4 long thin box + cone (canoe), 5 sphere neem trees | **D** (2024 flood; polluted); dam must not appear | Where is a safe, ordinary riverside spot? Should the river appear at all? |
| Lake Chad shore | Flat reed-fringed shore with canoes and fish-drying racks [1, S27] | waterfront | The state's defining geographic feature | 1 flat box water, 2 cone reed tufts, 3 canoe (box + cone), 4 cyl posts + flat box rack, 5 sphere acacia | **D?** shore towns (Baga, Kukawa) are conflict locations; the name is a lake not a town | May the lake appear at all? As a landmark or only a horizon haze? |
| Neem avenue | An older main avenue shaded by mature neems [2+: S1, S8, S46] | landmark (or park) | The city's most-attested look | 1 two rows of sphere canopies, 2 cyl trunks, 3 flat box road, 4 low box kerb, 5 box lamp pole | trees on several main roads were felled for dualisation [1, S40]; **no named avenue exists in the sources** | Which avenue is the best example? |
| Ngadda road bridge | A road bridge with streetlights over the river [1: S6] | bridge | River crossing | 1 flat box deck, 2 two box parapets, 3 three cyl piers, 4 two box abutments, 5 box lamp poles | **D** (2024 flood destroyed other bridges and rebuilding is under way); shape single-source | Which bridge? Is it undamaged? |
| State museum compound | State museum, city centre, near the palace [2: S2, S20] | landmark | Kanuri antiquities, raffia crafts | 1 low long box, 2 box parapet, 3 cyl arched door, 4 sphere tree, 5 low wall | building undescribed [1]; **dilapidated** (2021); courtyard statue of a historical ruler (P-adjacent); collection includes "war implements" and items from displaced communities [1, S20] | Does it look worth showing? Is it open? |
| Traditional ruler's palace | Seat of the traditional ruler [2: S9, S25] | (scenery) | Kanuri architecture | 1 big box mass, 2 box parapet row, 3 cyl round tower, 4 dark arched door, 5 low wall | **PAL** scenery only; materials disputed [S9 vs S25] | Is it appropriate even as far-field scenery? |
| Old railway terminus | Rail terminus; passenger service not running; rail lines have been targeted [1, S2, S4] | landmark | Rail heritage (opened 1964) | 1 long low box hall, 2 flat box canopy, 3 four thin cyl posts, 4 box name board, 5 two long box wagons | **D?** rail attacked [1, S2]; shape unknown | Is the station still standing and quiet? |
| Zoological and botanical garden | 17 ha, opened 1970 [S13] | park | Oldest zoo in the country | n/a | **P** (named for a former ruler); **D** (flood killed >80% of animals, Sept 2024) | Reject |
| Monday Market | The city's main market | market | Largest market in the north-east | n/a | **D**: blasts 2014 and 16 Mar 2026; fire Feb 2023 | Reject as named venue |
| University campus | Main federal university | landmark | Largest in the region | n/a | **P** (renamed for a former president 2025); **D** (2017 attacks; 2024 flood; 2026 blast at the adjacent hospital gate) | Reject |
| Polytechnic | State polytechnic | landmark | State technical college | n/a | **P** (named for a former head of state) | Reject |

**Best five, in segment order (i = 0..4):**
0. **Cap & Cloth Market** (market): Kanuri craft identity and the only candidate not tied to a place that has burnt or been bombed; generic by design. It carries the weakest evidence (location single-source), so the reviewer must either name a real lane or approve the generic name. Reserve: none; a market with a named real site is not recommended.
1. **Flyover road** (bridge): contemporary, well documented [2+], night-lit; flagged for the junction's old (2012-13) incident record. Reserve: the Ngadda road bridge, flagged for the 2024 flood.
2. **Maiduguri City Gate** (landmark): arrival symbol; shape unknown so it is drawn from the generic gate silhouette; reserve: the neem avenue.
3. **Main stadium** (stadium): the generic C34 "township ground" pattern; floodlights on the skyline; football is the lowest-risk shared civic subject. Reserve: none; if the reviewer rejects the generic name, use a drawn but unnamed football pitch in the district.
4. **Ngadda riverbank at low water** (waterfront): the river-in-the-dry-season story is Borno's most distinctive water image and reads as dry sand with a shallow channel, nothing flood-like. Reserve: Lake Chad shore as a horizon prop only (not a named venue).

## 9. Rejected candidates
- **Monday Market** (pack): not person-named, but **D** three times over: 1979 and Feb 2023 fires (about 13,000 shops [2: S10, S11]); 2014 bombing at its roundabout [2+: S12, S47]; coordinated blasts at its roundabout on 16 March 2026 [2+: S12]. Hard reject as a named venue; use the trade, not the name. (This answers the user's check: **yes, it is a conflict site.**)
- **Borno State Museum** (pack): nothing is known about its building shape [1, S20]; it has been dilapidated since the late 1990s [2: S20, S21]; its courtyard holds a statue of a historical ruler and the collection includes war implements and items from displaced communities; the building cannot be drawn from a source. Reject as a venue. The museum itself is not person-named, so it can return if a reviewer supplies a text description of the building.
- **The pack's stadium entry** (the ground is named for an early-19th-century ruler; the top-flight club carries the same name): **P**. Replace by the generic "Main Stadium".
- **The pack's park entry** (the zoological and botanical park, named for a former traditional ruler): **P** (confirmed [2: S13, S9 text]) and **D** (Sept 2024 flood; animals escaped [2+: S13, S14]). Hard reject.
- **The pack's polytechnic entry** (renamed in 1978 in honour of the then head of state [1, S18]): **P** (confirmed). Hard reject.
- **University of Maiduguri**: renamed after a former president in July 2025 [2+: S16, S17]; 2017 campus bombings [1, S16]; 2024 flood; the hospital gate was a 2026 blast site [2+]. Hard reject. Campus avenues as scenery are unnecessary.
- **University teaching hospital, post-office roundabout, market roundabout**: 16 March 2026 blast sites [2+: S12]. Never model.
- **Customs-area market, Gamboru market**: Gamboru burnt twice in 2023 [1, S48]; the Customs area had blasts in 2012-13 [1]. Reject the names.
- **Baga fish market / Baga road**: named for a lake-shore town with 2014-15 attacks; the road was closed for security [1, S49]. Reject the name; dried fish may appear as stall goods.
- **Kasuwan Shanu cattle market**: cattle trade; herd imagery; Gamboru-Ngala cattle market was closed for years for security [1, search summary]. Reject.
- **Kukawa (walled twin towns)**: historic white-clay walls [1, S26], but it is a conflict location (2015 massacre and 2020 hostage-taking per S26). Reject as a landmark; "white clay low wall" may appear as an unnamed prop.
- **Chad Basin National Park / Sambisa forest**: park operations were suspended in 2021 for insecurity [1, S51]; Sambisa is the conflict stronghold. Reject.
- **Alau dam / Alo lake**: the 2024 failure. Reject. Do not draw a dam.
- **The 2024-flood bridges and the underpass near the Gamboru market**: flood destroyed bridges; the underpass is beside a twice-burnt market. Reject.
- **Fort/barracks, state assembly, specialist hospital, airport**: military, political or attacked sites. Reject.
- **Central mosque, the large new mosque, cathedral, churches**: R. Reject.
- **Traditional ruler's palace**: PAL; scenery only.
- **Mandara and Gwoza hills, Biu plateau**: scenic but in conflict-affected areas; far from the city. Reject; keep the horizon flat.
- **Fully named streets, avenues and a "Shehu ..." road**: person-named.
- **Lake Chad Club, restaurants, hotels, plazas by name**: private venues, some with person names, and not iconic. Not used.

## 10. Welcome / farewell candidates
| Line | Language | Confidence | Needs native check |
|------|---------|-----------|--------------------|
| Barka da zuwa Borno! | Hausa | high: phrasebook lists it as a welcome (S32); Hausa is the common second language in Maiduguri (S35) and a Hausa native speaker can read it; the same line is already used for Kano | light |
| Sannu da zuwa Borno! | Hausa | high: primary phrasebook form of "welcome" (S32) | light |
| Na gode, Borno! | Hausa | high: "thank you" (S32) | no |
| Welcome to Borno! / Thank you, Borno! | English | high | no |
| Ushé-ushé, Borno! | Kanuri | **low**: a single hello from one source (S31), and it is not "welcome" | **yes; do not ship** |
| Nyiro askǝrgǝna, Borno! | Kanuri | **low**: "thank you" from one phrasebook (S30) while another source gives "Nyiro zauro" (S31); the two do not agree | **yes; do not ship** |
- No Kanuri, Shuwa Arabic, Bura or Marghi line is offered. A line in any Borno language needs a native speaker of that language and must not be invented.
- Recommended: keep the current pair **"Barka da zuwa Borno!" / "Na gode, Borno!"** and add the English as a small sub-line. A Kanuri native-speaker pair would be a welcome upgrade after review (Q9).

## 11. Hazard visual notes
Pack hazards: `dust-storm`, `low-visibility`, `go-slow`. All three are dry-air or traffic hazards, so **no flood hazard is needed or wanted**.
- **dust-storm:** a flat, wide tan-grey dust wall at the horizon (harmattan plume raised over Chad [S42]) drifting across the road; 6-8 stacked translucent flat boxes or spheres, colour `#CDBB98` at 45% alpha, taller and paler than Kano's dust plume; neem canopies in the near field fade first. No brown-red laterite (that is Kaduna). No black smoke, no burning.
- **low-visibility:** the whole far field pulled towards the fog colour `#ECE3CD` from about 30 m; streetlights and solar poles haloed with a pale disc; trees and keke as silhouettes; sun as a pale disc. Keep it clean haze: no smoke columns, no red-orange glow, no flashing lights.
- **go-slow:** a knot of yellow keke and a stalled flatbed or box truck at the foot of a flyover ramp; one slow donkey cart; drivers with arms out. No barrier, no uniformed figure, no check-point cone line. A lowered boom across a road is not used.

## 12. Design brief
**What makes Borno visibly different from Kano and Kaduna** (Kano is `sahel-savanna`, Kaduna is `guinea-savanna`): Borno is the palest and flattest of the three. A wide sand-edged road with an almost empty horizon, thin neem canopy over cream and sand compounds, hazy cream-grey sky, bright green masakwa squares in the distance, yellow keke, indigo and white cloth stalls, and a flyover for scale. No hills, no dye pits, no red laterite, no horn pinnacles, no big colonial grid.

**Pack changes recommended**
- `signatureRide`: `okada` -> `keke` (S37).
- `palette`: replace with the one below so Borno does not repeat Kano.
- `landmarks`: replace the five with section 8's five (names: "Cap & Cloth Market", "Flyover Road", "City Gate", "Main Stadium", "Ngadda Riverbank"), all `verified: false`; venue types market, bridge, landmark, stadium, waterfront.
- Keep `hazards`, `welcomeLines` ("Barka da zuwa Borno!") and `farewellLine` ("Na gode, Borno!").
- `scenery`: replace "Kanem-Bornu motifs" with "neem avenue", "masakwa fields", "reed bank"; keep the acacia line.
- `audioStem` `ne-algaita`: ask whether another instrument, not the algaita, is Borno's (Q10).

**Palette (hex)**
- sky `#DCD3BD` (harmattan cream-grey); fog `#ECE3CD`; ground `#C9B38C` (pale sand); accent `#8B5A2B` (neem-bark brown, unchanged from the pack).
- Building colours: whitewashed clay `#E6DCC4`, sand render `#D3BF98`, mud brown `#B58E62`, pale sandcrete `#BDB8AA`, zinc grey `#9AA3A3`, door and awning indigo `#2F4560`, deep eaves shadow `#6B5A3A`.
- Foliage and ground detail: neem `#5F8A4A`, dry grass `#CFC08A`, masakwa green `#7FA05A`, reed `#A9A36B`, river water `#8E9A94`.
- Props: keke body mustard `#D9A22B` with black roof (confirm; Q6), school dark green `#3F5A45`, cloth white `#F4F1EA`.

**Existing shared library to reuse:** `sahel-savanna` (the Kano set) is the closest kit. It already has `mudbrick-compound`, `flatroof-shopfront`, `shophouse`, `plaza-block`, `bazaar`, `kerbside`, the `neem`, `acacia`, `baobab`, `datepalm` and `scrub` flora, `millet` crops, the `waterEdge` op (with canoes), `ambient: dust` and the `hausa-north` dress set (with `kube`, `turban`, `riga`, `kaftan`, `hijab`, `headtie`, `wrapper`). Extend it with `borno.*` districts rather than a fourth library. Existing lot styles that fit: `flatroof-shopfront`, `shophouse`, `plaza-block`, `zinc-bungalow`, `market-block`, `tiled-villa`, `thatch-hut` (village strip only), `colonial-bungalow` (very low weight).

**NEW items the world needs**
- Lot styles: `kanuri-compound` (plain flat roof with low parapet, dark arched door, no horn pinnacles, optional low dome on one corner, cream/sand render); `lockup-row` (one-storey concrete lock-up shops with roller shutters under one shared canopy, for the contemporary district and the cap-and-cloth lane).
- Wall kind: `clay-low` (low rounded-top whitewashed clay wall; **not** the existing `earthen` wall, see section 3).
- Flora and crops: `reedbed` (river and lake reeds), `masakwa` (bright green dry-season sorghum on pale clay; a recoloured `millet` is an acceptable shortcut); optional `doum-palm` [inf].
- Props (kerbside items): `water-bags` stall, `cap-rack`, `cloth-bolts`, `mat-screen` (grass-mat fence), `keke-rank`, `donkey-cart`, `camel` (single, market edge only).
- Set pieces: `borno.cap-market`, `borno.flyover`, `borno.city-gate`, `borno.stadium`, `borno.riverbank`.
- Skyline: `chad-plain` (flat horizon, a thin tree line and haze; no hills).
- Road style: `sahel-sand` (paler shoulder `#CBB68F`; sand rather than Kano's tan).
- Dress set: `kanuri-north` (recolour of `hausa-north`: whites, creams, sand, indigo; no solid red/green/blue caps; school-girl uniform variant in dark green).

**Building style weights** (existing game ids first; `new:` means a new style for the engineer)

| Style | Weight | Note |
|---|---|---|
| new: kanuri-compound | 28 | old quarters and edge villages |
| flatroof-shopfront | 20 | market and main-street shops |
| shophouse (2-3 floors) | 12 | main avenues |
| new: lockup-row | 10 | contemporary district, cap lane |
| zinc-bungalow | 8 | block-and-zinc houses |
| plaza-block | 7 | contemporary district |
| market-block | 6 | market lanes |
| tiled-villa | 4 | newer residential |
| thatch-hut | 3 | village strip only |
| colonial-bungalow | 2 | garrison quarter hint |

**Route table** (segment 0-7; landmark i belongs to segment i for i 0-4):

| Seg | District | What the player sees | Landmark carried |
|---|---|---|---|
| 0 | Yerwa market lane | Cream and sand compounds with dark arched doors, stalls of caps, indigo and white cloth, leather and calabash, mat screens, thin neem shade, pale dust | Cap & Cloth Market |
| 1 | Flyover road | Two-level flyover with solar poles, yellow keke below, plaza blocks and lock-up rows, harmattan sun | Flyover Road |
| 2 | City gate | Gate pylons across a wide road, a truck and keke queue (no barrier), neem rows, stalls selling water bags | City Gate |
| 3 | Stadium road | Floodlight masts over a low stand, shophouses, tea and suya stalls, school-girls in green crossing, football graffiti-free walls | Main Stadium |
| 4 | Ngadda riverbank | Sand bed, shallow channel, reeds, a canoe, neem on the bank, a low bridge in the distance | Ngadda Riverbank |
| 5 | Neem avenue | Mature neem canopy over a quiet avenue, whitewashed walls, bicycles (rare), school quarter, no market | none |
| 6 | Firgi farm edge | Flat pale clay fields with bright green masakwa squares, millet, donkey carts, a few thatch huts, long horizon | none |
| 7 | City centre (contemporary) | Dual carriageway with solar lamps and a flyover pier, plaza blocks, lock-up rows, bank-style fictional signs, rally stage | none |

**Start scene (40 m before the gate):** dawn on a wide sand-edged road, harmattan sun a pale disc low in cream-grey haze, neem rows both sides, whitewashed compounds with dark arched doors and mat fences, a yellow keke parked and a water-bag stall, a few walkers in white and cream gowns with embroidered caps and women in long gowns and headscarves, schoolgirls in dark green and white in the distance. The gate arch reads "Barka da zuwa Borno!".
**Finish scene:** the segment-7 city-centre avenue near a generic open space: plaza blocks and lock-up rows, a flyover pier beyond, solar poles, billboards for invented brands, a rally stage under a neem row, a crowd in mixed white, cream, indigo and wrap prints with no uniform cap colour.
**Contemporary district:** segment 7 and half of segment 1.

## 13. Open questions for the local reviewer
1. **Product-owner decision (before any reviewer):** given current events (a city-mosque bombing in Dec 2025 [1] and coordinated blasts on 16 March 2026 [2+]), should Maiduguri be drawn at all, or should the Borno world be a generic Kanuri sahel town with no named landmark at all? Is "role-named" (Cap & Cloth Market, Flyover Road) acceptable?
2. Which lane or market do residents mean by the caps market, and is a generic name acceptable? Which trades (dyed cloth, leather, calabash, metal) are really there today?
3. Is the two-level flyover a good symbol, or should the road bridge over the river be used? Which junction is safe to show?
4. Roof forms in the old Kanuri quarters: flat parapeted roof, low dome, conical thatch, or a mix? Wall colours? Are door and wall decorations in relief or paint, and are horn pinnacles ever used by Kanuri builders?
5. What does the city gate look like, and is there a different gate more typical of the state?
6. Keke body colours and trim in Maiduguri today (yellow with what?), and is a yellow keke close enough to a political colour to cause a problem?
7. Women's and men's everyday dress in Maiduguri: gown lengths and colours, cap types (the `rawaram`), turban style, whether school-girl uniforms are dark green, and whether the keke driver's dress has a standard.
8. Is it appropriate to show the Ngadda at all after the 2024 flood? If so, where, and at what water level? Which local name should appear on a sign?
9. Kanuri check: a natural **welcome** and **thank you** in Kanuri (two conflicting "thank you" forms were found), and any short market or shop sign word; also the Shuwa Arabic, Bura and Marghi equivalents if the reviewer wants them.
10. `audioStem` "ne-algaita": is the algaita used in Borno? Is another instrument (for example a long trumpet used at the traditional court, or a hand drum) more typical? Court instruments must not become a palace cue.
11. Which camel, donkey and horse props are normal at a city market, and which are not? Are bicycles used in the city today?
12. What name do residents use for the main football ground, and is "Main Stadium" fine? 
13. Is the dry-season masakwa sorghum visible near Maiduguri itself, or only further east in the clay plain?
14. Which contemporary district is the best city-centre example (a commercial avenue, a plaza, a bus terminal)?

## 14. Sign-off
Reviewer: —  Date: —  Status: unreviewed
