/** Append-only consent log helpers (device-local until a real account API exists). */

export type ConsentKind = 'terms' | 'privacy' | 'contender-share' | 'withdraw-contender';

export interface ConsentEntry {
  id: string;
  kind: ConsentKind;
  /** Legal / copy version accepted. */
  version: string;
  /** ISO timestamp. */
  at: string;
  accepted: boolean;
}

export function appendConsent(
  log: ConsentEntry[],
  kind: ConsentKind,
  version: string,
  accepted: boolean,
  now = Date.now(),
): ConsentEntry[] {
  const entry: ConsentEntry = {
    id: `${kind}:${now}`,
    kind,
    version,
    at: new Date(now).toISOString(),
    accepted,
  };
  return [...log, entry];
}

/** Latest accepted Contender-share consent wins; withdraw clears it. */
export function contenderShareAllowed(log: ConsentEntry[]): boolean {
  for (let i = log.length - 1; i >= 0; i--) {
    const e = log[i]!;
    if (e.kind === 'withdraw-contender' && e.accepted) return false;
    if (e.kind === 'contender-share') return e.accepted;
  }
  return false;
}

/**
 * What one flip of the Contender-share switch has to do.
 *
 * The device log is the legal record and is always written, signed in or not.
 * The server is told only when there is an account to tell — and telling it is
 * not optional on withdrawal: that call is what erases the Contender ids the
 * server already stored, which is the half of guardrail 10 that works
 * backwards.
 */
export function shareConsentPlan(
  next: boolean,
  signedIn: boolean,
): { local: 'grant' | 'withdraw'; server: boolean | null } {
  return { local: next ? 'grant' : 'withdraw', server: signedIn ? next : null };
}

export function latestAccepted(log: ConsentEntry[], kind: ConsentKind): ConsentEntry | null {
  for (let i = log.length - 1; i >= 0; i--) {
    const e = log[i]!;
    if (e.kind === kind && e.accepted) return e;
  }
  return null;
}

/** Score / sync payload fields. Never includes Contender id without consent. */
export function scoreSubmitFields(input: {
  crowd: number;
  delivered: number;
  stateId: string;
  contenderId: string | null;
  consentLog: ConsentEntry[];
}): { crowd: number; delivered: number; stateId: string; contenderId?: string } {
  const base = { crowd: input.crowd, delivered: input.delivered, stateId: input.stateId };
  if (input.contenderId && contenderShareAllowed(input.consentLog)) {
    return { ...base, contenderId: input.contenderId };
  }
  return base;
}
