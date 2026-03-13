/**
 * Lofi ambient music generator.
 * Soft pad chords, gentle pentatonic melody, vinyl warmth.
 * Entirely synthesized with Web Audio API — no external files.
 */

window.LofiMusic = (function () {
  let ctx = null;
  let master = null;
  let playing = false;
  let loopTimer = null;
  let crackleSource = null;
  let padOscs = [];
  let melodyTimer = null;
  let volume = 0.30;

  // Warm pentatonic in C — cozy, no tension
  // C3  D3  E3  G3  A3  C4  D4  E4  G4  A4
  var NOTES = [130.8, 146.8, 164.8, 196.0, 220.0, 261.6, 293.7, 329.6, 392.0, 440.0];

  // Chord progressions — indices into NOTES (root, third, fifth)
  // Cmaj, Am, Em, Fmaj, Dm — dreamy lofi cycle
  var CHORDS = [
    [5, 7, 9],    // C  E  G
    [4, 5, 7],    // A  C  E
    [2, 4, 6],    // E  G  B(approx D)
    [1, 3, 5],    // D  F(approx G)  A(approx C)
  ];

  var chordIdx = 0;

  function ensureCtx() {
    if (ctx) return true;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = volume;

      // Warm master filter — removes harshness
      var masterFilter = ctx.createBiquadFilter();
      masterFilter.type = 'lowpass';
      masterFilter.frequency.value = 1200;
      masterFilter.Q.value = 0.3;

      master.connect(masterFilter);
      masterFilter.connect(ctx.destination);
      return true;
    } catch (e) {
      return false;
    }
  }

  // ── Vinyl crackle — filtered noise, very quiet ──
  function startCrackle() {
    if (!ctx) return;
    var bufLen = ctx.sampleRate * 4;
    var buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    var data = buf.getChannelData(0);

    for (var i = 0; i < bufLen; i++) {
      // Sparse crackle — mostly silence with occasional tiny pops
      data[i] = Math.random() < 0.003 ? (Math.random() - 0.5) * 0.8 : (Math.random() - 0.5) * 0.01;
    }

    crackleSource = ctx.createBufferSource();
    crackleSource.buffer = buf;
    crackleSource.loop = true;

    var crackleGain = ctx.createGain();
    crackleGain.gain.value = 0.08;

    var crackleFilter = ctx.createBiquadFilter();
    crackleFilter.type = 'bandpass';
    crackleFilter.frequency.value = 600;
    crackleFilter.Q.value = 0.5;

    crackleSource.connect(crackleFilter);
    crackleFilter.connect(crackleGain);
    crackleGain.connect(master);
    crackleSource.start();
  }

  function stopCrackle() {
    if (crackleSource) {
      try { crackleSource.stop(); } catch (e) {}
      crackleSource = null;
    }
  }

  // ── Pad chord — warm sustained tones ──
  function playPad() {
    if (!ctx || !playing) return;

    // Fade out old pad
    padOscs.forEach(function (p) {
      p.gain.gain.setValueAtTime(p.gain.gain.value, ctx.currentTime);
      p.gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2);
      setTimeout(function () {
        try { p.osc.stop(); } catch (e) {}
        try { p.osc2.stop(); } catch (e) {}
      }, 2500);
    });
    padOscs = [];

    var chord = CHORDS[chordIdx % CHORDS.length];
    chordIdx++;

    chord.forEach(function (noteIdx) {
      var freq = NOTES[noteIdx];
      var t = ctx.currentTime;

      // Main oscillator — sine, warm
      var osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      // Detuned layer — slight chorus effect
      var osc2 = ctx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.value = freq * 1.003;

      var gain = ctx.createGain();
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.06, t + 1.5);  // very slow attack
      gain.gain.setValueAtTime(0.06, t + 5);
      gain.gain.linearRampToValueAtTime(0.03, t + 7);     // gentle swell down

      var gain2 = ctx.createGain();
      gain2.gain.value = 0.03; // detuned layer quieter

      var filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 500 + Math.random() * 200;
      filter.Q.value = 0.2;

      osc.connect(gain);
      osc2.connect(gain2);
      gain2.connect(gain);
      gain.connect(filter);
      filter.connect(master);

      osc.start(t);
      osc2.start(t);

      padOscs.push({ osc: osc, osc2: osc2, gain: gain });
    });

    // Next chord in 7-9 seconds — slow, dreamy
    var nextTime = 7000 + Math.random() * 2000;
    loopTimer = setTimeout(playPad, nextTime);
  }

  // ── Melody — gentle single notes, sparse ──
  function playMelodyNote() {
    if (!ctx || !playing) return;

    // Higher octave notes for melody — C4 to A4
    var melodyNotes = [261.6, 293.7, 329.6, 392.0, 440.0, 523.3];
    var freq = melodyNotes[Math.floor(Math.random() * melodyNotes.length)];
    var t = ctx.currentTime;

    var osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;

    var gain = ctx.createGain();
    var duration = 1.5 + Math.random() * 1.5;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.04, t + 0.1);     // soft pluck
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    var filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.exponentialRampToValueAtTime(300, t + duration); // tone darkens as it fades
    filter.Q.value = 0.3;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(master);

    osc.start(t);
    osc.stop(t + duration + 0.1);

    // Next note in 2-5 seconds — sparse, not busy
    var next = 2000 + Math.random() * 3000;
    // Occasionally skip a beat for breathing room
    if (Math.random() < 0.3) next += 3000;
    melodyTimer = setTimeout(playMelodyNote, next);
  }

  return {
    start: function () {
      if (playing) return;
      if (!ensureCtx()) return;
      playing = true;
      chordIdx = 0;

      // Fade in master
      master.gain.setValueAtTime(0, ctx.currentTime);
      master.gain.linearRampToValueAtTime(volume, ctx.currentTime + 2);

      startCrackle();
      playPad();
      // Melody starts after first chord settles
      melodyTimer = setTimeout(playMelodyNote, 3000);
    },

    stop: function () {
      playing = false;
      clearTimeout(loopTimer);
      clearTimeout(melodyTimer);

      // Fade out
      if (master && ctx) {
        master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
        master.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5);
      }

      // Clean up after fade
      setTimeout(function () {
        stopCrackle();
        padOscs.forEach(function (p) {
          try { p.osc.stop(); } catch (e) {}
          try { p.osc2.stop(); } catch (e) {}
        });
        padOscs = [];
      }, 2000);
    },

    toggle: function () {
      if (playing) {
        this.stop();
      } else {
        this.start();
      }
      return playing;
    },

    isPlaying: function () {
      return playing;
    },

    setVolume: function (v) {
      volume = Math.max(0, Math.min(1, v));
      if (master && ctx) {
        master.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.3);
      }
    }
  };
})();
