import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { CharacterLook, OutfitChoice } from '@cr/content';
import { GeoBuilder, mix, mulberry, shade } from './geo';
import { outlineMat, texMat, vcMat } from './materials';

/**
 * Original, stylised CHIBI Nigerian characters (ADR-0008). Proportions are
 * ~4.3 heads tall — big head, chunky simplified torso, short stubby limbs —
 * instead of the old realistic ~7.2-head figure built from 15+ overlapping
 * primitives (which read as lumpy/uncanny on a real phone). The face is a
 * single baked 2D texture (deterministic per `look`) on a smooth head
 * mesh, not a pile of overlapping eye/nose/lip primitives: fewer seams,
 * fewer verts, and crowds stay cheap. Every character is built from a
 * `look` (identity, never a real person) and an `outfit` (player-editable).
 */

export type Detail = 'hi' | 'lo';

export type Pose = 'stand' | 'run' | 'sit' | 'cheer' | 'wave';

export interface CharacterRig {
  group: THREE.Group;
  body: THREE.Group;
  parts: {
    head: THREE.Group;
    torso: THREE.Group;
    armL: THREE.Group;
    armR: THREE.Group;
    elbowL: THREE.Group;
    elbowR: THREE.Group;
    thighL: THREE.Group;
    thighR: THREE.Group;
    shinL: THREE.Group;
    shinR: THREE.Group;
  };
  geometries: THREE.BufferGeometry[];
}

// ---- Chibi skeleton (feet = y 0; ~4.3 heads tall) --------------------------
const HEAD_R = 0.135;
const HS = HEAD_R / 0.115; // scale factor for hair/headwear/ears carried over from the old head size
const HIP_Y = 0.5;
const THIGH = 0.25;
const SHIN = 0.25;
const TORSO_H = 0.46;
const SHOULDER_Y = HIP_Y + TORSO_H; // 0.96
// Chibi still means a short neck, but at -0.03 the cranium sank into the chest
// cylinder up to the chin: head and torso merged into one column with no join to
// read. +0.03 clears the shoulder yoke by about a third of a head radius.
const HEAD_Y = SHOULDER_Y + 0.03;
const CHEST_Y = HIP_Y + 0.3;
const PELVIS_Y = HIP_Y + 0.1;
const BELT_Y = HIP_Y + 0.19;
/**
 * Upper-body radii. Every chest-level clothing layer is expressed against these,
 * because the arms hang just outside SHOULDER_R: when a top quietly specified a
 * radius wider than the shoulders (hi-vis was 0.172, the yoke 0.168) it swallowed
 * the arms and the figure lost its silhouette.
 */
const CHEST_R = 0.142;
const SHOULDER_R = 0.152;
/** Arm pivot, outboard of SHOULDER_R so the upper arm always breaks the outline. */
const ARM_X = 0.188;

/**
 * Exported for the silhouette test. `widestTopR` is the largest radius any `top`
 * puts at chest height — keep it in step when adding or resizing a top, because a
 * top wider than the arms hides them and the character loses its arms entirely.
 */
export const RIG = {
  headR: HEAD_R,
  chestR: CHEST_R,
  shoulderR: SHOULDER_R,
  armX: ARM_X,
  /** rain-cape is excluded: it is a cape, deliberately draped over the arms. */
  widestTopR: 0.156,
} as const;
/**
 * Segment multipliers. 'hi' is the player, the studio turntable and the baked
 * portraits — one character on screen, shown large, where a 12-segment cylinder
 * is visibly a dodecagon. 'lo' is crowds and statics, which are small, numerous
 * and merged, and stay where they were.
 */
const HI_SEG = 1.4;
const LO_SEG = 0.55;
/**
 * Front-to-back squash on the torso. At 0.75 — set when the chest was much wider —
 * the body was a board in profile, which the studio turntable shows every few
 * seconds. Outer clothing layers use LAYER_Z so they stay proud of the chest in
 * depth as well as in radius.
 */
const TORSO_Z = 0.86;
const LAYER_Z = 0.88;

function sleeveSpec(top: string) {
  // [upper arm fraction covered, forearm fraction covered]
  switch (top) {
    case 'jacket':
    case 'ankara-shirt':
    case 'rain-cape':
      return [1, 1] as const;
    case 'kaftan':
      return [1, 0.55] as const;
    case 'blouse':
      return [0.6, 0] as const;
    case 'hi-vis':
      return [0, 0] as const;
    default:
      return [0.55, 0] as const; // tee
  }
}

// ---- Baked 2D face (replaces 10+ overlapping primitive face parts) --------
function faceCanvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  return { c, ctx };
}

const faceCache = new Map<string, THREE.CanvasTexture>();

/** Deterministic, cached per unique `look` signature — pure function of identity, no RNG. */
function faceTexture(look: CharacterLook): THREE.CanvasTexture {
  const f = look.face;
  const key = `${look.skin}|${f.width}|${f.jaw}|${f.nose}|${f.lips}|${f.brow}|${f.eye}|${look.facialHair}|${look.hairColor}|${look.gender}`;
  let tex = faceCache.get(key);
  if (tex) return tex;

  const W = 220;
  const H = 220;
  const sc = W / 160; // keep all the hand-tuned offsets below relative to the original 160px design
  const { c, ctx } = faceCanvas(W, H);
  const cx = W / 2;
  const cy = H * 0.56;
  const skin = look.skin;
  const female = look.gender === 'f';

  ctx.fillStyle = skin;
  ctx.fillRect(0, 0, W, H);

  // soft cheek warmth
  const cheekGrad = ctx.createRadialGradient(cx, cy + 14 * sc, 2, cx, cy + 14 * sc, 60 * sc);
  cheekGrad.addColorStop(0, shade(skin, 0.03));
  cheekGrad.addColorStop(1, shade(skin, 0));
  ctx.fillStyle = cheekGrad;
  ctx.fillRect(0, 0, W, H);

  // eyes: white, iris, pupil, highlight — big and close-set, chibi-cute
  const eyeDX = 22 * f.width * sc;
  const eyeW = 24 * f.eye * sc;
  const eyeH = 22 * f.eye * sc;
  for (const s of [-1, 1]) {
    const ex = cx + s * eyeDX;
    const ey = cy - 4 * sc;
    // white almond
    ctx.fillStyle = '#fbf8f1';
    ctx.beginPath();
    ctx.ellipse(ex, ey, eyeW * 0.5, eyeH * 0.46, 0, 0, Math.PI * 2);
    ctx.fill();
    // iris (big, bold)
    ctx.fillStyle = '#4a2f1c';
    ctx.beginPath();
    ctx.ellipse(ex, ey + eyeH * 0.06, eyeW * 0.4, eyeH * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
    // pupil
    ctx.fillStyle = '#0a0705';
    ctx.beginPath();
    ctx.ellipse(ex, ey + eyeH * 0.08, eyeW * 0.22, eyeH * 0.24, 0, 0, Math.PI * 2);
    ctx.fill();
    // highlight
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(ex - eyeW * 0.14, ey - eyeH * 0.16, eyeW * 0.1, eyeH * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
    // lid line: a thin crease just above the white, not a cap that covers it
    ctx.strokeStyle = shade(skin, -0.25);
    ctx.lineWidth = 1.6 * sc;
    ctx.beginPath();
    ctx.ellipse(ex, ey, eyeW * 0.52, eyeH * 0.48, 0, Math.PI * 1.05, Math.PI * 1.95);
    ctx.stroke();
    // brow: short, confident, well clear of the eye
    ctx.strokeStyle = look.hairColor;
    ctx.lineWidth = (3.2 + 1.8 * f.brow) * sc;
    ctx.lineCap = 'round';
    ctx.beginPath();
    const by = ey - eyeH * (female ? 1.3 : 1.45);
    ctx.moveTo(ex - eyeW * 0.46, by + 2 * sc);
    ctx.quadraticCurveTo(ex, by - 2.5 * f.brow * sc, ex + eyeW * 0.5, by + 1.5 * sc);
    ctx.stroke();
  }

  // nose: a soft vertical shade + tip, no hard line
  ctx.strokeStyle = shade(skin, -0.1);
  ctx.lineWidth = 2 * f.nose * sc;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - 1, cy + 2 * sc);
  ctx.quadraticCurveTo(cx - 3 * f.nose * sc, cy + 11 * sc, cx - 2 * f.nose * sc, cy + 15 * sc);
  ctx.stroke();
  ctx.fillStyle = shade(skin, -0.06);
  ctx.beginPath();
  ctx.ellipse(cx, cy + 16 * sc, 5 * f.nose * sc, 2.6 * sc, 0, 0, Math.PI * 2);
  ctx.fill();

  // mouth: a simple warm curve
  const lipC = mix(skin, '#7a2230', 0.55);
  ctx.strokeStyle = shade(lipC, -0.1);
  ctx.lineWidth = 3.4 * f.lips * sc;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - 14 * f.lips * sc, cy + 32 * sc);
  ctx.quadraticCurveTo(cx, cy + 38 * f.lips * sc, cx + 14 * f.lips * sc, cy + 32 * sc);
  ctx.stroke();

  // facial hair, baked rather than a separate clipping primitive
  if (look.facialHair === 'moustache' || look.facialHair === 'beard') {
    ctx.fillStyle = look.hairColor;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 27 * sc, 15 * sc, 4.5 * sc, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  if (look.facialHair === 'goatee' || look.facialHair === 'beard') {
    ctx.fillStyle = look.hairColor;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 46 * sc, (look.facialHair === 'beard' ? 30 : 11) * sc, (look.facialHair === 'beard' ? 22 : 13) * sc, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // soft oval alpha mask: fades to fully transparent at the plate edge so the
  // rectangular quad disappears into the curved skin-coloured head (ADR-0008)
  // instead of showing as a hard sticker edge.
  ctx.globalCompositeOperation = 'destination-in';
  const mask = ctx.createRadialGradient(cx, cy, W * 0.28, cx, cy, W * 0.5);
  mask.addColorStop(0, 'rgba(0,0,0,1)');
  mask.addColorStop(0.75, 'rgba(0,0,0,1)');
  mask.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = mask;
  ctx.beginPath();
  ctx.ellipse(cx, cy, W * 0.5, H * 0.56, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';

  tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.anisotropy = 4;
  faceCache.set(key, tex);
  return tex;
}

interface HeadBuild {
  skull: THREE.BufferGeometry; // cranium + ears + hair + headwear (vertex-coloured, merged)
  face: THREE.BufferGeometry | null; // small flat textured plate (hi detail only)
  faceMap: THREE.CanvasTexture | null;
}

function headGeo(look: CharacterLook, outfit: OutfitChoice, detail: Detail): HeadBuild {
  const b = new GeoBuilder();
  if (detail === 'lo') b.segScale = 0.5;
  const hi = detail === 'hi';
  const skin = look.skin;
  const fw = look.face.width;
  const hairCol = look.hairColor;
  const female = look.gender === 'f';

  // cranium: one smooth rounded shape (chibi — big, simple, reads clean at a distance)
  b.sphere(HEAD_R, skin, { sx: 1.0 * fw, sy: 1.05, sz: 1.0 }, 16);
  // ears
  for (const s of [-1, 1]) {
    b.sphere(0.024 * HS, skin, { x: s * 0.118 * HS * fw, y: -0.01, z: -0.01, sx: 0.5, sy: 1.1, sz: 0.85 }, 8);
    if (female) b.sphere(0.008 * HS, '#f0c75e', { x: s * 0.124 * HS * fw, y: -0.03 }, 6);
  }

  // hair (skipped under a headtie)
  const hw = outfit.headwear;
  if (hw !== 'headtie') {
    switch (look.hair) {
      case 'short':
        b.cap(0.143 * HS, 1.85, hairCol, { y: 0.01, rx: -0.78, sx: 0.98 * fw, sy: 1.08, sz: 1.04 }, 12);
        break;
      case 'natural':
        b.cap(0.156 * HS, 2.0, hairCol, { y: 0.015, rx: -0.68, sx: 1.0 * fw, sy: 1.1, sz: 1.06 }, 12);
        break;
      case 'afro':
        b.sphere(0.182 * HS, hairCol, { y: 0.03, sx: 1.08 * fw, sy: 1.0, sz: 1.04 }, 14);
        break;
      case 'braids':
        b.cap(0.145 * HS, 1.9, hairCol, { y: 0.012, rx: -0.73, sx: 0.98 * fw, sy: 1.08, sz: 1.04 }, 12);
        for (let i = 0; i < 7; i++) {
          const a = -0.85 + (i / 6) * 1.7;
          const x = Math.sin(a) * 0.125 * HS * fw;
          const z = -Math.cos(a) * 0.1 * HS;
          b.cyl(0.011 * HS, 0.007 * HS, 0.2 * HS, hairCol, { x, y: -0.08, z, rx: 0.05, rz: -a * 0.08 }, 5);
        }
        break;
      default:
        break;
    }
  }

  // headwear
  const hc = outfit.headColor;
  switch (hw) {
    case 'headtie': {
      // A cap, not a full sphere: a sphere here reaches z ~0.23 and depth-occludes
      // the whole face plate (which sits at z = HEAD_R * 1.06), leaving a blank head.
      // The wrap band also has to stay above the eyes — hence y ~0.07, not 0.
      // Hugging the cranium matters too: at r 0.149 * HS (C32) the wrap was 45 %
      // wider than the head and as wide as the shoulders, which read as a lampshade.
      b.cap(0.122 * HS, 1.75, hc, { y: 0.022, rx: -0.5, sx: 1.03 * fw, sy: 1.02, sz: 1.04 }, 14);
      b.torus(0.126 * HS, 0.03 * HS, shade(hc, -0.12), { y: 0.07 * HS, rx: Math.PI / 2, sx: 1.04 * fw }, Math.PI * 2, 16);
      // Gele fan: three folds, each TALLER than it is wide and leaning back off the
      // crown. The previous pair were wide slabs laid flat across the head, which
      // read as a pagoda brim and put the whole face in its shade.
      const fold: Array<[number, number, number, number, number]> = [
        // x, y, height, spread (rz), twist (ry). Bases overlap so the fan reads as
        // one pleated mass; too much spread and it separates into three prongs.
        [0.05, 0.175, 0.2, -0.3, 0.22],
        [0.0, 0.195, 0.235, -0.04, 0.0],
        [-0.052, 0.17, 0.185, 0.26, -0.2],
      ];
      fold.forEach(([fx, fy, fh, rz, ry], i) => {
        b.box(0.095 * HS, fh * HS, 0.036 * HS, shade(hc, i === 1 ? 0.05 : -0.06 * (i + 1)), {
          x: fx * HS,
          y: fy * HS,
          z: -0.03 * HS,
          rx: -0.3,
          rz,
          ry,
        });
      });
      break;
    }
    case 'cap':
      b.cap(0.148 * HS, 1.7, hc, { y: 0.015, rx: -0.5, sx: 0.98 * fw, sy: 1.05, sz: 1.04 }, 12);
      b.box(0.14 * HS, 0.012 * HS, 0.1 * HS, shade(hc, -0.1), { y: 0.05 * HS, z: 0.13 * HS, rx: 0.15 });
      break;
    case 'hardhat':
      // A helmet clears the skull by a liner's thickness, not by 40 %: the shell was
      // r 0.16 * HS and the brim 0.175 * HS against a 0.135 head, so it read as a
      // sombrero and shaded the whole face.
      b.cap(0.133 * HS, 1.95, hc, { y: 0.02, rx: -0.4, sx: 1.0 * fw, sy: 1.02, sz: 1.04 }, 14);
      b.cyl(0.146 * HS, 0.146 * HS, 0.013 * HS, shade(hc, -0.08), { y: 0.055 * HS, z: 0.012 * HS, sz: 1.04 }, 18);
      b.box(0.028 * HS, 0.022 * HS, 0.23 * HS, shade(hc, -0.12), { y: 0.14 * HS, z: -0.005 * HS });
      break;
    case 'sailor':
      b.cyl(0.128 * HS * fw, 0.12 * HS * fw, 0.075 * HS, hc, { y: 0.1 * HS, sz: 1.04 }, 16);
      b.cyl(0.142 * HS * fw, 0.142 * HS * fw, 0.015 * HS, hc, { y: 0.138 * HS, sz: 1.04 }, 18);
      b.cyl(0.124 * HS * fw, 0.124 * HS * fw, 0.02 * HS, '#1a2a44', { y: 0.075 * HS, sz: 1.04 }, 16);
      b.sphere(0.014 * HS, '#f0b429', { y: 0.1 * HS, z: 0.14 * HS }, 6);
      break;
    case 'headphones':
      b.torus(0.144 * HS * fw, 0.012 * HS, hc, { y: 0.0, ry: 0 }, Math.PI, 14);
      for (const s of [-1, 1]) b.cyl(0.05 * HS, 0.05 * HS, 0.036 * HS, shade(hc, -0.15), { x: s * 0.144 * HS * fw, y: -0.005 * HS, rz: Math.PI / 2 }, 12);
      break;
    default:
      break;
  }

  if (look.accessory === 'goggles') {
    const gy = 0.03;
    for (const s of [-1, 1]) {
      b.torus(0.032 * HS, 0.008 * HS, '#8a6a2f', { x: s * 0.045 * HS, y: gy, z: 0.128 * HS }, Math.PI * 2, 10);
      b.cyl(0.029 * HS, 0.029 * HS, 0.004 * HS, '#7fd4e8', { x: s * 0.045 * HS, y: gy, z: 0.128 * HS, rx: Math.PI / 2 }, 10);
    }
    b.box(0.034 * HS, 0.01 * HS, 0.01 * HS, '#8a6a2f', { y: gy, z: 0.13 * HS });
    b.cyl(0.13 * HS * fw, 0.13 * HS * fw, 0.014 * HS, '#3a2f22', { y: gy, sz: 1.03 }, 14);
  }

  const skull = b.build()!;

  if (!hi) return { skull, face: null, faceMap: null };

  // face plate: one small flat textured quad, not an outline-prone pile of primitives
  const faceMap = faceTexture(look);
  const faceW = HEAD_R * 1.25 * fw;
  const faceH = HEAD_R * 1.3;
  const plate = new THREE.PlaneGeometry(faceW, faceH);
  // Must clear the cranium sphere's surface at every point the (flat) plate
  // covers, not just at its centre, or the sphere depth-occludes the middle
  // of the face (that was the earlier bug: only the plate's grazing edges
  // were visible, the iris/pupil were hidden behind the sphere).
  plate.translate(0, 0.01, HEAD_R * 1.06);
  return { skull, face: plate, faceMap };
}

function torsoGeo(look: CharacterLook, outfit: OutfitChoice, detail: Detail): THREE.BufferGeometry {
  const b = new GeoBuilder();
  b.segScale = detail === 'lo' ? LO_SEG : HI_SEG;
  const f = look.gender === 'f';
  const sw = (f ? 0.92 : 1) * Math.pow(look.build, 0.5);
  const hw = (f ? 1.1 : 1) * Math.pow(look.build, 0.55);
  const skin = look.skin;
  const tc = outfit.topColor;
  const bc = outfit.bottomColor;
  const top = outfit.top;

  // Short neck, shaded down: the underside of a jaw is never the same value as a
  // cheek, and that one darker band is most of what separates head from body.
  b.cyl(0.05 * HS, 0.058 * HS, 0.09, shade(skin, -0.07), { y: SHOULDER_Y + 0.025 }, 12);

  const bodyCol = top === 'hi-vis' ? '#9499a0' : tc;
  // chest
  b.cyl(CHEST_R * sw, 0.134 * hw, 0.32, bodyCol, { y: CHEST_Y, sz: TORSO_Z }, 12);
  // Shoulder yoke: a flattened ellipsoid capping the chest. Without it the torso
  // ended in a hard cylinder disc at chin height and the figure read as stacked
  // tins; this rounds the shoulder line and pushes the deltoids out past the arms
  // so the arms have something to hang off.
  b.sphere(SHOULDER_R * sw, bodyCol, { y: SHOULDER_Y - 0.075, sx: 1.06, sy: 0.72, sz: TORSO_Z + 0.02 }, 14);
  // pelvis
  b.cyl(0.136 * hw, 0.148 * hw, 0.2, bc, { y: PELVIS_Y, sz: TORSO_Z }, 12);
  b.cyl(0.144 * hw, 0.144 * hw, 0.03, shade(bc, -0.18), { y: BELT_Y, sz: TORSO_Z + 0.01 }, 12); // belt

  switch (top) {
    case 'hi-vis':
      b.cyl(0.152 * sw, 0.14 * hw, 0.3, tc, { y: CHEST_Y, sz: LAYER_Z }, 12);
      b.cyl(0.156 * sw, 0.142 * hw, 0.026, '#d9dde0', { y: CHEST_Y - 0.08, sz: LAYER_Z }, 12);
      b.cyl(0.156 * sw, 0.148 * sw, 0.026, '#d9dde0', { y: CHEST_Y + 0.1, sz: LAYER_Z }, 12);
      break;
    case 'jacket':
      b.cyl(0.154 * sw, 0.142 * hw, 0.33, tc, { y: CHEST_Y, sz: LAYER_Z }, 12);
      b.cyl(0.144 * hw, 0.144 * hw, 0.04, shade(tc, -0.15), { y: PELVIS_Y, sz: LAYER_Z }, 12);
      b.torus(0.046 * HS, 0.016 * HS, shade(tc, -0.1), { y: SHOULDER_Y, rx: Math.PI / 2, sz: 1.1 }, Math.PI * 2, 12);
      b.box(0.01, 0.3, 0.01, shade(tc, -0.3), { y: CHEST_Y, z: 0.125 * sw });
      break;
    case 'kaftan':
      b.cyl(0.152 * sw, 0.2 * hw, 0.56, tc, { y: HIP_Y + 0.02, sz: LAYER_Z + 0.02 }, 12);
      b.cyl(0.2 * hw, 0.2 * hw, 0.03, '#f0c75e', { y: HIP_Y - 0.12, sz: LAYER_Z + 0.02 }, 12);
      b.box(0.04, 0.22, 0.01, '#f0c75e', { y: CHEST_Y + 0.04, z: 0.142 * sw });
      break;
    case 'rain-cape':
      b.cyl(0.11 * sw, 0.27 * hw, 0.58, tc, { y: HIP_Y + 0.04, sz: LAYER_Z + 0.04 }, 12);
      b.torus(0.075 * HS, 0.032 * HS, shade(tc, 0.06), { y: SHOULDER_Y + 0.02, rx: Math.PI / 2 }, Math.PI * 2, 10);
      b.sphere(0.095 * HS, shade(tc, -0.06), { y: SHOULDER_Y + 0.05, z: -0.07, sx: 1.0, sy: 0.85, sz: 0.68 }, 8);
      break;
    case 'blouse':
      b.cyl(0.142 * hw, 0.2 * hw, 0.12, tc, { y: PELVIS_Y + 0.02, sz: LAYER_Z }, 12);
      b.torus(0.046 * HS, 0.013 * HS, '#f0c75e', { y: SHOULDER_Y, rx: Math.PI / 2, sz: 1.1 }, Math.PI * 2, 12);
      for (let i = 0; i < 2; i++) b.cyl(0.15 * sw, 0.15 * sw, 0.018, shade(tc, 0.16), { y: CHEST_Y - 0.07 + i * 0.1, sz: LAYER_Z }, 12);
      break;
    case 'ankara-shirt':
      for (let i = 0; i < 3; i++) b.cyl(0.152 * sw, 0.142 * hw, 0.034, i % 2 ? '#f0c75e' : shade(tc, -0.2), { y: PELVIS_Y + 0.08 + i * 0.1, sz: LAYER_Z }, 12);
      b.torus(0.046 * HS, 0.014 * HS, shade(tc, -0.25), { y: SHOULDER_Y, rx: Math.PI / 2, sz: 1.1 }, Math.PI * 2, 12);
      break;
    default:
      b.torus(0.046 * HS, 0.013 * HS, shade(tc, -0.12), { y: SHOULDER_Y, rx: Math.PI / 2, sz: 1.1 }, Math.PI * 2, 12);
      break;
  }

  if (outfit.bottom === 'wrapper') {
    b.cyl(0.17 * hw, 0.19 * hw, 0.2, bc, { y: HIP_Y - 0.04, sz: LAYER_Z + 0.02 }, 12);
    b.cyl(0.19 * hw, 0.2 * hw, 0.024, shade(bc, -0.2), { y: HIP_Y - 0.12, sz: LAYER_Z + 0.02 }, 12);
  }

  if (look.accessory === 'bowtie') {
    b.cone(0.026, 0.044, '#e8a87c', { x: -0.03, y: SHOULDER_Y - 0.02, z: 0.132 * sw, rz: Math.PI / 2 }, 6);
    b.cone(0.026, 0.044, '#e8a87c', { x: 0.03, y: SHOULDER_Y - 0.02, z: 0.132 * sw, rz: -Math.PI / 2 }, 6);
    b.sphere(0.011, '#c98a5e', { y: SHOULDER_Y - 0.02, z: 0.128 * sw }, 6);
  }
  if (look.prop === 'pouch') {
    b.sphere(0.048, '#8b5a2b', { x: 0.16 * hw, y: PELVIS_Y + 0.02, z: 0.08, sy: 1.1 }, 8);
    b.box(0.044, 0.013, 0.026, '#f0b429', { x: 0.16 * hw, y: PELVIS_Y + 0.07, z: 0.08 });
  }
  if (look.prop === 'speaker') {
    b.box(0.013, 0.035, 0.42, '#2a2a2a', { x: 0.12, y: CHEST_Y, z: 0.0, rz: 0.7 });
  }

  return b.build()!;
}

function armGeos(look: CharacterLook, outfit: OutfitChoice, detail: Detail) {
  const skin = look.skin;
  // A sleeve in the exact torso colour welds the arm to the chest wherever the two
  // overlap. One step down is enough to keep the edge.
  const sc = outfit.top === 'hi-vis' ? skin : shade(outfit.topColor, -0.07);
  const [upFrac, loFrac] = sleeveSpec(outfit.top);
  const f = look.gender === 'f';
  const thin = f ? 0.9 : 1;
  const upper = new GeoBuilder();
  const lo = new GeoBuilder();
  upper.segScale = lo.segScale = detail === 'lo' ? LO_SEG : HI_SEG;
  const upLen = 0.16;
  upper.sphere(0.052 * thin, upFrac > 0 ? sc : skin, { y: 0 }, 8);
  upper.cyl(0.046 * thin, 0.04 * thin, upLen, skin, { y: -upLen / 2 }, 8);
  if (upFrac > 0) {
    const l = upLen * upFrac;
    upper.cyl(0.05 * thin, 0.046 * thin + 0.002, l, sc, { y: -l / 2 }, 8);
  }
  const loLen = 0.15;
  lo.sphere(0.04 * thin, skin, { y: 0 }, 8);
  lo.cyl(0.039 * thin, 0.032 * thin, loLen, skin, { y: -loLen / 2 }, 8);
  if (loFrac > 0) {
    const l = loLen * loFrac;
    lo.cyl(0.044 * thin, 0.038 * thin + 0.004, l, sc, { y: -l / 2 }, 8);
  }
  // chibi hand: one round, slightly bigger "mitten" blob
  lo.sphere(0.046 * thin, skin, { y: -loLen - 0.02, sx: 1.0, sy: 1.05, sz: 0.85 }, 8);
  return { upper: upper.build()!, lower: lo.build()! };
}

function legGeos(look: CharacterLook, outfit: OutfitChoice, detail: Detail) {
  const skin = look.skin;
  const bc = outfit.bottomColor;
  const f = look.gender === 'f';
  const hw = (f ? 1.08 : 1) * Math.pow(look.build, 0.5);
  const bottom = outfit.bottom;
  const thighCol = bottom === 'wrapper' ? skin : bc;
  const shinCol = bottom === 'shorts' || bottom === 'wrapper' ? skin : bc;

  const thigh = new GeoBuilder();
  thigh.segScale = detail === 'lo' ? LO_SEG : HI_SEG;
  thigh.sphere(0.066 * hw, thighCol, { y: 0 }, 8);
  thigh.cyl(0.072 * hw, 0.055, THIGH, thighCol, { y: -THIGH / 2 }, 9);
  if (bottom === 'shorts') thigh.cyl(0.075 * hw, 0.062, THIGH * 0.58, bc, { y: -THIGH * 0.29 }, 9);
  if (bottom === 'work') thigh.box(0.018, 0.08, 0.06, shade(bc, -0.15), { x: 0.062 * hw, y: -0.1 });

  const shin = new GeoBuilder();
  shin.segScale = detail === 'lo' ? LO_SEG : HI_SEG;
  shin.sphere(0.054, shinCol, { y: 0 }, 8);
  shin.cyl(0.052, 0.04, SHIN - 0.03, shinCol, { y: -(SHIN - 0.03) / 2 }, 9);
  if (bottom === 'work') shin.box(0.08, 0.06, 0.028, shade(bc, -0.12), { y: -0.03, z: 0.045 });
  if (bottom !== 'shorts' && bottom !== 'wrapper') shin.cyl(0.044, 0.044, 0.02, shade(bc, -0.12), { y: -SHIN + 0.05 }, 9);

  // ground relative to the knee pivot
  const gy = -(HIP_Y - THIGH);
  const fc = outfit.footColor;
  const zc = 0.045;
  switch (outfit.footwear) {
    case 'sandals':
      shin.box(0.088, 0.02, 0.23, fc, { y: gy + 0.01, z: zc });
      shin.box(0.075, 0.03, 0.17, skin, { y: gy + 0.035, z: zc + 0.018 });
      for (const s of [-1, 1]) shin.sphere(0.011, skin, { x: s * 0.026, y: gy + 0.042, z: zc + 0.1 }, 5);
      break;
    case 'boots':
      shin.box(0.095, 0.03, 0.24, '#1a1410', { y: gy + 0.015, z: zc });
      shin.box(0.088, 0.065, 0.19, fc, { y: gy + 0.062, z: zc + 0.012 });
      shin.cyl(0.05, 0.052, 0.17, fc, { y: gy + 0.16 }, 9);
      break;
    case 'shoes':
      shin.box(0.095, 0.022, 0.24, '#0d0d0d', { y: gy + 0.011, z: zc });
      shin.box(0.084, 0.05, 0.2, fc, { y: gy + 0.046, z: zc + 0.012 });
      shin.sphere(0.044, fc, { y: gy + 0.042, z: zc + 0.11, sy: 0.7, sz: 1.1 }, 8);
      break;
    case 'slippers':
      shin.box(0.088, 0.018, 0.23, fc, { y: gy + 0.009, z: zc });
      shin.box(0.075, 0.028, 0.15, skin, { y: gy + 0.03, z: zc + 0.025 });
      break;
    default: // sneakers
      shin.box(0.098, 0.032, 0.25, '#f4f1ea', { y: gy + 0.016, z: zc });
      shin.box(0.088, 0.05, 0.19, fc, { y: gy + 0.058, z: zc + 0.017 });
      shin.sphere(0.046, fc, { y: gy + 0.052, z: zc + 0.11, sy: 0.7, sz: 1.1 }, 8);
      shin.box(0.09, 0.01, 0.06, '#f4f1ea', { y: gy + 0.075, z: zc + 0.04 });
      break;
  }
  return { thigh: thigh.build()!, shin: shin.build()! };
}

function propGeo(kind: string): THREE.BufferGeometry | null {
  const b = new GeoBuilder();
  switch (kind) {
    case 'fan':
      b.cyl(0.011, 0.011, 0.13, '#6b4a2b', { y: -0.03 }, 5);
      b.cyl(0.095, 0.095, 0.011, '#e0902b', { y: 0.06, rz: Math.PI / 2 }, 14);
      b.cyl(0.065, 0.065, 0.013, '#2a6f97', { y: 0.06, rz: Math.PI / 2 }, 14);
      break;
    case 'wrench':
      b.cyl(0.012, 0.012, 0.28, '#9aa3ab', { y: -0.02, rx: Math.PI / 2 }, 6);
      b.box(0.034, 0.06, 0.026, '#9aa3ab', { y: -0.02, z: 0.16 });
      b.box(0.01, 0.026, 0.026, '#2a2a2a', { y: -0.02, z: 0.18 });
      break;
    case 'lantern':
      b.cyl(0.005, 0.005, 0.065, '#2a2a2a', { y: 0.042 }, 4);
      b.box(0.075, 0.1, 0.075, '#d9a441', { y: -0.08 });
      b.box(0.062, 0.082, 0.062, '#ffe9a0', { y: -0.08 });
      b.box(0.084, 0.016, 0.084, '#2a2a2a', { y: -0.135 });
      b.box(0.084, 0.016, 0.084, '#2a2a2a', { y: -0.025 });
      break;
    case 'speaker':
      b.box(0.3, 0.165, 0.115, '#22262e', { y: -0.08 });
      for (const s of [-1, 1]) {
        b.cyl(0.058, 0.058, 0.014, '#8a8f99', { x: s * 0.075, y: -0.08, z: 0.062, rx: Math.PI / 2 }, 12);
        b.cyl(0.025, 0.025, 0.017, '#111', { x: s * 0.075, y: -0.08, z: 0.066, rx: Math.PI / 2 }, 8);
      }
      b.cyl(0.005, 0.005, 0.16, '#999', { x: 0.11, y: 0.05, rz: -0.6 }, 4);
      break;
    case 'baton':
      b.cyl(0.008, 0.006, 0.28, '#e8e1d0', { y: -0.02, rx: Math.PI / 2 - 0.4, z: 0.08 }, 6);
      b.sphere(0.012, '#c98a5e', { y: 0.065, z: -0.025 }, 6);
      break;
    default:
      return null;
  }
  return b.build();
}

export function buildCharacter(look: CharacterLook, outfit: OutfitChoice, detail: Detail = 'hi'): CharacterRig {
  const mat = vcMat();
  const geometries: THREE.BufferGeometry[] = [];
  const mesh = (g: THREE.BufferGeometry, outline = detail === 'hi') => {
    geometries.push(g);
    const m = new THREE.Mesh(g, mat);
    if (outline) {
      const o = new THREE.Mesh(g, outlineMat());
      m.add(o);
    }
    return m;
  };
  const group = new THREE.Group();
  const body = new THREE.Group();
  group.add(body);
  const f = look.gender === 'f';
  const sw = (f ? 0.92 : 1) * Math.pow(look.build, 0.5);
  const hipX = 0.085 * (f ? 1.1 : 1) * Math.pow(look.build, 0.5);

  const torso = new THREE.Group();
  torso.position.y = 0;
  torso.add(mesh(torsoGeo(look, outfit, detail)));
  body.add(torso);

  const head = new THREE.Group();
  head.position.set(0, HEAD_Y, 0);
  const headBuild = headGeo(look, outfit, detail);
  head.add(mesh(headBuild.skull));
  if (headBuild.face && headBuild.faceMap) {
    const faceMesh = new THREE.Mesh(
      headBuild.face,
      texMat(`face:${headBuild.faceMap.uuid}`, headBuild.faceMap, { transparent: true, alphaTest: 0.08 }),
    );
    geometries.push(headBuild.face);
    head.add(faceMesh);
  }
  torso.add(head);

  const arms = armGeos(look, outfit, detail);
  const mkArm = (side: 1 | -1) => {
    const arm = new THREE.Group();
    // Outboard of SHOULDER_R, not inside it. At 0.155 the whole upper arm sat
    // within the torso silhouette, so in any same-coloured top the character
    // simply had no arms.
    arm.position.set(side * ARM_X * sw, SHOULDER_Y - 0.065, 0);
    arm.add(mesh(arms.upper.clone()));
    const elbow = new THREE.Group();
    elbow.position.y = -0.16;
    elbow.add(mesh(arms.lower.clone()));
    arm.add(elbow);
    torso.add(arm);
    return { arm, elbow };
  };
  const L = mkArm(-1);
  const R = mkArm(1);
  const prop = propGeo(look.prop);
  if (prop) {
    const pm = mesh(prop, false);
    pm.position.set(0, -0.16, 0.015);
    R.elbow.add(pm);
  }

  const legs = legGeos(look, outfit, detail);
  const mkLeg = (side: 1 | -1) => {
    const thigh = new THREE.Group();
    thigh.position.set(side * hipX, HIP_Y, 0);
    thigh.add(mesh(legs.thigh.clone()));
    const shin = new THREE.Group();
    shin.position.y = -THIGH;
    shin.add(mesh(legs.shin.clone()));
    thigh.add(shin);
    body.add(thigh);
    return { thigh, shin };
  };
  const LL = mkLeg(-1);
  const RL = mkLeg(1);

  group.scale.setScalar(look.height);
  arms.upper.dispose();
  arms.lower.dispose();
  legs.thigh.dispose();
  legs.shin.dispose();

  return {
    group,
    body,
    parts: {
      head,
      torso,
      armL: L.arm,
      armR: R.arm,
      elbowL: L.elbow,
      elbowR: R.elbow,
      thighL: LL.thigh,
      thighR: RL.thigh,
      shinL: LL.shin,
      shinR: RL.shin,
    },
    geometries,
  };
}

/**
 * Pose / animate. t is seconds; speed01 scales stride. Renderer-only (uses Math.sin freely).
 *
 * 'run' is continuous in speed01, not a hard switch from 'stand' (C22): at
 * speed01=0 it eases to a small idle shuffle with breathing blended in, at
 * speed01=1 it's a full stride. GameRenderer can therefore always call
 * 'run' while on foot — the old boolean `moving ? 'run' : 'stand'` snapped
 * instantly at the speed threshold, which read as robotic.
 */
export function poseCharacter(rig: CharacterRig, pose: Pose, t: number, speed01 = 1) {
  const p = rig.parts;
  const set = (g: THREE.Object3D, x = 0, y = 0, z = 0) => g.rotation.set(x, y, z);
  rig.body.position.y = 0;
  switch (pose) {
    case 'run': {
      // smoothstep, not linear: gentle ease into the stride instead of a linear ramp
      const amt = speed01 * speed01 * (3 - 2 * speed01);
      const idle = 1 - amt;
      const freq = 7 + amt * 5;
      const ph = t * freq;
      const s = Math.sin(ph);
      const stride = 0.2 + amt * 0.85;
      set(p.thighL, -s * stride);
      set(p.thighR, s * stride);
      set(p.shinL, Math.max(0, -s) * (0.3 + amt * 1.1) + 0.1);
      set(p.shinR, Math.max(0, s) * (0.3 + amt * 1.1) + 0.1);
      set(p.armL, s * (0.2 + amt * 0.75), 0, -0.08);
      set(p.armR, -s * (0.2 + amt * 0.75), 0, 0.08);
      set(p.elbowL, -0.4 - amt * 0.65);
      set(p.elbowR, -0.4 - amt * 0.65);
      // secondary motion: torso/head trail the leg phase slightly (overlap),
      // with idle breathing fading in as the stride fades out
      const phLag = (t - 0.055) * freq;
      set(p.torso, 0.04 + amt * 0.12, Math.sin(phLag) * (0.03 + amt * 0.08));
      set(p.head, -0.02 - amt * 0.09, -Math.sin(phLag) * (0.03 + amt * 0.08) + Math.sin(t * 0.9) * 0.025 * idle);
      rig.body.position.y = Math.abs(Math.cos(ph)) * (0.015 + amt * 0.028) + Math.sin(t * 1.6) * 0.003 * idle;
      break;
    }
    case 'sit': {
      set(p.thighL, -1.3, 0, -0.12);
      set(p.thighR, -1.3, 0, 0.12);
      set(p.shinL, 1.35);
      set(p.shinR, 1.35);
      set(p.armL, -0.95, 0, 0.18);
      set(p.armR, -0.95, 0, -0.18);
      set(p.elbowL, -0.5);
      set(p.elbowR, -0.5);
      set(p.torso, 0.18);
      set(p.head, -0.15);
      break;
    }
    case 'cheer': {
      const b = Math.sin(t * 9) * 0.25;
      set(p.thighL, 0);
      set(p.thighR, 0);
      set(p.shinL, 0);
      set(p.shinR, 0);
      set(p.armL, -2.7 + b, 0, 0.3);
      set(p.armR, -2.7 - b, 0, -0.3);
      set(p.elbowL, -0.25);
      set(p.elbowR, -0.25);
      set(p.torso, 0);
      set(p.head, -0.1);
      rig.body.position.y = Math.abs(Math.sin(t * 9)) * 0.04;
      break;
    }
    case 'wave': {
      set(p.thighL, 0);
      set(p.thighR, 0);
      set(p.shinL, 0);
      set(p.shinR, 0);
      set(p.armL, 0.05, 0, 0.1);
      set(p.armR, -2.5, 0, -0.35 + Math.sin(t * 7) * 0.3);
      set(p.elbowL, -0.15);
      set(p.elbowR, -0.4);
      set(p.torso, 0);
      set(p.head, 0.05, Math.sin(t * 1.5) * 0.15);
      break;
    }
    default: {
      const br = Math.sin(t * 1.6);
      set(p.thighL, 0, 0, -0.03);
      set(p.thighR, 0, 0, 0.03);
      set(p.shinL, 0);
      set(p.shinR, 0);
      // Negative z on the left arm swings the hand AWAY from the body; the old
      // +0.1 / -0.1 pair tucked both hands into the hips and closed the gap.
      set(p.armL, 0.04 + br * 0.02, 0, -0.2);
      set(p.armR, -0.15 + br * 0.02, 0, 0.2);
      set(p.elbowL, -0.32);
      set(p.elbowR, -0.55);
      set(p.torso, br * 0.01);
      set(p.head, 0, Math.sin(t * 0.7) * 0.05);
      rig.body.position.y = br * 0.003;
      break;
    }
  }
}

export function disposeRig(rig: CharacterRig) {
  for (const g of rig.geometries) g.dispose();
  rig.geometries.length = 0;
}

/** Bake a posed rig into ONE vertex-coloured geometry (crowds / statics — always 'lo', so no textured face plate to merge). */
export function bakeCharacter(look: CharacterLook, outfit: OutfitChoice, pose: Pose, t = 0, detail: Detail = 'lo'): THREE.BufferGeometry {
  const rig = buildCharacter(look, outfit, detail);
  poseCharacter(rig, pose, t, 1);
  rig.group.updateMatrixWorld(true);
  const list: THREE.BufferGeometry[] = [];
  rig.group.traverse((o) => {
    if (o instanceof THREE.Mesh && o.material === vcMat()) {
      const g = (o.geometry as THREE.BufferGeometry).clone();
      g.applyMatrix4(o.matrixWorld);
      list.push(g);
    }
  });
  const merged = mergeGeometries(list, false)!;
  for (const g of list) g.dispose();
  disposeRig(rig);
  merged.computeBoundingSphere();
  return merged;
}

/** Deterministic random everyday person (not tied to any real individual). */
export function randomPerson(
  seed: number,
  options: { colors: string[] },
): { look: CharacterLook; outfit: OutfitChoice } {
  const r = mulberry(seed * 7919 + 17);
  const female = r.chance(0.5);
  const skins = ['#3B2417', '#4A2C1B', '#5C3A24', '#6A4129', '#7A4B2E', '#8D5A3B'];
  const look: CharacterLook = {
    gender: female ? 'f' : 'm',
    skin: r.pick(skins),
    hair: female ? r.pick(['braids', 'natural', 'short'] as const) : r.pick(['short', 'short', 'bald', 'afro'] as const),
    hairColor: '#15100d',
    facialHair: !female && r.chance(0.3) ? r.pick(['moustache', 'goatee', 'beard'] as const) : 'none',
    face: {
      width: r.range(0.92, 1.1),
      jaw: r.range(0.9, 1.1),
      nose: r.range(0.9, 1.2),
      lips: r.range(0.9, 1.2),
      brow: r.range(0.9, 1.1),
      eye: r.range(0.95, 1.1),
    },
    height: female ? r.range(0.9, 0.99) : r.range(0.96, 1.05),
    build: r.range(0.9, 1.15),
    prop: 'none',
    accessory: 'none',
  };
  const outfit: OutfitChoice = {
    top: female ? r.pick(['blouse', 'tee', 'ankara-shirt', 'kaftan']) : r.pick(['tee', 'tee', 'ankara-shirt', 'kaftan', 'jacket']),
    topColor: r.pick(options.colors),
    bottom: female ? r.pick(['wrapper', 'jeans', 'trousers']) : r.pick(['jeans', 'trousers', 'shorts']),
    bottomColor: r.pick(['#2f4a6b', '#1b2b3a', '#3A4A5A', '#161616', '#2A6F97', '#8B5A2B']),
    footwear: r.pick(['sandals', 'sneakers', 'slippers', 'shoes']),
    footColor: r.pick(['#F3E3C3', '#161616', '#E0902B', '#1F5F8B']),
    headwear: female && r.chance(0.3) ? 'headtie' : r.chance(0.12) ? 'cap' : 'none',
    headColor: r.pick(options.colors),
  };
  return { look, outfit };
}
