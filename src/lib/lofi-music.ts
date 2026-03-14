/**
 * Lofi ambient music generator.
 * Soft pad chords, gentle pentatonic melody, vinyl warmth.
 * Entirely synthesized with Web Audio API — no external files.
 *
 * Ported from vanilla JS: js/lofi-music.js
 */

// Warm pentatonic in C — cozy, no tension
// C3  D3  E3  G3  A3  C4  D4  E4  G4  A4
const NOTES = [130.8, 146.8, 164.8, 196.0, 220.0, 261.6, 293.7, 329.6, 392.0, 440.0];

// Chord progressions — indices into NOTES (root, third, fifth)
// Cmaj, Am, Em, Fmaj — dreamy lofi cycle
const CHORDS = [
  [5, 7, 9], // C  E  G
  [4, 5, 7], // A  C  E
  [2, 4, 6], // E  G  B(approx D)
  [1, 3, 5], // D  F(approx G)  A(approx C)
];

// Higher octave notes for melody — C4 to C5
const MELODY_NOTES = [261.6, 293.7, 329.6, 392.0, 440.0, 523.3];

interface PadOsc {
  osc: OscillatorNode;
  osc2: OscillatorNode;
  gain: GainNode;
}

class LofiMusicEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private masterFilter: BiquadFilterNode | null = null;
  private playing = false;
  private loopTimer: ReturnType<typeof setTimeout> | null = null;
  private crackleSource: AudioBufferSourceNode | null = null;
  private padOscs: PadOsc[] = [];
  private melodyTimer: ReturnType<typeof setTimeout> | null = null;
  private volume = 0.30;
  private chordIdx = 0;

  private ensureCtx(): boolean {
    if (this.ctx) return true;
    try {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.volume;

      // Warm master filter — removes harshness
      this.masterFilter = this.ctx.createBiquadFilter();
      this.masterFilter.type = 'lowpass';
      this.masterFilter.frequency.value = 1200;
      this.masterFilter.Q.value = 0.3;

      this.master.connect(this.masterFilter);
      this.masterFilter.connect(this.ctx.destination);
      return true;
    } catch {
      return false;
    }
  }

  // ── Vinyl crackle — filtered noise, very quiet ──

  private startCrackle(): void {
    if (!this.ctx || !this.master) return;
    const bufLen = this.ctx.sampleRate * 4;
    const buf = this.ctx.createBuffer(1, bufLen, this.ctx.sampleRate);
    const data = buf.getChannelData(0);

    for (let i = 0; i < bufLen; i++) {
      // Sparse crackle — mostly silence with occasional tiny pops
      data[i] = Math.random() < 0.003
        ? (Math.random() - 0.5) * 0.8
        : (Math.random() - 0.5) * 0.01;
    }

    this.crackleSource = this.ctx.createBufferSource();
    this.crackleSource.buffer = buf;
    this.crackleSource.loop = true;

    const crackleGain = this.ctx.createGain();
    crackleGain.gain.value = 0.08;

    const crackleFilter = this.ctx.createBiquadFilter();
    crackleFilter.type = 'bandpass';
    crackleFilter.frequency.value = 600;
    crackleFilter.Q.value = 0.5;

    this.crackleSource.connect(crackleFilter);
    crackleFilter.connect(crackleGain);
    crackleGain.connect(this.master);
    this.crackleSource.start();
  }

  private stopCrackle(): void {
    if (this.crackleSource) {
      try { this.crackleSource.stop(); } catch { /* already stopped */ }
      this.crackleSource = null;
    }
  }

  // ── Pad chord — warm sustained tones ──

  private playPad = (): void => {
    if (!this.ctx || !this.playing || !this.master) return;

    // Fade out old pad
    const ctx = this.ctx;
    this.padOscs.forEach((p) => {
      p.gain.gain.setValueAtTime(p.gain.gain.value, ctx.currentTime);
      p.gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2);
      setTimeout(() => {
        try { p.osc.stop(); } catch { /* already stopped */ }
        try { p.osc2.stop(); } catch { /* already stopped */ }
      }, 2500);
    });
    this.padOscs = [];

    const chord = CHORDS[this.chordIdx % CHORDS.length];
    this.chordIdx++;

    chord.forEach((noteIdx) => {
      const freq = NOTES[noteIdx];
      const t = ctx.currentTime;

      // Main oscillator — sine, warm
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      // Detuned layer — slight chorus effect
      const osc2 = ctx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.value = freq * 1.003;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.06, t + 1.5); // very slow attack
      gain.gain.setValueAtTime(0.06, t + 5);
      gain.gain.linearRampToValueAtTime(0.03, t + 7); // gentle swell down

      const gain2 = ctx.createGain();
      gain2.gain.value = 0.03; // detuned layer quieter

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 500 + Math.random() * 200;
      filter.Q.value = 0.2;

      osc.connect(gain);
      osc2.connect(gain2);
      gain2.connect(gain);
      gain.connect(filter);
      filter.connect(this.master!);

      osc.start(t);
      osc2.start(t);

      this.padOscs.push({ osc, osc2, gain });
    });

    // Next chord in 7-9 seconds — slow, dreamy
    const nextTime = 7000 + Math.random() * 2000;
    this.loopTimer = setTimeout(this.playPad, nextTime);
  };

  // ── Melody — gentle single notes, sparse ──

  private playMelodyNote = (): void => {
    if (!this.ctx || !this.playing || !this.master) return;

    const freq = MELODY_NOTES[Math.floor(Math.random() * MELODY_NOTES.length)];
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;

    const gain = this.ctx.createGain();
    const duration = 1.5 + Math.random() * 1.5;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.04, t + 0.1); // soft pluck
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.exponentialRampToValueAtTime(300, t + duration); // tone darkens as it fades
    filter.Q.value = 0.3;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);

    osc.start(t);
    osc.stop(t + duration + 0.1);

    // Next note in 2-5 seconds — sparse, not busy
    let next = 2000 + Math.random() * 3000;
    // Occasionally skip a beat for breathing room
    if (Math.random() < 0.3) next += 3000;
    this.melodyTimer = setTimeout(this.playMelodyNote, next);
  };

  // ── Public API ──

  start(): void {
    if (this.playing) return;
    if (!this.ensureCtx()) return;
    this.playing = true;
    this.chordIdx = 0;

    // Fade in master
    this.master!.gain.setValueAtTime(0, this.ctx!.currentTime);
    this.master!.gain.linearRampToValueAtTime(this.volume, this.ctx!.currentTime + 2);

    this.startCrackle();
    this.playPad();
    // Melody starts after first chord settles
    this.melodyTimer = setTimeout(this.playMelodyNote, 3000);
  }

  stop(): void {
    this.playing = false;
    if (this.loopTimer) clearTimeout(this.loopTimer);
    if (this.melodyTimer) clearTimeout(this.melodyTimer);

    // Fade out
    if (this.master && this.ctx) {
      this.master.gain.setValueAtTime(this.master.gain.value, this.ctx.currentTime);
      this.master.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1.5);
    }

    // Clean up after fade
    setTimeout(() => {
      this.stopCrackle();
      this.padOscs.forEach((p) => {
        try { p.osc.stop(); } catch { /* already stopped */ }
        try { p.osc2.stop(); } catch { /* already stopped */ }
      });
      this.padOscs = [];
    }, 2000);
  }

  toggle(): boolean {
    if (this.playing) {
      this.stop();
    } else {
      this.start();
    }
    return this.playing;
  }

  isPlaying(): boolean {
    return this.playing;
  }

  setVolume(v: number): void {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.master && this.ctx) {
      this.master.gain.linearRampToValueAtTime(this.volume, this.ctx.currentTime + 0.3);
    }
  }

  /** Clean up all resources — call on unmount */
  destroy(): void {
    this.stop();
    // Give fade-out time to complete, then close context
    setTimeout(() => {
      if (this.ctx && this.ctx.state !== 'closed') {
        this.ctx.close().catch(() => { /* ignore */ });
      }
      this.ctx = null;
      this.master = null;
      this.masterFilter = null;
    }, 2500);
  }
}

// Singleton instance
let instance: LofiMusicEngine | null = null;

function getInstance(): LofiMusicEngine {
  if (!instance) {
    instance = new LofiMusicEngine();
  }
  return instance;
}

export const lofiMusic = {
  start: () => getInstance().start(),
  stop: () => getInstance().stop(),
  toggle: () => getInstance().toggle(),
  isPlaying: () => getInstance().isPlaying(),
  setVolume: (v: number) => getInstance().setVolume(v),
  destroy: () => {
    if (instance) {
      instance.destroy();
      instance = null;
    }
  },
};
