/**
 * Chase-camera framing, kept pure so it can be unit-tested at every phone aspect.
 *
 * The lanes sit at x = -2.8, 0, +2.8 and the camera used to follow only half of that while the
 * "road bends" sweep yawed it by up to ±17°. On a tall phone (aspect ~0.46) the horizontal view
 * at the player's depth is under ±2 m, so the character slid out of frame. Portrait therefore
 * follows the player fully, keeps the bend to a small bounded sway and widens the view; landscape
 * keeps the original framing (portrait weight 0).
 */
export interface CameraRig {
  /** Vertical field of view, degrees (includes the speed kick). */
  fov: number;
  /** Camera x target (eased by the renderer). */
  x: number;
  y: number;
  /** Camera distance behind the player, world units. */
  back: number;
  lookX: number;
  lookY: number;
  /** Look-at distance ahead of the player, world units. */
  ahead: number;
  /** How fast the lateral follow eases, per second. */
  followRate: number;
  /** 0 = landscape framing, 1 = full portrait framing. */
  portrait: number;
}

const BASE_FOV = 58;
const MAX_FOV = 72;
const KICK_FOV = 8;
const TARGET_HFOV = 40;
const CURVE_PERIOD = 1200;

/** 0 for landscape/desktop (aspect >= 1.2), 1 for a phone held upright (aspect <= 0.8). */
export function portraitWeight(aspect: number): number {
  return Math.max(0, Math.min(1, (1.2 - aspect) / 0.4));
}

export function cameraFor(aspect: number, pX: number, pZ: number, speed01: number, reduceMotion: boolean): CameraRig {
  const t = portraitWeight(aspect);
  const kick = speed01 * (reduceMotion ? 2 : KICK_FOV);
  const fitFov = (2 * Math.atan(Math.tan((TARGET_HFOV * Math.PI) / 360) / Math.max(0.2, aspect)) * 180) / Math.PI;
  const wide = t > 0 ? Math.max(BASE_FOV, Math.min(MAX_FOV, fitFov)) : BASE_FOV;
  const fov = BASE_FOV + (wide - BASE_FOV) * t + kick;

  const bendAmp = reduceMotion ? 0 : 5.5 - 4.5 * t;
  const bend = Math.sin((pZ / CURVE_PERIOD) * Math.PI * 2) * bendAmp;
  const follow = 0.5 + 0.5 * t;
  const lookFollow = 0.3 + 0.7 * t;
  return {
    fov,
    x: pX * follow,
    y: 3.3 + 0.7 * t,
    back: 7.2 + 2.2 * t,
    lookX: pX * lookFollow + bend,
    lookY: 1.25,
    ahead: 10,
    followRate: 9 + 6 * t,
    portrait: t,
  };
}
