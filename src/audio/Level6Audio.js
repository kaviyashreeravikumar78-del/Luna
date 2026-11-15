/**
 * Web Audio API Sound Synthesizer for Level 6 (Communication)
 * Procedural audio generation for antenna motor servo, signal carrier tone,
 * satellite lock chime, rhythm transmission beeps, beam pulse, and Earth glow.
 */
class Level6AudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.carrierOsc = null;
    this.carrierGain = null;
    this.isCarrierPlaying = false;
    this.motorOsc = null;
    this.motorGain = null;
    this.isMotorPlaying = false;
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
    if (muted) {
      if (this.carrierGain) this.carrierGain.gain.setValueAtTime(0, this.ctx?.currentTime || 0);
      if (this.motorGain) this.motorGain.gain.setValueAtTime(0, this.ctx?.currentTime || 0);
    }
  }

  /**
   * Continuous telemetry carrier tone that rises in pitch as dish points to satellite
   */
  startCarrierTone() {
    if (this.isCarrierPlaying || this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, ctx.currentTime); // Low baseline pitch

    gain.gain.setValueAtTime(0.01, ctx.currentTime);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();

    this.carrierOsc = osc;
    this.carrierGain = gain;
    this.isCarrierPlaying = true;
  }

  /**
   * Updates signal carrier tone pitch and volume based on signal strength (0 to 1)
   */
  updateSignalStrength(strength = 0) {
    if (!this.isCarrierPlaying || !this.carrierOsc || !this.carrierGain || this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    // Pitch rises smoothly from 320Hz up to 1046Hz (C6) as aim nears satellite
    const targetFreq = 320 + strength * 726;
    const targetGain = 0.02 + strength * 0.14;

    this.carrierOsc.frequency.setTargetAtTime(targetFreq, ctx.currentTime, 0.08);
    this.carrierGain.gain.setTargetAtTime(targetGain, ctx.currentTime, 0.08);
  }

  stopCarrierTone() {
    if (!this.isCarrierPlaying) return;
    try {
      if (this.carrierOsc) this.carrierOsc.stop();
    } catch (e) {}
    this.carrierOsc = null;
    this.carrierGain = null;
    this.isCarrierPlaying = false;
  }

  /**
   * Stepper motor mechanical hum while dish is rotating
   */
  setMotorSound(isMoving) {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    if (isMoving && !this.isMotorPlaying) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(95, ctx.currentTime);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(280, ctx.currentTime);

      gain.gain.setValueAtTime(0.04, ctx.currentTime);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      this.motorOsc = osc;
      this.motorGain = gain;
      this.isMotorPlaying = true;
    } else if (!isMoving && this.isMotorPlaying) {
      try {
        if (this.motorOsc) this.motorOsc.stop();
      } catch (e) {}
      this.motorOsc = null;
      this.motorGain = null;
      this.isMotorPlaying = false;
    }
  }

  /**
   * Ascending chime sequence when target lock reaches 100%
   */
  playLockChime() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [587.33, 783.99, 1174.66]; // D5, G5, D6
    const now = ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + idx * 0.12;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.05, t + 0.25);

      gain.gain.setValueAtTime(0.01, t);
      gain.gain.linearRampToValueAtTime(0.22, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.36);
    });
  }

  /**
   * Crisp musical note for rhythm transmission hits
   */
  playRhythmHit(noteIndex = 0) {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const scale = [523.25, 587.33, 659.25, 698.46, 783.99, 880.0, 987.77, 1046.50]; // C Major
    const freq = scale[noteIndex % scale.length];
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.28);
  }

  /**
   * Soft forgiving sound on rhythm miss
   */
  playRhythmMiss() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.1);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  /**
   * Laser data pulse surge from dish to satellite
   */
  playPulseToEarth() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.22);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.24);
  }

  /**
   * Resonant celestial hum as Earth lights up with the received transmission
   */
  playEarthGlow() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const chord = [261.63, 329.63, 392.0, 523.25]; // C Major chord (C4, E4, G4, C5)

    chord.forEach(f => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 1.45);
    });
  }

  /**
   * Victory Fanfare
   */
  playVictoryFanfare() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const melody = [
      { f: 587.33, d: 0.14 }, // D5
      { f: 739.99, d: 0.14 }, // F#5
      { f: 880.00, d: 0.14 }, // A5
      { f: 1174.66, d: 0.44 }, // D6
    ];

    let t = ctx.currentTime;
    melody.forEach(note => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, t);

      gain.gain.setValueAtTime(0.01, t);
      gain.gain.linearRampToValueAtTime(0.24, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + note.d);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + note.d);

      t += note.d * 0.85;
    });
  }

  playFailTone() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [440, 392, 349.23];
    notes.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + idx * 0.18;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t);

      gain.gain.setValueAtTime(0.14, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.24);
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

export const level6Audio = new Level6AudioEngine();
