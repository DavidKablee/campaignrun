# Delta (capital Asaba) — world research dossier

Status: DRAFT (research only; not reviewed by a local reviewer). Every landmark stays `verified: false` until someone from the state signs off in section 14.

Rules that bind this dossier (AGENTS.md, docs/GUARDRAILS.md, docs/chunks/C27.md, C34.md, ADR-0009):
- No photos are downloaded, traced, copied or committed. Record a text description and the source URL only.
- A venue is one of: market, stadium, square, park, bridge, landmark, waterfront. A palace is scenery only, never a venue. No religious building as a landmark. Nothing named after a person. No recent disaster. No real politicians, parties, slogans or party colours.
- Welcome and farewell lines only in a language the state actually speaks.

House rule applied while writing: no real person's name is written anywhere below. Where a stadium, garden, road, house or anchorage is named after a person it is described by role (for example "the Asaba stadium named for a late national footballer-coach") and flagged `person-named`; the reviewer can identify it. Source URLs whose slug contains a person's name are listed by publisher only (URL withheld). Party names, party colours-as-livery and slogans are described generically.

Evidence tags: **[2+]** two or more independent sources agree; **[1]** single source, treat as unconfirmed; **[inf]** my inference or general knowledge, no fetched source confirmed it.

## 1. Scope and date
Researched 2026-10-27 for the Delta pack (`creek-delta` kit, `ss-brass`), using WebSearch (standard; extended for the thin Warri-streets topic) and WebFetch on Wikipedia, Wikivoyage, Wikimedia Commons file/category pages (file names and captions only, no images opened), travel and trade-press articles, and news. No downloads, no other file touched.

Honest limits:
- **There is almost no text that describes what Delta streets, bridges or markets physically look like.** Wikipedia pages for Warri, Asaba, Sapele, Ughelli and Abraka give geography, institutions and photo captions but nearly no visual description. Built form, road furniture and colours below are mostly `[inf]` and the reviewer must correct them first (section 13).
- Several sources were blocked or empty (HTTP 403: Britannica, Guardian NG, a tour-operator page, a Commons "Asaba" category; HTTP 404: several Commons categories and a Pidgin essay). For those, only the search-result summary was seen and the claim is tagged accordingly.
- The "Okpara palm belt" named in the brief: only a tiny Wikipedia/list mention of an Okpara waterside community (Urhobo, Ethiope East) was found; no description of Okpara itself. The palm-belt look is built from Urhobo/Isoko/Ughelli palm-oil sources instead.

**What must make Delta look different from Rivers (already built, also `creek-delta`)** — Rivers is the planned colonial grid and tree-lined GRA, a big oil-money city, the Creek Road working waterfront and the Bonny estuary lighthouse. Delta's distinguishing material, ranked by evidence:
1. **Asaba on a raised terrace above the Niger**, facing Onitsha across the water, entered over a long steel through-truss bridge `[2+]`. Rivers has no river cliff and no steel bridge.
2. **Sapele: timber.** Sawmills since 1925, a very large plywood and veneer plant, hardwood logs (mahogany, obeche) stacked and barged `[2]`. Rivers has no timber economy.
3. **Warri-Effurun twin city built around roundabouts and (now) flyovers**, with a port, a refinery and a steelworks as skyline `[2+]`.
4. **Oil-palm and cassava belt** (Urhobo, Isoko, Ughelli) `[2+]`: palm oil, banga soup, starch. Rivers uses oil palm only as an accent.
5. **A clear-water Ethiope river** at Abraka (spring-fed, canoeing, picnics) and tall raffia/lowland forest `[2]`, instead of Rivers' brown nipa-and-mangrove creeks.
6. **A plank-built floating market** in the Itsekiri/Ijaw creeks (Warri North) `[2+ but all about a government project; status unconfirmed]`.
Do not let Delta's creek segment reuse Rivers' stilt-village-plus-jetty-plus-nipa combination; keep Delta's creek segment short and plank-platform based.

## 2. Sources
Accessed 2026-10-27 for all rows. "Summary" = only the search summary was seen.

| # | URL | Title | Supports | Single-source? |
|---|-----|-------|----------|----------------|
| S1 | https://en.wikipedia.org/wiki/Delta_State | Delta State | low-lying, no remarkable hills; mangrove SW, lowland forest elsewhere; Niger on east border; rainfall 2,000-3,200 mm, July very wet, January driest; peoples; crops (oil palm, yam, cassava); roads (A2 Warri-Benin, A232 over the Niger bridge); Warri airstrip | no |
| S2 | https://en.wikipedia.org/wiki/Asaba | Asaba | west bank of Niger facing Onitsha; "terrace of the lower Niger"; elevation ~55 m, lowest ~40 m near the river; Ibusa/Okpanam on an escarpment; markets list; stadium, airport, film village; harmattan mid-Dec to Feb; wet Mar-Oct | no |
| S3 | https://thingsnigeria.com/2019/06/24/asaba-sitting-on-a-bend-of-the-niger-river/ | Asaba, sitting on a bend of the Niger | raised ground overlooking the river and Onitsha; deep water near the bank; a dry-season sandbank beach; a large mall on Okpanam Road; colonial residence-museum | yes (travel essay) |
| S4 | https://en.wikivoyage.org/wiki/Asaba | Asaba (Wikivoyage) | market list (Ogbe-Ogonogo, Cable Point, Midwifery, Wazobia...), sights, minibuses and cabs, 95% Igbo-speaking claim; contains at least one error (dates the First bridge as the "second") | no (with S2) |
| S5 | https://en.wikipedia.org/wiki/Warri | Warri | Warri River joins Forcados/Escravos by Jones Creek; Ekpan refinery; Ugbuwangue port; stadium; Pidgin lingua franca; Urhobo, Itsekiri, Ijaw; tropical monsoon, dry Nov-Apr with harmattan; bus and tricycle | no |
| S6 | https://en.wikivoyage.org/wiki/Warri | Warri (Wikivoyage) | markets (Main, Igbudu, Pessu, Ibo market, Uwie modern market), riverside jetties and boats, keke napep, Falcorp park, Effurun Garden Park, Udu Bridge, two stadium entries | no (with S5) |
| S7 | https://en.wikipedia.org/wiki/Uvwie ; https://en.wikipedia.org/wiki/Effurun | Uvwie; Effurun | Effurun Roundabout "the central spot in Uvwie", links to Benin, Sapele, Ughelli-Port Harcourt and the port expressway; DSC roundabout (Ebrumede), Enerhen junction; refinery at Ekpan; two malls; Effurun GRA | no |
| S8 | https://commons.wikimedia.org/wiki/File:Effurun_Roundabout.jpg ; https://commons.wikimedia.org/wiki/Category:Warri ; https://commons.wikimedia.org/wiki/Category:Delta_State,_Nigeria | Commons (text only) | caption "Effurun Roundabout near [a supermarket mall], Effurun"; file names: DSC Roundabout Ebrumede, Skyline of Uvwie, Okumagba Layout, wooden house in a riverine area, wooden boat River Niger, Ethiope River at Abraka, Abavo Market, Omoko dance | [1] each (names/captions only) |
| S9 | ThisDay (July 2025, URL withheld: contractor name in the slug) ; arise.tv, blueprint.ng, itsnigeria.org (summaries) | Warri/Effurun flyover project | three flyovers (DSC roundabout, PTI junction, Enerhen junction to Marine Gate), a 3/4 cloverleaf at the Effurun flyover, pedestrian bridges, storm drains, road widened from 4 to 8 lanes, 30-month contract from Oct 2023, high-tension cables over the road | partly (state-built project; politician-credited) |
| S10 | https://en.wikipedia.org/wiki/Warri_Stadium ; https://en.wikipedia.org/wiki/Warri_Wolves_F.C. ; BusinessDay (renovation piece, summary) | Warri Stadium (a.k.a. Warri Township Stadium) | Cemetery Road, 20,000 all-covered, track and field, renovated for a 2009 youth world cup, home of a football club; Wikivoyage says 30,000 (conflict) | no |
| S11 | https://en.wikipedia.org/wiki/Aladja ; https://en.wikipedia.org/wiki/Udu,_Nigeria | Aladja; Udu | Udu Bridge over the Warri River from Enerhen (built 1975); "Aladja Waterside" was the old route; Delta Steel plant (1980) sits on Ovwian/Aladja land; barter at Aladja Market; rail terminal; streams, lagoons, swamps | no |
| S12 | https://en.wikipedia.org/wiki/Sapele,_Delta | Sapele | Ethiope River/Benin River port, ~10 m elevation, timber capital, plywood and veneer, sawmills, fresh (not salt) water, vice-consulate 1891 (converted ship moored at the anchorage), Ogorode power plants, township stadium 2013 ~10,000 | partly |
| S13 | https://www.takeyourbackpack.com/backpacking-in-nigeria/visit-sapele/ | Visit Sapele | waterfront with canoes, fish sellers, timber barges; stacked hardwood logs; sawmill streets; roadside grills at Amukpe; Ogorode market; keke main transport. Blog style, reads like SEO copy | yes (weak) |
| S14 | https://www.britannica.com/place/Sapele (summary only, page 403) | Sapele (Britannica) | sawmilling centre since 1925 (obeche, abura, sapele, mahogany), plywood plant one of the largest in W. Africa | partly |
| S15 | https://shippingposition.com.ng/why-its-difficult-to-operate-koko-sapele-ports-now-npa-md/ (summary) | Sapele and Koko ports | port used as a naval base/engineering college; idle floating dock; dilapidated breakwaters | yes |
| S16 | https://en.wikipedia.org/wiki/River_Niger_Bridge | River Niger Bridge | steel centre-truss, 1,404 m, longest span 180 m, 7 piers in water, 23 m clearance, 11 m carriageway with a walkway each side, congestion and informal traders, Sept 2026 repair closure, war damage history | no (with Anambra dossier S2/S22/S23) |
| S17 | https://dutumgroup.com/the-story-of-the-river-niger-bridge-anambra/ (summary) ; https://eyesofalagosboy.com/2026/01/19/photo-of-the-week-niger-bridge-where-steel-met-the-river/ | Bridge history and photo essay | "steel meets the river"; ferries and canoes before the bridge; no truss shape or colour given | yes each |
| S18 | NAN and other news summaries of the second-bridge access roads (URLs withheld: politician in the slug) ; https://en.wikipedia.org/wiki/Second_Niger_bridge | Second Niger Bridge approaches | 3.3 km approach on the Asaba side; long access road through Okpanam, Ibusa, Asaba, Okwe, Oko | partly (political credit) |
| S19 | https://en.wikipedia.org/wiki/Ogbe-Ogonogo_Modern_Market ; thisdaylive.com 2020 fire piece, dailytrust 2020 (summaries) | Ogbe-Ogonogo Market, Asaba | largest market in Asaba, > 1,000 traders, Nkwo market day (every 4th day), livestock and tailoring-materials sections, runs ~1 km along the main market road toward the river; fire 26 May 2020 | partly (with S4) |
| S20 | https://archive.businessday.ng/real-estate/article/new-retail-opportunity-shopping-experience-coming-as-asaba-mall-opens-in-5months/ | Asaba Mall pre-opening | mall at the roundabout where two named roads meet beside the flyover; 39 shops, ~9,500 m2, supermarket anchor, air-conditioned, generators | partly (promotional) |
| S21 | https://guardian.ng/?p=1290920 (403, summary) ; https://thesun.ng/deltas-n4-2-billion-floating-market-ready-in-three-months-commissioner/ ; https://pmnewsnigeria.com/2013/09/13/delta-state-to-build-n3-6-billion-floating-market/ ; https://en.wikipedia.org/wiki/Warri_North | Ogheye floating market, Warri North | plank-built platform ~80 m x 70 m, 90 lock-up stores and 80 open stores, previously rebuilt about every six months, fish preservation, a police post "against sea pirates"; completion dates slipped 2021 to 2022; status unconfirmed | partly (3 outlets, all government-project coverage) |
| S22 | https://www.finelib.com/listing/Falcorp-Mangrove-Park/72655/ ; Wikivoyage Warri; tour-operator listing (summary) | Falcorp Mangrove Park | leisure/eco park at Ijala behind the refinery: mini zoo, royal cemetery, small museum, apiary, canoeing, fishing, mini rice farm | partly (listing sources) |
| S23 | https://en.wikipedia.org/wiki/Abraka ; https://commons.wikimedia.org/wiki/Category:Delta_State,_Nigeria | Abraka | university town on the Abraka-Warri highway; river beach with spring water, canoeing, fishing, swimming, barbecue, picnics; roundabout in town; polo/golf club exists; file names "Ethiope River at Abraka" | partly |
| S24 | https://en.wikipedia.org/wiki/Ughelli | Ughelli | agricultural trading centre (palm oil/kernels, cassava, plantain, sugarcane per Britannica summary), glass and gas/power industry, township stadium, palace | partly |
| S25 | https://en.wikipedia.org/wiki/Urhobo_people ; https://en.wikipedia.org/wiki/Isoko_region | Urhobo; Isoko | evergreen forest with many oil palms; palm oil, kernel (banga soup), cassava starch coloured by palm oil; Isoko: cassava, yam, palm oil and kernel, women traders on market days; dry Nov-Apr harmattan, rain May-Oct with a short August break | no |
| S26 | https://en.wikipedia.org/wiki/Itsekiri_people | Itsekiri | kemeje shirt + George wrapper, coral, feathered hat; women's wrappers, blouse, head-tie; mud-walled houses on firm ground, palm-rib walls and plank floors on posts in swamps; open-sided meeting hall; banga, owo; canoes, fish fences, crayfish baskets; masquerades (avoid) | partly (page read to 100k of 155k chars) |
| S27 | https://www.legit.ng/1200779-ethnic-groups-nigeria-mode-dressing.html ; https://www.bellanaija.com/?p=1594537 ; https://21stcenturychronicle.com/?p=15093 | Dress guides | Urhobo/Isoko: white lace or pastel shirt, George wrapper, black hat, walking stick, coral; women: two wrappers, head-tie, blouse; Itsekiri: ikemeje + wrapper + fedora/feather hat; bride: George wrapper, coral, three outfits | partly (commercial guides, same facts repeated) |
| S28 | https://en.wikipedia.org/wiki/Anioma_people ; Wikipedia Enuani dialect (stub) | Anioma | Asaba is the largest Anioma settlement; Igboid varieties (Enuani, Ika, Ukwuani); mostly Christian | no |
| S29 | https://en.wikipedia.org/wiki/Niger_Delta_swamp_forests ; https://en.wikipedia.org/wiki/Nigerian_lowland_forests | Forest ecoregions | oil palm, raffia palm, abura, opepe, mahogany, bush mango, umbrella tree, ferns; obeche and iroko logged | no |
| S30 | https://en.wikivoyage.org/wiki/Nigerian_Pidgin_phrasebook ; https://en.wikipedia.org/wiki/Nigerian_Pidgin | Pidgin phrases | How far?, Yu dey welkom o, E go bi nah, DEY OPEN, DON KLOS, KOMOT, MAN-DEM, WOMAN-DEM | no |
| S31 | https://johannesburgreviewofbooks.com/2020/03/05/new-short-fiction-ugborikoko-by-jerry-chiemeke-the-jrbs-pidgin-english-debut/ ; https://www.milehacker.com/travel/nigeria/delta/warri/warri-travel-tips-money-safety-culture/ | Warri Pidgin words; local greetings | wetin, abeg, wahala, gbege, pikin, comot, waka, siddon, chop; Itsekiri "Káálá"/"Ẹsé", Urhobo "Migwo"/"Imíelè" | yes each (fiction and a travel blog) |
| S32 | https://en.wikipedia.org/wiki/Itsekiri_language ; https://languagecrush.com/forum/t/1839 (summary) | Itsekiri and Urhobo phrases | Ere ọwurọ (good morning), Ere ọsọn, Odejuma (good night), Mo dọkpẹ (thank you); Urhobo "Migwo" (to an elder) | partly (forum) |
| S33 | https://en.wikipedia.org/wiki/Okere,_Warri ; https://saharareporters.com/2012/04/08/warri-pikin-choice-ekpekurede ; https://www.thecable.ng/you-dont-own-warri-south-south-west-itsekiri-counters-ogbe-ijoh-people/ | Warri markets and the ownership dispute | Main Market, Pessu, Igbudu, Ibo market, Okere; "ownership of Warri" is contested between groups: **avoid naming districts in ways that take a side** | partly |
| S34 | https://pmnewsnigeria.com/2012/12/24/tricycle-operators-hail-okada-ban-in-delta/ ; https://pmnewsnigeria.com/2014/08/03/delta-to-distribute-500-tricycles-to-commercial-riders/ ; https://www.withinnigeria.com/news/2022/02/16/keke-operators-mob-attack-destma-officials-over-seized-tricycle/ | Keke and okada rules | okada phased out in urban Asaba, Warri and Effurun; ~3,000 tricycles distributed; tricycle ban on federal highways (fine); state traffic authority enforces | partly |
| S35 | https://gazettengr.com/?p=140700 | Warri road closures (2022) | names Ubeji Roundabout, Okere Square, Edjeba community road | [1] |
| S36 | https://thisdaylive.com/index.php/2018/09/16/river-niger-floods-submerge-houses-churches-in-delta ; https://businessday.ng/news/article/flood-delta-opens-10-camps-19-lgas-submerge-official/ | Delta floods | Niger overflow at Asaba, Oshimili South and others; flood camps | recent-disaster flag |
| S37 | https://en.wikipedia.org/wiki/Burutu ; https://en.wikipedia.org/wiki/For%C3%A7ados | Burutu, Forcados | colonial transshipment ports; decaying colonial buildings | partly |
| S38 | docs/research/states/anambra.md and rivers.md (this repo) | Neighbour dossiers | Anambra chose the Second Niger Bridge; Rivers' Izon "nụ́a"/"dibuomu", etibo-and-hat avoidance | internal |
| S39 | Britannica Forçados River (search summary only) | River facts | Forcados leaves the Niger ~32 km below Aboh to the sea | [1] |

(Withheld by the person-named rule: Wikipedia and news pages on the Asaba stadium named for a late footballer-coach, on the explorers' anchorage and the colonial house named for a Scottish explorer, on the airport garden named for a South African statesman, a hall named for a prince, and the second-bridge road-flag pieces with a politician in the slug.)

## 3. Built form
The reviewer should treat every dimension below as `[inf]` unless a source tag is given.

### 3a. Old and vernacular
- **Itsekiri `[1: S26]`:** mud-walled houses stand on firm ground; in the swamps houses have palm-rib walls and plank floors raised on posts. Older villages are small houses grouped in quarters around an open-sided meeting hall; wealthy compounds put the family head's house facing a shrine to his father (religious: do not model the shrine). Fish fences, spring-loaded rods, conical crayfish baskets fixed to posts, and canoes along creek banks.
- **Urhobo/Isoko `[inf]`:** no architecture source was found. Reading: villages of block or plastered-mud rectangles with zinc roofs along cleared roads, palm trees behind, a market square (Isoko women trade on market days `[1: S25]`), cassava drying and palm-oil processing in the yard. Use the existing `thatch-hut` only for a tiny share.
- **Igbo (Asaba/Anioma) `[inf]`:** the pack's Asaba end is Igbo-speaking `[2: S2, S4]`. For Asaba proper I found no vernacular source; the Anambra dossier's Igbo compound reading (obi gate-house, concrete-block mansions with gate pillars) can be reused as `[inf]`.
- **Plank lock-ups on piles `[1: S21]`:** the floating market is described as a platform ~80 x 70 m of planks with 90 lock-up stores and 80 open stores, rebuilt about every six months, now being replaced by a concrete structure. Model as a wide low deck on posts, a row of narrow lock-up boxes with shuttered fronts, open stalls with canopy slabs, a jetty and canoes alongside.

### 3b. Colonial
- Sapele was founded as a colonial river port; a vice-consulate was set up in 1891 using a converted ship and barracks later built on the cleared ground `[1: S12]`. Burutu/Forcados have decaying colonial warehouses and houses `[1: S37]`. Warri's "government station" and trading station date from 1906 `[1: S33]`. Asaba had a first trading-company headquarters, a telegraph landing ("Cable Point", also known locally by an older name) and a colonial house now a museum `[2: S3, S4]`.
- Reading `[inf]`: single-storey bungalow with deep veranda, hipped zinc roof, louvred windows (the existing `colonial-bungalow` fits); low riverside warehouse sheds with zinc roofs (existing `port-shed`).

### 3c. Contemporary city
- **Warri-Effurun `[2+]`:** a conurbation of dense commerce and two shopping malls, a refinery at Ekpan, GRA and housing estates (Effurun GRA, a former petroleum-company housing complex `[1: S7]`). Streets are crowded with markets (Main Market, Igbudu, Pessu, Ibo market `[2: S6, S33]`) and tricycles. The swampy west of Warri forced Uvwie to grow inland `[1]`.
- **Flyovers coming:** three flyovers and a cloverleaf under construction in Effurun/Warri (S9). Visuals for modelling: in-situ deck casting, beam launching, diversion roads, drainage trenches. Because it is a politician-credited public-works project, **use only a generic flyover pier and deck, no plaques or names**, and no construction accident.
- **Asaba `[2]`:** a government capital: a supermarket-anchored mall of 39 shops beside a flyover at a roundabout where two main roads meet (S20); an airport (2011-12) with a duty-free terminal `[2: S2, S4]`; hotels along the main road to the airport (promotional listings `[1]`); a stadium (person-named); a film village (2023) `[1]`. Reading `[inf]`: 3-6 storey glass-and-cladding plaza blocks, boutique hotels, wide dual carriageway with median.
- **Markets `[2+]`:** Asaba has at least six; the main one runs ~1 km along its market road toward the Niger bank and works on a four-day Nkwo cycle `[2: S19, S4]`. Warri has Main, Igbudu, Pessu and others `[2]`. Sapele has Ogorode (produce, smoked fish, cloth, spices `[1: S13]`).
- **Industry (skyline only):** Warri refinery at Ekpan; port at Ugbuwangue; Delta Steel at Ovwian/Aladja (1980, running minimally `[2: S11]`); glass plant and power station near Ughelli `[2]`; Sapele power plants `[1]`; Asaba textile mill and steel mill `[1: S2]`.

### 3d. Timber and sawmill (Sapele)
Hardwood logs stacked and sawn; plywood/veneer factory; barges on the river; sawmills shape local streets `[2: S12, S13, S14]`. Reading `[inf]`: long open-sided sheds under low gable zinc roofs, stacked log cylinders (red-brown cut ends), plank stacks, a gantry or crane, sawdust piles, a wharf slab. Do not model the Navy presence or the idle floating dock.

### 3e. Settlement pattern
A flat, forested lowland of palm and farm-bush with towns strung along the A2 and the east-west highway; riverine settlements on creeks reach by boat. Asaba and the Anioma towns sit on terrace and escarpment above the Niger `[2: S2, S28]`.

## 4. Road
- **Highways `[2]`:** the A2 runs from the east through Patani to Warri and north to Benin City; the A232 runs from Benin through Agbor and Asaba to the Niger bridge (S1). The Effurun-Patani highway is the east-west route; an expressway links Effurun to the port (S7). Currently four lanes widening to eight between Effurun roundabout and the steelworks roundabout (S9). Treat as dark-grey asphalt, dual carriageway with median in urban stretches `[inf]`.
- **Flyovers `[1 project, politician-credited]`:** three flyovers and a 3/4 cloverleaf, pedestrian bridges and storm drains (S9). Asaba also has a flyover at its mall roundabout `[1: S20]`.
- **Roundabouts `[2+]`:** Effurun (S7, S8), steelworks roundabout at Ebrumede (S7, S8), Ubeji Roundabout and Okere Square (closed temporarily in 2022 `[1: S35]`), Okpanam roundabout market in Asaba `[1: S4]`, Abraka town roundabout `[1: S23]`, the Asaba mall roundabout.
- **Bridges `[2]`:** the Niger bridge (S16) with an 11 m centre carriageway and walkway each side, steel truss; Udu Bridge over the Warri River (1975) (S11); 19 bridges planned on an Itsekiri-side road (summary only, `[1]`).
- **Poles and wires:** high-tension overhead cables cross the road at one flyover site (S9). Concrete poles with sagging wires `[inf]`; generator noise is a recurring detail in Sapele guesthouses (S13) so small generators outside shops are plausible.
- **Drains:** storm-water drains being cut at Effurun/PTI/Enerhen (S9). Model as open concrete channels along the kerb, some slab-covered `[inf]`.
- **Surfaces and shoulders `[inf]`:** wet-dark asphalt, standing water after rain (annual rainfall 2,000-3,200 mm, S1); red-brown laterite shoulder; sandy bank near the river at Asaba.
- **Roadside trade `[inf with hints]`:** roadside grills at Amukpe (S13), sachet ("pure") water sellers, cassava and palm-oil jerrycans, fresh fish.
- **Transport `[2]`:** keke napep and minibuses (S5, S6). **Okada were phased out in Asaba, Warri and Effurun and ~3,000 tricycles were issued to former riders** `[2: S34]`, so do not show okada in town; kekes are the signature ride (keep `signatureRide: keke`). Kekes are barred from federal highways such as the Asaba-Onitsha road `[1: S34]`, so on the bridge approach show buses and trucks, with keke parked at the rank. Keke colour: **not found** (open question).
- **Signs:** hand-painted boards, glazed fascias on malls `[inf]`; gantry signs with junction names `[inf]`.
- **Do not show:** roadblocks, extortion, checkpoints, uniformed guards (insecurity guardrail 3).

## 5. Vegetation, terrain, water, light and season
- **Terrain `[2]`:** generally low-lying with no remarkable hills (S1); Asaba on a terrace of the lower Niger, ~55 m above sea level with the river bank ~40 m, escarpment at Ibusa/Okpanam (S2). The "hills up to 200 m" in S2 conflicts with S1; treat Asaba as a **terrace and a bluff, not mountains**.
- **Forest `[2]`:** lowland rainforest, freshwater swamp forest, mangrove along the coast (S1, S29). Trees named in S29: oil palm, raffia palm, abura, opepe, mahogany, bush mango, umbrella tree, ferns and epiphytes; obeche and iroko have been logged heavily. Use a **big buttressed forest tree** (obeche/iroko) at the Sapele and Ethiope scenes, raffia at swamp edges, bush mango and oil palm in villages.
- **Crops `[2+]`:** oil palm, cassava, yam, plantain, sugarcane (S1, S24, S25).
- **Water:** Niger brown-green with sandbanks and a dry-season beach at Asaba `[2: S3, search]`; the Ethiope is described as the deepest inland waterway in Africa and is clear spring water at Abraka `[2: S1, S23]` (sacred at its source: do not use the source); Warri River and creeks are tidal and dark `[inf]`; the Sapele river is freshwater, not salty `[1: S12]`.
- **Climate `[2]`:** wet season about March/May to October, dry season from November with harmattan haze (S2, S5, S25); July very wet, January driest (S1). The Isoko page notes a short dry spell in August.
- **Light `[inf]`:** milky bright overcast and haze, low sun glare off the Niger at Asaba, harmattan beige haze Dec-Feb.
- **Flares:** a flame on a slim stack at the Warri refinery or steelworks as a distant glow in the horizon only. No smoke over roads or people, no spills.
- **Recent-disaster flags:** the Niger overflowed at Asaba and in other Delta LGAs in 2012, 2018 and 2022 (S36). Do not show floods in streets or camps; a high-water river and sandbank are fine.

## 6. Dress
Men:
- **Urhobo/Isoko `[1+1: S27]`:** white lace or pastel shirt, George wrapper tied at the waist, a black hat, a walking stick, coral bracelets/necklace. **Use shirt + wrapper, hatless, no stick.**
- **Itsekiri `[2: S26, S27]`:** long-sleeved *kemeje* (also written *ikemeje*) shirt over a George wrapper, coral beads or a metal chain, a feathered hat (*ekoro*) or fedora. Chiefs' dress (white wrapper, scarlet sash; cross-topped crowns; priestly neckpiece) is regalia: **do not use**.
- **Ijaw `[reuse from Rivers dossier]`:** *njiri* (George), *etibo/owoko* shirt, coral. **Do not use the full etibo-hat-stick look** (flagged in the Rivers dossier as a head-to-toe signature look).
- **Igbo (Asaba) `[2: S27, Anambra dossier]`:** wrapper, plain shirts; isiagu only in a single non-political colour, never with a red cap.
- **Everyday `[inf]`:** short-sleeve shirts, polo, football shirts, jeans, trousers, sandals, canvas shoes.
Women:
- **Urhobo/Isoko `[1: S27]`:** two wrappers of the same cloth as the men's, a blouse, head-tie, coral.
- **Itsekiri `[2: S26, S27]`:** one or two wrappers with a fitted blouse, a knotted head-tie (*ulesun*), coral, silver or gold jewellery; brides in a George wrapper with a beaded top `[1]`.
- **Igbo (Asaba):** blouse, two wrappers, headscarf.
- **Everyday `[inf]`:** Ankara skirt-and-top, wrapper and blouse, head-tie, plastic basins on the head, baby tied with a wrapper.
Children `[inf]`: school uniforms (avoid exact colour pairs), flip-flops.
Working people `[inf]`: sawmill and timber loaders in vests or old shirts and boots; fishers in rolled trousers/singlets with cast nets; palm-oil and cassava processors in aprons; keke and bus drivers in short sleeves; fish sellers in wrappers; hawkers with sachet water.

**Avoid list (hard):**
1. The party colours #D4621B, #1FA98F, #3B6FD4, #F5CE2E, #C23FA0, #8257C8, as a solid garment, cap, umbrella, canopy, keke livery or flag. **Warning specific to Delta:** George wrapper in real life is often vivid royal blue, purple, magenta or gold, which coincide with the party list. Use muted wine #7A2F3E, indigo #3C4B7A (grey-blue, low saturation), mustard-ochre #B8892E, dusty rose #B97A84, dark teal #2E5E5A, cream. Coral beads render as small muted coral #D9826F accents only (a whole garment in coral would sit near the orange party colour).
2. Any red cap, plain red or green cap (Igbo title cap, party-cap look), branded "campaign" caps or T-shirts, umbrellas, brooms, horses, eagles.
3. A complete etibo-with-hat-and-stick outfit; feathered chiefly hats; scarlet sashes; cross-topped crowns; priestly neckpieces (oronwu); staffs.
4. Masquerade costumes (Omoko, Umale and others), ritual objects, shrines, cemeteries, anything religious (clerical collars, choir robes, mosque/church forms).
5. Militant or insecurity imagery: camouflage, balaclavas, headbands, armed men in speedboats, pipeline and flow-line fabrication scenes, oil spills, soot, protest scenes, checkpoints.
6. Palaces and rulers' regalia (scenery only; not used).
7. Flood-displacement scenes (camps, canoes in streets).
8. Slogan-like Pidgin sayings associated with Warri that could read as a campaign line (see section 7).

## 7. Signs and language
- **English** dominates shop fascias, and Pidgin is the lingua franca in Warri `[2: S5, S6]` and understood across the state. Business-name styles `[inf]`: "... Ent.", "... & Sons", "... Plaza", "... Ventures", "Mini Mart", "Pharmacy", "Auto Spares", "Plywood & Planks", "Timber Depot".
- **Pidgin words `[2+: S30, S31, Rivers dossier]`:** how far, I dey fine, wetin, abeg, wahala, gbege, pikin, comot, waka, siddon, chop, sabi, oga, una, dey. Sign forms `[1: S30]`: DEY OPEN, DON KLOS, KOMOT, MAN-DEM, WOMAN-DEM, DEM FORBID AM. "Shuo" is a Warri-Sapele Pidgin particle (mentioned in a search summary `[1]`): not recommended for signs.
- **Food and trade `[2]`:** banga soup with starch (Urhobo/Itsekiri/Isoko staple `[2: S25, S26]`), owo, pepper soup, garri, palm oil, smoked fish, plantain, okra soup; timber, plywood, planks (Sapele).
- **Sample boards (original, safe):** "BANGA & STARCH - HOT HOT", "PEPPER SOUP", "FRESH FISH", "PLANK & PLYWOOD - ALL SIZE", "SAW MILL", "PURE WATER", "DEY OPEN", "DON KLOS", "KEKE PARK - ABEG PARK WELL", "WELCOME TO DELTA".
- **Local words (all need a native speaker; dialects differ):**

| Word | Language | Gloss | Confidence | Needs native check |
|------|----------|-------|-----------|----|
| Migwo | Urhobo | hello/welcome, used to someone older | medium `[2: S31, S32]`, both weak | yes |
| Imíelè | Urhobo | thank you | low `[1: S31]` | yes |
| Káálá | Itsekiri | hello | low `[1: S31]` | yes |
| Ẹsé / Ẹ se | Itsekiri | thank you | low `[2 weak: S31 and a travel guide]` | yes |
| Mo dọkpẹ | Itsekiri | thank you | medium `[1: S32 Wikipedia]`, conflicts with the line above | yes |
| Ere ọwurọ / Ere ọsọn / Ere alẹ | Itsekiri | good morning / afternoon / evening | medium `[1: S32]` | yes |
| Odejuma | Itsekiri | good night | medium `[1: S32]` | yes |
| nụ́a | Izon (Ijaw) | thanks/welcome | medium `[2: Rivers S29, S30]`; dialects differ | yes |
| dibuomu | Izon | safe journey | low `[1: Rivers S29]` | yes |
| Nnọọ / Ndewo / Kedu | Igbo | welcome / hello / how are you | high for standard Igbo `[2+: Anambra S36]`; Asaba Enuani dialect not documented | yes |
| Nkwo | Igbo | the market day name used at Asaba's main market | medium `[2: S19, Anambra dossier]` | yes |
| (Isoko) | Isoko | **no greeting found** | — | — |

- **Avoid on signs:** "Warri no dey carry last" (a well-known Warri saying `[inf]`, could be adopted as a campaign line); "Resource control" and any militancy slogan; "Egbesu"; church/prayer-house business names; any party slogan; the ownership-of-Warri labels (district names that take a side).

## 8. Landmark candidates
Rule flags: P person-named, R religious, PAL palace, D recent disaster or insecurity, POL politician/government-project credit, 1S single-source, X existence or name unverified.

| # | Name | What it is | venueType | Why iconic | Silhouette in ≤5 primitives | Rule flags | Question for the local reviewer |
|---|------|-----------|-----------|-----------|------------------------------|-----------|----------------|
| 1 | **Niger Bridge, Asaba head** | steel through-truss, 1,404 m, 7 piers, Asaba end rising from the terrace to the first span | bridge | Delta's gateway from the south-east; built to replace ferries `[3: S16, S17, S1]` | 1) long thin deck box 2) two long open truss walls (thin boxes with diagonal braces) 3) taller portal frame over the main pier 4) three round piers 5) approach ramp wedge with a gate board | duplicates Anambra's bridge family but Anambra chose the second (concrete) bridge; Sept 2026 repair closure after vandalism (infrastructure, borderline D); war-damage history (do not depict); congestion with traders; truss profile and colour unsourced `[1]` | Arched or flat top chord? Colour? Is the Asaba head approach on a rise? |
| 2 | **Cable Point landing, Asaba** | former telegraph landing and ferry point on the Niger, boats to Onitsha (~8-12 min), a market (Wikivoyage's "Abraka Market") | waterfront | river gate of the capital `[2: S3, S4 + traveller account [1]]` | 1) sloping stair wedge down the bank 2) landing slab 3) boat hull (capsule) 4) market shed (box + low roof) 5) post/lamp | none (the older local name is a place name); ferry "previously" per S2 so current status unconfirmed X | Do boats still cross? Is the landing safe/open to show? |
| 3 | **Ogbe-Ogonogo Modern Market, Asaba** | largest market in Asaba, ~1 km along its market road toward the river, Nkwo days | market | the capital's trading heart `[2: S19, S4]` | 1) long low hall (box) 2) shallow zinc roof slab 3) row of parasol cones 4) livestock pen strip (low boxes) 5) gate board | D: 2020 fire (6 years; no casualties) so never show smoke; trader tax disputes (skip); road named for a person (P: describe as "market road") | Colour of the gate? Sections? Is the 2020 fire too recent? |
| 4 | **Effurun Roundabout** | the central traffic circle of Uvwie, near a shopping mall, links Benin, Sapele, Ughelli and the port expressway | square | "the central spot in Uvwie" `[2: S7, S8]` | 1) wide low disc (island) 2) outer ring-road disc 3) central sign column or plinth 4) mall block (box) in the back 5) flyover pier stub | POL/construction: a flyover and cloverleaf project is under way `[1: S9]`; X: what stands in the middle `[unknown]` | What is in the middle (monument, none)? Person-named? |
| 5 | **Warri Stadium (a.k.a. Warri Township Stadium)** | 20,000-seat covered stadium on a named road, athletics track, home of a club | stadium | Warri's main ground, hosted a women's continental final and a youth world cup `[2: S10]` | 1) squashed-cylinder bowl 2) pavilion roof wedge 3) track ring disc 4) four floodlight masts 5) entrance gate box | capacity conflict (20,000 vs Wikivoyage 30,000); name conflict (Warri Stadium / Warri Township Stadium / "Warri City Stadium" in Wikivoyage, may be a different ground); not found to be person-named `[1]` | Which name do locals use? Is "Cemetery Road" its address? |
| 6 | **Warri riverside jetties and markets** | riverfront strip with markets and jetties, boats between Warri and creek towns | waterfront | working water-gate of the city `[2: S5, S6]` | 1) jetty plank slab 2) posts 3) long boat (capsule) 4) tarp stall (box + wedge) 5) market sign board | Ogbe-Ijoh market name is contested between groups (use a neutral label); similar to Rivers' Creek Road waterfront | Which jetty? Neutral name? |
| 7 | **Udu Bridge (Enerhen to Udu)** | 1975 road bridge over the Warri River | bridge | replaced the old Aladja Waterside crossing `[2: S11]` | 1) low long deck 2) box piers 3) side rails 4) lamp posts 5) approach ramp | form unsourced `[inf]`; X for dimensions; Enerhen junction flyover project nearby (POL) | What does it look like (arched? truss?)? |
| 8 | **Sapele Timber Wharf and River Landing** | river landing with logs, barges and sawmills; timber capital | waterfront | the delta's timber trade `[2: S12, S14]` + scene `[1: S13]` | 1) wharf slab 2) log stack (cylinders, red-brown ends) 3) low open saw shed (box + gable) 4) crane/gantry (tall box + long box) 5) barge (flat box + wedge bow) | not a named place in any source; "Sapele Waterside" in the pack is unverified X; port used by the Navy (military, do not show); idle floating dock (skip) | Is there a public timber wharf you can name? Where do logs land? |
| 9 | **Sapele Township Stadium** | ~10,000-seat stadium completed 2013 | stadium | Sapele's ground `[1: S12]` | 1) bowl 2) stand wedge 3) track 4) masts 5) gate | 1S; only needed if Warri Stadium is rejected | Name and condition? |
| 10 | **Ogheye Floating Market** | plank-built platform market in the creeks of Warri North; 90 lock-ups + 80 open stores; a concrete replacement was planned | market | the only floating market in the state `[2+ but one project]` | 1) wide low deck slab on posts 2) row of lock-up boxes 3) open stall canopies (wedge slabs) 4) jetty planks 5) canoe hulls | POL (state-built, politician-credited; show no plaque); D: a "sea pirates" police post is mentioned (do not show); X: whether the new market opened; remote | Does it work as described today? Local name? |
| 11 | **Falcorp Mangrove Park** | leisure/eco park behind the refinery: mini zoo, small museum, royal cemetery, apiary, canoeing, rice plot | park | the best-known park in the metropolis `[3 listings]` | 1) mangrove clump (3 stilt-root cones) 2) plank walk (box) 3) pond disc 4) cage block 5) gate | royal cemetery on site (PAL-adjacent and ritual: reviewer only); mini zoo of captive animals (welfare risk); boardwalk unconfirmed | Is the cemetery within the park a sensitive site? |
| 12 | **Abraka river beach on the Ethiope** | spring-fed river beach with canoeing, fishing, swimming, picnics | waterfront | the clear-water Delta `[2: S23]` | 1) sand wedge 2) river disc (clear green-grey) 3) canoe 4) picnic shelter (box + cone) 5) big forest tree (cylinder + sphere) | similar beach is called by a surname (P) in a Commons file name `[1]`; Ethiope is sacred at its source (do not use the source) | Name? Public? Is the water clear? |
| 13 | **Effurun Garden Park** | public garden park | park | Wikivoyage sight `[1: S6]` | 1) lawn disc 2) path 3) tree 4) pergola 5) gate | 1S, no description; 2015 budget lists "rest parks" `[1]` | Does it exist? What does it hold? |
| 14 | **Asaba mall roundabout and flyover** | supermarket-anchored mall (39 shops) beside a flyover at a main-road roundabout | square | Asaba's contemporary face `[2: S20, S3]` | 1) mall block (box) 2) flyover deck 3) two piers 4) roundabout disc 5) billboard | commercial brand (do not show logos); promotional sources `[1]` | Is this recognisable as the capital's modern junction? |
| 15 | **Otuogu beach (Niger sandbank, Asaba)** | long sand bank on the Niger visited in the dry season | waterfront | dry-season river beach `[2: S3, S2 and listing]` | 1) long flat sand wedge 2) river disc 3) kiosks (two boxes) 4) palm 5) boat | few amenities; flood-prone zone (D context) | Is it a gathering place? |
| 16 | **Delta Steel / Warri refinery / Warri port** | industrial skyline | landmark | skyline marker `[2+]` | tanks, gantry, one flare stack | industrial; flare imagery limited to a distant glow; not a venue | skyline only |

### The best five and why
Chosen one per segment 0-4, differing visually from each other and from Rivers/Anambra, with rule flags manageable:
1. **Segment 0 — Niger Bridge, Asaba head (bridge).** Delta's entry point from the south-east and its most recognisable structure. Anambra's pack uses the Second Niger Bridge, and this build must read as a **steel through-truss with open diagonal side walls on a rise above the river** (Anambra: smooth concrete box girder). Show it from the Asaba bluff, not from the Onitsha side, and keep the bridge deck off the screen centre as the player stops at the gate. Keep the existing pack entry but add the note "Asaba head".
2. **Segment 1 — Sapele Timber Wharf (waterfront).** Replaces the pack's "Sapele Waterside", which no source names. It is the only timber scene in the six built states, and it is not a creek jetty like Rivers. Sources are thinner (blog plus encyclopaedia), so the reviewer must confirm.
3. **Segment 2 — Effurun Roundabout (square).** Best-sourced urban node (Wikipedia, Commons caption, news) and the natural home of the roundabout-maze hazard; carries the contemporary Warri conurbation.
4. **Segment 3 — Warri Stadium (stadium).** Two-source existence, 20,000 covered, athletics track. Keep the pack's venue type; the name should follow the reviewer's choice (Warri Stadium / Warri Township Stadium).
5. **Segment 4 — Ogheye Floating Market (market).** Replaces the pack's fifth entry (a garden inside the Asaba airport named for a South African statesman: person-named, and an airport precinct is not a public rally park). It is the most distinctive Delta thing found and puts a plank-platform market on water, which Rivers does not have. **It is the highest-risk pick** (a state project; opening unconfirmed; remote). **Fallback if the reviewer cannot confirm:** Ogbe-Ogonogo Modern Market (market) in Asaba.

Pack changes suggested: keep "Niger Bridge (Asaba head)", "Effurun Roundabout"; rename "Sapele Waterside" to "Sapele Timber Wharf"; keep "Warri Township Stadium" pending a name check; replace the airport garden with "Ogheye Floating Market". Also: replace pack `scenery` "riverine stilt houses" with "plank lock-ups on piles" to avoid duplicating Rivers; add "oil-palm and cassava belt" and "log stacks".

## 9. Rejected candidates
- **The Asaba stadium named for a late national footballer-coach:** P (person-named). Even though it is the best-documented stadium in the state (22,000 seats, hosted an athletics championship), the rule forbids it.
- **The garden inside Asaba airport named for a South African statesman:** P and an airport precinct (not a public park).
- **The explorers' anchorage and museum at Asaba, the colonial house named for a Scottish explorer (now the national museum), the princess statue, the "Omu" women's-leader statue, the heritage centre, an independence-themed square:** P for the first three; the statues and monuments are cultural or ritual and the square is only a listing with no description `[1]`, X. Reviewer-only.
- **Palaces:** the Olu's palace at Ekurede, the Ovie palace at Otovwodo, the Asagba palace, and the former palace and museum of an Itsekiri chief at Koko (P + PAL): scenery only, not used even as scenery.
- **Royal cemetery of the Warri kingdom** (inside Falcorp park): ritual and PAL-adjacent. Falcorp park itself is not selected for that reason.
- **The Ethiope source at Umuaja and the sacred groves:** sacred; river itself only as clear-water scenery.
- **Religious buildings:** the Word of Life church building (Wikivoyage lists it as a sight), the catholic church over a century old at Asaba, cathedrals: R.
- **Ogbe-Ijoh market name:** the ownership of Warri is contested (S33); selecting that label takes a side.
- **Refinery, port, steelworks, Ugbuwangue docks, flow stations, Ughelli power station:** industrial, not venue types; skyline hints only. Spills, flaring over people and pipeline scenes: D.
- **Sapele Navy port and idle floating dock:** military.
- **Hotels, malls by brand (supermarket logo), the film village:** commercial; the film village is also thin `[1]`.
- **Forcados / Burutu colonial ruins:** remote, decaying; no sources describing a venue.
- **Kwale game reserve:** remote and wildlife-themed; not a rally venue.
- **Flood scenes (Asaba waterside 2012/2018/2022, Warri 2022):** D.
- **The Asaba main-market fire (2020):** kept only as a flag; never shown.
- **The Warri-area ethnic crisis history and militancy:** never referenced.
- **Mistaken Wikivoyage entries:** "Nike Lake Resort" listed under Asaba is in another state; "Second Niger Bridge, built 1965" is the First bridge.

## 10. Welcome / farewell candidates
Delta has no single language: Urhobo, Isoko, Itsekiri, Ijaw, Igbo (Anioma), Ukwuani and others, with Pidgin the shared lingua franca. Picking one local language for the gate would privilege a group (GUARDRAILS 3, no ethnic bonuses). Recommendation: **Pidgin and English only** at the gates; offer local-language lines as a rotating bonus only after native review.

| Line | Language | Confidence | Needs native check |
|------|----------|-----------|-------------------|
| "Welcome o! Na Delta we dey!" (current) | Nigerian Pidgin | medium-high: "Na ... we dey" is natural; set-phrase form not attested | quick check |
| "Una welcome to Delta o!" | Pidgin ("una" attested `[2: S30, Rivers]`) | medium-high | quick check |
| "Yu dey welkom o!" (as spelled by the phrasebook) | Pidgin | high as a gloss `[1: S30]` | spelling check |
| "Go well o! Make we see again." | Pidgin | medium (already proposed for Rivers; a different line is better so states differ) | quick check |
| "E go bi nah, Delta!" | Pidgin (informal goodbye `[1: S30]`) | medium | quick check |
| "Safe journey from Delta." | English | high | no |
| "Bye-bye, Delta!" | Pidgin/English | high, generic | no |
| "Migwo!" | Urhobo | low-medium `[2 weak]`; used to elders | YES |
| "Ere ọwurọ!" / "Mo dọkpẹ" | Itsekiri | medium `[1: Wikipedia]`; thank-you conflicts with another guide | YES |
| "Nụ́a!" | Izon (Ijaw) | medium for one dialect | YES |
| "Nnọọ n'Delta!" | Igbo (Anioma) | medium `[inf]`; Enuani spelling unknown | YES |
Recommendation: keep "Welcome o! Na Delta we dey!" for the gate; add a farewell "E go bi nah, Delta! Safe journey." (the pack currently has none) and ship both after a quick Pidgin check. Do not ship any Urhobo, Itsekiri, Ijaw or Igbo line before native confirmation, and if one is added, give each language equal exposure.

## 11. Hazard visual notes
The pack's three hazards: `creek-crossing`, `roundabout-maze`, `go-slow`.
- **creek-crossing:** A narrow timber-deck bridge or short causeway over a creek: grey plank deck with low rails, a lane squeeze to one car width, brown tidal water under it, a canoe tied to a pile, raffia fronds at the edge and a hand-painted "SLOW - BRIDGE" board. Mechanic is lateral squeeze only. **No collapse, no missing planks, no injured people** (a bridge collapse is a recent-disaster category; Delta has had bridge stories in the news). A 6-8 box strip plus a flat water plane. Telegraph with two bollards and a slow-down chevron (black and white; avoid orange cones).
- **roundabout-maze:** Three or four slim traffic islands staggered across a wide carriageway (palm, sign column, planted shrub), a keke and a minibus circulating, a flyover pier and deck casting a shadow above. Chevron boards in black-and-white; use grey barrier drums, not orange. No construction accident, no workers in danger. Cheap: 3-4 cylinders on a disc, 1 box deck above.
- **go-slow:** A long queue at the bridge head: timber lorry with a log load, minibuses with roof racks, a tanker silhouette, buses and a few cars, hawkers weaving with sachet-water trays and fruit baskets, a keke on the shoulder. Amber hazard blink on tail lights. **Do not show roadblocks, checkpoints, uniforms or "toll" bribes.** Cheap: a block of 6-10 box vehicles at low speed with slow-wobble speed lines.

## 12. Design brief
**Which shared library it can reuse:** the pack's `biomeKit` is `creek-delta` (`packages/content/data/world/creek-delta.json`, today holding the `rivers.*` districts and the `delta-south` dress set). Delta should **add a `delta.*` district set to the same file** (with its own dress set and road entry) rather than a new kit: it needs the `waterEdge`, `flora`, `lots`, `kerbside`, `bazaar`, `crops`, `people` and `furniture` ops. Asaba's Igbo end could borrow Anambra's `farmland-river` districts as a look reference only; do not share district ids. Skyline: `oil-flares` (Warri refinery/steelworks: tank farm, gantry, one slim flare) and `niger-bluffs` (the far bank; for Delta it reads as Onitsha seen from Asaba: low blue-green ridge, two cranes, faint bridge deck on piers).

**Existing lot styles reusable:** `shophouse`, `flatroof-shopfront` (street frontage), `market-shed` and `market-block` (Warri markets), `plaza-block` (Effurun and Asaba mall), `tiled-villa` (return-home houses), `colonial-bungalow` (Sapele and Asaba old quarters), `zinc-bungalow` (village rows), `port-shed` (riverside warehouses), `tank-farm` and `works-shed` / `factory-shed` (Aladja, Warri), `stilt-house` (creek segment, 1 only), `thatch-hut` (tiny share).

**NEW building styles, flora and props needed:**
- Lot `sawmill-shed`: long open-sided shed, low gable zinc roof, plank and log stacks, a belt or saw bench box, a sawdust mound.
- Lot `plank-lockups`: a row of narrow plank-and-zinc lock-up boxes on a wide pile deck (floating-market stalls); could also seed a `waterEdge` platform.
- Venue pieces: `delta.niger-bridge` (steel through-truss on round piers, approach wedge, gate board), `delta.timber-wharf`, `delta.effurun-roundabout`, `delta.warri-stadium`, `delta.ogheye-market`.
- Flora: `forest-giant` (obeche/iroko-like buttressed tree), `silkcotton` optional; reuse `oilpalm`, `raffia`, `bush mango` (via `mango`), `banana`, `cassava`, `nipa`/`mangrove` (sparingly).
- Kerbside items: `logs`, `planks`, `jerrycans` (palm oil), `sachets` (water-sachet bag stack). Palm-oil colour is orange-red: keep jerrycans muted brown-yellow, not #D4621B.
- Props: flyover pier and deck with in-situ shuttering (generic), grey drums, steel guard rail, sawdust.
- Dress set `delta-south`-like: add `kemeje`/lace shirt and `george-wrapper` colours (see palette), `head-tie`; no new hats.

**Palette (hex)**
- sky `#A9C4C8` (milky humid, a touch greyer than the pack's #A8D8D8; dry-season haze variant `#D6CFBF`)
- fog `#DCE5E1`
- ground (grass/verge) `#55744A`; Asaba red-brown shoulder `#A5683F`; Sapele sawdust `#C9A66B`
- accent `#4D6F86` (steel-bridge slate; **replaces the pack's #2A6F97, a saturated mid-blue that sits near the blue party colour**)
- river (Niger) `#7A8F78`; Ethiope `#6F9A8A`; creek `#6B5238`; road `#4C5154`; lane marks `#E4E0D2`
- buildings: cream `#E6DBC0`, sand `#D9C9A4`, terracotta tile `#9C5A3B`, zinc grey `#9AA3A6`, rust zinc `#A8553B`, plank brown `#8A7358`, sage wall `#A9C0A8`, slate door `#4F6D85`
- timber: log end `#9A5A38`, plank `#C9A66B`
- cloth swatches (single colour, never the party list): wine `#7A2F3E`, indigo `#3C4B7A`, mustard `#B8892E`, dusty rose `#B97A84`, dark teal `#2E5E5A`; coral accents `#D9826F` (small areas only)

**Building style weights** (sum 100)
| Style | Weight |
|-------|--------|
| shophouse (2-3 floors) | 22 |
| flatroof-shopfront | 14 |
| market-shed / plank lock-ups | 10 |
| plaza-block (Effurun, Asaba mall, hotels) | 10 |
| tiled-villa (return-home houses) | 10 |
| colonial-bungalow / zinc-bungalow | 10 |
| new sawmill-shed | 6 |
| stilt-house / palm-rib creek houses | 6 |
| factory / works / tank-farm | 6 |
| port-shed | 4 |
| thatch-hut | 2 |

**Route table** (the order is a game tour, not a driving route; the reviewer may reorder)
| Seg | District | What the player sees | Landmark carried |
|-----|----------|---------------------|------------------|
| 0 | Asaba bridge head and Niger bluff | steel truss at the end of a rising approach, terraced bank dropping to the river, hazy far bank with cranes (niger-bluffs), hawkers with basins, truck queue, red-brown shoulders | Niger Bridge, Asaba head |
| 1 | Sapele timber quarter | log stacks, saw sheds, plank piles, a wharf with a barge, forest-giant trees, sawdust, rust-zinc roofs | Sapele Timber Wharf |
| 2 | Effurun / Uvwie (contemporary district) | a wide roundabout with a flyover pier, supermarket-anchored mall, glass plaza blocks, keke rank, drain trenches | Effurun Roundabout |
| 3 | Warri South streets | dense market streets, fascia boards, umbrellas, kekes, concrete poles and wires, a stadium bowl with masts | Warri Stadium |
| 4 | Warri North creeks | plank-deck market on piles with lock-up boxes, canoes, raffia swamp edge, dark water | Ogheye Floating Market |
| 5 | Udu / Aladja waterside and steelworks skyline | a long road bridge over the Warri River, steelworks and refinery hint (tanks, gantry, one slim flame at the horizon), barter market | none |
| 6 | Ughelli to Isoko oil-palm and cassava belt | oil palms, cassava rows, palm-oil jerrycans at the kerb, block houses with zinc roofs, women traders on a market day | none |
| 7 | Asaba Okpanam Road (contemporary district, finish approach) | dual carriageway with median, mall and hotel plaza blocks, flyover, terraced bank glimpsed toward the Niger | none |

**Start scene (40 m before the gate):** the Asaba bridge-head approach in humid morning light: a gently rising dark-grey road, a steel guard rail, concrete poles with sagging wires, the first truss frame ahead with brown-green river haze beneath, a red-brown laterite shoulder, a keke rank beside a row of plank and zinc stalls, hawkers with basins and sachet-water trays, a timber lorry and minibus queue, an oil palm and a bush mango on the right, and a board "WELCOME o! NA DELTA WE DEY!" across the gate. No uniforms, no roadblock.
**Finish scene:** dusk on the Asaba terrace in the capital's new district: a lit dual carriageway with median palms, a mall and hotel plaza block with generic signs, a flyover pier, a low wall at the bluff edge with the Niger and the far bank's lights beyond, a rally stage in front of a tree-lined verge, a crowd in muted George and Ankara colours, "E go bi nah, Delta!" board. No party colours, no flags.
**Contemporary district:** segment 2 (Effurun) and segment 7 (Asaba Okpanam Road).

## 13. Open questions for the local reviewer
1. Niger Bridge, Asaba end: arched or flat top chord on the truss? Colour? Does the approach rise from the town? Is it acceptable that Anambra uses the other (concrete) bridge while Delta shows the steel one?
2. Is the September 2026 repair closure of the old bridge a problem for showing it?
3. What stands in the middle of the Effurun roundabout (monument, planting, none)? Is anything on it person-named? Colours of the surrounding fascias and the mall?
4. Warri stadium name locals use (Warri Stadium / Warri Township Stadium / a separate "Warri City Stadium")? Capacity 20,000 or 30,000?
5. Is there a public, nameable timber wharf or river landing at Sapele (the pack's "Sapele Waterside" is unverified)? Do log barges load there? Which river (Ethiope or Benin)?
6. Does Ogheye Floating Market work as described today? Local name? Is the plank version still standing? Is it appropriate to show it?
7. Fallback market: is Ogbe-Ogonogo (Asaba) fine given the 2020 fire, and what are its gate and sections?
8. Keke and minibus colours and liveries in Warri, Sapele and Asaba today; any colour code that echoes a party livery?
9. Poles, wires, kerbs, medians and sign colours on Warri and Asaba roads (no source found).
10. Pidgin gate lines in section 10; Urhobo "Migwo/Imíelè", Itsekiri "Káálá/Ẹsé/Mo dọkpẹ", Izon "nụ́a", Isoko (no greeting found), Asaba Igbo (Enuani) forms.
11. Dress: which Urhobo, Isoko, Itsekiri and Ijaw combinations read as a particular public figure or a chiefly rank? Are coral beads in muted accents acceptable given the orange party colour?
12. Is a Warri-district label ever contested? Which neutral names should signs use (the dispute over who owns Warri is visible in the sources)?
13. Is Cable Point still a boat landing? Is the crossing used by traders?
14. Isoko and Okpara country: what do compounds, markets and palm-oil processing really look like? Where is the "Okpara palm belt"?
15. Are kekes allowed on the Asaba bridge approach, and what travels on it?
16. Which parks are real and public in Warri and Asaba (Effurun Garden Park, any Asaba park)?
17. Is the hazard "creek-crossing" visually right for Delta (plank bridge, canoe ferry, pontoon)?

## 14. Sign-off
Reviewer: —  Date: —  Status: unreviewed
