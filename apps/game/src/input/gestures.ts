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
}

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

  constructor(private readonly tuning: ControlTuning) {}

  down(id: number, x: number, y: number, now: number): void {
    this.fingers.set(id, { ax: x, ay: y, at: now, x0: x, y0: y, t0: now, moved: false, braking: false, horned: false });
  }

  move(id: number, x: number, y: number, now: number): void {
    const f = this.fingers.get(id);
    if (!f) return;
    if (Math.abs(x - f.x0) > this.tuning.tapMaxMovePx || Math.abs(y - f.y0) > this.tuning.tapMaxMovePx) {
      f.moved = true;
    }
    const dx = x - f.ax;
    const dy = y - f.ay;
    if (Math.abs(dx) < this.tuning.swipeMinPx && Math.abs(dy) < this.tuning.swipeMinPx) return;

    const quick = now - f.at <= this.tuning.swipeMaxMs;
    if (Math.abs(dx) > Math.abs(dy)) {
      // A lane is a deliberate flick. A slow drag across the glass — a thumb
      // drifting while it holds the brake — re-anchors and says nothing.
      if (quick) this.out.push(dx > 0 ? 'right' : 'left');
    } else if (dy < 0) {
      if (quick) this.out.push('hop');
    } else {
      // Down is a hold, not a flick, so speed is not asked for: the thumb that
      // pushes down and stays there is braking for as long as it stays.
      f.braking = true;
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
    if (!f.moved && !f.horned && now - f.t0 <= this.tuning.tapMaxMs) this.out.push('tap');
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
      if (!f.moved && !f.horned && now - f.t0 >= this.tuning.holdHornMs) {
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
