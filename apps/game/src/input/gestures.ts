import type { ControlTuning } from '@cr/content';

/**
 * C46: one-shot gestures the glass can report. The brake is deliberately not
 * one of them — it is a level, held for as long as the thumb stays down, so a
 * zone can be loaded by keeping the finger on the screen.
 */
export type Gesture = 'left' | 'right' | 'hop' | 'tap' | 'horn';

interface Finger {
  /** Anchor the next flick is measured from; moves with each flick consumed. */
  ax: number;
  ay: number;
  /** When the anchor was set, so a slow drag can be told from a flick. */
  at: number;
  /** Where the finger first landed, for the tap test. */
  x0: number;
  y0: number;
  t0: number;
  /** Set once the finger has done anything but sit still — kills tap and horn. */
  moved: boolean;
  /** This finger flicked down, so it is holding the brake. */
  braking: boolean;
  /** The horn only sounds once per press. */
  horned: boolean;
  /** Set when the finger first left the landing spot: the flick window starts there, not at touch-down. */
  started: boolean;
  /** Direction of the last lane flick this finger made, so one long swipe is one lane, not two. */
  lane: 'left' | 'right' | null;
  /** Landed on a pad (BEAT / PERK): it can swipe, but a still press is the pad's, not a tap or a horn. */
  pad: boolean;
}

/** A finger that has not left its landing spot by this much (px, before scaling) is still "landing". */
const SLOP_PX = 5;
/** Down is the costly gesture (a sticky brake), so it must be clearly vertical. */
const BRAKE_AXIS_RATIO = 1.5;

/**
 * Pure gesture reader: no DOM, no timers, no state outside this object. The
 * client feeds it pointer positions with a wall-clock timestamp and drains the
 * gestures it recognised. Being pure is the point — the whole control scheme is
 * testable without a browser, which is the only way a thumb-driven game gets a
 * regression test at all.
 */
export class GestureEngine {
  private fingers = new Map<number, Finger>();
  private out: Gesture[] = [];
  /** Brake runs on past the last touch by `brakeGraceMs`; this is the deadline. */
  private brakeUntil = -1;

  /** Pixel thresholds scale with the screen so a thumb flick feels the same on a small phone and a tablet. */
  private scale = 1;

  constructor(private readonly tuning: ControlTuning) {}

  /** Tell the engine how big the glass is (CSS px). 390 px wide is the reference phone. */
  setViewport(w: number, h: number): void {
    const vmin = Math.min(w, h);
    this.scale = vmin > 0 ? Math.max(0.85, Math.min(1.4, vmin / 390)) : 1;
  }

  down(id: number, x: number, y: number, now: number, pad = false): void {
    this.fingers.set(id, { ax: x, ay: y, at: now, x0: x, y0: y, t0: now, moved: false, braking: false, horned: false, started: false, lane: null, pad });
  }

  move(id: number, x: number, y: number, now: number): void {
    const f = this.fingers.get(id);
    if (!f) return;
    const tapMove = this.tuning.tapMaxMovePx * this.scale;
    if (Math.abs(x - f.x0) > tapMove || Math.abs(y - f.y0) > tapMove) {
      f.moved = true;
    }
    // The flick clock starts when the thumb actually starts moving, so pressing
    // and thinking before a swipe does not make the swipe "too slow".
    if (!f.started) {
      if (Math.abs(x - f.ax) > SLOP_PX * this.scale || Math.abs(y - f.ay) > SLOP_PX * this.scale) {
        f.started = true;
        f.at = now;
      }
    }
    const min = this.tuning.swipeMinPx * this.scale;
    const dx = x - f.ax;
    const dy = y - f.ay;
    if (Math.abs(dx) < min && Math.abs(dy) < min) return;

    const quick = now - f.at <= this.tuning.swipeMaxMs;
    const ax = Math.abs(dx);
    const ay = Math.abs(dy);
    if (ax >= min && (ax > ay || (dy > 0 && ay < ax * BRAKE_AXIS_RATIO))) {
      // A lane is a deliberate flick. A slow drag across the glass — a thumb
      // drifting while it holds the brake — re-anchors and says nothing.
      const dir = dx > 0 ? 'right' : 'left';
      // Same direction again without lifting is the same swipe running on, not a second lane.
      if (quick && f.lane !== dir) {
        this.out.push(dir);
        f.lane = dir;
      }
    } else if (dy < 0) {
      if (quick) this.out.push('hop');
      f.lane = null;
    } else if (ay > ax * BRAKE_AXIS_RATIO) {
      // Down is a hold, not a flick, so speed is not asked for: the thumb that
      // pushes down and stays there is braking for as long as it stays.
      f.braking = true;
      f.lane = null;
    }
    f.ax = x;
    f.ay = y;
    f.at = now;
  }

  up(id: number, now: number): void {
    const f = this.fingers.get(id);
    if (!f) return;
    this.fingers.delete(id);
    if (f.braking) this.brakeUntil = now + this.tuning.brakeGraceMs;
    if (!f.pad && !f.moved && !f.horned && now - f.t0 <= this.tuning.tapMaxMs) this.out.push('tap');
  }

  cancel(id: number, now: number): void {
    const f = this.fingers.get(id);
    if (!f) return;
    this.fingers.delete(id);
    if (f.braking) this.brakeUntil = now + this.tuning.brakeGraceMs;
  }

  /** Called every frame: a finger that has sat still long enough blows the horn. */
  poll(now: number): void {
    for (const f of this.fingers.values()) {
      if (!f.pad && !f.moved && !f.horned && now - f.t0 >= this.tuning.holdHornMs) {
        f.horned = true;
        this.out.push('horn');
      }
    }
  }

  isBraking(now: number): boolean {
    for (const f of this.fingers.values()) if (f.braking) return true;
    return now < this.brakeUntil;
  }

  /** Hand over everything recognised since the last call. */
  drain(): Gesture[] {
    if (this.out.length === 0) return [];
    const out = this.out;
    this.out = [];
    return out;
  }

  reset(): void {
    this.fingers.clear();
    this.out = [];
    this.brakeUntil = -1;
  }
}
