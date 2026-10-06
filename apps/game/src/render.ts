import * as THREE from 'three';
import type { SimState } from '@cr/sim';

export class GameRenderer {
  public canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  
  private playerMesh: THREE.Mesh;
  private entityMeshes = new Map<number, THREE.Mesh>();

  private roadWidth = 6; // units
  private mmToUnits = 0.001; // 1000mm = 1 unit

  constructor() {
    this.canvas = document.createElement('canvas');
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#A8DADC'); // Sky color from states
    this.scene.fog = new THREE.Fog('#E0F2F1', 10, 50);

    // Camera: behind and above player
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    
    // Lights
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(-5, 10, 5);
    this.scene.add(dirLight);
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.4));

    // Ground
    const groundGeo = new THREE.PlaneGeometry(100, 1000);
    const groundMat = new THREE.MeshLambertMaterial({ color: '#8D7B68' });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    this.scene.add(ground);

    // Road
    const roadGeo = new THREE.PlaneGeometry(this.roadWidth, 1000);
    const roadMat = new THREE.MeshLambertMaterial({ color: '#333333' });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    this.scene.add(road);

    // Player (Yellow Danfo Bus placeholder)
    const pGeo = new THREE.BoxGeometry(1, 1.2, 2);
    const pMat = new THREE.MeshLambertMaterial({ color: '#ffcc00' });
    this.playerMesh = new THREE.Mesh(pGeo, pMat);
    this.scene.add(this.playerMesh);
  }

  resize() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }

  render(state: SimState) {
    const pZ = state.z * this.mmToUnits;
    const pX = (state.laneX - 1000) * this.mmToUnits;
    const pY = state.hopT > 0 ? 1.0 : 0.6; // simple hop

    this.playerMesh.position.set(pX, pY, -pZ);

    // Camera follows player
    this.camera.position.set(pX * 0.5, 3, -pZ + 5);
    this.camera.lookAt(pX * 0.2, 0, -pZ - 5);

    // Update entities
    const activeIds = new Set<number>();
    
    for (const ent of state.entities) {
      if (!ent.active) continue;
      activeIds.add(ent.id);
      
      let mesh = this.entityMeshes.get(ent.id);
      if (!mesh) {
        // Spawn basic obstacle or pickup
        const eGeo = new THREE.BoxGeometry(
          ent.halfWidthMm * 2 * this.mmToUnits,
          ent.heightMm * this.mmToUnits || 1,
          ent.halfLenMm * 2 * this.mmToUnits
        );
        const color = ent.isPickup ? '#2a9d8f' : '#e76f51';
        const eMat = new THREE.MeshLambertMaterial({ color });
        mesh = new THREE.Mesh(eGeo, eMat);
        this.scene.add(mesh);
        this.entityMeshes.set(ent.id, mesh);
      }
      
      const eX = (ent.lane - 1) * 2; // lane 0,1,2 -> -2,0,2
      const eZ = -ent.z * this.mmToUnits;
      mesh.position.set(eX, (ent.heightMm * this.mmToUnits)/2 || 0.5, eZ);
    }

    // Cleanup despawned
    for (const [id, mesh] of this.entityMeshes.entries()) {
      if (!activeIds.has(id)) {
        this.scene.remove(mesh);
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
        this.entityMeshes.delete(id);
      }
    }

    this.renderer.render(this.scene, this.camera);
  }
}
