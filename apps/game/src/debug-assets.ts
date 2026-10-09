import * as THREE from 'three';
import { biomeAssetIds, buildInstancedProp, loadAsset, preloadBiome } from './render/assets';

/**
 * C20 pipeline proof: loads the Lagos CC0 biome kit, instances a few props,
 * and renders them in a bare scene. Not part of the shipped game — reachable
 * only via `pnpm --filter @cr/game dev` + /debug-assets.html. Superseded by
 * the real world.ts integration in C23.
 */
const hud = document.getElementById('hud')!;
const log = (s: string) => {
  hud.textContent += `\n${s}`;
};

async function main() {
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
