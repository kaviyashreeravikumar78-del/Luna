/**
 * Web Audio API Sound Synthesizer for Level 7 (Final Colony Check & Finale)
 * Procedural audio generation for facility checks, mini-challenge sounds,
 * fireworks explosions, and the grand mission completion fanfare.
 */
class Level7AudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
  }

  getContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  setMuted(muted) {
    this.isMuted = muted;
  }

  /**
   * Facility Check completed sound (bright celebratory major chord)
   */
  playFacilityCheck(index = 0) {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const chords = [
      [523.25, 659.25, 783.99],   // C Major
      [587.33, 739.99, 880.00],   // D Major
      [659.25, 830.61, 987.77],   // E Major
      [698.46, 880.00, 1046.50],  // F Major
      [783.99, 987.77, 1174.66],  // G Major (Grand 5th)
    ];

    const notes = chords[index % chords.length];
    const now = ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + idx * 0.06;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.01, t);
      gain.gain.linearRampToValueAtTime(0.2, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.48);
    });
  }

  /**
   * Fireworks burst pop & crackle
   */
  playFireworks() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // 1. Initial low launch / explosion thump
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.35);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.4);

    // 2. High sparkle crackle (noise burst)
    const bufSize = ctx.sampleRate * 0.5;
    const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2800, now + 0.08);
    filter.frequency.exponentialRampToValueAtTime(800, now + 0.5);
    filter.Q.value = 3.5;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.01, now + 0.08);
    noiseGain.gain.linearRampToValueAtTime(0.22, now + 0.12);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    noise.start(now + 0.08);
  }

  /**
   * Water pouring sound for Greenhouse check
   */
  playWaterPour() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const bufSize = ctx.sampleRate * 0.4;
    const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.4);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start();
  }

  /**
   * Cable snap click for Research Lab check
   */
  playCableSnap() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.08);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  /**
   * Grand Mission Completion Fanfare (Full 7-day victory)
   */
  playGrandCelebration() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [
      { f: 523.25, d: 0.16 }, // C5
      { f: 659.25, d: 0.16 }, // E5
      { f: 783.99, d: 0.16 }, // G5
      { f: 1046.50, d: 0.28 }, // C6
      { f: 880.00, d: 0.18 },  // A5
      { f: 1046.50, d: 0.18 }, // C6
      { f: 1174.66, d: 0.55 }, // D6
    ];

    let t = ctx.currentTime;
    notes.forEach(note => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, t);

      gain.gain.setValueAtTime(0.01, t);
      gain.gain.linearRampToValueAtTime(0.25, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + note.d);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + note.d);

      t += note.d * 0.85;
    });
  }

  playClick() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  }
}

export const level7Audio = new Level7AudioEngine();
