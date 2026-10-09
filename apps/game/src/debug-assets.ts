import * as THREE from 'three';
import { biomeAssetIds, buildInstancedProp, loadAsset, preloadBiome } from './render/assets';
import { bakeCharacter, buildCharacter, poseCharacter } from './render/character';
import { vcMat } from './render/materials';

/**
 * C20/C21 pipeline proof. Not part of the shipped game — reachable only via
 * `pnpm --filter @cr/game dev` + /debug-assets.html(?face=1). Superseded by
 * the real world.ts integration (C23) / in-game rendering (C21 already real).
 */
const hud = document.getElementById('hud')!;
const log = (s: string) => {
  hud.textContent += `\n${s}`;
};

/** C21 close-up: a row of chibi heads at native res, for judging face-texture quality. */
function faceCheck() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#dce8f0');
  const camera = new THREE.PerspectiveCamera(35, innerWidth / innerHeight, 0.05, 50);
  camera.position.set(0.1, 0.7, 2.6);
  camera.lookAt(0.1, 0.6, 0);
  scene.add(new THREE.HemisphereLight('#fff6df', '#8d7a63', 1.3));
  const sun = new THREE.DirectionalLight('#fff1cf', 2.0);
  sun.position.set(-1, 2, 2);
  scene.add(sun);

  const skins = ['#5C3A24'];
  skins.forEach((skin, i) => {
    const look = {
      gender: (i % 2 ? 'f' : 'm') as 'f' | 'm',
      skin,
      hair: (i % 2 ? 'natural' : 'short') as 'short' | 'natural' | 'afro' | 'braids' | 'bald',
      hairColor: '#15100d',
      facialHair: 'none' as const,
      face: { width: 1, jaw: 1, nose: 1, lips: 1, brow: 1, eye: 1 },
      height: 1,
      build: 1,
      prop: 'none' as const,
      accessory: 'none' as const,
    };
    const outfit = {
      top: 'tee' as const,
      topColor: '#e0902b',
      bottom: 'trousers' as const,
      bottomColor: '#2f4a6b',
      footwear: 'sneakers' as const,
      footColor: '#F3E3C3',
      headwear: 'none' as const,
      headColor: '#e0902b',
    };
    const rig = buildCharacter(look, outfit, 'hi');
    poseCharacter(rig, 'cheer', i * 0.6, 1);
    rig.group.position.x = -0.5;
    scene.add(rig.group);

    // 'lo' detail (crowd path): baked single-buffer mesh, no outline/face-plate.
    const lo = bakeCharacter(look, { ...outfit, topColor: '#2a9d6f' }, 'wave', 0.3, 'lo');
    const loMesh = new THREE.Mesh(lo, vcMat());
    loMesh.position.x = 0.6;
    scene.add(loMesh);
  });
  log('rig rendered');

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  document.body.appendChild(renderer.domElement);
  renderer.render(scene, camera);
  log('face check rendered');
}

async function main() {
  if (new URLSearchParams(location.search).has('face')) {
    faceCheck();
    return;
  }
  const t0 = performance.now();
  await preloadBiome('lagos');
  const ids = biomeAssetIds('lagos');
  log(`loaded ${ids.length} assets in ${(performance.now() - t0).toFixed(0)}ms`);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#8fb8d8');
  const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 200);
  camera.position.set(6, 5, 10);
  camera.lookAt(0, 1, 0);
  scene.add(new THREE.HemisphereLight('#fff6df', '#8d7a63', 1.3));
  const sun = new THREE.DirectionalLight('#fff1cf', 2.0);
  sun.position.set(-6, 10, 4);
  scene.add(sun);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshStandardMaterial({ color: '#4a7a3c' }));
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  // One instanced prop per asset, laid out in a grid — proves loadAsset + buildInstancedProp end to end.
  const cols = 5;
  const spacing = 2.5;
  ids.forEach((id, i) => {
    loadAsset('lagos', id).then((template) => {
      const prop = buildInstancedProp(template, 1);
      const x = (i % cols) * spacing - (cols * spacing) / 2;
      const z = Math.floor(i / cols) * spacing - 4;
      const m = new THREE.Matrix4().compose(
        new THREE.Vector3(x, 0, z),
        new THREE.Quaternion(),
        new THREE.Vector3(1, 1, 1),
      );
      prop.setAt(0, m);
      scene.add(prop.group);
      log(`placed ${id}`);
    });
  });

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  document.body.appendChild(renderer.domElement);
  window.addEventListener('resize', () => {
    renderer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
  });

  function tick() {
    camera.position.x = Math.sin(performance.now() / 4000) * 12;
    camera.position.z = Math.cos(performance.now() / 4000) * 12 + 2;
    camera.lookAt(0, 1, 0);
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  tick();
}

main().catch((err) => log(`ERROR: ${String(err)}`));
