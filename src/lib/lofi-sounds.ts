/**
 * Lofi sound effects for CS Animations.
 * Warm, soft synthesized tones using Web Audio API.
 * All sounds are gentle and non-jarring — cozy study room vibes.
 *
 * Ported from vanilla JS: js/sounds.js
 */

// Pentatonic scale — always sounds pleasant, no dissonance
// C4 D4 E4 G4 A4 C5 D5 E5 G5 A5
const SCALE = [261.6, 293.7, 329.6, 392.0, 440.0, 523.3, 587.3, 659.3, 784.0, 880.0];

function valueToFreq(value: number): number {
  const idx = Math.floor(value * (SCALE.length - 1));
  return SCALE[Math.min(idx, SCALE.length - 1)];
}

export interface StepLike {
  type: string;
  value?: number;
  dist?: number;
  node?: number;
  values?: number[];
  indices?: number[];
  [key: string]: unknown;
}

class LofiSoundsEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private volume = 0.35;
  private muted = false;

  /** Lazy init — browsers require user interaction before AudioContext */
  private ensureCtx(): boolean {
    if (this.ctx) return true;
    try {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.ctx.destination);
      return true;
    } catch {
      return false;
    }
  }

  /** Soft sine/triangle tone with warm envelope */
  private warmTone(freq: number, duration: number, type: OscillatorType = 'sine', startTime?: number): void {
    if (!this.ensureCtx() || this.muted || !this.ctx || !this.masterGain) return;
    const t = startTime ?? this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    // Low-pass filter for warmth — cuts harshness
    filter.type = 'lowpass';
    filter.frequency.value = Math.min(freq * 3, 2000);
    filter.Q.value = 0.5;

    osc.type = type;
    osc.frequency.value = freq;

    // Gentle envelope — soft attack, slow release
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.15, t + 0.03); // soft attack
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration); // fade out

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + duration);
  }

  /** Layered warm tone — sine + quiet triangle for texture */
  private richTone(freq: number, duration: number, startTime?: number): void {
    this.warmTone(freq, duration, 'sine', startTime);
    this.warmTone(freq * 1.002, duration * 0.8, 'triangle', startTime); // slight detune for warmth
  }

  /** Soft noise burst — like a gentle brush/tap */
  private noiseTap(duration: number): void {
    if (!this.ensureCtx() || this.muted || !this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const bufferSize = Math.round(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800;
    filter.Q.value = 0.3;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.06, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    source.start(t);
    source.stop(t + duration);
  }

  // ── Public API ──

  /** Initialize AudioContext on first user interaction */
  init(): void {
    this.ensureCtx();
  }

  /** Soft tone when comparing elements — pitch maps to value */
  compare(value?: number): void {
    const freq = valueToFreq(value ?? 0.5);
    this.warmTone(freq, 0.12, 'sine');
  }

  /** Two-note warm sound when swapping */
  swap(v1?: number, v2?: number): void {
    const f1 = valueToFreq(v1 ?? 0.3);
    const f2 = valueToFreq(v2 ?? 0.6);
    const t = this.ctx ? this.ctx.currentTime : 0;
    this.richTone(f1, 0.15, t);
    this.richTone(f2, 0.15, t + 0.06);
  }

  /** Gentle chime when element reaches sorted position */
  sorted(value?: number): void {
    const freq = valueToFreq(value ?? 0.7);
    this.richTone(freq, 0.25);
  }

  /** Satisfying resolution chord — algorithm complete */
  complete(): void {
    if (!this.ensureCtx() || this.muted || !this.ctx) return;
    const t = this.ctx.currentTime;
    // C major pentatonic arpeggio
    this.richTone(523.3, 0.6, t);        // C5
    this.richTone(659.3, 0.5, t + 0.08); // E5
    this.richTone(784.0, 0.45, t + 0.16); // G5
    this.richTone(1047, 0.7, t + 0.24);  // C6
  }

  /** Soft tap for UI clicks */
  click(): void {
    this.noiseTap(0.06);
    this.warmTone(600, 0.05, 'sine');
  }

  /** Warm pluck for insertions/additions */
  insert(value?: number): void {
    const freq = valueToFreq(value ?? 0.5);
    if (!this.ensureCtx() || this.muted || !this.ctx) return;
    const t = this.ctx.currentTime;
    this.richTone(freq, 0.2, t);
    this.warmTone(freq * 1.5, 0.12, 'sine', t + 0.02); // soft overtone
  }

  /** Soft descending tone for removals */
  remove(): void {
    if (!this.ensureCtx() || this.muted || !this.ctx) return;
    const t = this.ctx.currentTime;
    this.warmTone(440, 0.15, 'sine', t);
    this.warmTone(330, 0.2, 'sine', t + 0.05);
  }

  /** Gentle ping for graph/tree node visits */
  visit(value?: number): void {
    const freq = valueToFreq(value ?? 0.5);
    this.warmTone(freq * 1.5, 0.1, 'sine');
  }

  /** Short notification — found/discovered something */
  found(): void {
    if (!this.ensureCtx() || this.muted || !this.ctx) return;
    const t = this.ctx.currentTime;
    this.richTone(659.3, 0.2, t);       // E5
    this.richTone(784.0, 0.3, t + 0.1); // G5
  }

  /** Set master volume (0-1) */
  setVolume(v: number): void {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.masterGain) this.masterGain.gain.value = this.volume;
  }

  /** Toggle mute. Returns true if sound is ON after toggle. */
  toggle(): boolean {
    this.muted = !this.muted;
    return !this.muted;
  }

  /** Returns true if sound effects are currently muted */
  isMuted(): boolean {
    return this.muted;
  }

  /**
   * Universal step dispatcher — call with any step object.
   * Maps common step types to appropriate sounds.
   */
  step(s: StepLike): void {
    if (!s || this.muted) return;
    const t = s.type;
    let v = s.value ?? s.dist ?? 0.5;
    // Normalize value to 0-1 if it's a node index
    if (s.node !== undefined && s.value === undefined) v = (s.node % 10) / 10;

    if (
      t === 'compare' || t === 'consider-edge' || t === 'check-edge' || t === 'relax' ||
      t === 'compute-indegree' || t === 'conv' || t === 'forwardLayer'
    ) {
      this.compare(v);
    } else if (t === 'swap' || t === 'place') {
      this.swap(s.values?.[0] ?? 0.3, s.values?.[1] ?? 0.6);
    } else if (
      t === 'sorted' || t === 'finalize' || t === 'accept' || t === 'select-edge' ||
      t === 'add-to-mst'
    ) {
      this.sorted(v);
    } else if (t === 'complete' || t === 'done' || t === 'result') {
      this.complete();
    } else if (
      t === 'visit' || t === 'process' || t === 'enqueue' || t === 'dequeue' ||
      t === 'push' || t === 'open' || t === 'current' || t === 'backwardLayer'
    ) {
      this.visit(v);
    } else if (t === 'found' || t === 'path') {
      this.found();
    } else if (t === 'reject' || t === 'not-found') {
      this.compare(0.2);
    } else if (
      t === 'pivot' || t === 'range' || t === 'pool' || t === 'updateWeights' ||
      t === 'computeLoss' || t === 'update-dist' || t === 'decrement' ||
      t === 'close' || t === 'clear-candidates' || t === 'pop' || t === 'backtrack'
    ) {
      this.compare(v * 0.7);
    }
  }

  /** Clean up all resources — call on unmount */
  destroy(): void {
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close().catch(() => { /* ignore */ });
    }
    this.ctx = null;
    this.masterGain = null;
  }
}

// Singleton instance
let instance: LofiSoundsEngine | null = null;

function getInstance(): LofiSoundsEngine {
  if (!instance) {
    instance = new LofiSoundsEngine();
  }
  return instance;
}

export const lofiSounds = {
  init: () => getInstance().init(),
  compare: (value?: number) => getInstance().compare(value),
  swap: (v1?: number, v2?: number) => getInstance().swap(v1, v2),
  sorted: (value?: number) => getInstance().sorted(value),
  complete: () => getInstance().complete(),
  click: () => getInstance().click(),
  insert: (value?: number) => getInstance().insert(value),
  remove: () => getInstance().remove(),
  visit: (value?: number) => getInstance().visit(value),
  found: () => getInstance().found(),
  setVolume: (v: number) => getInstance().setVolume(v),
  toggle: () => getInstance().toggle(),
  isMuted: () => getInstance().isMuted(),
  step: (s: StepLike) => getInstance().step(s),
  destroy: () => {
    if (instance) {
      instance.destroy();
      instance = null;
    }
  },
};
