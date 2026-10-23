import { metaConfig, type UpgradeId } from '@cr/content';

export type StartId = 'funded' | 'grassroots';
export type UpgradeLevels = Record<UpgradeId, number>;

/**
 * C48: `runModifiers`, `runPayout` and `followingGain` moved into
 * `@cr/content`, because the shop has to print the same numbers the run
 * applies and it could not reach them here. Re-exported so every existing
 * caller keeps its import.
 */
export { runModifiers, runPayout, followingGain } from '@cr/content';
export type MissionProgress = Record<string, number>;

export const emptyUpgrades = (): UpgradeLevels => ({ magnet: 0, shield: 0, horn: 0, loading: 0, value: 0 });

export function watDay(now = Date.now()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Lagos', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(now));
}
export function watWeek(now = Date.now()): string {
  const day = watDay(now);
  const utc = new Date(`${day}T12:00:00Z`);
  const thursday = new Date(utc);
  thursday.setUTCDate(utc.getUTCDate() + 3 - ((utc.getUTCDay() + 6) % 7));
  const first = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((thursday.getTime() - first.getTime()) / 86400000 - 3 + ((first.getUTCDay() + 6) % 7)) / 7);
  return `${thursday.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}
export function upgradeCost(id: UpgradeId, level: number): number | null {
  return metaConfig.upgrades.find((u) => u.id === id)?.costs[level] ?? null;
}
export function missionDelta(progress: MissionProgress, completed: string[], delivered: number, crowd: number, finished: boolean) {
  if (!finished) return { progress, completed };
  const next = { ...progress };
  const done = [...completed];
  for (const mission of metaConfig.missions.daily) {
    const add = mission.id === 'run' ? 1 : mission.id === 'deliver' ? delivered : crowd;
    next[mission.id] = (next[mission.id] ?? 0) + add;
    if ((next[mission.id] ?? 0) >= mission.target && !done.includes(mission.id)) done.push(mission.id);
  }
  next['weekly-runs'] = (next['weekly-runs'] ?? 0) + 1;
  if (next['weekly-runs'] >= metaConfig.missions.weekly.target && !done.includes('weekly-runs')) done.push('weekly-runs');
  return { progress: next, completed: done };
}
