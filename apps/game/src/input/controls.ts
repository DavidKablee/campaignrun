import { Btn } from '@cr/sim';
import { controlTuning } from '@cr/content';
import { GestureEngine, type Gesture } from './gestures';

const ONE_SHOT: Record<Gesture, number> = {
  left: Btn.Left,
  right: Btn.Right,
  hop: Btn.Up,
  horn: Btn.Horn,
  // One tap is one beat tap. The venue wants `bonuses.onBeatTaps` of them
  // inside its window, which is 2 — so a double tap is what earns the bonus,
  // and the sim is still counting real taps rather than crediting a gesture
  // with taps the player never made. Outside the window the sim ignores Tap
  // entirely, so a stray tap on the glass costs nothing.
  tap: Btn.Tap,
};

/**
 * Translates a thumb (or a keyboard) into the sim's input bits.
 *
 * C46: the row of pads is gone. Lanes, hop, brake, horn and the beat are all
 * gestures now, and the convoy drives itself, so the brake is the only thing
 * the player does to the speed. Two pads are left on screen — the beat and the
 * Contender's perk — because both are timed against something the player has
 * to be able to see.
 *
 * The sim is edge-triggered: a one-shot bit only counts on the tick it rises.
 * So one-shots queue here and leave a blank tick behind them, which is also
 * the fix for two flicks landing inside the same frame — the old code ORed
 * them together and the second one was eaten.
 */
function hapticFor(g: Gesture): number {
  const h = controlTuning.haptics;
  if (g === 'hop') return h.hopMs;
  if (g === 'horn') return h.hornMs;
  if (g === 'tap') return h.beatMs;
  return h.laneMs;
}

export class InputController {
  /** Held bits from the keyboard only (brake, horn, manual gas). */
  private levelBits = 0;
  private queue: number[] = [];
  /** True on the tick after a one-shot, so the next rise is a real rise. */
  private spacer = false;
  private haptics = true;
  private el: HTMLElement | null = null;
  private readonly engine = new GestureEngine(controlTuning);

  attach(el: HTMLElement) {
    this.el = el;
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
    el.addEventListener('pointerdown', this.onPointerDown);
    el.addEventListener('pointermove', this.onPointerMove);
    el.addEventListener('pointerup', this.onPointerUp);
    el.addEventListener('pointercancel', this.onPointerCancel);
    // A long press is the horn now, so the platform's own long-press menu has
    // to stay out of the way.
    el.addEventListener('contextmenu', this.onContextMenu);
  }

  detach() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
    if (this.el) {
      this.el.removeEventListener('pointerdown', this.onPointerDown);
      this.el.removeEventListener('pointermove', this.onPointerMove);
      this.el.removeEventListener('pointerup', this.onPointerUp);
      this.el.removeEventListener('pointercancel', this.onPointerCancel);
      this.el.removeEventListener('contextmenu', this.onContextMenu);
    }
    this.engine.reset();
  }

  /**
   * Drop everything in flight: fingers, queued one-shots, held keys. The tutorial and the
   * pause card sit over the glass, so what is pressed behind them must not replay on resume.
   */
  reset() {
    this.engine.reset();
    this.queue = [];
    this.spacer = false;
    this.levelBits = 0;
  }

  /** Respects the player's haptics setting — the old swipe buzz ignored it. */
  setHaptics(on: boolean) {
    this.haptics = on;
  }

  /** One tap of the on-screen BEAT pad; two inside the window call the beat. */
  tap() {
    this.queue.push(Btn.Tap);
    this.buzz(controlTuning.haptics.beatMs);
  }

  pulsePerk() {
    this.queue.push(Btn.Perk);
  }

  isBraking(now = performance.now()): boolean {
    return (this.levelBits & Btn.Brake) !== 0 || this.engine.isBraking(now);
  }

  /** Consume one tick of input. */
  sample(now = performance.now()): number {
    this.engine.poll(now);
    for (const g of this.engine.drain()) {
      this.queue.push(ONE_SHOT[g]);
      this.buzz(hapticFor(g));
    }

    let out = this.levelBits;
    if (this.spacer) {
      this.spacer = false;
    } else {
      const bit = this.queue.shift();
      if (bit !== undefined) {
        out |= bit;
        this.spacer = true;
      }
    }

    if (this.engine.isBraking(now)) out |= Btn.Brake;
    // Gas loses to the brake in the sim, so auto-gas has to stand down while
    // the player is braking or the brake would do nothing at all.
    if (controlTuning.autoGas && (out & Btn.Brake) === 0) out |= Btn.Gas;
    return out;
  }

  private buzz(ms: number) {
    if (this.haptics && ms > 0 && navigator.vibrate) navigator.vibrate(ms);
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.repeat) return;
    this.key(true, e.key);
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.key(false, e.key);
  };

  /**
   * Desktop keeps the full keyboard — the gestures are the phone's half of the
   * same input, not a replacement for it. Public for the same reason the
   * pointer entry points are.
   */
  key(down: boolean, k: string) {
    if (down) {
      if (k === 'ArrowLeft' || k === 'a') this.queue.push(Btn.Left);
      if (k === 'ArrowRight' || k === 'd') this.queue.push(Btn.Right);
      if (k === ' ' || k === 'w') this.queue.push(Btn.Up);
      if (k === 'j') this.queue.push(Btn.Tap);
      if (k === 'k') this.queue.push(Btn.Perk);
      if (k === 'ArrowUp') this.levelBits |= Btn.Gas;
      if (k === 'ArrowDown' || k === 's') this.levelBits |= Btn.Brake;
      if (k === 'h') this.levelBits |= Btn.Horn;
      return;
    }
    if (k === 'ArrowUp') this.levelBits &= ~Btn.Gas;
    if (k === 'ArrowDown' || k === 's') this.levelBits &= ~Btn.Brake;
    if (k === 'h') this.levelBits &= ~Btn.Horn;
  }

  /** Tabbing away must not leave the brake or the horn stuck on. */
  private onBlur = () => {
    this.levelBits = 0;
    this.engine.reset();
  };

  private onContextMenu = (e: Event) => {
    e.preventDefault();
  };

  /** 'ignore' for ordinary buttons; 'pad' for BEAT / PERK, which a swipe may start on; null for the glass. */
  private touchTarget(target: EventTarget | null): 'ignore' | 'pad' | null {
    const el = target as HTMLElement | null;
    if (el?.closest?.('[data-control]')) return 'pad';
    return el?.closest?.('button, a, input') ? 'ignore' : null;
  }

  private onPointerDown = (e: PointerEvent) => {
    const hit = this.touchTarget(e.target);
    if (hit === 'ignore') return;
    if (this.el) this.engine.setViewport(this.el.clientWidth, this.el.clientHeight);
    // A swipe that starts under the right thumb on a pad still counts. No capture there: the pad
    // keeps its own pointer stream, and the move/up events bubble up to us either way.
    this.down(e.pointerId, e.clientX, e.clientY, e.timeStamp, hit === 'pad');
    if (hit === null) this.el?.setPointerCapture(e.pointerId);
  };

  private onPointerMove = (e: PointerEvent) => {
    this.move(e.pointerId, e.clientX, e.clientY, e.timeStamp);
  };

  private onPointerUp = (e: PointerEvent) => {
    this.up(e.pointerId, e.timeStamp);
  };

  private onPointerCancel = (e: PointerEvent) => {
    this.cancel(e.pointerId, e.timeStamp);
  };

  // The four below are what the pointer handlers call. They are public so the
  // whole chain — glass to input bits — can be driven by a test without a DOM.
  down(id: number, x: number, y: number, now: number, pad = false) {
    this.engine.down(id, x, y, now, pad);
  }

  move(id: number, x: number, y: number, now: number) {
    const wasBraking = this.engine.isBraking(now);
    this.engine.move(id, x, y, now);
    if (!wasBraking && this.engine.isBraking(now)) this.buzz(controlTuning.haptics.brakeMs);
  }

  up(id: number, now: number) {
    this.engine.up(id, now);
  }

  cancel(id: number, now: number) {
    this.engine.cancel(id, now);
  }
}
