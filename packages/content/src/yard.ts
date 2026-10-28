import metaJson from '../data/meta.json';
import simJson from '../data/sim.json';
import { metaConfigSchema, simConfigSchema, type MetaConfig, type UpgradeId } from './schemas';

/* Parsed here rather than imported from the barrel: this module runs at import
   time (maxUpgradeLevel below), and reaching back through './index' would make
   the two files circular — whichever evaluated second would see undefined. */
const metaConfig: MetaConfig = metaConfigSchema.parse(metaJson);
const tickHz = simConfigSchema.parse(simJson).tickHz;

type Upgrade = MetaConfig['upgrades'][number];
export type UpgradeLevels = Record<UpgradeId, number>;

/** Levels an upgrade can reach, from content rather than a literal in the shop. */
export const maxUpgradeLevel = metaConfig.maxLevel;

/**
 * C48: the one place that turns a level into the number the run uses.
 *
 * This existed in three places before — `meta.json` held the step, the client's
 * `runModifiers()` re-typed it as a literal, and the store re-typed the payout
 * step a third time. The Convoy Yard could not say what a level bought without
 * adding a fourth copy, which is the whole reason it said nothing.
 */
export function upgradeValue(upgrade: Upgrade, level: number): number {
  const lv = Math.max(0, Math.min(maxUpgradeLevel, level));
  const e = upgrade.effect;
  if (e.kind === 'ticks-down') return Math.max(e.floor, e.base - lv * upgrade.step);
  return e.base + lv * upgrade.step;
}

/** The five run modifiers, derived from the same numbers the shop prints. */
export function runModifiers(levels: UpgradeLevels) {
  const out = {} as Record<Upgrade['effect']['stat'], number>;
  for (const upgrade of metaConfig.upgrades) {
    out[upgrade.effect.stat] = upgradeValue(upgrade, levels[upgrade.id] ?? 0);
  }
  return out;
}

/**
 * The rally streak's lift on the next payout, permille. It reads the streak the
 * player walks in with, steps up with each rally in a row and stops at a cap —
 * a thank-you for coming back, not a reason to grind. It touches Funds only,
 * never Turnout, so no board is ever affected by how long someone has played.
 */
export function streakBonusPermille(streak: number): number {
  const r = metaConfig.rewards;
  return Math.min(Math.max(0, streak), r.streakBonusMaxSteps) * r.streakBonusPermillePerStep;
}

/**
 * ₦ for a rally, before mission payouts. `baseShare` is the part of the
 * finishing pay a short run earns (1000 = all of it), so a quick rally cannot
 * out-earn the full road by being repeated.
 */
export function runPayout(
  delivered: number,
  levels: UpgradeLevels,
  opts: { streak?: number; baseSharePermille?: number } = {},
): number {
  const r = metaConfig.rewards;
  const base = Math.floor((r.baseRun * (opts.baseSharePermille ?? 1000)) / 1000) + Math.max(0, delivered) * r.perDelivered;
  const boosted = Math.floor((base * runModifiers(levels).rewardPermille) / 1000);
  return Math.floor((boosted * (1000 + streakBonusPermille(opts.streak ?? 0))) / 1000);
}

/** Following for a finished rally. Delivering supporters is the only source. */
export function followingGain(delivered: number): number {
  return Math.max(0, delivered) * metaConfig.rewards.followingPerDelivered;
}

function seconds(ticks: number): string {
  return `${(ticks / tickHz).toFixed(1)}s`;
}

/**
 * One level's value as the shop prints it. Every unit is the player's, not the
 * sim's: millimetres become metres, ticks become seconds, permille becomes a
 * percentage above the un-upgraded number.
 */
export function formatUpgradeValue(upgrade: Upgrade, level: number): string {
  const v = upgradeValue(upgrade, level);
  switch (upgrade.effect.kind) {
    case 'mm-up':
      return `+${(v / 1000).toFixed(2).replace(/\.?0+$/, '')}m`;
    case 'ticks-up':
      return `+${seconds(v)}`;
    case 'ticks-down':
      return seconds(v);
    case 'permille-up':
      return `+${Math.round((v - 1000) / 10)}%`;
  }
}

export interface UpgradeReadout {
  /** What the stat is called in the shop. */
  label: string;
  /** Its value at the level the player owns now. */
  now: string;
  /** Its value one level up, or null at max. */
  next: string | null;
  level: number;
  maxLevel: number;
  /** ₦ for the next level, or null at max. */
  cost: number | null;
  /** True when the next level would be stopped by the effect's own floor. */
  atFloor: boolean;
}

export function upgradeReadout(upgrade: Upgrade, level: number): UpgradeReadout {
  const capped = Math.max(0, Math.min(maxUpgradeLevel, level));
  const maxed = capped >= maxUpgradeLevel;
  return {
    label: upgrade.effect.label,
    now: formatUpgradeValue(upgrade, capped),
    next: maxed ? null : formatUpgradeValue(upgrade, capped + 1),
    level: capped,
    maxLevel: maxUpgradeLevel,
    cost: maxed ? null : (upgrade.costs[capped] ?? null),
    atFloor: !maxed && upgradeValue(upgrade, capped) === upgradeValue(upgrade, capped + 1),
  };
}

/** The next ride Following will open, and how far off it is. */
export function nextRideGate(following: number, rides: readonly { id: string; name: string; playable: boolean; followingGate: number }[]) {
  const next = rides.filter((r) => r.playable && r.followingGate > following).sort((a, b) => a.followingGate - b.followingGate)[0];
  if (!next) return null;
  const short = next.followingGate - following;
  return {
    name: next.name,
    gate: next.followingGate,
    short,
    /** Supporters still to deliver, which is the only way Following moves. */
    supporters: Math.ceil(short / Math.max(1, metaConfig.rewards.followingPerDelivered)),
  };
}
