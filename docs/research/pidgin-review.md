# Naija Pidgin lines — for a native-speaker review

Status: DRAFT. Written 28 Oct 2026 without a native speaker, in the same spirit as the Efik and Hausa lines the state dossiers leave to a local reviewer. **Nothing here has been checked by anyone who speaks Pidgin.** The risk is not offence but a stilted or wrong line that makes players groan, which a Pidgin-speaking player will notice in a second.

Where it appears: the radio strip, run toasts, run prompts, the first-run card and the message a player sends a friend, only when Settings → *Naija Pidgin on the road* is on. Menus, legal text and the disclosure stay in English.

## What to check
- Is it natural, or does it read as English with *dey* sprinkled in? Rewrite freely.
- Spelling: Pidgin has no single standard. Pick one house spelling (for example *dey*, *don*, *wetin*, *comot*, *abeg*) and keep it.
- Anything that sounds like a political slogan, a real person's catchphrase or a party's line. None is intended; say so if one is.
- Regional register: Lagos, Warri and Port Harcourt Pidgin differ. The lines aim for the common middle; flag any that only fit one region.

## Strings (key · English · Pidgin)

| Key | English | Pidgin |
|-----|---------|--------|
| `toast.fullHouse` | FULL HOUSE | E FULL! |
| `toast.onBeat` | ON BEAT | ON BEAT O! |
| `toast.clear` | CLEAR | E CLEAR |
| `toast.fail` | FAIL | E DON FAIL |
| `toast.toll` | TOLL · AGBERO | AGBERO WAN COLLECT |
| `toast.tollDodged` | DODGED THE TOLL | YOU DODGE AM |
| `toast.stubborn` | STUBBORN PASSENGER · HOLD | PASSENGER NO WAN COMOT · HOLD |
| `toast.weaveWarn` | SWERVING AHEAD | SOMEBODY DEY SWERVE |
| `toast.closeCall` | CLOSE CALL | E NEARLY HAPPEN |
| `prompt.pickup` | FLICK DOWN & HOLD · LOAD | FLICK DOWN, HOLD · LOAD AM |
| `prompt.venue` | FLICK DOWN & HOLD · DOUBLE-TAP ×{beat} | FLICK DOWN, HOLD · DOUBLE-TAP ×{beat} |
| `prompt.pickupAhead` | PICKUP AHEAD · BE READY TO BRAKE | PICKUP DEY AHEAD · GET READY TO BRAKE |
| `prompt.venueAhead` | VENUE AHEAD · BE READY TO BRAKE | VENUE DEY AHEAD · GET READY TO BRAKE |
| `hint.gestures` | <b>Flick</b> ◀ ▶ lane · <b>up</b> hop · <b>down</b> brake · <b>double-tap</b> beat · <b>hold</b> horn | <b>Flick</b> ◀ ▶ change lane · <b>up</b> jump · <b>down</b> brake · <b>double-tap</b> beat · <b>hold</b> horn |
| `tutorial.title` | Two moves to start | Two things to start |
| `tutorial.lane` | Flick left or right to change lane | Flick left or right to change lane |
| `tutorial.hop` | Flick up to hop a pothole | Flick up to jump the pothole |
| `tutorial.rest` | The convoy drives itself. When you reach a pickup, the screen tells you what to do. | The convoy dey drive itself. When you reach pickup, the screen go tell you wetin to do. |
| `tutorial.go` | Got it — drive | I don understand — drive |
| `challenge.text` | Beat my {crowd} Turnout on Campaigner — same road ({state} · {ride}). Game scores, not a poll. | Abeg beat my {crowd} Turnout for Campaigner. Na the same road ({state} · {ride}). E be game score, no be poll. |
| `challenge.whatsapp` | Send on WhatsApp | Send am for WhatsApp |
| `challenge.other` | Share… | Share am… |
| `challenge.copy` | Copy link | Copy the link |
| `challenge.title` | Beat my run | Beat my run |
| `challenge.sub` | Sends a link to this exact road and traffic with your {crowd} to beat. No account needed. | We go send link for this same road and traffic with your {crowd} to beat. You no need account. |
| `challenge.sent` | Opened WhatsApp | WhatsApp don open |
| `challenge.shared` | Shared | E don go |
| `challenge.copied` | Link copied | Link don copy |
| `challenge.failed` | Could not share the link | The link no gree share |

## Radio pools (Pidgin only; the English pools are in `radioCallouts.ts`)

**gate**
- Oya o! Gate don open — convoy dey road!
- We dey move! Supporters, hold tight!
- Make we go! Road clear, engine don hot!
- Rally time! Everybody enter, make we waka!
- Oya, mount! Today na our day!

**dropoff**
- Supporters don land — go the next stop!
- You drop am clean — road dey sweet!
- Oya, unload don happen — keep moving!
- Crowd don enter — next batch, make we go!
- Gbam! Passengers don comot well well!

**fullHouse**
- E full! Convoy pack from front reach back!
- No space again — this bus dey choke!
- Everybody don enter — make we move!
- Bus full reach roof — momentum dey rise!
- Dem pack am like market day — oya go!

**onBeat**
- On beat o! Turnout dey climb!
- That timing sweet — keep am up!
- You dey on point — the crowd dey feel am!
- Beat dey your side — Turnout dey stack!

**finish**
- Grand rally don reach! Thank you from the studio!
- Finish line! Na the biggest crowd of the season!
- Rally don end — we call am a wrap!
- You don do am! Rally finish, crowd dey sing!
- End of road, top of chart — well done!

**toll**
- Agbero don collect! Your load don pay am!
- Area boys dey the junction — toll dey for road!
- Chai! Agbero say "something small" — and e no small!

**tollDodged**
- Agbero wave, e miss — clean escape!
- You dodge the toll! Smooth like butter!
- Area boy dey hold air — nice lane work!

**stubborn**
- One passenger no wan comot — just dey patient!
- "I never reach my stop!" — passenger dey argue!
- Conductor dey beg am to comot — hold the brake!

**weave**
- Traffic dey swerve — watch your lane!
- Driver don signal — e go cut across!
- Somebody no dey look road — give am space!

**closeCall**
- Chai! Na inches — clean dodge!
- Omo! E nearly happen — steady hand!
- Bumper nearly kiss you — hold am steady!
- Close shave! Road dey sweet and dangerous!

**breakdown**
- Ohh! Breakdown on air — convoy don stop!
- Engine don cut — mechanic dey road, hold on!
- We don stop — rally dey wait small!
- Flat tyre alert! Supporters, make una calm down!

**finalStretch**
- Last stretch — Grand Rally dey front!
- Almost there! Grand Rally dey call!
- Last kilometre — Grand Rally dey come!

**zoneEnter**
- We dey enter ${lm} — open your eye!
- ${lm} dey ahead — make we load!
- Reach ${lm} soon — hold for supporters!
- ${lm} dey the horizon — oya!

**zoneEnterLagos**
- Eko dey shake — we dey go ${lm}!
- Lagos crowd for ${lm} — convoy dey come!

## Sign-off
Reviewer: —  Date: —  Status: unreviewed
