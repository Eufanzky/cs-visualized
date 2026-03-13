/**
 * Lofi sound system for CS Animations.
 * Warm, soft synthesized tones using Web Audio API.
 * All sounds are gentle and non-jarring — cozy study room vibes.
 *
 * Usage:
 *   LofiSounds.compare(value)    — soft tone mapped to value (0-1)
 *   LofiSounds.swap(v1, v2)      — two-note warm chord
 *   LofiSounds.sorted(value)     — gentle chime
 *   LofiSounds.complete()        — satisfying resolution chord
 *   LofiSounds.click()           — soft tap for button presses
 *   LofiSounds.insert(value)     — warm pluck for insertions
 *   LofiSounds.remove()          — soft descending tone
 *   LofiSounds.visit(value)      — gentle ping for graph/tree visits
 *   LofiSounds.setVolume(0-1)    — master volume
 *   LofiSounds.toggle()          — mute/unmute
 */

window.LofiSounds = (function () {
  let ctx = null;
  let masterGain = null;
  let volume = 0.35;
  let muted = false;

  // Lazy init — browsers require user interaction before AudioContext
  function ensureCtx() {
    if (ctx) return true;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = ctx.createGain();
      masterGain.gain.value = volume;
      masterGain.connect(ctx.destination);
      return true;
    } catch (e) {
      return false;
    }
  }

  // Pentatonic scale — always sounds pleasant, no dissonance
  // C4 D4 E4 G4 A4 C5 D5 E5 G5 A5
  const SCALE = [261.6, 293.7, 329.6, 392.0, 440.0, 523.3, 587.3, 659.3, 784.0, 880.0];

  function valueToFreq(value) {
    // Map 0-1 to pentatonic scale
    const idx = Math.floor(value * (SCALE.length - 1));
    return SCALE[Math.min(idx, SCALE.length - 1)];
  }

  // Soft sine/triangle tone with warm envelope
  function warmTone(freq, duration, type, startTime) {
    if (!ensureCtx() || muted) return;
    const t = startTime || ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    // Low-pass filter for warmth — cuts harshness
    filter.type = 'lowpass';
    filter.frequency.value = Math.min(freq * 3, 2000);
    filter.Q.value = 0.5;

    osc.type = type || 'sine';
    osc.frequency.value = freq;

    // Gentle envelope — soft attack, slow release
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.15, t + 0.03);   // soft attack
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration); // fade out

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    osc.start(t);
    osc.stop(t + duration);
  }

  // Layered warm tone — sine + quiet triangle for texture
  function richTone(freq, duration, startTime) {
    warmTone(freq, duration, 'sine', startTime);
    warmTone(freq * 1.002, duration * 0.8, 'triangle', startTime); // slight detune for warmth
  }

  // Soft noise burst — like a gentle brush/tap
  function noiseTap(duration) {
    if (!ensureCtx() || muted) return;
    const t = ctx.currentTime;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800;
    filter.Q.value = 0.3;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.06, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    source.start(t);
    source.stop(t + duration);
  }

  return {
    // Soft tone when comparing elements — pitch maps to value
    compare: function (value) {
      const freq = valueToFreq(value || 0.5);
      warmTone(freq, 0.12, 'sine');
    },

    // Two-note warm sound when swapping
    swap: function (v1, v2) {
      const f1 = valueToFreq(v1 || 0.3);
      const f2 = valueToFreq(v2 || 0.6);
      const t = ctx ? ctx.currentTime : 0;
      richTone(f1, 0.15, t);
      richTone(f2, 0.15, t + 0.06);
    },

    // Gentle chime when element reaches sorted position
    sorted: function (value) {
      const freq = valueToFreq(value || 0.7);
      richTone(freq, 0.25);
    },

    // Satisfying resolution chord — algorithm complete
    complete: function () {
      if (!ensureCtx() || muted) return;
      const t = ctx.currentTime;
      // C major pentatonic arpeggio
      richTone(523.3, 0.6, t);         // C5
      richTone(659.3, 0.5, t + 0.08);  // E5
      richTone(784.0, 0.45, t + 0.16); // G5
      richTone(1047, 0.7, t + 0.24);   // C6
    },

    // Soft tap for UI clicks
    click: function () {
      noiseTap(0.06);
      warmTone(600, 0.05, 'sine');
    },

    // Warm pluck for insertions/additions
    insert: function (value) {
      const freq = valueToFreq(value || 0.5);
      if (!ensureCtx() || muted) return;
      const t = ctx.currentTime;
      richTone(freq, 0.2, t);
      warmTone(freq * 1.5, 0.12, 'sine', t + 0.02); // soft overtone
    },

    // Soft descending tone for removals
    remove: function () {
      if (!ensureCtx() || muted) return;
      const t = ctx.currentTime;
      warmTone(440, 0.15, 'sine', t);
      warmTone(330, 0.2, 'sine', t + 0.05);
    },

    // Gentle ping for graph/tree node visits
    visit: function (value) {
      const freq = valueToFreq(value || 0.5);
      warmTone(freq * 1.5, 0.1, 'sine');
    },

    // Short notification — found/discovered something
    found: function () {
      if (!ensureCtx() || muted) return;
      const t = ctx.currentTime;
      richTone(659.3, 0.2, t);        // E5
      richTone(784.0, 0.3, t + 0.1);  // G5
    },

    // Error/reject — soft low tone
    reject: function () {
      warmTone(220, 0.2, 'triangle');
    },

    // Set master volume (0-1)
    setVolume: function (v) {
      volume = Math.max(0, Math.min(1, v));
      if (masterGain) masterGain.gain.value = volume;
    },

    // Toggle mute
    toggle: function () {
      muted = !muted;
      return !muted; // returns true if sound is ON
    },

    // Check if muted
    isMuted: function () {
      return muted;
    },

    // Initialize on first user interaction
    init: function () {
      ensureCtx();
    },

    // Universal step dispatcher — call with any step object
    // Maps common step types to appropriate sounds
    step: function (step) {
      if (!step || muted) return;
      var t = step.type;
      var v = step.value || step.dist || 0.5;
      // Normalize value to 0-1 if it's a node index
      if (step.node !== undefined && !step.value) v = (step.node % 10) / 10;

      if (t === 'compare' || t === 'consider-edge' || t === 'check-edge' || t === 'relax'
          || t === 'compute-indegree' || t === 'conv' || t === 'forwardLayer') {
        this.compare(v);
      } else if (t === 'swap' || t === 'place') {
        this.swap(step.values ? step.values[0] : 0.3, step.values ? step.values[1] : 0.6);
      } else if (t === 'sorted' || t === 'finalize' || t === 'accept' || t === 'select-edge'
                 || t === 'add-to-mst') {
        this.sorted(v);
      } else if (t === 'complete' || t === 'done' || t === 'result') {
        this.complete();
      } else if (t === 'visit' || t === 'process' || t === 'enqueue' || t === 'dequeue'
                 || t === 'push' || t === 'open' || t === 'current' || t === 'backwardLayer') {
        this.visit(v);
      } else if (t === 'found' || t === 'path') {
        this.found();
      } else if (t === 'reject' || t === 'not-found') {
        this.reject();
      } else if (t === 'pivot' || t === 'range' || t === 'pool' || t === 'updateWeights'
                 || t === 'computeLoss' || t === 'update-dist' || t === 'decrement'
                 || t === 'close' || t === 'clear-candidates' || t === 'pop'
                 || t === 'backtrack') {
        this.compare(v * 0.7);
      }
    }
  };
})();

// ── Auto-wire sound toggle button and init on any button click ──
(function () {
  // Sound toggle button
  var btn = document.getElementById('btnSound');
  if (btn) {
    btn.addEventListener('click', function () {
      LofiSounds.init();
      var on = LofiSounds.toggle();
      btn.classList.toggle('is-muted', !on);
      btn.title = on ? 'Mute sound' : 'Unmute sound';
    });
  }

  // Init audio context on first interaction with any control button
  document.addEventListener('click', function initOnce(e) {
    if (e.target.closest('.controls__btn') || e.target.closest('.controls__slider')) {
      LofiSounds.init();
      document.removeEventListener('click', initOnce);
    }
  });
})();
