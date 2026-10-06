import { useGameStore } from './state';
import type { SimEvent } from '@cr/sim';

// Simple Web Audio API based audio manager
class AudioManager {
  private ctx: AudioContext | null = null;
  private buffers = new Map<string, AudioBuffer>();
  private musicSource: AudioBufferSourceNode | null = null;
  private musicGain: GainNode | null = null;

  async init() {
    if (this.ctx) return;
    this.ctx = new AudioContext();
    // In a real app we'd load actual stems here. For now we use empty stubs or simple oscillators.
  }

  playEvent(event: SimEvent) {
    if (!this.ctx) return;
    const sfxVol = useGameStore.getState().sfxVolume;
    if (sfxVol <= 0) return;

    // A simple procedural beep for now since we don't have audio files
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    switch (event.type) {
      case 'hit':
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.1);
        break;
      case 'dent':
        osc.frequency.setValueAtTime(300, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.2);
        break;
      case 'breakdown':
        osc.frequency.setValueAtTime(100, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(10, this.ctx.currentTime + 0.5);
        break;
      case 'pickup':
        osc.frequency.setValueAtTime(600, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.1);
        break;
      default:
        osc.frequency.value = 440;
    }

    gain.gain.value = sfxVol * 0.1; // lower volume for synth beeps
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  playMusic() {
    // Stub
  }
}

export const audio = new AudioManager();
