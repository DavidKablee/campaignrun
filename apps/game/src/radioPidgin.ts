/**
 * The radio station in Naija Pidgin (docs/research/pidgin-review.md). Same events, same cooldowns,
 * same rules as the English pools in radioCallouts.ts: no ride names, no religious phrases, no
 * other state's name, and a place is named only where it is true.
 */
export const PCM = {
  gate: [
    'Oya o! Gate don open — convoy dey road!',
    'We dey move! Supporters, hold tight!',
    'Make we go! Road clear, engine don hot!',
    'Rally time! Everybody enter, make we waka!',
    'Oya, mount! Today na our day!',
  ],
  dropoff: [
    'Supporters don land — go the next stop!',
    'You drop am clean — road dey sweet!',
    'Oya, unload don happen — keep moving!',
    'Supporters don enter — next batch, make we go!',
    'Gbam! Passengers don comot well well!',
  ],
  fullHouse: [
    'E full! Convoy pack from front reach back!',
    'No space again — this bus dey choke!',
    'Everybody don enter — make we move!',
    'Bus full reach roof — momentum dey rise!',
    'Dem pack am like market day — oya go!',
  ],
  onBeat: [
    'On beat o! Crowd dey climb!',
    'That timing sweet — keep am up!',
    'You dey on point — the crowd dey feel am!',
    'Beat dey your side — Crowd dey stack!',
  ],
  finish: [
    'Grand rally don reach! Thank you from the studio!',
    'Finish line! Na the biggest crowd of the season!',
    'Rally don end — we call am a wrap!',
    'You don do am! Rally finish, crowd dey sing!',
    'End of road, top of chart — well done!',
  ],
  toll: [
    'Agbero don collect! Your load don pay am!',
    'Area boys dey the junction — toll dey for road!',
    'Chai! Agbero say "something small" — and e no small!',
  ],
  tollDodged: [
    'Agbero wave, e miss — clean escape!',
    'You dodge the toll! Smooth like butter!',
    'Area boy dey hold air — nice lane work!',
  ],
  stubborn: [
    'One passenger no wan comot — just dey patient!',
    '"I never reach my stop!" — passenger dey argue!',
    'Conductor dey beg am to comot — hold the brake!',
  ],
  weave: [
    'Traffic dey swerve — watch your lane!',
    'Driver don signal — e go cut across!',
    'Somebody no dey look road — give am space!',
  ],
  closeCall: [
    'Chai! Na inches — clean dodge!',
    'Omo! E nearly happen — steady hand!',
    'Bumper nearly kiss you — hold am steady!',
    'Close shave! Road dey sweet and dangerous!',
  ],
  breakdown: [
    'Ohh! Breakdown on air — convoy don stop!',
    'Engine don cut — mechanic dey road, hold on!',
    'We don stop — rally dey wait small!',
    'Flat tyre alert! Supporters, make una calm down!',
  ],
  finalStretch: [
    'Last stretch — Grand Rally dey front!',
    'Almost there! Grand Rally dey call!',
    'Last kilometre — Grand Rally dey come!',
  ],
  zoneEnter: [
    (lm: string) => `We dey enter ${lm} — open your eye!`,
    (lm: string) => `${lm} dey ahead — make we load!`,
    (lm: string) => `Reach ${lm} soon — hold for supporters!`,
    (lm: string) => `${lm} dey the horizon — oya!`,
  ],
  zoneEnterPlace: (stateName: string) => [(lm: string) => `${stateName} dey move — ${lm} dey ahead!`],
  zoneEnterLagos: [
    (lm: string) => `Eko dey shake — we dey go ${lm}!`,
    (lm: string) => `Lagos crowd for ${lm} — convoy dey come!`,
  ],
  landmarkFlair: ['We dey go', 'Next stop:', 'Road dey lead to'],
  landmarkFlairLagos: ['Eko people, get ready —', 'Lagos crowd dey wait —'],
};
