import type { SimEvent } from '@cr/sim';
import { getLang, type Lang } from './i18n';
import { PCM } from './radioPidgin';

/** Pick a random element from an array. */
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

// Zone-specific station IDs shown in the radio strip
export const ZONE_STATION: Record<string, string> = {
  SW:  'Èkó Wave 92.1',
  NW:  'Arewa Air 89.3',
  NE:  'Sahel Signal 97.7',
  SE:  'Ogene Line 94.5',
  SS:  'Creek Brass 88.9',
  NC:  'Middle Belt Beat 91.0',
  FCT: 'Capital Mix 103.5',
};

export function stationForZone(zone = 'SW'): string {
  return ZONE_STATION[zone] ?? ZONE_STATION['SW']!;
}

// Generic DJ patter pools by event
const GATE_LINES = [
  'Oya o! Gates open — convoy is on the road!',
  'We dey move! Supporters, lock in tight!',
  "Convoy wey no stop — that's us today!",
  'Oya, rally o! Road don clear — go!',
  'Gate open, engine hot — hustle time!',
  'Supporter bus dey full — convoy activated!',
];

const DROPOFF_LINES = [
  'Supporters delivered — on to the next stop!',
  'Drop-off confirmed — route is clean!',
  'Oya, unload don happen — keep momentum!',
  'Supporters dropped off — next wave, mount up!',
  'Supporters offloaded — keep it moving, driver!',
];

const FULL_HOUSE_LINES = [
  'Full house! Convoy packed from front to back!',
  'No space remain — this ride is choking!',
  'Capacity reached! Everybody in — move out!',
  'Bus full to the roof — momentum surge!',
  "Packed like market day — let's ride!",
];

const ON_BEAT_LINES = [
  'On the beat — Crowd stacking up nicely!',
  'Rhythm right — crowd numbers climbing!',
  'That timing sweet — keep the groove!',
  'On beat, on point — this convoy is blessed!',
];

const FINISH_LINES = [
  'Grand rally reach! Thank you from the studio!',
  'Finish line! Biggest crowd of the season!',
  'Rally done! We call it a wrap here on air!',
  'Grand rally complete — history made today!',
  'End of road, top of the chart — well done!',
  'You don do am! Rally finish, crowd dey sing!',
];

const TOLL_LINES = [
  'Agbero don collect! "Owo ọkọ" — your load pay am!',
  'Area boys at the junction — toll for the road!',
  'Chai! Agbero ask for "something small" — and e no small!',
];

const WEAVE_LINES = [
  'Traffic dey swerve — watch the lane!',
  'Driver don signal — e go cut across!',
  'Somebody no dey look — give am space!',
];

const CLOSE_CALL_LINES = [
  'Chai! Na just inches — clean dodge!',
  'Omo! E nearly happen — steady hand!',
  'Vehicle against traffic — and you escape!',
  'Bumper almost kiss you — steady hand!',
  'Close shave! Road dey sweet and dangerous!',
];

const TOLL_DODGED_LINES = [
  'Agbero wave and miss — clean escape!',
  'You dodge the toll! Smooth like butter!',
  'Area boy left holding air — nice lane work!',
];

const STUBBORN_LINES = [
  'One passenger no wan comot — be patient!',
  '"I never reach my stop!" — passenger dey argue!',
  'Conductor dey beg am to get down — hold the brake!',
];

const BREAKDOWN_LINES = [
  'Ohh! Breakdown on air — convoy stopped!',
  'Engine cut — mechanic dey road, hold on!',
  'We don stop — convoy down, rally on hold!',
  'Flat tyre alert! Supporters, remain calm!',
];

// Zone-flavoured zone-enter lines
const ZONE_ENTER_GENERIC = [
  (lm: string) => `Rolling into ${lm} — eyes open!`,
  (lm: string) => `${lm} zone ahead — load up!`,
  (lm: string) => `Approaching ${lm} — hold for supporters!`,
  (lm: string) => `Zone change! ${lm} on the horizon!`,
];

/** Lines that name a place are only used where the place is true; the rest speak for the whole zone. */
const ZONE_ENTER_BY_ZONE: Record<string, Array<(lm: string) => string>> = {
  SW: [
    (lm) => `South-West convoy dey go ${lm}!`,
    (lm) => `Southwest road open — ${lm} ahead!`,
  ],
  NW: [
    (lm) => `Arewa convoy moving to ${lm}!`,
    (lm) => `North wind blowing to ${lm} — on the road!`,
  ],
  SE: [
    (lm) => `Igbo kwenu! Rolling to ${lm}!`,
    (lm) => `Onward to ${lm} — South-East people ready!`,
  ],
  SS: [
    (lm) => `South-South road to ${lm} — we dey go!`,
    (lm) => `Coast convoy heading for ${lm}!`,
  ],
  NC: [
    (lm) => `Middle Belt moving — ${lm} calling!`,
    (lm) => `Middle Belt road to ${lm}!`,
  ],
  FCT: [
    (lm) => `Capital convoy to ${lm} — protocol observed!`,
    (lm) => `Abuja road clear — ${lm} straight ahead!`,
  ],
  NE: [
    (lm) => `Sahel breeze — convoy reaching ${lm}!`,
    (lm) => `Peace road to ${lm} — move in peace!`,
  ],
};

/** Place-true extras: only Lagos gets the Lagos lines. */
function placeLines(stateName: string | undefined): Array<(lm: string) => string> {
  if (stateName === 'Lagos') return [(lm) => `Eko dey shake — heading to ${lm}!`, (lm) => `Lagos crowd for ${lm} — convoy dey come!`];
  if (stateName) return [(lm) => `${stateName} dey move — ${lm} ahead!`];
  return [];
}

/** Short DJ-style lines for the in-run radio strip. Returns null for unhandled events. */
export function calloutForEvent(
  ev: SimEvent,
  landmarkAhead: string,
  zone = 'SW',
  stateName?: string,
  lang: Lang = getLang(),
): string | null {
  if (lang === 'pcm') return pidginCallout(ev, landmarkAhead, stateName);
  switch (ev.type) {
    case 'gate':
      return pick(GATE_LINES);
    case 'zoneEnter': {
      const lm = landmarkAhead || 'next zone';
      const zonePool = ZONE_ENTER_BY_ZONE[zone] ?? [];
      const pool = [...ZONE_ENTER_GENERIC, ...zonePool, ...placeLines(stateName)];
      return pick(pool)(lm);
    }
    case 'dropoff':
      return pick(DROPOFF_LINES);
    case 'fullHouse':
      return pick(FULL_HOUSE_LINES);
    case 'onBeat':
      return pick(ON_BEAT_LINES);
    case 'finish':
      return pick(FINISH_LINES);
    case 'breakdown':
      return pick(BREAKDOWN_LINES);
    case 'toll':
      return pick(TOLL_LINES);
    case 'tollDodged':
      return pick(TOLL_DODGED_LINES);
    case 'stubborn':
      return pick(STUBBORN_LINES);
    case 'weaveWarn':
      return pick(WEAVE_LINES);
    case 'closeCall':
      return pick(CLOSE_CALL_LINES);
    default:
      return null;
  }
}

/** The Pidgin station: the same events, answered from the Pidgin pools. */
function pidginCallout(ev: SimEvent, landmarkAhead: string, stateName?: string): string | null {
  switch (ev.type) {
    case 'gate':
      return pick(PCM.gate);
    case 'zoneEnter': {
      const lm = landmarkAhead || 'the next zone';
      const place = stateName === 'Lagos' ? PCM.zoneEnterLagos : stateName ? PCM.zoneEnterPlace(stateName) : [];
      return pick([...PCM.zoneEnter, ...place])(lm);
    }
    case 'dropoff':
      return pick(PCM.dropoff);
    case 'fullHouse':
      return pick(PCM.fullHouse);
    case 'onBeat':
      return pick(PCM.onBeat);
    case 'finish':
      return pick(PCM.finish);
    case 'breakdown':
      return pick(PCM.breakdown);
    case 'toll':
      return pick(PCM.toll);
    case 'tollDodged':
      return pick(PCM.tollDodged);
    case 'stubborn':
      return pick(PCM.stubborn);
    case 'weaveWarn':
      return pick(PCM.weave);
    case 'closeCall':
      return pick(PCM.closeCall);
    default:
      return null;
  }
}

export function calloutForLandmark(to: string, zone = 'SW', stateName?: string, lang: Lang = getLang()): string {
  if (lang === 'pcm') {
    if (to === 'Grand Rally') return pick(PCM.finalStretch);
    return `${pick(stateName === 'Lagos' ? PCM.landmarkFlairLagos : PCM.landmarkFlair)} ${to}`;
  }
  if (to === 'Grand Rally') {
    return pick([
      'Final stretch — Grand Rally ahead!',
      'Last kilometre — Grand Rally incoming!',
      'Almost there! Grand Rally calling!',
    ]);
  }
  const zoneFlairs: Record<string, string[]> = {
    SW: stateName === 'Lagos' ? ['Eko people, get ready —', 'Lagos crowd dey wait —'] : ['South-West convoy —', 'Southwest road —'],
    NW: ['Northern convoy coming to', 'Arewa family, we reach'],
    SE: ['Igbo kwenu —', 'South-East rising —'],
    SS: ['South-South convoy —', 'Coast road —'],
    NC: ['Middle Belt power —', 'Middle Belt convoy —'],
    FCT: ['Capital road —', 'Abuja convoy —'],
    NE: ['Sahel wind carry us to', 'North-East convoy —'],
  };
  const flair = pick(zoneFlairs[zone] ?? ['Coming up:']);
  return `${flair} ${to}`;
}

export const CALLOUT_MS = 2400;
export const CALLOUT_COOLDOWN_MS = 1800;
