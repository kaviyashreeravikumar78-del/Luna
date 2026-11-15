/**
 * LUNA: Mission Survival - Robotic Voice & Chirp Synthesizer for ORBIT
 * Uses Web Speech API (SpeechSynthesis) and Web Audio API (Synthesizer Chirps)
 * 100% client-side, zero external files, works in all modern browsers
 */
export class OrbitVoiceManager {
  constructor() {
    this.storageKey = 'luna_orbit_voice_muted';
    this.isMuted = typeof localStorage !== 'undefined' ? localStorage.getItem(this.storageKey) === 'true' : false;
    this.synth = typeof window !== 'undefined' && window.speechSynthesis ? window.speechSynthesis : null;
    this.audioCtx = null;
    this.voice = null;

    if (this.synth) {
      this.initVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.initVoices();
      }
    }
  }

  initAudioContext() {
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.audioCtx = new AudioCtx();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  initVoices() {
    if (!this.synth) return;
    const voices = this.synth.getVoices();
    // Prioritize clear, natural English voices
    this.voice = voices.find(v => 
      v.lang.startsWith('en') && (
        v.name.includes('Natural') || 
        v.name.includes('Google') || 
        v.name.includes('Samantha') || 
        v.name.includes('Zira')
      )
    ) || voices.find(v => v.lang.startsWith('en')) || voices[0] || null;
  }

  /**
   * Plays a cute electronic robotic chirp before ORBIT speaks
   */
  playChirp(type = 'activate') {
    if (this.isMuted) return;
    try {
      this.initAudioContext();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';

      if (type === 'activate') {
        // High-pitched rising robot chirp (like BB-8 or R2)
        osc.frequency.setValueAtTime(580, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
        osc.frequency.exponentialRampToValueAtTime(1150, now + 0.16);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.12, now + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.24);
      } else if (type === 'click') {
        // Short subtle click blip
        osc.frequency.setValueAtTime(740, now);
        osc.frequency.exponentialRampToValueAtTime(960, now + 0.05);

        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.07);
      } else if (type === 'hover') {
        // Gentle soft UI hover tick
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(1020, now + 0.03);

        gain.gain.setValueAtTime(0.02, now);
        gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.04);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'success') {
        // Upbeat game reward chime
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
          const o = this.audioCtx.createOscillator();
          const g = this.audioCtx.createGain();
          o.type = 'triangle';
          o.frequency.setValueAtTime(freq, now + i * 0.07);
          g.gain.setValueAtTime(0.06, now + i * 0.07);
          g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.25);
          o.connect(g);
          g.connect(this.audioCtx.destination);
          o.start(now + i * 0.07);
          o.stop(now + i * 0.07 + 0.26);
        });
      } else if (type === 'warning') {
        // Soft alert pulse
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(370, now + 0.09);
        gain.gain.setValueAtTime(0.07, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.24);
      }
    } catch (e) {
      // AudioContext policy gracefully handled
    }
  }

  /**
   * Speaks dialogue with a friendly robotic pitch and cadence.
   * Supports real-time speech synthesis lifecycle events for animation sync.
   */
  speak(text, onEnd = null, onBoundary = null, onStart = null) {
    if (this.isMuted || !this.synth) {
      if (onEnd) onEnd();
      return;
    }

    // Cancel any previous speaking line immediately
    this.synth.cancel();

    // Play initial robot chirp
    this.playChirp('activate');

    // Clean text: strip emojis, symbols, and formatting that sound weird when read aloud
    const cleanText = text
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '') // Remove emojis
      .replace(/[•✓✕→←\*#]/g, '') // Remove bullet points & arrows
      .replace(/\s+/g, ' ')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);

    if (this.voice) {
      utterance.voice = this.voice;
    }

    // Friendly robotic voice parameters
    utterance.pitch = 1.25; // Slightly higher pitch for cute robot persona
    utterance.rate = 1.05;  // Brisk and cheerful cadence
    utterance.volume = 1.0;

    if (onStart) {
      utterance.onstart = onStart;
    }
    if (onBoundary) {
      utterance.onboundary = onBoundary;
    }
    if (onEnd) {
      utterance.onend = onEnd;
      utterance.onerror = onEnd;
    }

    // Small delay so chirp plays first
    setTimeout(() => {
      try {
        this.synth.speak(utterance);
      } catch (err) {
        console.warn('Speech synthesis error:', err);
        if (onEnd) onEnd();
      }
    }, 90);
  }

  /**
   * Stops current speech immediately
   */
  stop() {
    if (this.synth) {
      this.synth.cancel();
    }
  }

  /**
   * Toggles voice on/off
   */
  toggleMute() {
    this.isMuted = !this.isMuted;
    localStorage.setItem(this.storageKey, this.isMuted ? 'true' : 'false');
    if (this.isMuted) {
      this.stop();
    } else {
      this.playChirp('activate');
    }
    return !this.isMuted;
  }
}

// Global Singleton Instance
export const orbitVoice = new OrbitVoiceManager();
