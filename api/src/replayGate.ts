import { simConfig } from '@cr/content';
import { decodeInputLog, type InputRecord } from '@cr/sim';

/** Ten minutes of ticks: the same ceiling the replay itself stops at. */
const MAX_TICK = simConfig.tickHz * 600;
/** A run is ~3 minutes of input changes; anything past this is not a person playing. */
const MAX_RECORDS = 20_000;

/**
 * The input log as the client sends it (base64 of `encodeInputLog`), checked
 * before anything is simulated. `decodeInputLog` trusts its input — on a
 * truncated varint it walks off the end and returns NaN — so the shape is
 * verified here rather than in the sim, which only ever sees its own logs.
 */
export function decodeReplayLog(b64: string): InputRecord[] | null {
  let bytes: Uint8Array;
  try {
    bytes = new Uint8Array(Buffer.from(b64, 'base64'));
  } catch {
    return null;
  }
  if (bytes.length === 0 || bytes.length > MAX_RECORDS * 3) return null;
  let records: InputRecord[];
  try {
    records = decodeInputLog(bytes);
  } catch {
    return null;
  }
  if (records.length === 0 || records.length > MAX_RECORDS) return null;
  let last = 0;
  for (const r of records) {
    if (!Number.isInteger(r.tick) || !Number.isInteger(r.input)) return null;
    if (r.tick < last || r.tick > MAX_TICK) return null;
    if (r.input < 0 || r.input > 255) return null;
    last = r.tick;
  }
  return records;
}

const WAT_OFFSET_MS = 60 * 60 * 1000;

/**
 * Rally Saturday (Sat 18:00-21:00 WAT) is the one multiplier the server cannot
 * recompute from the log, because it comes from the player's clock. So it is
 * checked against the server's: a claim is believed only if the window was open
 * a moment ago or is open now. The slack covers a run that started just before
 * the window closed and was posted a few minutes later.
 */
export function rallySaturdayPlausible(nowMs: number, slackMs = 15 * 60 * 1000): boolean {
  const open = (t: number) => {
    const d = new Date(t + WAT_OFFSET_MS);
    return d.getUTCDay() === 6 && d.getUTCHours() >= 18 && d.getUTCHours() < 21;
  };
  return open(nowMs) || open(nowMs - slackMs);
}
