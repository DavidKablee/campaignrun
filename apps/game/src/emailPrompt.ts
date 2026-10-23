import { limits } from '@cr/content';

/**
 * Whether to ask a name-only player for an email yet (C42).
 *
 * Two conditions, and both matter. The player must have something to lose —
 * asking before the first run is asking a stranger for an address, and the
 * answer is no. And the server's snooze must have run out, so "not now" means
 * something; the ladder that sets it lives in `api/src/emailPrompt.ts`.
 *
 * Pure, and the only place the decision is made: the summary screen and the
 * account screen both read it, and a prompt that appeared on one but not the
 * other would look like a bug in whichever the player saw second.
 */
export function emailPromptDue(args: {
  /** Null on a name-only account. */
  email: string | null;
  /** Runs the server has stored for this account. */
  runs: number;
  /** ISO timestamp from the server, or null for "any time". */
  promptAfter: string | null;
  now?: number;
}): boolean {
  if (args.email) return false;
  if (args.runs < limits.auth.emailPromptAfterRuns) return false;
  if (!args.promptAfter) return true;
  const until = Date.parse(args.promptAfter);
  // An unparseable date is treated as no snooze rather than as forever: the
  // failure that loses a campaign is the one where the ask never comes back.
  return Number.isNaN(until) || (args.now ?? Date.now()) >= until;
}

/** Total runs the server has stored, which is what the prompt waits on. */
export function runsFromBest(best: Record<string, { runs: number }>): number {
  return Object.values(best).reduce((n, b) => n + b.runs, 0);
}
