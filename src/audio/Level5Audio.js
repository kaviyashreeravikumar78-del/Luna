/**
 * Web Audio API Sound Synthesizer for Level 5 (Habitat Repair)
 * Procedural audio generation for habitat emergency alarm, air leak hissing,
 * sonar leak detector pings, foam sealant spraying, and pressure valve turning.
 */
class Level5AudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.hissNode = null;
    this.hissGain = null;
    this.hissFilter = null;
    this.isHissing = false;
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
    if (muted && this.hissGain) {
      this.hissGain.gain.setValueAtTime(0, this.ctx?.currentTime || 0);
    }
  }

  /**
   * Soft pulsing amber alarm on habitat entry
   */
  playSoftAlarm() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    [0, 0.28, 0.56].forEach(offset => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now + offset); // D5
      osc.frequency.exponentialRampToValueAtTime(880.0, now + offset + 0.12);

      gain.gain.setValueAtTime(0.01, now + offset);
      gain.gain.linearRampToValueAtTime(0.14, now + offset + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + offset);
      osc.stop(now + offset + 0.2);
    });
  }

  /**
   * Continuous air leak hiss with proximity modulation
   */
  startHiss() {
    if (this.isHissing || this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    // White noise buffer
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, ctx.currentTime);
    filter.Q.value = 2.5;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, ctx.currentTime);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start();

    this.hissNode = noise;
    this.hissFilter = filter;
    this.hissGain = gain;
    this.isHissing = true;
  }

  /**
   * Modulate hiss intensity based on distance to nearest leak (0 to 1)
   */
  setHissProximity(proximity = 0) {
    if (!this.isHissing || !this.hissGain || !this.hissFilter || this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    // proximity: 1 = right next to leak, 0 = far away
    const targetGain = 0.02 + proximity * 0.22;
    const targetFreq = 800 + proximity * 2400; // 800Hz to 3200Hz

    this.hissGain.gain.setTargetAtTime(targetGain, ctx.currentTime, 0.1);
    this.hissFilter.frequency.setTargetAtTime(targetFreq, ctx.currentTime, 0.1);
  }

  stopHiss() {
    if (!this.isHissing) return;
    try {
      if (this.hissNode) this.hissNode.stop();
    } catch (e) {}
    this.hissNode = null;
    this.hissFilter = null;
    this.hissGain = null;
    this.isHissing = false;
  }

  /**
   * Handheld Leak Detector Sonar Ping
   * @param {number} proximity 0 (far) to 1 (touching leak)
   */
  playDetectorPing(proximity = 0.2) {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Frequency rises from 600Hz up to 1800Hz as player nears leak
    const baseFreq = 650 + proximity * 1150;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.35, now + 0.08);

    gain.gain.setValueAtTime(0.02, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  /**
   * Foam Sealant Spray sound (gentle airy fizz)
   */
  playFoamSpray() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const duration = 0.12;
    const bufSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(3200, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start();
  }

  /**
   * Cheerful chime when a crack is fully sealed with foam
   */
  playLeakSealed() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [659.25, 880.0, 1174.66]; // E5, A5, D6
    const now = ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + idx * 0.1;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.01, t);
      gain.gain.linearRampToValueAtTime(0.2, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.3);
    });
  }

  /**
   * Metallic ratchet clicks as player turns the pressure valve wheel
   */
  playValveClick() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.04);

    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.045);
  }

  /**
   * Air surge / pressurization whoosh when habitat pressure is fully restored
   */
  playPressureRestore() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const duration = 0.9;
    const bufSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(2800, ctx.currentTime + 0.45);
    filter.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + duration);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.02, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start();
  }

  /**
   * Victory fanfare
   */
  playVictoryFanfare() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [
      { f: 523.25, d: 0.14 }, // C5
      { f: 659.25, d: 0.14 }, // E5
      { f: 783.99, d: 0.14 }, // G5
      { f: 1046.50, d: 0.42 }, // C6
    ];

    let t = ctx.currentTime;
    notes.forEach(note => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, t);

      gain.gain.setValueAtTime(0.01, t);
      gain.gain.linearRampToValueAtTime(0.22, t + 0.02);
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
    osc.frequency.setValueAtTime(1100, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  }
}

export const level5Audio = new Level5AudioEngine();
