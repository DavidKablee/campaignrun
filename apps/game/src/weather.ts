/**
 * C30: "Nigerian rhythm" — time-of-day lighting, NEPA night outages, harmattan haze,
 * rainy-season tint, and the Rally Saturday Crowd window (spec section 6.8).
 * Pure functions only: the caller reads the real clock once at run start and passes the
 * result in — nothing here, and nothing in packages/sim, ever calls Date itself mid-run.
 */

export type Zone = 'SW' | 'SE' | 'SS' | 'NW' | 'NE' | 'NC' | 'FCT';

export interface WeatherContext {
  /** 0 = midnight, 0.5 = noon, 1 = next midnight — smooth position in the WAT day. */
  dayPhase: number;
  isNight: boolean;
  /** A dark-roads, phone-torch-cone outage. Only possible at night; rolled once per run from its seed, not from a live clock — same outage all run. */
  isNepaOut: boolean;
  /** Dec-Jan in the north (NW/NE/NC) — denser, dustier haze. */
  isHarmattan: boolean;
  /** Apr-Oct in the south (SW/SE/SS) — wetter, cooler tint. */
  isRainySeason: boolean;
  /** Spec: "x2 Crowd, 6-9pm WAT" on Saturdays. */
  isRallySaturday: boolean;
}

const WAT_OFFSET_MS = 60 * 60 * 1000; // UTC+1, no DST

function watParts(nowMs: number) {
  const d = new Date(nowMs + WAT_OFFSET_MS);
  return { hour: d.getUTCHours(), minute: d.getUTCMinutes(), weekday: d.getUTCDay(), month: d.getUTCMonth() };
}

const NORTH_ZONES: readonly Zone[] = ['NW', 'NE', 'NC'];
const SOUTH_ZONES: readonly Zone[] = ['SW', 'SE', 'SS'];

/**
 * @param nowMs real clock, ms since epoch (pass Date.now() at the call site)
 * @param zone the state's zone, for harmattan/rainy-season eligibility
 * @param runSeed the run's own seed — makes the NEPA roll deterministic per run, not a flat
 *   `Math.random()` call scattered through renderer code
 */
export function computeWeather(nowMs: number, zone: Zone, runSeed: number): WeatherContext {
  const { hour, minute, weekday, month } = watParts(nowMs);
  const dayPhase = (hour + minute / 60) / 24;
  const isNight = hour < 6 || hour >= 19;
  const isNepaOut = isNight && runSeed % 100 < 35;
  const isHarmattan = (month === 11 || month === 0) && NORTH_ZONES.includes(zone);
  const isRainySeason = month >= 3 && month <= 9 && SOUTH_ZONES.includes(zone);
  const isRallySaturday = weekday === 6 && hour >= 18 && hour < 21;
  return { dayPhase, isNight, isNepaOut, isHarmattan, isRainySeason, isRallySaturday };
}
