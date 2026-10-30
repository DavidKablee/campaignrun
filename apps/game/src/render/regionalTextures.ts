import { mulberry } from './geo';
import { canvas, memo, speckle, toTex } from './textures';

/**
 * Painters for the looks other than Lagos. Same technique as textures.ts: paint
 * once on a canvas, no download. Each is keyed by its set id so a session that
 * visits two states keeps both.
 */

// ------------------------------------------------------------------ roads

/**
 * Sahel dust road: same 18 m strip and lane layout as the Lagos one (the sim's
 * lanes do not move), but warm asphalt under blown dust, faded paint, and packed
 * earth with a worn footpath where Lagos has paving blocks.
 */
function sahelDustRoad() {
  return memo('road:sahel-dust', () => {
    const W = 1024;
    const H = 512;
    const { c, ctx } = canvas(W, H);
    const px = (x: number) => ((x + 9) / 18) * W;
    const pz = (z: number) => (z / 8) * H;
    ctx.fillStyle = '#4a4540';
    ctx.fillRect(0, 0, W, H);
    speckle(ctx, W, H, 9000, 0.14, 12);
    // dust drifting in from both edges, thickest at the kerb
    for (const side of [-1, 1]) {
      const edge = px(side * 4.7);
      const g = ctx.createLinearGradient(edge, 0, px(side * 1.6), 0);
      g.addColorStop(0, 'rgba(196,150,96,0.55)');
      g.addColorStop(1, 'rgba(196,150,96,0)');
      ctx.fillStyle = g;
      ctx.fillRect(Math.min(edge, px(side * 1.6)), 0, Math.abs(edge - px(side * 1.6)), H);
    }
    // pale tyre tracks, a little dustier than the asphalt around them
    for (const lx of [-2.8, 0, 2.8]) {
      for (const off of [-0.55, 0.55]) {
        const g = ctx.createLinearGradient(px(lx + off - 0.3), 0, px(lx + off + 0.3), 0);
        g.addColorStop(0, 'rgba(230,200,160,0)');
        g.addColorStop(0.5, 'rgba(230,200,160,0.10)');
        g.addColorStop(1, 'rgba(230,200,160,0)');
        ctx.fillStyle = g;
        ctx.fillRect(px(lx + off - 0.3), 0, px(0.6) - px(0), H);
      }
    }
    // patched potholes, drifts of sand across the lane
    const r = mulberry(35);
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = `rgba(28,24,22,${r.range(0.15, 0.35)})`;
      ctx.beginPath();
      ctx.ellipse(r.range(px(-4), px(4)), r.range(0, H), r.range(10, 36), r.range(8, 22), r.range(0, 3), 0, 6.3);
      ctx.fill();
    }
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = 'rgba(208,166,112,0.35)';
      ctx.beginPath();
      ctx.ellipse(r.range(px(-4), px(4)), r.range(0, H), r.range(40, 90), r.range(8, 16), r.range(-0.3, 0.3), 0, 6.3);
      ctx.fill();
    }
    // packed-earth shoulders with a footpath worn down the middle of each
    for (const side of [-1, 1]) {
      const x0 = side < 0 ? 0 : px(5.0);
      const x1 = side < 0 ? px(-5.0) : W;
      ctx.fillStyle = '#b98a5c';
      ctx.fillRect(x0, 0, x1 - x0, H);
      speckle(ctx, W, H, 4200, 0.16, 41 + side);
      const mid = side < 0 ? px(-7.4) : px(7.4);
      const g = ctx.createLinearGradient(mid - 40, 0, mid + 40, 0);
      g.addColorStop(0, 'rgba(235,205,165,0)');
      g.addColorStop(0.5, 'rgba(235,205,165,0.45)');
      g.addColorStop(1, 'rgba(235,205,165,0)');
      ctx.fillStyle = g;
      ctx.fillRect(mid - 40, 0, 80, H);
      // a few stones and tufts
      for (let i = 0; i < 34; i++) {
        ctx.fillStyle = r.chance(0.5) ? 'rgba(96,70,46,0.5)' : 'rgba(120,128,72,0.55)';
        ctx.fillRect(Math.min(x0, x1) + r.range(0, Math.abs(x1 - x0)), r.range(0, H), r.range(2, 7), r.range(2, 5));
      }
    }
    // kerb: ochre and bare, no painted blocks
    for (const side of [-1, 1]) {
      const x = side < 0 ? px(-5.0) : px(4.7);
      ctx.fillStyle = '#9a6f46';
      ctx.fillRect(x, 0, px(0.3) - px(0), H);
    }
    // faded edge lines and lane dashes
    ctx.fillStyle = 'rgba(232,222,196,0.7)';
    for (const side of [-1, 1]) ctx.fillRect(px(side * 4.45 - 0.08), 0, px(0.16) - px(0), H);
    for (const lx of [-1.4, 1.4]) {
      for (let z = 0; z < 8; z += 4) ctx.fillRect(px(lx - 0.07), pz(z), px(0.14) - px(0), pz(2.6));
    }
    return toTex(c);
  });
}


/**
 * Wet delta asphalt: same 18 m strip and lanes, dark and glossy from the rain, standing
 * puddles with a pale sheen, mud washed across the edges, concrete kerbs and worn lines.
 */
function deltaWetRoad() {
  return memo('road:delta-wet', () => {
    const W = 1024;
    const H = 512;
    const { c, ctx } = canvas(W, H);
    const px = (x: number) => ((x + 9) / 18) * W;
    const pz = (z: number) => (z / 8) * H;
    ctx.fillStyle = '#34383c';
    ctx.fillRect(0, 0, W, H);
    speckle(ctx, W, H, 7000, 0.12, 21);
    // sheen: soft pale bands where the sky is reflected
    for (const lx of [-2.8, 0, 2.8]) {
      const g = ctx.createLinearGradient(px(lx - 1.1), 0, px(lx + 1.1), 0);
      g.addColorStop(0, 'rgba(170,196,206,0)');
      g.addColorStop(0.5, 'rgba(170,196,206,0.13)');
      g.addColorStop(1, 'rgba(170,196,206,0)');
      ctx.fillStyle = g;
      ctx.fillRect(px(lx - 1.1), 0, px(2.2) - px(0), H);
    }
    const r = mulberry(61);
    // puddles with a bright rim
    for (let i = 0; i < 9; i++) {
      const x = r.range(px(-4), px(4));
      const y = r.range(0, H);
      const rw = r.range(30, 80);
      const rh = r.range(10, 22);
      ctx.fillStyle = 'rgba(120,150,164,0.42)';
      ctx.beginPath();
      ctx.ellipse(x, y, rw, rh, r.range(-0.2, 0.2), 0, 6.3);
      ctx.fill();
      ctx.strokeStyle = 'rgba(210,228,234,0.35)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    // patches and cracks
    for (let i = 0; i < 7; i++) {
      ctx.fillStyle = `rgba(20,22,24,${r.range(0.15, 0.3)})`;
      ctx.beginPath();
      ctx.ellipse(r.range(px(-4), px(4)), r.range(0, H), r.range(14, 40), r.range(8, 20), r.range(0, 3), 0, 6.3);
      ctx.fill();
    }
    // muddy, grassy shoulders with ponded water
    for (const side of [-1, 1]) {
      const x0 = side < 0 ? 0 : px(5.0);
      const x1 = side < 0 ? px(-5.0) : W;
      ctx.fillStyle = '#6b5238';
      ctx.fillRect(x0, 0, x1 - x0, H);
      speckle(ctx, W, H, 4600, 0.18, 71 + side);
      for (let i = 0; i < 8; i++) {
        ctx.fillStyle = 'rgba(120,150,164,0.4)';
        ctx.beginPath();
        ctx.ellipse(Math.min(x0, x1) + r.range(10, Math.abs(x1 - x0) - 10), r.range(0, H), r.range(16, 40), r.range(6, 14), 0, 0, 6.3);
        ctx.fill();
      }
      for (let i = 0; i < 40; i++) {
        ctx.fillStyle = r.chance(0.6) ? 'rgba(70,104,52,0.6)' : 'rgba(96,70,46,0.5)';
        ctx.fillRect(Math.min(x0, x1) + r.range(0, Math.abs(x1 - x0)), r.range(0, H), r.range(2, 8), r.range(2, 6));
      }
    }
    // mud washed onto the tarmac at both edges
    for (const side of [-1, 1]) {
      const edge = px(side * 4.7);
      const g = ctx.createLinearGradient(edge, 0, px(side * 3.2), 0);
      g.addColorStop(0, 'rgba(96,70,46,0.55)');
      g.addColorStop(1, 'rgba(96,70,46,0)');
      ctx.fillStyle = g;
      ctx.fillRect(Math.min(edge, px(side * 3.2)), 0, Math.abs(edge - px(side * 3.2)), H);
    }
    // concrete kerb
    for (const side of [-1, 1]) {
      const x = side < 0 ? px(-5.0) : px(4.7);
      ctx.fillStyle = '#a19e94';
      ctx.fillRect(x, 0, px(0.3) - px(0), H);
    }
    // worn lane paint
    ctx.fillStyle = 'rgba(232,230,218,0.75)';
    for (const side of [-1, 1]) ctx.fillRect(px(side * 4.45 - 0.08), 0, px(0.16) - px(0), H);
    for (const lx of [-1.4, 1.4]) {
      for (let z = 0; z < 8; z += 4) ctx.fillRect(px(lx - 0.07), pz(z), px(0.14) - px(0), pz(2.6));
    }
    return toTex(c);
  });
}

/**
 * South-eastern town road: dark patched asphalt, red laterite washed in from both
 * edges after rain (thickest at the kerb, with a few fans across the lane), a
 * concrete kerb and a worn lane line. Same 18 m strip and lanes as the others.
 */
function lateriteWashRoad(id = 'laterite-wash', base = '#4f5558', wash = '176,98,60', shoulder = '#a85a38', seed = 81) {
  return memo(`road:${id}`, () => {
    const W = 1024;
    const H = 512;
    const { c, ctx } = canvas(W, H);
    const px = (x: number) => ((x + 9) / 18) * W;
    const pz = (z: number) => (z / 8) * H;
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, W, H);
    speckle(ctx, W, H, 8000, 0.13, 31);
    const r = mulberry(seed);
    for (let i = 0; i < 9; i++) {
      ctx.fillStyle = `rgba(28,30,32,${r.range(0.14, 0.28)})`;
      ctx.beginPath();
      ctx.ellipse(r.range(px(-4), px(4)), r.range(0, H), r.range(16, 46), r.range(8, 22), r.range(0, 3), 0, 6.3);
      ctx.fill();
    }
    for (const side of [-1, 1]) {
      const edge = px(side * 4.7);
      const g = ctx.createLinearGradient(edge, 0, px(side * 2.4), 0);
      g.addColorStop(0, `rgba(${wash},0.7)`);
      g.addColorStop(1, `rgba(${wash},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(Math.min(edge, px(side * 2.4)), 0, Math.abs(edge - px(side * 2.4)), H);
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = `rgba(${wash},0.28)`;
        ctx.beginPath();
        ctx.ellipse(px(side * r.range(2.2, 4.2)), r.range(0, H), r.range(28, 70), r.range(8, 18), 0, 0, 6.3);
        ctx.fill();
      }
    }
    for (const side of [-1, 1]) {
      const x0 = side < 0 ? 0 : px(5.0);
      const x1 = side < 0 ? px(-5.0) : W;
      ctx.fillStyle = shoulder;
      ctx.fillRect(x0, 0, x1 - x0, H);
      speckle(ctx, W, H, 4200, 0.16, 91 + side);
      for (let i = 0; i < 30; i++) {
        ctx.fillStyle = r.chance(0.5) ? 'rgba(110,70,44,0.5)' : 'rgba(196,128,86,0.45)';
        ctx.fillRect(Math.min(x0, x1) + r.range(0, Math.abs(x1 - x0)), r.range(0, H), r.range(3, 10), r.range(2, 6));
      }
    }
    for (const side of [-1, 1]) {
      const x = side < 0 ? px(-5.0) : px(4.7);
      ctx.fillStyle = '#a19e94';
      ctx.fillRect(x, 0, px(0.3) - px(0), H);
    }
    ctx.fillStyle = 'rgba(232,230,218,0.72)';
    for (const side of [-1, 1]) ctx.fillRect(px(side * 4.45 - 0.08), 0, px(0.16) - px(0), H);
    for (const lx of [-1.4, 1.4]) {
      for (let z = 0; z < 8; z += 4) ctx.fillRect(px(lx - 0.07), pz(z), px(0.14) - px(0), pz(2.6));
    }
    return toTex(c);
  });
}

export function regionalRoadTexture(style: string) {
  switch (style) {
    case 'sahel-dust':
      return sahelDustRoad();
    case 'delta-wet':
      return deltaWetRoad();
    case 'laterite-wash':
      return lateriteWashRoad();
    case 'katsina-rose':
      return lateriteWashRoad('katsina-rose', '#4f5558', '171,127,102', '#ab7f66', 203);
    case 'bauchi-sand':
      return lateriteWashRoad('bauchi-sand', '#4d4b47', '198,170,128', '#c4a679', 211);
    case 'sokoto-pale':
      return lateriteWashRoad('sokoto-pale', '#51504b', '214,180,134', '#d3b98f', 223);
    case 'ibom-clean':
      return lateriteWashRoad('ibom-clean', '#43474a', '118,126,90', '#76805a', 229);
    case 'imo-red':
      return lateriteWashRoad('imo-red', '#46494b', '150,96,66', '#8a5a3a', 233);
    case 'edo-red':
      return lateriteWashRoad('edo-red', '#47484a', '142,78,52', '#8a4b32', 239);
    case 'benue-sand':
      return lateriteWashRoad('benue-sand', '#4c4d4a', '190,170,120', '#b8a46c', 257);
    case 'abia-wet':
      return lateriteWashRoad('abia-wet', '#4a4d4f', '139,111,90', '#8b6f5a', 251);
    case 'ondo-green':
      return lateriteWashRoad('ondo-green', '#44494a', '128,98,70', '#6f6a46', 241);
    case 'calabar-wet':
      return lateriteWashRoad('calabar-wet', '#3f4547', '96,110,78', '#667050', 281);
    case 'jigawa-sand':
      return lateriteWashRoad('jigawa-sand', '#504e49', '210,180,134', '#c9b080', 277);
    case 'adamawa-dust':
      return lateriteWashRoad('adamawa-dust', '#4d4b46', '176,146,104', '#b09468', 269);
    case 'fct-asphalt':
      return lateriteWashRoad('fct-asphalt', '#3f4448', '124,124,120', '#8f9296', 293);
    case 'osun-green':
      return lateriteWashRoad('osun-green', '#45494b', '122,100,68', '#6a6f46', 263);
    case 'ogun-slab':
      return lateriteWashRoad('ogun-slab', '#9c9a94', '150,140,125', '#a29b92', 207);
    case 'redbrown-avenue':
      return lateriteWashRoad('redbrown-avenue', '#43474a', '155,106,76', '#9b6a4c', 97);
    case 'sahel-sand':
      return lateriteWashRoad('sahel-sand', '#4d4b47', '203,182,143', '#cbb68f', 151);
    case 'hill-asphalt':
      return lateriteWashRoad('hill-asphalt', '#56595c', '152,88,60', '#98583c', 137);
    case 'kwara-red':
      return lateriteWashRoad('kwara-red', '#4f5558', '168,100,63', '#a8643f', 127);
    case 'asaba-red':
      return lateriteWashRoad('asaba-red', '#4c5154', '165,104,63', '#a5683f', 113);
    default:
      throw new Error(`Unknown road style: ${style}`);
  }
}

// ------------------------------------------------------------------ facades

const MUD_WALLS = ['#c98f58', '#b87e4a', '#d4a06a', '#e2c9a0', '#bf8a60', '#d9b88a'];

/**
 * One window bay x one floor (3.5 m x 3 m) of earthen plaster: trowelled
 * courses, a small arched window behind a plank shutter, projecting beam ends
 * along the top and a band of raised diamond relief.
 */
function mudFacade(variant: number) {
  const v = variant % MUD_WALLS.length;
  return memo(`facade:mud:${v}`, () => {
    const { c, ctx } = canvas(256, 256);
    const r = mulberry(500 + v);
    ctx.fillStyle = MUD_WALLS[v]!;
    ctx.fillRect(0, 0, 256, 256);
    speckle(ctx, 256, 256, 2200, 0.16, 90 + v);
    // trowel marks: faint horizontal strokes
    for (let i = 0; i < 26; i++) {
      ctx.fillStyle = `rgba(90,56,30,${r.range(0.04, 0.12)})`;
      ctx.fillRect(r.range(0, 200), r.range(0, 256), r.range(30, 110), r.range(2, 5));
    }
    // rain-washed streaks from the parapet
    for (let i = 0; i < 10; i++) {
      const x = r.range(0, 256);
      const g = ctx.createLinearGradient(0, 0, 0, 256);
      g.addColorStop(0, 'rgba(60,36,18,0)');
      g.addColorStop(1, `rgba(60,36,18,${r.range(0.05, 0.14)})`);
      ctx.fillStyle = g;
      ctx.fillRect(x, 0, r.range(3, 10), 256);
    }
    // projecting beam ends along the top
    ctx.fillStyle = '#6a4326';
    for (let x = 18; x < 256; x += 56) {
      ctx.beginPath();
      ctx.arc(x, 14, 6, 0, 6.3);
      ctx.fill();
    }
    // relief band: raised diamonds
    ctx.strokeStyle = 'rgba(70,40,20,0.55)';
    ctx.fillStyle = 'rgba(245,225,190,0.35)';
    ctx.lineWidth = 3;
    for (let x = 14; x < 256; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 40);
      ctx.lineTo(x + 14, 28);
      ctx.lineTo(x + 28, 40);
      ctx.lineTo(x + 14, 52);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    // window: a pointed arch in a recess
    const wx = v % 2 === 0 ? 84 : 112;
    const wy = 100;
    ctx.fillStyle = 'rgba(40,24,12,0.55)';
    ctx.beginPath();
    ctx.moveTo(wx - 6, wy + 110);
    ctx.lineTo(wx - 6, wy + 30);
    ctx.quadraticCurveTo(wx + 30, wy - 26, wx + 66, wy + 30);
    ctx.lineTo(wx + 66, wy + 110);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#4a3020';
    ctx.beginPath();
    ctx.moveTo(wx, wy + 108);
    ctx.lineTo(wx, wy + 32);
    ctx.quadraticCurveTo(wx + 30, wy - 14, wx + 60, wy + 32);
    ctx.lineTo(wx + 60, wy + 108);
    ctx.closePath();
    ctx.fill();
    // plank shutter, one leaf ajar
    ctx.fillStyle = '#7a4f2b';
    ctx.fillRect(wx, wy + 44, 28, 64);
    ctx.strokeStyle = 'rgba(30,16,8,0.6)';
    ctx.lineWidth = 2;
    for (let x = wx + 7; x < wx + 28; x += 7) {
      ctx.beginPath();
      ctx.moveTo(x, wy + 44);
      ctx.lineTo(x, wy + 108);
      ctx.stroke();
    }
    return toTex(c);
  });
}

// 'block' reads as a rendered concrete-block wall painted in a pale market colour,
// for the contemporary city districts.
const BLOCK_WALLS = ['#e8dcc0', '#d9c9a0', '#b9c7c2', '#e6c9a8', '#cfd6c4', '#f0e6d2'];
function blockFacade(variant: number) {
  const v = variant % BLOCK_WALLS.length;
  return memo(`facade:block:${v}`, () => {
    const { c, ctx } = canvas(256, 256);
    const r = mulberry(700 + v);
    ctx.fillStyle = BLOCK_WALLS[v]!;
    ctx.fillRect(0, 0, 256, 256);
    speckle(ctx, 256, 256, 1500, 0.1, 130 + v);
    for (let i = 0; i < 12; i++) {
      const x = r.range(0, 256);
      const g = ctx.createLinearGradient(0, 0, 0, 256);
      g.addColorStop(0, 'rgba(70,52,34,0)');
      g.addColorStop(1, `rgba(70,52,34,${r.range(0.05, 0.14)})`);
      ctx.fillStyle = g;
      ctx.fillRect(x, 0, r.range(2, 8), 256);
    }
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.fillRect(0, 0, 256, 9);
    ctx.fillRect(0, 247, 256, 9);
    // louvred window with a metal grille
    const wx = 70;
    const wy = 74;
    ctx.fillStyle = '#4b3b2e';
    ctx.fillRect(wx - 5, wy - 5, 126, 126);
    const glass = ctx.createLinearGradient(0, wy, 0, wy + 116);
    glass.addColorStop(0, '#7fa8b8');
    glass.addColorStop(1, '#2d4a58');
    ctx.fillStyle = glass;
    ctx.fillRect(wx, wy, 116, 116);
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    for (let y = wy + 6; y < wy + 116; y += 14) ctx.fillRect(wx, y, 116, 3);
    ctx.strokeStyle = '#201a16';
    ctx.lineWidth = 4;
    for (let x = wx + 14; x < wx + 116; x += 29) {
      ctx.beginPath();
      ctx.moveTo(x, wy);
      ctx.lineTo(x, wy + 116);
      ctx.stroke();
    }
    return toTex(c);
  });
}


// Weathered plank walls for waterside houses.
const PLANK_WALLS = ['#8a7358', '#7a6a4f', '#9a8468', '#6e5e48', '#8f7c60', '#7d6c52'];
const PLANK_DOORS = ['#2a6f73', '#c98f3a', '#3b4f80', '#6e5a44', '#a8553b', '#8ea4ae'];
function plankFacade(variant: number) {
  const v = variant % PLANK_WALLS.length;
  return memo(`facade:plank:${v}`, () => {
    const { c, ctx } = canvas(256, 256);
    const r = mulberry(1100 + v);
    ctx.fillStyle = PLANK_WALLS[v]!;
    ctx.fillRect(0, 0, 256, 256);
    speckle(ctx, 256, 256, 2000, 0.2, 210 + v);
    // vertical planks
    for (let x = 0; x < 256; x += 21) {
      ctx.fillStyle = `rgba(30,22,14,${r.range(0.08, 0.22)})`;
      ctx.fillRect(x, 0, 3, 256);
      ctx.fillStyle = `rgba(255,240,215,${r.range(0.02, 0.07)})`;
      ctx.fillRect(x + 4, 0, 6, 256);
    }
    // nail rows
    ctx.fillStyle = 'rgba(30,22,14,0.5)';
    for (let x = 10; x < 256; x += 21) for (const y of [30, 128, 226]) ctx.fillRect(x, y, 3, 3);
    // rust and damp streaks from the roof
    for (let i = 0; i < 8; i++) {
      const x = r.range(0, 256);
      const g = ctx.createLinearGradient(0, 0, 0, 256);
      g.addColorStop(0, 'rgba(140,70,40,0)');
      g.addColorStop(1, `rgba(140,70,40,${r.range(0.08, 0.2)})`);
      ctx.fillStyle = g;
      ctx.fillRect(x, 0, r.range(4, 12), 256);
    }
    // a shuttered window, one leaf painted
    const wx = v % 2 ? 56 : 120;
    ctx.fillStyle = '#2a1f17';
    ctx.fillRect(wx, 80, 80, 90);
    ctx.fillStyle = PLANK_DOORS[v]!;
    ctx.fillRect(wx, 80, 38, 90);
    ctx.fillStyle = 'rgba(20,14,8,0.5)';
    ctx.fillRect(wx + 18, 80, 3, 90);
    return toTex(c);
  });
}

// Painted concrete-block walls of the oil city: cream, terracotta, teal-grey and pale grey,
// louvred windows behind burglar bars, damp stains and mould at the foot.
const PLASTER_WALLS = ['#e8dcc0', '#d9c9a0', '#c98f6a', '#9cb5b0', '#cfd0c6', '#e6d3b0'];
function plasterFacade(variant: number) {
  const v = variant % PLASTER_WALLS.length;
  return memo(`facade:plaster:${v}`, () => {
    const { c, ctx } = canvas(256, 256);
    const r = mulberry(1300 + v);
    ctx.fillStyle = PLASTER_WALLS[v]!;
    ctx.fillRect(0, 0, 256, 256);
    speckle(ctx, 256, 256, 1600, 0.1, 230 + v);
    for (let i = 0; i < 12; i++) {
      const x = r.range(0, 256);
      const g = ctx.createLinearGradient(0, 0, 0, 256);
      g.addColorStop(0, 'rgba(60,70,50,0)');
      g.addColorStop(1, `rgba(60,70,50,${r.range(0.06, 0.18)})`);
      ctx.fillStyle = g;
      ctx.fillRect(x, 0, r.range(3, 10), 256);
    }
    // mould at the foot of the wall
    const g = ctx.createLinearGradient(0, 200, 0, 256);
    g.addColorStop(0, 'rgba(40,60,40,0)');
    g.addColorStop(1, 'rgba(40,60,40,0.28)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 200, 256, 56);
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.fillRect(0, 0, 256, 9);
    ctx.fillRect(0, 247, 256, 9);
    // louvred window with bars, and a small split air-conditioner on some
    const wx = 70;
    const wy = 70;
    ctx.fillStyle = '#4b3b2e';
    ctx.fillRect(wx - 5, wy - 5, 126, 126);
    const glass = ctx.createLinearGradient(0, wy, 0, wy + 116);
    glass.addColorStop(0, '#8fb3b8');
    glass.addColorStop(1, '#3a5a60');
    ctx.fillStyle = glass;
    ctx.fillRect(wx, wy, 116, 116);
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    for (let y = wy + 6; y < wy + 116; y += 14) ctx.fillRect(wx, y, 116, 3);
    ctx.strokeStyle = '#201a16';
    ctx.lineWidth = 4;
    for (let x = wx + 14; x < wx + 116; x += 29) {
      ctx.beginPath();
      ctx.moveTo(x, wy);
      ctx.lineTo(x, wy + 116);
      ctx.stroke();
    }
    if (v % 3 === 0) {
      ctx.fillStyle = '#e8e6de';
      ctx.fillRect(196, 100, 50, 24);
      ctx.fillStyle = '#9a9a94';
      ctx.fillRect(200, 114, 42, 4);
    }
    return toTex(c);
  });
}

const PLAZA_WALLS = ['#e7d9b6', '#9c5a3a', '#f0ebdd', '#5e9c95', '#c9a98a', '#9aa3a6'];

/**
 * One bay x one floor of a market plaza or town block: painted render in one of the
 * trade-block colours, concrete frame lines either side, a glazed window with a
 * balcony rail across the foot, weather streaks from the roof edge.
 */
function plazaFacade(variant: number) {
  const v = variant % PLAZA_WALLS.length;
  return memo(`facade:plaza:${v}`, () => {
    const { c, ctx } = canvas(256, 256);
    const r = mulberry(1700 + v);
    ctx.fillStyle = PLAZA_WALLS[v]!;
    ctx.fillRect(0, 0, 256, 256);
    speckle(ctx, 256, 256, 1500, 0.1, 270 + v);
    for (let i = 0; i < 10; i++) {
      const x = r.range(0, 256);
      const g = ctx.createLinearGradient(0, 0, 0, 256);
      g.addColorStop(0, 'rgba(50,50,44,0)');
      g.addColorStop(1, `rgba(50,50,44,${r.range(0.05, 0.15)})`);
      ctx.fillStyle = g;
      ctx.fillRect(x, 0, r.range(3, 9), 256);
    }
    ctx.fillStyle = 'rgba(70,66,58,0.35)';
    ctx.fillRect(0, 0, 12, 256);
    ctx.fillRect(244, 0, 12, 256);
    ctx.fillRect(0, 0, 256, 10);
    const glass = ctx.createLinearGradient(0, 56, 0, 190);
    glass.addColorStop(0, '#9dbcc2');
    glass.addColorStop(1, '#4a6a72');
    ctx.fillStyle = '#2f2a24';
    ctx.fillRect(46, 50, 164, 146);
    ctx.fillStyle = glass;
    ctx.fillRect(52, 56, 152, 134);
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(52, 56, 152, 10);
    ctx.fillStyle = '#2f2a24';
    ctx.fillRect(126, 56, 4, 134);
    // balcony rail
    ctx.fillStyle = '#e8e4d4';
    ctx.fillRect(30, 204, 196, 6);
    for (let x = 36; x < 226; x += 16) ctx.fillRect(x, 210, 4, 34);
    ctx.fillRect(30, 242, 196, 6);
    if (v % 2 === 0) {
      ctx.fillStyle = '#7a8a90';
      ctx.fillRect(196, 20, 40, 22);
    }
    return toTex(c);
  });
}

const LIME_WALLS = ['#eadfc6', '#f2eee2', '#b8b2a2', '#cda66b', '#e4dcc4', '#d9cdb0'];

/**
 * One bay x one floor of a Kaduna town building: limewash or sandcrete render in
 * cream, whitewash, grey or ochre, a deep dark eaves band, a window with a slate-blue
 * shutter and an iron burglar-proof grille (the Panteka workshops' daily product).
 */
function limewashFacade(variant: number) {
  const v = variant % LIME_WALLS.length;
  return memo(`facade:limewash:${v}`, () => {
    const { c, ctx } = canvas(256, 256);
    const r = mulberry(2100 + v);
    ctx.fillStyle = LIME_WALLS[v]!;
    ctx.fillRect(0, 0, 256, 256);
    speckle(ctx, 256, 256, 1500, 0.1, 310 + v);
    for (let i = 0; i < 8; i++) {
      const x = r.range(0, 256);
      const g = ctx.createLinearGradient(0, 0, 0, 256);
      g.addColorStop(0, 'rgba(110,70,44,0)');
      g.addColorStop(1, `rgba(110,70,44,${r.range(0.04, 0.12)})`);
      ctx.fillStyle = g;
      ctx.fillRect(x, 0, r.range(3, 9), 256);
    }
    ctx.fillStyle = 'rgba(70,52,40,0.4)';
    ctx.fillRect(0, 0, 256, 14);
    ctx.fillStyle = '#2f2a24';
    ctx.fillRect(60, 56, 136, 140);
    const glass = ctx.createLinearGradient(0, 62, 0, 190);
    glass.addColorStop(0, '#9dbcc2');
    glass.addColorStop(1, '#4a6a72');
    ctx.fillStyle = glass;
    ctx.fillRect(66, 62, 124, 128);
    ctx.fillStyle = '#4f6d85';
    ctx.fillRect(34, 56, 24, 140);
    ctx.fillRect(198, 56, 24, 140);
    ctx.strokeStyle = '#1c1a18';
    ctx.lineWidth = 4;
    for (let x = 80; x < 190; x += 22) {
      ctx.beginPath();
      ctx.moveTo(x, 62);
      ctx.lineTo(x, 190);
      ctx.stroke();
    }
    for (const y of [100, 146]) {
      ctx.beginPath();
      ctx.moveTo(66, y);
      ctx.lineTo(190, y);
      ctx.stroke();
    }
    return toTex(c);
  });
}


const EARTH_WALLS = ['#c99a62', '#d4aa74', '#bf8f5a', '#e0c08e', '#c4a06c', '#d9b98a'];

/**
 * One window bay x one floor of plastered earth-and-sandcrete render, ochre with a pale
 * chalk dado at the foot, hand-trowelled streaks, a small window with a slate shutter and
 * a plain iron grille. The old-city grain of Ilorin, without any relief or ornament.
 */
function earthPlasterFacade(variant: number) {
  const v = variant % EARTH_WALLS.length;
  return memo(`facade:earth-plaster:${v}`, () => {
    const { c, ctx } = canvas(256, 256);
    const r = mulberry(2500 + v);
    ctx.fillStyle = EARTH_WALLS[v]!;
    ctx.fillRect(0, 0, 256, 256);
    speckle(ctx, 256, 256, 1700, 0.12, 350 + v);
    for (let i = 0; i < 9; i++) {
      const x = r.range(0, 256);
      const g = ctx.createLinearGradient(0, 0, 0, 256);
      g.addColorStop(0, 'rgba(90,60,36,0)');
      g.addColorStop(1, `rgba(90,60,36,${r.range(0.05, 0.14)})`);
      ctx.fillStyle = g;
      ctx.fillRect(x, 0, r.range(3, 10), 256);
    }
    ctx.fillStyle = 'rgba(239,232,214,0.55)';
    ctx.fillRect(0, 214, 256, 42);
    ctx.fillStyle = 'rgba(70,50,34,0.35)';
    ctx.fillRect(0, 0, 256, 12);
    ctx.fillStyle = '#2f2a24';
    ctx.fillRect(86, 60, 84, 110);
    ctx.fillStyle = '#4f6d85';
    ctx.fillRect(68, 60, 16, 110);
    ctx.fillRect(172, 60, 16, 110);
    ctx.strokeStyle = '#1c1a18';
    ctx.lineWidth = 3;
    for (let x = 98; x < 168; x += 14) {
      ctx.beginPath();
      ctx.moveTo(x, 64);
      ctx.lineTo(x, 166);
      ctx.stroke();
    }
    return toTex(c);
  });
}

const CLAY_WALLS = ['#e6dcc4', '#d3bf98', '#ddd0b0', '#cdb98f', '#e0d3b6', '#d8c8a2'];

/**
 * One window bay x one floor of whitewashed clay or sand render: pale, nearly flat, a few
 * hand-trowelled streaks, a deep eaves shadow, a small window with an indigo shutter and a
 * plain iron grille. The paler, plainer wall of the north-east.
 */
function sandClayFacade(variant: number) {
  const v = variant % CLAY_WALLS.length;
  return memo(`facade:sand-clay:${v}`, () => {
    const { c, ctx } = canvas(256, 256);
    const r = mulberry(3300 + v);
    ctx.fillStyle = CLAY_WALLS[v]!;
    ctx.fillRect(0, 0, 256, 256);
    speckle(ctx, 256, 256, 1500, 0.1, 430 + v);
    for (let i = 0; i < 8; i++) {
      const x = r.range(0, 256);
      const g = ctx.createLinearGradient(0, 0, 0, 256);
      g.addColorStop(0, 'rgba(110,90,60,0)');
      g.addColorStop(1, `rgba(110,90,60,${r.range(0.04, 0.1)})`);
      ctx.fillStyle = g;
      ctx.fillRect(x, 0, r.range(3, 9), 256);
    }
    ctx.fillStyle = 'rgba(107,90,58,0.45)';
    ctx.fillRect(0, 0, 256, 14);
    ctx.fillStyle = '#2f2a24';
    ctx.fillRect(90, 64, 76, 100);
    ctx.fillStyle = '#2f4560';
    ctx.fillRect(72, 64, 16, 100);
    ctx.fillRect(168, 64, 16, 100);
    ctx.strokeStyle = '#1c1a18';
    ctx.lineWidth = 3;
    for (let x = 102; x < 164; x += 14) {
      ctx.beginPath();
      ctx.moveTo(x, 68);
      ctx.lineTo(x, 160);
      ctx.stroke();
    }
    return toTex(c);
  });
}

/**
 * A plain rendered wall for the later regional sets, one window bay x one floor: a flat wall
 * colour, light streaking, an eaves shadow, a window with a coloured shutter and an iron grille,
 * and (when `relief` is set) a band of small raised lozenges under the eaves.
 */
function plainFacade(key: string, seed: number, walls: string[], variant: number, shutter: string, relief?: string) {
  const v = variant % walls.length;
  return memo(`facade:${key}:${v}`, () => {
    const { c, ctx } = canvas(256, 256);
    const r = mulberry(seed + v);
    ctx.fillStyle = walls[v]!;
    ctx.fillRect(0, 0, 256, 256);
    speckle(ctx, 256, 256, 1500, 0.1, seed + 30 + v);
    for (let i = 0; i < 8; i++) {
      const g = ctx.createLinearGradient(0, 0, 0, 256);
      g.addColorStop(0, 'rgba(90,70,50,0)');
      g.addColorStop(1, `rgba(90,70,50,${r.range(0.05, 0.12)})`);
      ctx.fillStyle = g;
      ctx.fillRect(r.range(0, 256), 0, r.range(3, 9), 256);
    }
    ctx.fillStyle = 'rgba(80,66,48,0.42)';
    ctx.fillRect(0, 0, 256, 14);
    if (relief) {
      ctx.fillStyle = relief;
      for (let x = 8; x < 256; x += 24) {
        ctx.beginPath();
        ctx.moveTo(x + 8, 22);
        ctx.lineTo(x + 16, 30);
        ctx.lineTo(x + 8, 38);
        ctx.lineTo(x, 30);
        ctx.fill();
      }
    }
    ctx.fillStyle = '#2b2824';
    ctx.fillRect(92, 66, 72, 98);
    ctx.fillStyle = shutter;
    ctx.fillRect(74, 66, 16, 98);
    ctx.fillRect(166, 66, 16, 98);
    ctx.fillStyle = 'rgba(60,50,40,0.5)';
    ctx.fillRect(86, 164, 84, 8);
    ctx.strokeStyle = '#1c1a18';
    ctx.lineWidth = 3;
    for (let x = 104; x < 162; x += 14) {
      ctx.beginPath();
      ctx.moveTo(x, 70);
      ctx.lineTo(x, 160);
      ctx.stroke();
    }
    return toTex(c);
  });
}

/** A shop-front board set: a painted fascia with trade words over a dark opening, shutter strip and goods. */
interface TradeBoard {
  name: string;
  bg: string;
  fg: string;
  shutter: string;
}
function tradeShop(key: string, seed: number, wall: string, boards: TradeBoard[], variant: number, hue: [number, number]) {
  const v = variant % boards.length;
  return memo(`shop:${key}:${v}`, () => {
    const s = boards[v]!;
    const { c, ctx } = canvas(256, 256);
    const r = mulberry(seed + v);
    ctx.fillStyle = wall;
    ctx.fillRect(0, 0, 256, 256);
    speckle(ctx, 256, 256, 1400, 0.1, seed + 40 + v);
    ctx.fillStyle = s.bg;
    ctx.fillRect(10, 16, 236, 58);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(10, 16, 236, 9);
    ctx.fillStyle = s.fg;
    ctx.font = 'bold 28px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(s.name, 128, 54, 224);
    ctx.fillStyle = '#2a1f17';
    ctx.fillRect(18, 90, 220, 158);
    for (let i = 0; i < 18; i++) {
      ctx.fillStyle = `hsl(${r.range(hue[0], hue[1])},${r.range(25, 45)}%,${r.range(42, 66)}%)`;
      ctx.fillRect(r.range(26, 215), r.range(124, 214), r.range(10, 24), r.range(10, 22));
    }
    ctx.fillStyle = s.shutter;
    ctx.fillRect(18, 90, 220, 28);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    for (let y = 94; y < 118; y += 6) ctx.fillRect(18, y, 220, 2);
    return toTex(c);
  });
}

const ENUGU_SHOPS: TradeBoard[] = [
  { name: 'SPARE PARTS', bg: '#34383b', fg: '#efe8d6', shutter: '#7c8a84' },
  { name: 'WELDING · FABRICATION', bg: '#7c8a84', fg: '#fff', shutter: '#34383b' },
  { name: 'GARRI · PROVISIONS', bg: '#c9a877', fg: '#2a1f17', shutter: '#4f6d85' },
  { name: 'PURE WATER', bg: '#4f6d85', fg: '#f4f1ea', shutter: '#b2ac9c' },
  { name: 'TAILORING', bg: '#7a2f3e', fg: '#f0e6d2', shutter: '#c9a877' },
  { name: 'RECHARGE · POS', bg: '#efe8d6', fg: '#34383b', shutter: '#8e5a3a' },
];
const JOS_SHOPS: TradeBoard[] = [
  { name: 'POTATOES · VEGETABLES', bg: '#707a84', fg: '#f4f1ea', shutter: '#b8b2a2' },
  { name: 'CHARCOAL · FIREWOOD', bg: '#5f5a55', fg: '#efe6d0', shutter: '#9c9892' },
  { name: 'JACKETS · SWEATERS', bg: '#c9b58a', fg: '#2a2622', shutter: '#707a84' },
  { name: 'FRESH MILK · HONEY', bg: '#e7dfc6', fg: '#4a4036', shutter: '#8a8f6a' },
  { name: 'PHARMACY', bg: '#dce3e1', fg: '#3a4a52', shutter: '#707a84' },
  { name: 'HARDWARE', bg: '#8f8a7e', fg: '#fff', shutter: '#5f5a55' },
];
const KATSINA_SHOPS: TradeBoard[] = [
  { name: 'HATSI · GRAIN', bg: '#a0564a', fg: '#fff1cf', shutter: '#d9c3a0' },
  { name: 'CAPS · CLOTH', bg: '#3a4a52', fg: '#efe0cc', shutter: '#b98a6e' },
  { name: 'PROVISIONS', bg: '#d9c3a0', fg: '#2a1f17', shutter: '#9c4f3a' },
  { name: 'PHARMACY', bg: '#efe0cc', fg: '#3a4a52', shutter: '#6b5a46' },
  { name: 'TAILORING', bg: '#8a6a52', fg: '#fff1cf', shutter: '#efe0cc' },
  { name: 'WATER · TEA', bg: '#6b8794', fg: '#f4f1ea', shutter: '#d9c3a0' },
];
const BAUCHI_SHOPS: TradeBoard[] = [
  { name: 'GRAIN · GROUNDNUTS', bg: '#8e6b3e', fg: '#fff1cf', shutter: '#d9c3a0' },
  { name: 'CAPS · CLOTH', bg: '#3a4a52', fg: '#efe0cc', shutter: '#c4a67e' },
  { name: 'PROVISIONS', bg: '#d9c3a0', fg: '#2a1f17', shutter: '#6b4a2e' },
  { name: 'PHARMACY', bg: '#efe6d0', fg: '#3a4a52', shutter: '#8a7a64' },
  { name: 'TAILORING', bg: '#7a5a3a', fg: '#fff1cf', shutter: '#e9dcc0' },
  { name: 'WATER · TEA', bg: '#6b8794', fg: '#f4f1ea', shutter: '#d9c3a0' },
];
const SOKOTO_SHOPS: TradeBoard[] = [
  { name: 'LEATHER · BAGS', bg: '#7a4a2b', fg: '#fff1cf', shutter: '#d9c3a0' },
  { name: 'ONIONS · GARLIC', bg: '#8a4a5a', fg: '#fff1cf', shutter: '#e9dcc0' },
  { name: 'CAPS · CLOTH', bg: '#3a4a52', fg: '#efe0cc', shutter: '#c9ad84' },
  { name: 'PROVISIONS', bg: '#d9c3a0', fg: '#2a1f17', shutter: '#7a4a2b' },
  { name: 'PHARMACY', bg: '#efe6d0', fg: '#3a4a52', shutter: '#8a7a64' },
  { name: 'WATER · TEA', bg: '#6b8794', fg: '#f4f1ea', shutter: '#d9c3a0' },
];
const IBOM_SHOPS: TradeBoard[] = [
  { name: 'GARRI · PROVISIONS', bg: '#2e5a48', fg: '#f4f1ea', shutter: '#d9cdb0' },
  { name: 'RAFFIA · CRAFTS', bg: '#b89c5a', fg: '#2a1f17', shutter: '#2e5a48' },
  { name: 'FISH · CRAYFISH', bg: '#2f6e6a', fg: '#f4f1ea', shutter: '#e8dcc0' },
  { name: 'PURE WATER', bg: '#6a8a96', fg: '#f4f1ea', shutter: '#d8d2c2' },
  { name: 'TAILORING', bg: '#7a3a4a', fg: '#f0e6d2', shutter: '#c9ad84' },
  { name: 'RECHARGE · POS', bg: '#e8dcc0', fg: '#2e5a48', shutter: '#8a7a64' },
];
const IMO_SHOPS: TradeBoard[] = [
  { name: 'GARRI · TOMATOES', bg: '#8a5a3a', fg: '#fff1cf', shutter: '#d9cdb0' },
  { name: 'ONIONS · PEPPER', bg: '#7a3a4a', fg: '#f0e6d2', shutter: '#e7d9b6' },
  { name: 'PURE WATER', bg: '#2e6e73', fg: '#f4f1ea', shutter: '#d8d2c2' },
  { name: 'PROVISIONS', bg: '#d9cdb0', fg: '#2a1f17', shutter: '#2e6e73' },
  { name: 'TAILORING', bg: '#3c4b7a', fg: '#f0e6d2', shutter: '#c9ad84' },
  { name: 'RECHARGE · POS', bg: '#e7d9b6', fg: '#2e6e73', shutter: '#8a7a64' },
];
const EDO_SHOPS: TradeBoard[] = [
  { name: 'GARRI · PLANTAIN', bg: '#8a4b32', fg: '#fff1cf', shutter: '#d9cdb0' },
  { name: 'RUBBER · TIMBER', bg: '#4a5a36', fg: '#f4f1ea', shutter: '#d8c9a0' },
  { name: 'PURE WATER', bg: '#5a86a0', fg: '#f4f1ea', shutter: '#d8d2c2' },
  { name: 'PROVISIONS', bg: '#d9cdb0', fg: '#2a1f17', shutter: '#8a4b32' },
  { name: 'TAILORING', bg: '#7a3a3a', fg: '#f0e6d2', shutter: '#c9ad84' },
  { name: 'RECHARGE · POS', bg: '#e6d9c0', fg: '#4a3328', shutter: '#8a7a64' },
];
const ONDO_SHOPS: TradeBoard[] = [
  { name: 'COCOA · KOLA', bg: '#6b4226', fg: '#f4e6c8', shutter: '#d9cdb0' },
  { name: 'YAM · CASSAVA', bg: '#4a6a36', fg: '#f4f1ea', shutter: '#d8c9a0' },
  { name: 'FRESH FISH', bg: '#3f6f84', fg: '#f4f1ea', shutter: '#d8d2c2' },
  { name: 'PURE WATER', bg: '#5a86a0', fg: '#f4f1ea', shutter: '#d8d2c2' },
  { name: 'PROVISIONS', bg: '#d9cdb0', fg: '#2a1f17', shutter: '#6b4226' },
  { name: 'RECHARGE · POS', bg: '#e6dcc2', fg: '#2f4a2c', shutter: '#8a7a64' },
];
const CROSS_RIVER_SHOPS: TradeBoard[] = [
  { name: 'FRESH FISH', bg: '#3f6f84', fg: '#f4f1ea', shutter: '#d8d2c2' },
  { name: 'PLANTAIN · YAM', bg: '#4a6a36', fg: '#f4f1ea', shutter: '#d8c9a0' },
  { name: 'TAILORING', bg: '#7a2e4a', fg: '#f4f1ea', shutter: '#d9cdb0' },
  { name: 'PURE WATER', bg: '#5a86a0', fg: '#f4f1ea', shutter: '#d8d2c2' },
  { name: 'PROVISIONS', bg: '#d9cdb0', fg: '#2a1f17', shutter: '#7a2e4a' },
  { name: 'RECHARGE · POS', bg: '#e6dcc2', fg: '#2a2f3a', shutter: '#8a7a64' },
];
const JIGAWA_SHOPS: TradeBoard[] = [
  { name: 'RICE · GRAIN', bg: '#8c5a2b', fg: '#f4e6c8', shutter: '#d9cdb0' },
  { name: 'DATES · SPICES', bg: '#5a3a22', fg: '#f4e6c8', shutter: '#d8c9a0' },
  { name: 'COTTON · CLOTH', bg: '#2f3a66', fg: '#f4f1ea', shutter: '#d8d2c2' },
  { name: 'PURE WATER', bg: '#5a86a0', fg: '#f4f1ea', shutter: '#d8d2c2' },
  { name: 'PROVISIONS', bg: '#d9cdb0', fg: '#2a1f17', shutter: '#5a3a22' },
  { name: 'RECHARGE · POS', bg: '#e6dcc2', fg: '#3a2f20', shutter: '#8a7a64' },
];
const ADAMAWA_SHOPS: TradeBoard[] = [
  { name: 'GRAIN · ONIONS', bg: '#8a5a2b', fg: '#f4e6c8', shutter: '#d9cdb0' },
  { name: 'COTTON · CLOTH', bg: '#2f4560', fg: '#f4f1ea', shutter: '#d8d2c2' },
  { name: 'PROVISIONS', bg: '#d9cdb0', fg: '#2a1f17', shutter: '#5a3a22' },
  { name: 'PURE WATER', bg: '#5a86a0', fg: '#f4f1ea', shutter: '#d8d2c2' },
  { name: 'RECHARGE · POS', bg: '#e6dcc2', fg: '#3a3224', shutter: '#8a7a64' },
  { name: 'TAILORING', bg: '#5e8a46', fg: '#f4f1ea', shutter: '#d8c9a0' },
];
const FCT_SHOPS: TradeBoard[] = [
  { name: 'PRINT · COPY', bg: '#2f4560', fg: '#f4f1ea', shutter: '#d8d8d2' },
  { name: 'FRESH PRODUCE', bg: '#6a7a3c', fg: '#f4f1ea', shutter: '#d8d2c2' },
  { name: 'PHARMACY', bg: '#e6e2d6', fg: '#26363f', shutter: '#8a9094' },
  { name: 'PURE WATER', bg: '#5a86a0', fg: '#f4f1ea', shutter: '#d8d2c2' },
  { name: 'POS · AIRTIME', bg: '#e6dcc2', fg: '#2a2f36', shutter: '#8a8f94' },
  { name: 'PROVISIONS', bg: '#d9d4c4', fg: '#2a2f36', shutter: '#4a5560' },
];
const OSUN_SHOPS: TradeBoard[] = [
  { name: 'ADIRE · ARO', bg: '#2b3a6b', fg: '#f4f1ea', shutter: '#d9d2bc' },
  { name: 'ASO · ANKARA', bg: '#5e7a3a', fg: '#f4f1ea', shutter: '#d8c9a0' },
  { name: 'COCOA · KOLA', bg: '#6b4226', fg: '#f4e6c8', shutter: '#d9cdb0' },
  { name: 'PURE WATER', bg: '#5a86a0', fg: '#f4f1ea', shutter: '#d8d2c2' },
  { name: 'PROVISIONS', bg: '#d9cdb0', fg: '#2a1f17', shutter: '#2b3a6b' },
  { name: 'RECHARGE · POS', bg: '#e6dcc2', fg: '#26304f', shutter: '#8a7a64' },
];
const ABIA_SHOPS: TradeBoard[] = [
  { name: 'SHOES · SANDALS', bg: '#7a4a2b', fg: '#fff1cf', shutter: '#d9cdb0' },
  { name: 'BELTS · BAGS', bg: '#2f3a44', fg: '#f0e6d2', shutter: '#c9ad84' },
  { name: 'FABRICS · LACE', bg: '#3f6b5a', fg: '#f4f1ea', shutter: '#d8c9a0' },
  { name: 'TAILORING', bg: '#7a3a4a', fg: '#f0e6d2', shutter: '#c9ad84' },
  { name: 'PURE WATER', bg: '#5a86a0', fg: '#f4f1ea', shutter: '#d8d2c2' },
  { name: 'RECHARGE · POS', bg: '#e6dcc2', fg: '#3a3f46', shutter: '#8a7a64' },
];
const BENUE_SHOPS: TradeBoard[] = [
  { name: 'YAM · RICE', bg: '#7a5a2a', fg: '#fff1cf', shutter: '#d9cdb0' },
  { name: 'SOYA · BEANS', bg: '#4a6a36', fg: '#f4f1ea', shutter: '#d8c9a0' },
  { name: 'BUKA · CHOP', bg: '#a8553b', fg: '#f4f1ea', shutter: '#d8d2c2' },
  { name: 'PURE WATER', bg: '#5a86a0', fg: '#f4f1ea', shutter: '#d8d2c2' },
  { name: 'PROVISIONS', bg: '#d9cdb0', fg: '#2a1f17', shutter: '#2f6f8f' },
  { name: 'RECHARGE · POS', bg: '#e6dcc2', fg: '#33403a', shutter: '#8a7a64' },
];
const OGUN_SHOPS: TradeBoard[] = [
  { name: 'ADIRE · ASO OKE', bg: '#2b3045', fg: '#f0e6d2', shutter: '#b8b6ae' },
  { name: 'CEMENT · BLOCKS', bg: '#8d8f90', fg: '#fff', shutter: '#2b3045' },
  { name: 'PROVISIONS', bg: '#c9b88c', fg: '#2a1f17', shutter: '#4a5a66' },
  { name: 'PURE WATER', bg: '#6a8a96', fg: '#f4f1ea', shutter: '#d8d2c2' },
  { name: 'BUKA · CHOP', bg: '#7a5a3a', fg: '#fff1cf', shutter: '#d8d2c2' },
  { name: 'POS · AIRTIME', bg: '#d8d2c2', fg: '#2b3045', shutter: '#8a7a64' },
];

export function regionalFacadeTexture(variant: number, set: string) {
  switch (set) {
    case 'sandcrete':
      return plainFacade('sandcrete', 3600, ['#e4dcc8', '#d8d0bc', '#c9c0aa', '#e8ddc6', '#cfd2c4', '#dccfb2'], variant, '#707a84');
    case 'relief-render':
      return plainFacade('relief-render', 3700, ['#ead8c0', '#e2c8ae', '#d9b9a0', '#eee0cb', '#dcc2a6', '#e6d2b8'], variant, '#9c4f3a', '#b98a6e');
    case 'bauchi-render':
      return plainFacade('bauchi-render', 3900, ['#e9dcc0', '#e0cfae', '#d8c29c', '#eee2c8', '#dfc9a4', '#e4d5b6'], variant, '#6b4a2e', '#c4a67e');
    case 'sokoto-render':
      return plainFacade('sokoto-render', 4000, ['#eee0c6', '#e6d4b4', '#dcc79f', '#f0e5cf', '#e2cfa8', '#e8d9bc'], variant, '#7a4a2b', '#c9ad84');
    case 'ibom-render':
      return plainFacade('ibom-render', 4100, ['#ece6d6', '#e2dccb', '#d6d0bd', '#efe9da', '#dcd6c4', '#e6e0cf'], variant, '#2e5a48');
    case 'benue-render':
      return plainFacade('benue-render', 4600, ['#ece2c8', '#e2d4b0', '#d8c48e', '#efe6cf', '#dccca0', '#e6dab8'], variant, '#33403a', '#b89a62');
    case 'abia-render':
      return plainFacade('abia-render', 4500, ['#ece4cd', '#e0d8bf', '#c6d2b0', '#efe8d4', '#d8d0b6', '#e4dcc4'], variant, '#3a3f46', '#9a6a3c');
    case 'calabar-render':
      return plainFacade('calabar-render', 5100, ['#ece4d0', '#dcd8c0', '#cdbfa8', '#efe8d6', '#d4ccb4', '#e4dcc8'], variant, '#7a2e4a', '#a8967a');
    case 'jigawa-render':
      return plainFacade('jigawa-render', 5000, ['#ecdfc4', '#e4d2ae', '#d8c08c', '#efe4cb', '#dcc89c', '#e6d8b8'], variant, '#5a3a22', '#c0a468');
    case 'fct-render':
      return plainFacade('fct-render', 5200, ['#ece9e2', '#e0ddd5', '#d6d3cb', '#f0eee8', '#cfd4d6', '#dfe3e6'], variant, '#4a5560', '#b8bcc0');
    case 'adamawa-render':
      return plainFacade('adamawa-render', 4900, ['#eadcc0', '#e0cfae', '#d4bd94', '#eee2c8', '#d8c49e', '#e4d5b6'], variant, '#5a3a22', '#b9a06c');
    case 'osun-render':
      return plainFacade('osun-render', 4800, ['#eae2cc', '#dcd8bc', '#c8cfb4', '#ede6d0', '#d2cdb2', '#e2dcc4'], variant, '#2b3a6b', '#9aa8c4');
    case 'ondo-render':
      return plainFacade('ondo-render', 4400, ['#eae0c8', '#dfd6b8', '#c9d0b0', '#ede4cd', '#d4cbb0', '#e2dac0'], variant, '#6b4226', '#a8b48c');
    case 'edo-render':
      return plainFacade('edo-render', 4300, ['#ede0c6', '#e4d3b6', '#d8b494', '#efe3cc', '#dcc4a4', '#e6d6bc'], variant, '#8a4b32', '#c98f6a');
    case 'imo-render':
      return plainFacade('imo-render', 4200, ['#ede3cc', '#e4d6bc', '#d8b9a2', '#efe6d2', '#dccab0', '#e6d9c0'], variant, '#2e6e73');
    case 'ogun-block':
      return plainFacade('ogun-block', 3800, ['#e6e2d4', '#d8d2c2', '#c9b88c', '#b8b6ae', '#e2d8bf', '#cfd2d4'], variant, '#2b3045');
    case 'sand-clay':
      return sandClayFacade(variant);
    case 'earth-plaster':
      return earthPlasterFacade(variant);
    case 'plank':
      return plankFacade(variant);
    case 'plaster':
      return plasterFacade(variant);
    case 'mud':
      return mudFacade(variant);
    case 'block':
      return blockFacade(variant);
    case 'plaza':
      return plazaFacade(variant);
    case 'limewash':
      return limewashFacade(variant);
    default:
      throw new Error(`Unknown facade set: ${set}`);
  }
}

// ------------------------------------------------------------------ shops

/**
 * Shop fronts for the northern markets. Wording is plain, common Hausa and
 * English trade words. Each is flagged for a native speaker in the research
 * dossier before a state is called verified.
 */
const SAHEL_SHOPS = [
  // Ochre, indigo and sand: no saturated green, red or royal blue, and no green-and-white
  // anywhere, so no board or awning can read as a party's colours (dossier, section 6).
  { name: 'KAYAN ABINCI', bg: '#8a5a2b', fg: '#fff1cf', awning: '#c98f3a' },
  { name: 'TELA · TAILOR', bg: '#2d3c73', fg: '#f4f1ea', awning: '#8ea4ae' },
  { name: 'RUWAN SHA', bg: '#5b7f8a', fg: '#f4f1ea', awning: '#c98f3a' },
  { name: 'GIDAN BURODI', bg: '#b3611e', fg: '#fff1cf', awning: '#2d3c73' },
  { name: 'PATENT MEDICINE', bg: '#6b5a3a', fg: '#fff1cf', awning: '#8ea4ae' },
  { name: 'KAYAN GIDA', bg: '#3b5a80', fg: '#f4f1ea', awning: '#8a5a2b' },
];
export const SAHEL_SHOP_VARIANTS = SAHEL_SHOPS.length;

function sahelShop(variant: number) {
  const v = variant % SAHEL_SHOPS.length;
  return memo(`shop:sahel:${v}`, () => {
    const s = SAHEL_SHOPS[v]!;
    const { c, ctx } = canvas(256, 256);
    const r = mulberry(900 + v);
    ctx.fillStyle = '#d6b78a';
    ctx.fillRect(0, 0, 256, 256);
    speckle(ctx, 256, 256, 1400, 0.12, 170 + v);
    // painted sign board
    ctx.fillStyle = s.bg;
    ctx.fillRect(10, 16, 236, 58);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(10, 16, 236, 9);
    ctx.fillStyle = s.fg;
    let size = 28;
    ctx.font = `900 ${size}px Arial Black, Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    while (ctx.measureText(s.name).width > 214 && size > 12) {
      size -= 2;
      ctx.font = `900 ${size}px Arial Black, Arial, sans-serif`;
    }
    ctx.fillText(s.name, 128, 46);
    // open front: dark interior, goods, a woven mat on the ground
    ctx.fillStyle = '#2a1f17';
    ctx.fillRect(18, 90, 220, 158);
    for (let i = 0; i < 22; i++) {
      ctx.fillStyle = `hsl(${r.range(0, 360)},62%,52%)`;
      ctx.fillRect(r.range(26, 215), r.range(108, 214), r.range(10, 24), r.range(10, 22));
    }
    ctx.fillStyle = '#a9794a';
    ctx.fillRect(18, 216, 220, 32);
    // striped canvas shade across the top of the opening
    for (let x = 18; x < 238; x += 22) {
      ctx.fillStyle = (x / 22) % 2 < 1 ? s.awning : '#f4f1ea';
      ctx.fillRect(x, 90, 22, 22);
    }
    return toTex(c);
  });
}


/** Shop boards for the oil city: plain English and Nigerian Pidgin trade words, nothing religious or personal. */
const DELTA_SHOPS = [
  { name: 'BOLE & FISH', bg: '#a8553b', fg: '#fff1cf', awning: '#c98f3a' },
  { name: 'OKRIKA · ALL SIZE', bg: '#2a6f73', fg: '#f4f1ea', awning: '#c98f3a' },
  { name: 'FRESH FISH', bg: '#2d3c73', fg: '#f4f1ea', awning: '#8ea4ae' },
  { name: 'BARBING SALON', bg: '#6b5a3a', fg: '#fff1cf', awning: '#2a6f73' },
  { name: 'PHONE · CHARGE', bg: '#3b5a80', fg: '#f4f1ea', awning: '#c98f3a' },
  { name: 'PHARMACY', bg: '#3a5a60', fg: '#f4f1ea', awning: '#c98f3a' },
];
export const DELTA_SHOP_VARIANTS = DELTA_SHOPS.length;

function deltaShop(variant: number) {
  const v = variant % DELTA_SHOPS.length;
  return memo(`shop:delta:${v}`, () => {
    const s = DELTA_SHOPS[v]!;
    const { c, ctx } = canvas(256, 256);
    const r = mulberry(1500 + v);
    ctx.fillStyle = '#d8cdb0';
    ctx.fillRect(0, 0, 256, 256);
    speckle(ctx, 256, 256, 1400, 0.12, 250 + v);
    ctx.fillStyle = s.bg;
    ctx.fillRect(10, 16, 236, 58);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(10, 16, 236, 9);
    ctx.fillStyle = s.fg;
    let size = 28;
    ctx.font = `900 ${size}px Arial Black, Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    while (ctx.measureText(s.name).width > 214 && size > 12) {
      size -= 2;
      ctx.font = `900 ${size}px Arial Black, Arial, sans-serif`;
    }
    ctx.fillText(s.name, 128, 46);
    // open front with a roll-up shutter half raised, goods inside
    ctx.fillStyle = '#2a1f17';
    ctx.fillRect(18, 90, 220, 158);
    for (let i = 0; i < 20; i++) {
      ctx.fillStyle = `hsl(${r.range(0, 360)},55%,50%)`;
      ctx.fillRect(r.range(26, 215), r.range(120, 214), r.range(10, 24), r.range(10, 22));
    }
    ctx.fillStyle = '#9a9690';
    ctx.fillRect(18, 90, 220, 26);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    for (let y = 94; y < 116; y += 6) ctx.fillRect(18, y, 220, 2);
    for (let x = 18; x < 238; x += 22) {
      ctx.fillStyle = (x / 22) % 2 < 1 ? s.awning : '#f4f1ea';
      ctx.fillRect(x, 78, 22, 14);
    }
    return toTex(c);
  });
}

/** Trade boards for the south-eastern towns: plain English trade words and "Mama Put", nothing personal or religious. */
const IGBO_SHOPS = [
  { name: 'SPARE PARTS', bg: '#7a2f3e', fg: '#f4f1ea', shutter: '#5e9c95' },
  { name: 'TYRES · BATTERIES', bg: '#3c4b7a', fg: '#f4f1ea', shutter: '#9c5a3a' },
  { name: 'MINI MART', bg: '#e7d9b6', fg: '#3c2a1a', shutter: '#7a2f3e' },
  { name: 'MAMA PUT · CHOP', bg: '#9c5a3a', fg: '#fff1cf', shutter: '#3c4b7a' },
  { name: 'BOUTIQUE', bg: '#5e9c95', fg: '#1f2a28', shutter: '#e7d9b6' },
  { name: 'AUTO SPARES', bg: '#2f3a44', fg: '#f4f1ea', shutter: '#9c5a3a' },
];
export const IGBO_SHOP_VARIANTS = IGBO_SHOPS.length;

function igboShop(variant: number) {
  const v = variant % IGBO_SHOPS.length;
  return memo(`shop:igbo:${v}`, () => {
    const s = IGBO_SHOPS[v]!;
    const { c, ctx } = canvas(256, 256);
    const r = mulberry(1900 + v);
    ctx.fillStyle = '#d8cdb0';
    ctx.fillRect(0, 0, 256, 256);
    speckle(ctx, 256, 256, 1400, 0.12, 290 + v);
    // stacked fascia: a main board and a thin sub-board above it
    ctx.fillStyle = s.shutter;
    ctx.fillRect(10, 8, 236, 14);
    ctx.fillStyle = s.bg;
    ctx.fillRect(10, 24, 236, 52);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(10, 24, 236, 8);
    ctx.fillStyle = s.fg;
    ctx.font = 'bold 30px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(s.name, 128, 59, 224);
    // shop front: dark interior, goods, shutter half rolled up in the shop's colour
    ctx.fillStyle = '#2a1f17';
    ctx.fillRect(18, 90, 220, 158);
    for (let i = 0; i < 20; i++) {
      ctx.fillStyle = `hsl(${r.range(0, 360)},50%,48%)`;
      ctx.fillRect(r.range(26, 215), r.range(124, 214), r.range(10, 24), r.range(10, 22));
    }
    ctx.fillStyle = s.shutter;
    ctx.fillRect(18, 90, 220, 30);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    for (let y = 94; y < 120; y += 6) ctx.fillRect(18, y, 220, 2);
    return toTex(c);
  });
}

/** Trade boards for northern city streets: English trade words and plain Hausa, nothing personal or religious. */
const HAUSA_CITY_SHOPS = [
  { name: 'KASUWA', bg: '#cda66b', fg: '#2a1f17', shutter: '#4f6d85' },
  { name: 'PROVISIONS', bg: '#4f6d85', fg: '#f4f1ea', shutter: '#cda66b' },
  { name: 'CHEMIST', bg: '#eadfc6', fg: '#3a4a52', shutter: '#4f6d85' },
  { name: 'BARBING SALON', bg: '#6b5a3a', fg: '#fff1cf', shutter: '#cda66b' },
  { name: 'BURGLAR-PROOF & GATES', bg: '#3a4a52', fg: '#f4f1ea', shutter: '#a5573a' },
  { name: 'TAILORING', bg: '#a5573a', fg: '#fff1cf', shutter: '#eadfc6' },
];
export const HAUSA_CITY_SHOP_VARIANTS = HAUSA_CITY_SHOPS.length;

function hausaCityShop(variant: number) {
  const v = variant % HAUSA_CITY_SHOPS.length;
  return memo(`shop:hausa-city:${v}`, () => {
    const s = HAUSA_CITY_SHOPS[v]!;
    const { c, ctx } = canvas(256, 256);
    const r = mulberry(2300 + v);
    ctx.fillStyle = '#d8cdb0';
    ctx.fillRect(0, 0, 256, 256);
    speckle(ctx, 256, 256, 1400, 0.12, 330 + v);
    ctx.fillStyle = s.bg;
    ctx.fillRect(10, 16, 236, 58);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(10, 16, 236, 9);
    ctx.fillStyle = s.fg;
    ctx.font = 'bold 28px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(s.name, 128, 54, 224);
    ctx.fillStyle = '#2a1f17';
    ctx.fillRect(18, 90, 220, 158);
    for (let i = 0; i < 18; i++) {
      ctx.fillStyle = `hsl(${r.range(0, 360)},45%,48%)`;
      ctx.fillRect(r.range(26, 215), r.range(124, 214), r.range(10, 24), r.range(10, 22));
    }
    // rolling shutter half up, and an iron grille across the opening
    ctx.fillStyle = s.shutter;
    ctx.fillRect(18, 90, 220, 28);
    ctx.strokeStyle = '#1c1a18';
    ctx.lineWidth = 3;
    for (let x = 30; x < 238; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 120);
      ctx.lineTo(x, 248);
      ctx.stroke();
    }
    return toTex(c);
  });
}

/** Trade boards for Warri, Sapele and Asaba: English and Nigerian Pidgin trade words, nothing personal or religious. */
const WARRI_SHOPS = [
  { name: 'GARRI · BEANS · OIL', bg: '#8a7358', fg: '#fff1cf', awning: '#b8892e' },
  { name: 'TIMBER · PLANKS', bg: '#6b5a3a', fg: '#fff1cf', awning: '#a9c0a8' },
  { name: 'POS · CASH OUT', bg: '#4d6f86', fg: '#f4f1ea', awning: '#c9b58a' },
  { name: 'FRESH FISH', bg: '#2e5e5a', fg: '#f4f1ea', awning: '#b8892e' },
  { name: 'BARBING · SALON', bg: '#7a2f3e', fg: '#f4f1ea', awning: '#c9b58a' },
  { name: 'PHONE · CHARGE', bg: '#3c4b7a', fg: '#f4f1ea', awning: '#b97a84' },
];
export const WARRI_SHOP_VARIANTS = WARRI_SHOPS.length;

function warriShop(variant: number) {
  const v = variant % WARRI_SHOPS.length;
  return memo(`shop:warri:${v}`, () => {
    const s = WARRI_SHOPS[v]!;
    const { c, ctx } = canvas(256, 256);
    const r = mulberry(2700 + v);
    ctx.fillStyle = '#d9c9a4';
    ctx.fillRect(0, 0, 256, 256);
    speckle(ctx, 256, 256, 1400, 0.12, 370 + v);
    // a fascia board with a thin trim board over it
    ctx.fillStyle = '#4f4a42';
    ctx.fillRect(10, 8, 236, 8);
    ctx.fillStyle = s.bg;
    ctx.fillRect(10, 18, 236, 56);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(10, 18, 236, 8);
    ctx.fillStyle = s.fg;
    let size = 28;
    ctx.font = `900 ${size}px Arial Black, Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    while (ctx.measureText(s.name).width > 214 && size > 12) {
      size -= 2;
      ctx.font = `900 ${size}px Arial Black, Arial, sans-serif`;
    }
    ctx.fillText(s.name, 128, 47);
    // open front with goods in sacks and basins, a plank counter
    ctx.fillStyle = '#2a1f17';
    ctx.fillRect(18, 90, 220, 158);
    for (let i = 0; i < 20; i++) {
      ctx.fillStyle = `hsl(${r.range(20, 60)},38%,${r.range(40, 62)}%)`;
      ctx.fillRect(r.range(26, 215), r.range(112, 214), r.range(10, 24), r.range(10, 22));
    }
    ctx.fillStyle = '#8a7358';
    ctx.fillRect(18, 216, 220, 32);
    for (let x = 18; x < 238; x += 22) {
      ctx.fillStyle = (x / 22) % 2 < 1 ? s.awning : '#f4f1ea';
      ctx.fillRect(x, 78, 22, 14);
    }
    return toTex(c);
  });
}


/** Trade boards for Ilorin: English trade words and plain Yoruba (aṣọ òkè), nothing personal or religious. */
const ILORIN_SHOPS = [
  { name: 'POTS · BOWLS', bg: '#a9573a', fg: '#fff1cf', shutter: '#4f6d85' },
  { name: 'TOMATO · PEPPER', bg: '#6e7442', fg: '#f4f1ea', shutter: '#c99a62' },
  { name: 'ASO OKE · CLOTH', bg: '#2f3a66', fg: '#f4f1ea', shutter: '#b79a6a' },
  { name: 'VULCANIZER', bg: '#3a4a52', fg: '#f4f1ea', shutter: '#a9573a' },
  { name: 'POS · AIRTIME', bg: '#7a2f3e', fg: '#f4f1ea', shutter: '#c99a62' },
  { name: 'PROVISIONS', bg: '#c99a62', fg: '#2a1f17', shutter: '#2f3a66' },
];
export const ILORIN_SHOP_VARIANTS = ILORIN_SHOPS.length;

function ilorinShop(variant: number) {
  const v = variant % ILORIN_SHOPS.length;
  return memo(`shop:ilorin:${v}`, () => {
    const s = ILORIN_SHOPS[v]!;
    const { c, ctx } = canvas(256, 256);
    const r = mulberry(2900 + v);
    ctx.fillStyle = '#d9c4a0';
    ctx.fillRect(0, 0, 256, 256);
    speckle(ctx, 256, 256, 1400, 0.12, 390 + v);
    ctx.fillStyle = s.bg;
    ctx.fillRect(10, 16, 236, 58);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(10, 16, 236, 9);
    ctx.fillStyle = s.fg;
    ctx.font = 'bold 28px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(s.name, 128, 54, 224);
    ctx.fillStyle = '#2a1f17';
    ctx.fillRect(18, 90, 220, 158);
    for (let i = 0; i < 20; i++) {
      ctx.fillStyle = `hsl(${r.range(8, 45)},${r.range(35, 55)}%,${r.range(38, 60)}%)`;
      ctx.fillRect(r.range(26, 215), r.range(124, 214), r.range(10, 24), r.range(10, 22));
    }
    ctx.fillStyle = s.shutter;
    ctx.fillRect(18, 90, 220, 28);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    for (let y = 94; y < 118; y += 6) ctx.fillRect(18, y, 220, 2);
    return toTex(c);
  });
}

/** Trade boards for Ibadan: English trade words and a little Yoruba (adire), nothing personal or religious. */
const IBADAN_SHOPS = [
  { name: 'ADIRE · CLOTH', bg: '#2e3c69', fg: '#f1eee4', shutter: '#cdbb95' },
  { name: 'PURE WATER', bg: '#5b7f8a', fg: '#f4f1ea', shutter: '#8a5a3c' },
  { name: 'IRON · BEANS', bg: '#6b3a28', fg: '#fff1cf', shutter: '#cdbb95' },
  { name: 'POS · AIRTIME', bg: '#7a2f3e', fg: '#f4f1ea', shutter: '#cdbb95' },
  { name: 'COCOA · KOLA', bg: '#6f4a2e', fg: '#fff1cf', shutter: '#8db1a8' },
  { name: 'PROVISIONS', bg: '#c99e62', fg: '#2a1f17', shutter: '#2e3c69' },
];
export const IBADAN_SHOP_VARIANTS = IBADAN_SHOPS.length;

function ibadanShop(variant: number) {
  const v = variant % IBADAN_SHOPS.length;
  return memo(`shop:ibadan:${v}`, () => {
    const s = IBADAN_SHOPS[v]!;
    const { c, ctx } = canvas(256, 256);
    const r = mulberry(3100 + v);
    ctx.fillStyle = '#e0d4b8';
    ctx.fillRect(0, 0, 256, 256);
    speckle(ctx, 256, 256, 1400, 0.12, 410 + v);
    ctx.fillStyle = s.bg;
    ctx.fillRect(10, 16, 236, 58);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(10, 16, 236, 9);
    ctx.fillStyle = s.fg;
    ctx.font = 'bold 28px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(s.name, 128, 54, 224);
    ctx.fillStyle = '#2a1f17';
    ctx.fillRect(18, 90, 220, 158);
    for (let i = 0; i < 20; i++) {
      ctx.fillStyle = `hsl(${r.range(10, 50)},${r.range(30, 50)}%,${r.range(36, 58)}%)`;
      ctx.fillRect(r.range(26, 215), r.range(124, 214), r.range(10, 24), r.range(10, 22));
    }
    ctx.fillStyle = s.shutter;
    ctx.fillRect(18, 90, 220, 28);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    for (let y = 94; y < 118; y += 6) ctx.fillRect(18, y, 220, 2);
    return toTex(c);
  });
}

/** Trade boards for Maiduguri-style streets: English trade words and plain Hausa, nothing personal or religious. */
const BORNO_SHOPS = [
  { name: 'CAPS · CLOTH', bg: '#2f4560', fg: '#f4f1ea', shutter: '#d3bf98' },
  { name: 'WATER · COLD DRINKS', bg: '#5b7f8a', fg: '#f4f1ea', shutter: '#b58e62' },
  { name: 'PROVISIONS', bg: '#b58e62', fg: '#2a1f17', shutter: '#2f4560' },
  { name: 'TEA · BREAD', bg: '#6b5a3a', fg: '#fff1cf', shutter: '#d3bf98' },
  { name: 'PHARMACY', bg: '#e6dcc4', fg: '#3a4a52', shutter: '#2f4560' },
  { name: 'TAILORING', bg: '#8b5a2b', fg: '#fff1cf', shutter: '#e6dcc4' },
];
export const BORNO_SHOP_VARIANTS = BORNO_SHOPS.length;

function bornoShop(variant: number) {
  const v = variant % BORNO_SHOPS.length;
  return memo(`shop:borno:${v}`, () => {
    const s = BORNO_SHOPS[v]!;
    const { c, ctx } = canvas(256, 256);
    const r = mulberry(3500 + v);
    ctx.fillStyle = '#dccdac';
    ctx.fillRect(0, 0, 256, 256);
    speckle(ctx, 256, 256, 1400, 0.1, 450 + v);
    ctx.fillStyle = s.bg;
    ctx.fillRect(10, 16, 236, 58);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(10, 16, 236, 9);
    ctx.fillStyle = s.fg;
    ctx.font = 'bold 28px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(s.name, 128, 54, 224);
    ctx.fillStyle = '#2a1f17';
    ctx.fillRect(18, 90, 220, 158);
    for (let i = 0; i < 18; i++) {
      ctx.fillStyle = `hsl(${r.range(20, 48)},${r.range(25, 45)}%,${r.range(42, 66)}%)`;
      ctx.fillRect(r.range(26, 215), r.range(124, 214), r.range(10, 24), r.range(10, 22));
    }
    ctx.fillStyle = s.shutter;
    ctx.fillRect(18, 90, 220, 28);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    for (let y = 94; y < 118; y += 6) ctx.fillRect(18, y, 220, 2);
    return toTex(c);
  });
}

export function regionalShopTexture(variant: number, set: string) {
  switch (set) {
    case 'enugu':
      return tradeShop('enugu', 3900, '#ddd2b8', ENUGU_SHOPS, variant, [30, 60]);
    case 'jos':
      return tradeShop('jos', 4000, '#dcd6c4', JOS_SHOPS, variant, [60, 110]);
    case 'bauchi':
      return tradeShop('bauchi', 4300, '#e4d5b6', BAUCHI_SHOPS, variant, [24, 46]);
    case 'sokoto':
      return tradeShop('sokoto', 4400, '#e8d9bc', SOKOTO_SHOPS, variant, [18, 40]);
    case 'ibom':
      return tradeShop('ibom', 4500, '#e4dcc8', IBOM_SHOPS, variant, [80, 170]);
    case 'benue':
      return tradeShop('benue', 5000, '#e6dcc0', BENUE_SHOPS, variant, [90, 130]);
    case 'abia':
      return tradeShop('abia', 4900, '#e4dcc6', ABIA_SHOPS, variant, [140, 200]);
    case 'ondo':
      return tradeShop('ondo', 4800, '#e4dcc2', ONDO_SHOPS, variant, [100, 160]);
    case 'cross-river':
      return tradeShop('cross-river', 5100, '#e6dcc6', CROSS_RIVER_SHOPS, variant, [150, 200]);
    case 'jigawa':
      return tradeShop('jigawa', 5050, '#e6d8b8', JIGAWA_SHOPS, variant, [24, 60]);
    case 'fct':
      return tradeShop('fct', 5250, '#e6e4dc', FCT_SHOPS, variant, [190, 230]);
    case 'adamawa':
      return tradeShop('adamawa', 4950, '#e4d8bc', ADAMAWA_SHOPS, variant, [30, 70]);
    case 'osun':
      return tradeShop('osun', 4850, '#e4dcc4', OSUN_SHOPS, variant, [220, 250]);
    case 'edo':
      return tradeShop('edo', 4700, '#e6d6bc', EDO_SHOPS, variant, [12, 34]);
    case 'imo':
      return tradeShop('imo', 4600, '#e6d9c0', IMO_SHOPS, variant, [10, 30]);
    case 'katsina':
      return tradeShop('katsina', 4100, '#e2cfb6', KATSINA_SHOPS, variant, [18, 44]);
    case 'ogun':
      return tradeShop('ogun', 4200, '#ddd6c2', OGUN_SHOPS, variant, [200, 240]);
    case 'borno':
      return bornoShop(variant);
    case 'ibadan':
      return ibadanShop(variant);
    case 'ilorin':
      return ilorinShop(variant);
    case 'warri':
      return warriShop(variant);
    case 'delta':
      return deltaShop(variant);
    case 'sahel':
      return sahelShop(variant);
    case 'igbo':
      return igboShop(variant);
    case 'hausa-city':
      return hausaCityShop(variant);
    default:
      throw new Error(`Unknown shop set: ${set}`);
  }
}
