import { stateIndex } from '@cr/content';

/**
 * The weekly "busiest roads" tally, as the board shows it.
 *
 * It is a count of finished rallies per state over the last week, nothing more: no party, no
 * percentage, no winner (guardrail 2). The server hides it until the whole game has enough rallies
 * for a count to mean something, and this module refuses anything that does not look like that
 * answer, so a misbehaving or older server shows nothing rather than something odd.
 */
export interface TallyRow {
  stateId: string;
  name: string;
  rallies: number;
}

export interface Tally {
  windowDays: number;
  total: number;
  rows: TallyRow[];
}

export function parseTally(raw: unknown): Tally | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as { hidden?: unknown; windowDays?: unknown; total?: unknown; busiest?: unknown };
  if (r.hidden !== false || !Array.isArray(r.busiest)) return null;
  if (typeof r.windowDays !== 'number' || typeof r.total !== 'number') return null;
  const rows: TallyRow[] = [];
  for (const b of r.busiest) {
    const row = b as { stateId?: unknown; rallies?: unknown };
    const state = stateIndex.find((s) => s.id === row.stateId);
    if (!state || typeof row.rallies !== 'number' || !Number.isFinite(row.rallies) || row.rallies < 0) continue;
    rows.push({ stateId: state.id, name: state.name, rallies: Math.floor(row.rallies) });
  }
  return rows.length ? { windowDays: r.windowDays, total: Math.floor(r.total), rows } : null;
}
