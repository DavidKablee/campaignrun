import { initState, seedRng, type SimState } from '@cr/sim';
import { simConfig, lagosLaunch, rides } from '@cr/content';
import type { CharacterLook, OutfitChoice } from '@cr/content';
import { GameRenderer } from './GameRenderer';

/**
 * Splash hero: the real Lagos world driven by a scripted autopilot.
 * It reads a private copy of sim state and never touches the live sim.
 */
export class Showcase {
  private renderer: GameRenderer;
  private state: SimState;
  private prev: SimState;
  private frame = 0;
  private alive = true;
  private last = 0;
  private t = 0;
  private startZ = 30_000;

  constructor(host: HTMLElement, look: CharacterLook, outfit: OutfitChoice, reduceMotion: boolean, dataSaver: boolean) {
    const ride = rides.find((r) => r.id === 'okada') ?? rides[0]!;
    this.state = initState(simConfig, seedRng(20261019), { capacity: ride.capacity });
    // Zones only: the hero road stays clear so the ride never clips a hazard.
    this.state.entities = this.state.entities.filter((e) => e.isZone && e.zoneKind !== 'finish');
    this.state.carried = Math.min(8, ride.capacity);
    this.state.z = this.startZ;
    this.state.speed = Math.floor(simConfig.maxSpeedUm * 0.8);
    this.prev = this.snapshot();
    this.renderer = new GameRenderer({
      look,
      outfit,
      rideId: ride.id,
      config: simConfig,
      landmarks: lagosLaunch.landmarks,
      reduceMotion,
      dataSaver,
    });
    host.appendChild(this.renderer.canvas);
    this.renderer.resize();
    this.frame = requestAnimationFrame(this.loop);
  }

  private snapshot(): SimState {
    const s = this.state;
    return { ...s, rng: { ...s.rng }, entities: s.entities.map((e) => ({ ...e })), events: [] };
  }

  private loop = (time: number) => {
    if (!this.alive) return;
    this.frame = requestAnimationFrame(this.loop);
    if (this.last && time - this.last < 30) return; // ~30 fps cap
    const dt = this.last ? Math.min(0.05, (time - this.last) / 1000) : 0.016;
    this.last = time;
    this.t += dt;
    this.prev = this.snapshot();
    const s = this.state;
    // cruise ~14 m/s; wrap before the end of the course
    s.z += Math.floor(14_000 * dt);
    if (s.finishZ > 0 && s.z > s.finishZ - 60_000) s.z = this.startZ;
    // gentle lane drift (integer lane mm, renderer reads laneX)
    const sway = Math.round(Math.sin(this.t * 0.45) * 700);
    s.laneX = 1000 + sway;
    s.targetLane = sway > 250 ? 2 : sway < -250 ? 0 : 1;
    this.renderer.render(this.prev, s, 1);
  };

  dispose() {
    this.alive = false;
    cancelAnimationFrame(this.frame);
    this.renderer.dispose();
  }
}
