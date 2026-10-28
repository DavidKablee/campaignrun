import { describe, expect, it } from 'vitest';
import { Btn, initState, seedRng, step } from '@cr/sim';
import { controlTuning, simConfig } from '@cr/content';
import { GestureEngine } from '../src/input/gestures';
import { InputController } from '../src/input/controls';

const T = controlTuning;

/** A flick: land, move far enough, fast enough, lift. */
function flick(e: GestureEngine, dx: number, dy: number, t = 1000) {
  e.down(1, 200, 400, t);
  e.move(1, 200 + dx, 400 + dy, t + 60);
  e.up(1, t + 70);
}

describe('C46: the road is driven with a thumb', () => {
  it('reads a sideways flick as a lane change', () => {
    const left = new GestureEngine(T);
    flick(left, -(T.swipeMinPx + 10), 0);
    expect(left.drain()).toEqual(['left']);

    const right = new GestureEngine(T);
    flick(right, T.swipeMinPx + 10, 0);
    expect(right.drain()).toEqual(['right']);
  });

  it('reads a flick up as a hop', () => {
    const e = new GestureEngine(T);
    flick(e, 0, -(T.swipeMinPx + 10));
    expect(e.drain()).toEqual(['hop']);
  });

  it('brakes on a flick down and holds while the thumb stays on the glass', () => {
    const e = new GestureEngine(T);
    e.down(1, 200, 400, 1000);
    expect(e.isBraking(1000)).toBe(false);
    e.move(1, 200, 400 + T.swipeMinPx + 10, 1040);
    expect(e.isBraking(1040)).toBe(true);
    // A zone needs a full second of braking; the thumb sitting there is enough.
    expect(e.isBraking(3000)).toBe(true);
    // Down is a hold, not a one-shot — it must not also fire a hop or a lane.
    expect(e.drain()).toEqual([]);
  });

  it('lets the brake run on briefly after the thumb lifts, then drops it', () => {
    const e = new GestureEngine(T);
    e.down(1, 200, 400, 1000);
    e.move(1, 200, 400 + T.swipeMinPx + 10, 1040);
    e.up(1, 1050);
    expect(e.isBraking(1050 + T.brakeGraceMs - 1)).toBe(true);
    expect(e.isBraking(1050 + T.brakeGraceMs)).toBe(false);
  });

  it('says nothing about a slow drag, so a braking thumb cannot drift into a lane', () => {
    const e = new GestureEngine(T);
    e.down(1, 200, 400, 1000);
    // A real drag reports a stream of small moves; this one crawls well past the flick window.
    for (let i = 1; i <= 20; i++) e.move(1, 200 + i * 3, 400, 1000 + i * 50);
    expect(e.drain()).toEqual([]);
  });

  it('counts the flick from when the thumb starts moving, not from touch-down', () => {
    const e = new GestureEngine(T);
    e.down(1, 200, 400, 1000);
    // Press, hold still for a beat, then flick.
    e.move(1, 200 + T.swipeMinPx + 10, 400, 1000 + T.swipeMaxMs + 300);
    expect(e.drain()).toEqual(['right']);
  });

  it('treats one long swipe as one lane, and a reversal as the next', () => {
    const e = new GestureEngine(T);
    e.down(1, 200, 400, 1000);
    e.move(1, 200 + T.swipeMinPx + 10, 400, 1030);
    e.move(1, 200 + 2 * (T.swipeMinPx + 10), 400, 1060);
    expect(e.drain()).toEqual(['right']);
    e.move(1, 200 + (T.swipeMinPx + 10), 400, 1090);
    expect(e.drain()).toEqual(['left']);
  });

  it('does not brake on a diagonal that is mostly sideways', () => {
    const e = new GestureEngine(T);
    e.down(1, 200, 400, 1000);
    e.move(1, 200 + T.swipeMinPx + 6, 400 + T.swipeMinPx, 1040);
    expect(e.drain()).toEqual(['right']);
    expect(e.isBraking(1040)).toBe(false);
  });

  it('scales its thresholds with the screen', () => {
    const e = new GestureEngine(T);
    e.setViewport(780, 1560); // twice the reference width -> clamped scale 1.4
    e.down(1, 200, 400, 1000);
    e.move(1, 200 + T.swipeMinPx + 10, 400, 1040);
    expect(e.drain()).toEqual([]);
    e.move(1, 200 + T.swipeMinPx * 1.4 + 12, 400, 1080);
    expect(e.drain()).toEqual(['right']);
  });

  it('still changes lane while the brake is held', () => {
    const e = new GestureEngine(T);
    e.down(1, 200, 400, 1000);
    e.move(1, 200, 400 + T.swipeMinPx + 10, 1040);
    e.move(1, 200 + T.swipeMinPx + 10, 400 + T.swipeMinPx + 10, 1080);
    expect(e.drain()).toEqual(['right']);
    expect(e.isBraking(1080)).toBe(true);
  });

  it('counts a quick press as a tap and a long press as the horn', () => {
    const tap = new GestureEngine(T);
    tap.down(1, 200, 400, 1000);
    tap.poll(1000 + T.tapMaxMs - 10);
    tap.up(1, 1000 + T.tapMaxMs - 10);
    expect(tap.drain()).toEqual(['tap']);

    const hold = new GestureEngine(T);
    hold.down(1, 200, 400, 1000);
    hold.poll(1000 + T.holdHornMs);
    // Holding longer must not sound it twice, and lifting is not also a tap.
    hold.poll(1000 + T.holdHornMs * 3);
    hold.up(1, 1000 + T.holdHornMs * 3);
    expect(hold.drain()).toEqual(['horn']);
  });

  it('does not read a moving finger as a tap', () => {
    const e = new GestureEngine(T);
    e.down(1, 200, 400, 1000);
    e.move(1, 200 + T.tapMaxMovePx + 2, 400, 1020);
    e.up(1, 1040);
    expect(e.drain()).toEqual([]);
  });

  it('reads two thumbs without mixing them up', () => {
    const e = new GestureEngine(T);
    e.down(1, 100, 400, 1000);
    e.move(1, 100, 400 + T.swipeMinPx + 10, 1040); // left thumb brakes
    e.down(2, 300, 400, 1050);
    e.move(2, 300 - T.swipeMinPx - 10, 400, 1090); // right thumb takes a lane
    expect(e.drain()).toEqual(['left']);
    expect(e.isBraking(1090)).toBe(true);
  });
});

describe('C46: gestures become sim input bits', () => {
  it('drives itself and gives the brake right of way', () => {
    const c = new InputController();
    expect(controlTuning.autoGas).toBe(true);
    expect(c.sample(1000) & Btn.Gas).toBeTruthy();

    c.down(1, 200, 400, 1000);
    c.move(1, 200, 400 + T.swipeMinPx + 10, 1040);
    const bits = c.sample(1040);
    // The sim lets gas win over brake, so auto-gas has to stand down.
    expect(bits & Btn.Brake).toBeTruthy();
    expect(bits & Btn.Gas).toBeFalsy();
    expect(c.isBraking(1040)).toBe(true);
  });

  it('gets two flicks from one frame to the sim as two rising edges', () => {
    const c = new InputController();
    c.down(1, 200, 400, 1000);
    c.move(1, 200 + T.swipeMinPx + 10, 400, 1030);
    c.move(1, 200, 400, 1060);
    const seen: number[] = [];
    for (let i = 0; i < 6; i++) seen.push(c.sample(1060 + i) & (Btn.Right | Btn.Left));
    // On, off, on: the blank tick between them is what makes the second flick
    // a rising edge the sim can see.
    expect(seen.map((b) => (b ? 1 : 0))).toEqual([1, 0, 1, 0, 0, 0]);
  });

  it('turns one double tap into the on-beat bonus', () => {
    // The sim asks for `onBeatTaps` taps inside the window, and one double tap
    // is exactly that many. If this number ever rises, a double tap stops
    // being enough and the HUD copy becomes a lie.
    expect(simConfig.bonuses.onBeatTaps).toBe(2);

    const c = new InputController();
    const state = initState(simConfig, seedRng(7));
    state.beatWindowTicks = simConfig.bonuses.onBeatWindowTicks;
    let t = 1000;
    c.tap();
    c.tap();
    for (let i = 0; i < 8; i++) {
      step(state, c.sample(t), simConfig);
      t += 16;
    }
    expect(state.beatTaps).toBe(simConfig.bonuses.onBeatTaps);
  });

  it('keeps every keyboard control working for a desktop run', () => {
    const c = new InputController();
    c.key(true, 'ArrowLeft');
    expect(c.sample(1000) & Btn.Left).toBeTruthy();
    c.key(true, 's');
    const braking = c.sample(1002);
    expect(braking & Btn.Brake).toBeTruthy();
    expect(braking & Btn.Gas).toBeFalsy();
    c.key(false, 's');
    expect(c.sample(1004) & Btn.Brake).toBeFalsy();
    c.key(true, 'h');
    expect(c.sample(1006) & Btn.Horn).toBeTruthy();
  });
});

describe('swipes that start on a pad', () => {
  it('still steer, because the right thumb rests on BEAT and PERK', () => {
    const e = new GestureEngine(T);
    e.down(1, 200, 400, 1000, true);
    e.move(1, 200 - (T.swipeMinPx + 10), 400, 1060);
    e.up(1, 1070);
    expect(e.drain()).toEqual(['left']);
  });

  it('do not turn a still press on a pad into a tap or a horn', () => {
    const e = new GestureEngine(T);
    e.down(1, 200, 400, 1000, true);
    e.poll(1000 + T.holdHornMs + 50);
    e.up(1, 1000 + T.holdHornMs + 60);
    expect(e.drain()).toEqual([]);
    e.down(2, 200, 400, 3000, true);
    e.up(2, 3040);
    expect(e.drain()).toEqual([]);
  });
});
