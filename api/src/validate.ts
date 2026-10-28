import { z } from 'zod';
import { activeContenders, limits, maxUpgradeLevel, rides, stateIndex } from '@cr/content';

const stateIds = stateIndex.map((s) => s.id);
const rideIds = rides.map((r) => r.id);
const contenderIds = activeContenders.map((c) => c.id);

/**
 * One rule wherever a password is set — signup, reset and change — with the
 * minimum in content so the client can state it without keeping its own copy.
 * Length only, no composition rules: length beats symbol soup.
 */
const password = z.string().min(limits.auth.minPasswordLength).max(200);

/**
 * The board name. One definition, because since C42 it arrives on two routes —
 * a full signup and a name-only account — and the boards show the same column
 * whichever one made it.
 */
const username = z
  .string()
  .trim()
  .min(3)
  .max(16)
  .regex(/^[A-Za-z0-9_]+$/, 'letters, numbers and underscore only');

const email = z.string().trim().toLowerCase().email().max(254);

/** Deliberately strict: the client is not trusted, and an unknown id is a bug or an attack. */
export const signupSchema = z.object({ email, password, username });

export const loginSchema = z.object({
  email,
  password: z.string().min(1).max(200),
});

const level = z.number().int().min(0).max(maxUpgradeLevel);

/**
 * The run itself, so the server can play it again (C12). The course is a pure
 * function of the seed, so seed + inputs + the convoy the player drove is the
 * whole run. The Contender is deliberately not here: it is only ever sent as
 * `contenderId`, with consent (guardrail 10), and otherwise the server tries
 * every Contender and learns nothing it was not told.
 */
export const replaySchema = z.object({
  seed: z.number().int().min(0).max(0xffffffff),
  /** base64 of `encodeInputLog` — a few hundred bytes to a few KB. */
  log: z
    .string()
    .min(1)
    .max(60_000)
    .regex(/^[A-Za-z0-9+/]*={0,2}$/),
  upgrades: z.object({ magnet: level, shield: level, horn: level, loading: level, value: level }),
  rallySaturday: z.boolean(),
});

export const scoreSchema = z.object({
  stateId: z.enum(stateIds as [string, ...string[]]),
  crowd: z.number().int().min(0).max(100_000),
  delivered: z.number().int().min(0).max(10_000).default(0),
  dents: z.number().int().min(0).max(100).default(0),
  integrity: z.number().int().min(-1000).max(1000).default(0),
  capacity: z.number().int().min(0).max(10_000).default(0),
  rideId: z.enum(rideIds as [string, ...string[]]),
  /**
   * Guardrail 10: a Contender choice is sensitive and only travels with
   * consent. The client omits it otherwise, and the server stores null — it is
   * never inferred from anything else on the request.
   */
  contenderId: z.enum(contenderIds as [string, ...string[]]).nullish(),
  replay: replaySchema.optional(),
});

export const consentSchema = z.object({
  shareContender: z.boolean(),
  legalVersion: z.string().min(1).max(40),
});

export type ScorePayload = z.infer<typeof scoreSchema>;

// -- C41 --------------------------------------------------------------------

export const verifySchema = z.object({ token: z.string().min(10).max(200) });

export const forgotSchema = z.object({ email });

export const resetSchema = z.object({
  token: z.string().min(10).max(200),
  password,
});

export const passwordChangeSchema = z.object({
  current: z.string().min(1).max(200),
  next: password,
});

// -- C42 --------------------------------------------------------------------

/** A name-only account: a board name and nothing else. */
export const guestSchema = z.object({ username });

/**
 * The device key is opaque to the server beyond its shape. Bounded so a
 * multi-megabyte body never reaches the hash.
 */
export const deviceSchema = z.object({ deviceKey: z.string().min(20).max(200) });

/**
 * Putting an address on a name-only account. The password is required in the
 * same request: an address with no password is still not something a second
 * device can sign in with, which is the only reason the player is being asked.
 */
export const attachEmailSchema = z.object({ email, password });
