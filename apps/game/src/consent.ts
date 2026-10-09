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
