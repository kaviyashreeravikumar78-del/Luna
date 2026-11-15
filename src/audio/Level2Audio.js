/**
 * Web Audio API Sound Synthesizer for Level 2 (Water Hunt Driving Mini-game)
 * Procedural audio generation with 0 external files:
 * - Dynamic rover engine hum (frequency & volume scale with speed)
 * - Radar sonar ping (pitch and tempo indicate hot/cold proximity)
 * - Drill rumble and rock crushing sound
 * - Ice collection chime & water splash
 * - Low-battery beep and victory jingle
 */
class Level2AudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.engineOsc = null;
    this.engineGain = null;
    this.engineRunning = false;
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
    if (this.engineGain) {
      this.engineGain.gain.value = muted ? 0 : 0.05;
    }
  }

  /**
   * Starts continuous rover engine hum
   */
  startEngine() {
    if (this.engineRunning) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      this.engineOsc = ctx.createOscillator();
      this.engineGain = ctx.createGain();

      this.engineOsc.type = 'triangle';
      this.engineOsc.frequency.setValueAtTime(55, ctx.currentTime); // Low idle rumble (A1)

      this.engineGain.gain.setValueAtTime(this.isMuted ? 0 : 0.04, ctx.currentTime);

      // Low pass filter for mechanical motor rumble
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(220, ctx.currentTime);

      this.engineOsc.connect(filter);
      filter.connect(this.engineGain);
      this.engineGain.connect(ctx.destination);

      this.engineOsc.start();
      this.engineRunning = true;
    } catch (e) {
      console.warn("Could not start engine audio:", e);
    }
  }

  /**
   * Modulates engine frequency and volume based on normalized rover speed (0 to 1)
   */
  updateEngineSpeed(speedRatio) {
    if (!this.engineRunning || !this.engineOsc || this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const baseFreq = 50;
    const maxFreq = 160;
    const targetFreq = baseFreq + speedRatio * (maxFreq - baseFreq);

    this.engineOsc.frequency.setTargetAtTime(targetFreq, ctx.currentTime, 0.08);
    const targetGain = 0.03 + speedRatio * 0.06;
    this.engineGain.gain.setTargetAtTime(targetGain, ctx.currentTime, 0.08);
  }

  stopEngine() {
    if (!this.engineRunning) return;
    try {
      if (this.engineOsc) {
        this.engineOsc.stop();
        this.engineOsc.disconnect();
      }
    } catch (e) {}
    this.engineRunning = false;
    this.engineOsc = null;
    this.engineGain = null;
  }

  /**
   * Radar Sonar Ping
   * @param {string} proximity - 'cold' (low beep), 'warm' (medium chime), 'hot' (rapid high ping)
   */
  playRadarPing(proximity = 'cold') {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    let freq = 440;
    let beeps = 1;
    let gap = 0.12;

    if (proximity === 'cold') {
      freq = 330; // E4
      beeps = 1;
    } else if (proximity === 'warm') {
      freq = 660; // E5
      beeps = 2;
    } else if (proximity === 'hot') {
      freq = 990; // B5
      beeps = 3;
    }

    for (let b = 0; b < beeps; b++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + b * gap);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.85, ctx.currentTime + b * gap + 0.18);

      gain.gain.setValueAtTime(0.001, ctx.currentTime + b * gap);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + b * gap + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + b * gap + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + b * gap);
      osc.stop(ctx.currentTime + b * gap + 0.22);
    }
  }

  /**
   * Drilling rumble sound
   */
  playDrill() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(140, ctx.currentTime + 0.12);
    osc.frequency.linearRampToValueAtTime(75, ctx.currentTime + 0.25);

    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  }

  /**
   * Crystal / Ice collection chime
   */
  playIceCollect() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [880, 1174.66, 1760]; // A5, D6, A6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.05);

      gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.05);
      gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + idx * 0.05 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.05 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.05);
      osc.stop(ctx.currentTime + idx * 0.05 + 0.35);
    });
  }

  /**
   * Water splashing / tank filling sound
   */
  playSplash() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const bufferSize = ctx.sampleRate * 0.6;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.2));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(1600, ctx.currentTime + 0.3);
    filter.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.6);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start();
  }

  /**
   * Obstacle bump thump
   */
  playBump() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(35, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  }

  /**
   * Victory jingle
   */
  playSuccessJingle() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5]; // C5, E5, G5, C6, E6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);

      gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.1);
      gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + idx * 0.1 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.1 + 0.55);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.1);
      osc.stop(ctx.currentTime + idx * 0.1 + 0.55);
    });
  }
}

export const level2Audio = new Level2AudioEngine();
