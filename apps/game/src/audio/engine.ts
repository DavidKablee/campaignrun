import type { SimEvent } from '@cr/sim';

/**
 * Procedural adaptive audio, no asset files.
 *
 * Design rules (the first version was harsh):
 *  - No sawtooth / square oscillators. Sine + triangle only, every note filtered.
 *  - Every note has an attack >= 5 ms and an exponential release (no clicks).
 *  - One shared noise buffer, only ever heard through low/band-pass filters.
 *  - Whole mix goes through a low-pass + gentle compressor, master capped low.
 *  - Notes are scheduled on the audio clock (look-ahead), not setInterval timing.
 */

const A_MINOR_PENT = [0, 3, 5, 7, 10];
const CHORDS: number[][] = [
  [57, 60, 64], // Am
  [53, 57, 60], // F
  [48, 52, 55], // C
  [55, 59, 62], // G
];
const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private roadSrc: AudioBufferSourceNode | null = null;
  private roadGain: GainNode | null = null;
  private timer: number | null = null;
  private nextTime = 0;
  private stepIx = 0;
  private layer = 0;
  private stemShift = 0;
  private radioOn = true;
  private sfxVol = 0.8;
  private musicVol = 0.35;
  private muted = false;
  private ducked = false;
  private running = false;
  private lastSfx = new Map<string, number>();

  async unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') await this.ctx.resume();
      return;
    }
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new Ctor();
    const ctx = this.ctx;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -20;
    comp.knee.value = 24;
    comp.ratio.value = 3;
    comp.attack.value = 0.01;
    comp.release.value = 0.25;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 7200;
    lp.Q.value = 0.4;
    this.master = ctx.createGain();
    this.master.gain.value = 0.7;
    this.master.connect(lp);
    lp.connect(comp);
    comp.connect(ctx.destination);
    this.sfxBus = ctx.createGain();
    this.sfxBus.connect(this.master);
    this.musicBus = ctx.createGain();
    this.musicBus.connect(this.master);
    this.noise = this.makeNoise(ctx);
    this.applyVolumes();
    if (ctx.state === 'suspended') await ctx.resume();
  }

  private makeNoise(ctx: AudioContext): AudioBuffer {
    // brown noise: soft, no hiss
    const len = ctx.sampleRate;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02;
      d[i] = last * 3.5;
    }
    return buf;
  }

  setVolumes(sfx: number, music: number) {
    this.sfxVol = sfx;
    this.musicVol = music;
    this.applyVolumes();
  }

  setMuted(m: boolean) {
    this.muted = m;
    this.applyVolumes();
  }

  duck(on: boolean) {
    if (this.ducked === on) return;
    this.ducked = on;
    this.applyVolumes();
  }

  private applyVolumes() {
    if (!this.ctx || !this.sfxBus || !this.musicBus) return;
    const t = this.ctx.currentTime;
    const k = this.muted ? 0 : this.ducked ? 0.25 : 1;
    this.sfxBus.gain.setTargetAtTime(this.sfxVol * 0.5 * k, t, 0.05);
    this.musicBus.gain.setTargetAtTime((this.radioOn ? this.musicVol : 0) * 0.45 * k, t, 0.08);
  }

  /** Start road bed + music for a run. */
  startRun() {
    const ctx = this.ctx;
    if (!ctx || !this.sfxBus || this.running) return;
    this.running = true;
    this.stepIx = 0;
    this.nextTime = ctx.currentTime + 0.15;
    // soft road rumble: brown noise, low-passed, level follows speed
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 180;
    this.roadGain = ctx.createGain();
    this.roadGain.gain.value = 0;
    src.connect(lp);
    lp.connect(this.roadGain);
    this.roadGain.connect(this.sfxBus);
    src.start();
    this.roadSrc = src;
    this.timer = window.setInterval(() => this.schedule(), 30);
  }

  stopRun() {
    this.running = false;
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
    try {
      this.roadSrc?.stop();
    } catch {
      /* already stopped */
    }
    this.roadSrc = null;
    this.roadGain = null;
  }

  setSpeed(speedUm: number, maxUm: number) {
    if (!this.ctx || !this.roadGain) return;
    const t = Math.min(1, Math.max(0, speedUm / maxUm));
    this.roadGain.gain.setTargetAtTime(0.1 + t * 0.35, this.ctx.currentTime, 0.1);
  }

  /** Pick the state's station. Music is generated here; nothing is streamed. */
  tune(stem: string) {
    const shift: Record<string, number> = {
      'sw-fuji': 0,
      'se-highlife': 4,
      'ss-brass': 7,
      'nw-kalangu': -2,
      'ne-algaita': -5,
      'nc-drums': 2,
      'fct-mix': 5,
    };
    this.stemShift = shift[stem] ?? 0;
  }

  setRadio(on: boolean) {
    this.radioOn = on;
    this.applyVolumes();
  }

  /** Soft radio blip when a DJ callout starts (no VO assets). */
  blip() {
    if (!this.ctx || this.muted || !this.radioOn) return;
    this.tone(880, 0.08, 0.28, { type: 'triangle', lp: 2400 });
    this.tone(1175, 0.1, 0.22, { type: 'triangle', at: 0.06, lp: 2600 });
  }

  setIntensity(momentum: number, carried: number, capacity: number) {
    const fill = capacity > 0 ? carried / capacity : 0;
    const m = Math.max(0, (momentum - 1000) / 1000);
    this.layer = fill > 0.75 || m > 0.6 ? 3 : fill > 0.4 || m > 0.25 ? 2 : fill > 0 ? 1 : 0;
  }

  // ----------------------------------------------------------- music
  private schedule() {
    const ctx = this.ctx;
    if (!ctx || !this.running) return;
    const bpm = 96 + this.stemShift + this.layer * 3;
    const stepDur = 60 / bpm / 4;
    while (this.nextTime < ctx.currentTime + 0.14) {
      const swing = this.stepIx % 2 === 1 ? stepDur * 0.12 : 0;
      this.playStep(this.stepIx, this.nextTime + swing);
      this.nextTime += stepDur;
      this.stepIx++;
    }
  }

  private playStep(i: number, t: number) {
    const s = i % 16;
    const bar = Math.floor(i / 16) % 4;
    const chord = CHORDS[bar]!;
    if (s === 0 || s === 8 || (this.layer >= 2 && (s === 6 || s === 14))) this.kick(t, s === 0 ? 0.55 : 0.4);
    if (this.layer >= 1 && (s === 4 || s === 12)) this.clap(t);
    if (this.layer >= 1 && s % 2 === 0) this.shaker(t, s % 4 === 2 ? 0.05 : 0.03);
    // bass: root on 1 and the "and" of 2, fifth on 3
    const root = chord[0]! - 12;
    if (s === 0 || s === 6 || s === 10 || (this.layer >= 2 && s === 14)) {
      this.bass(t, s === 10 ? root + 7 : root, 0.34);
    }
    // chord stab (soft electric-piano feel)
    if (this.layer >= 1 && (s === 0 || s === 7 || s === 12)) {
      for (const n of chord) this.keys(t, n + 12, 0.045, 0.5);
    }
    // pentatonic hook
    if (this.layer >= 3 && s % 4 === 3) {
      const n = chord[0]! + 24 + A_MINOR_PENT[(i * 3 + bar) % A_MINOR_PENT.length]!;
      this.pluck(t, n, 0.04);
    }
  }

  private env(g: GainNode, t: number, peak: number, attack: number, release: number) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + release);
  }

  private kick(t: number, vol: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(130, t);
    o.frequency.exponentialRampToValueAtTime(48, t + 0.12);
    this.env(g, t, vol, 0.005, 0.22);
    o.connect(g);
    g.connect(this.musicBus!);
    o.start(t);
    o.stop(t + 0.3);
  }

  private bass(t: number, midi: number, vol: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    const f = ctx.createBiquadFilter();
    const g = ctx.createGain();
    o.type = 'triangle';
    o.frequency.value = mtof(midi);
    f.type = 'lowpass';
    f.frequency.value = 420;
    this.env(g, t, vol, 0.012, 0.28);
    o.connect(f);
    f.connect(g);
    g.connect(this.musicBus!);
    o.start(t);
    o.stop(t + 0.4);
  }

  private keys(t: number, midi: number, vol: number, rel: number) {
    const ctx = this.ctx!;
    const g = ctx.createGain();
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 1800;
    this.env(g, t, vol, 0.008, rel);
    for (const [type, mult] of [['sine', 1], ['triangle', 2]] as const) {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = mtof(midi) * mult;
      const og = ctx.createGain();
      og.gain.value = mult === 1 ? 1 : 0.25;
      o.connect(og);
      og.connect(f);
      o.start(t);
      o.stop(t + rel + 0.1);
    }
    f.connect(g);
    g.connect(this.musicBus!);
  }

  private pluck(t: number, midi: number, vol: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    const f = ctx.createBiquadFilter();
    const g = ctx.createGain();
    o.type = 'triangle';
    o.frequency.value = mtof(midi);
    f.type = 'lowpass';
    f.frequency.setValueAtTime(2600, t);
    f.frequency.exponentialRampToValueAtTime(700, t + 0.2);
    this.env(g, t, vol, 0.006, 0.22);
    o.connect(f);
    f.connect(g);
    g.connect(this.musicBus!);
    o.start(t);
    o.stop(t + 0.35);
  }

  private noiseHit(t: number, type: BiquadFilterType, freq: number, q: number, vol: number, dur: number, bus: GainNode) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = ctx.createGain();
    this.env(g, t, vol, 0.004, dur);
    src.connect(f);
    f.connect(g);
    g.connect(bus);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.05);
  }

  private clap(t: number) {
    this.noiseHit(t, 'bandpass', 1400, 0.9, 0.35, 0.12, this.musicBus!);
  }

  private shaker(t: number, vol: number) {
    this.noiseHit(t, 'bandpass', 4200, 1.2, vol * 3, 0.05, this.musicBus!);
  }

  // ----------------------------------------------------------- sfx
  private tone(freq: number, dur: number, vol: number, opts: { type?: OscillatorType; slideTo?: number; at?: number; lp?: number } = {}) {
    const ctx = this.ctx;
    if (!ctx || !this.sfxBus) return;
    const t = ctx.currentTime + (opts.at ?? 0);
    const o = ctx.createOscillator();
    const f = ctx.createBiquadFilter();
    const g = ctx.createGain();
    o.type = opts.type ?? 'sine';
    o.frequency.setValueAtTime(freq, t);
    if (opts.slideTo) o.frequency.exponentialRampToValueAtTime(opts.slideTo, t + dur);
    f.type = 'lowpass';
    f.frequency.value = opts.lp ?? 3200;
    this.env(g, t, vol, 0.006, dur);
    o.connect(f);
    f.connect(g);
    g.connect(this.sfxBus);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  private throttled(key: string, ms: number): boolean {
    const now = performance.now();
    if (now - (this.lastSfx.get(key) ?? 0) < ms) return true;
    this.lastSfx.set(key, now);
    return false;
  }

  playEvent(ev: SimEvent) {
    if (!this.ctx || this.muted) return;
    switch (ev.type) {
      case 'pickup':
        if (this.throttled('pickup', 80)) return;
        this.tone(659, 0.16, 0.5);
        this.tone(880, 0.22, 0.45, { at: 0.07 });
        break;
      case 'dropoff':
        if (this.throttled('dropoff', 80)) return;
        [523, 659, 784].forEach((f, i) => this.tone(f, 0.2, 0.42, { type: 'triangle', at: i * 0.06 }));
        break;
      case 'dent':
      case 'hit': {
        if (this.throttled('hit', 150)) return;
        this.tone(150, 0.28, 0.9, { slideTo: 48, lp: 600 });
        this.noiseHit(this.ctx.currentTime, 'lowpass', 700, 0.7, 0.5, 0.15, this.sfxBus!);
        break;
      }
      case 'fullHouse':
        [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.28, 0.4, { type: 'triangle', at: i * 0.07 }));
        break;
      case 'onBeat':
        if (this.throttled('beat', 60)) return;
        this.tone(988, 0.1, 0.35);
        break;
      case 'zoneEnter':
        this.tone(440, 0.12, 0.3);
        break;
      case 'zoneProgress':
        if (this.throttled('zp', 120)) return;
        this.tone(520 + (typeof ev.payload === 'number' ? ev.payload : 0) * 4, 0.05, 0.16);
        break;
      case 'gate':
        [392, 523, 659].forEach((f, i) => this.tone(f, 0.3, 0.4, { type: 'triangle', at: i * 0.1 }));
        break;
      case 'finish':
        [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.4, 0.4, { type: 'triangle', at: i * 0.1 }));
        break;
      case 'breakdown':
        this.tone(300, 0.7, 0.6, { slideTo: 70, lp: 900 });
        break;
      case 'integrityFail':
        if (this.throttled('intFail', 200)) return;
        this.tone(220, 0.35, 0.7, { slideTo: 90, lp: 500 });
        break;
      case 'toll':
        if (this.throttled('toll', 200)) return;
        this.tone(196, 0.2, 0.6, { type: 'square', slideTo: 130, lp: 800 });
        this.tone(262, 0.12, 0.4, { at: 0.12 });
        break;
      case 'tollDodged':
        if (this.throttled('tollOk', 160)) return;
        this.tone(587, 0.1, 0.3);
        this.tone(784, 0.12, 0.3, { at: 0.06 });
        break;
      case 'weaveWarn':
        // Two short horn blasts: the rider is telling you which way they are about to go.
        if (this.throttled('weave', 500)) return;
        this.tone(430, 0.09, 0.35, { type: 'square', lp: 1400 });
        this.tone(430, 0.09, 0.35, { type: 'square', lp: 1400, at: 0.14 });
        break;
      case 'closeCall':
        if (this.throttled('close', 400)) return;
        this.tone(900, 0.16, 0.22, { type: 'triangle', slideTo: 220, lp: 1800 });
        break;
      case 'stubborn':
        this.tone(330, 0.14, 0.3, { type: 'triangle' });
        this.tone(311, 0.16, 0.3, { type: 'triangle', at: 0.12 });
        break;
      case 'integritySuccess':
        if (this.throttled('intOk', 160)) return;
        this.tone(740, 0.14, 0.35);
        this.tone(988, 0.16, 0.3, { at: 0.08 });
        break;
      default:
        break;
    }
  }
}

export const audio = new AudioEngine();
