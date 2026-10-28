import { limits } from '@cr/content';

/**
 * Abuse limits, resolved once at boot.
 *
 * The numbers live in `packages/content/data/limits.json` because the client
 * quotes them back to the player ("try again in 15 minutes", "this link lasts
 * an hour"), and two copies of a number the player is told drift apart. Each
 * has an env override so a local demo or a load test can loosen it without
 * editing content.
 */
const num = (env: string | undefined, fallback: number) => {
  const n = Number(env);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

export const LIMITS = {
  signupPerDayPerIp: num(process.env.CR_SIGNUP_PER_DAY, limits.auth.signupPerDayPerIp),
  loginPerMinutePerIp: num(process.env.CR_LOGIN_PER_MIN, limits.auth.loginPerMinutePerIp),
  loginFailuresBeforeLockout: num(process.env.CR_LOGIN_FAILURES, limits.auth.loginFailuresBeforeLockout),
  lockoutMinutes: num(process.env.CR_LOCKOUT_MINUTES, limits.auth.lockoutMinutes),
  forgotPerHourPerIp: num(process.env.CR_FORGOT_PER_HOUR, limits.auth.forgotPerHourPerIp),
  verifyTokenHours: num(process.env.CR_VERIFY_TOKEN_HOURS, limits.auth.verifyTokenHours),
  resetTokenMinutes: num(process.env.CR_RESET_TOKEN_MINUTES, limits.auth.resetTokenMinutes),
  minPasswordLength: num(process.env.CR_MIN_PASSWORD, limits.auth.minPasswordLength),
  guestPerDayPerIp: num(process.env.CR_GUEST_PER_DAY, limits.auth.guestPerDayPerIp),
  devicePerMinutePerIp: num(process.env.CR_DEVICE_PER_MIN, limits.auth.devicePerMinutePerIp),
  scoresPerMinutePerUser: num(process.env.CR_SCORES_PER_MIN, limits.scores.perMinutePerUser),
  boardMaxRows: num(process.env.CR_BOARD_MAX_ROWS, limits.board.maxRows),
  eventsPerMinutePerIp: num(process.env.CR_EVENTS_PER_MIN, limits.events.perMinutePerIp),
  eventsMaxPerRequest: limits.events.maxPerRequest,
  feedbackPerDayPerIp: num(process.env.CR_FEEDBACK_PER_DAY, limits.feedback.perDayPerIp),
  feedbackNoteMaxChars: limits.feedback.noteMaxChars,
} as const;

/**
 * Public boards and the live standings only count players who confirmed their
 * address. Without it, the privacy floor in `standings.ts` is a formality: 200
 * accounts is an afternoon's scripting, and clearing the floor is what unlocks
 * a region's Contender breakdown. Set false only for a local demo.
 */
export const REQUIRE_VERIFIED_FOR_BOARDS = process.env.CR_REQUIRE_VERIFIED !== 'false';
