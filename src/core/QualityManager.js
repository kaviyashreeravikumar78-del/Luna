/**
 * LUNA: Mission Survival - QualityManager
 * Automatically scales graphic fidelity (pixel ratio, shadows, particle pools)
 * to maintain a rock-solid 60 FPS on laptops and 30+ FPS on budget phones.
 */
export class QualityManager {
  constructor(game) {
    this.game = game;
    this.storageKey = 'luna_graphics_quality';

    this.presets = {
      high: {
        id: 'high',
        label: 'High (Crisp 🚀)',
        pixelRatio: Math.min(window.devicePixelRatio || 1, 1.5),
        shadows: true,
        shadowMapSize: 1024,
        particleScale: 1.0
      },
      medium: {
        id: 'medium',
        label: 'Medium (Balanced ⚡)',
        pixelRatio: Math.min(window.devicePixelRatio || 1, 1.25),
        shadows: true,
        shadowMapSize: 512,
        particleScale: 0.6
      },
      low: {
        id: 'low',
        label: 'Low (Battery Saver 🔋)',
        pixelRatio: 1.0,
        shadows: false,
        shadowMapSize: 256,
        particleScale: 0.35
      }
    };

    // Auto-detect mobile devices for butter-smooth 60 FPS
    const isMobile = (typeof window !== 'undefined') && (window.innerWidth <= 900 || ('ontouchstart' in window) || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0));

    // User preference: 'auto' | 'high' | 'medium' | 'low'
    this.mode = localStorage.getItem(this.storageKey) || 'auto';
    this.activePresetId = this.mode === 'auto' ? (isMobile ? 'medium' : 'high') : this.mode;

    // Performance monitor (Auto downgrade if < 40 FPS for 3s)
    this.lowFpsDuration = 0;
    this.sampleCount = 0;
    this.sampleAccum = 0;

    // Apply initial settings
    this.apply(this.activePresetId);
  }

  get currentPreset() {
    return this.presets[this.activePresetId] || this.presets.high;
  }

  apply(presetId) {
    const preset = this.presets[presetId];
    if (!preset) return;
    this.activePresetId = presetId;

    const renderer = this.game.renderer;
    if (renderer) {
      renderer.setPixelRatio(preset.pixelRatio);
      renderer.shadowMap.enabled = preset.shadows;

      if (this.game.lighting && this.game.lighting.sunLight) {
        this.game.lighting.sunLight.castShadow = preset.shadows;
        if (this.game.lighting.sunLight.shadow && this.game.lighting.sunLight.shadow.mapSize) {
          this.game.lighting.sunLight.shadow.mapSize.width = preset.shadowMapSize;
          this.game.lighting.sunLight.shadow.mapSize.height = preset.shadowMapSize;
        }
      }
    }
  }

  setMode(mode) {
    this.mode = mode;
    localStorage.setItem(this.storageKey, mode);
    if (mode === 'auto') {
      this.lowFpsDuration = 0;
      this.apply('high');
    } else {
      this.apply(mode);
    }
  }

  /**
   * Called every frame in the main render loop to track frame rate
   */
  update(delta) {
    if (this.mode !== 'auto' || this.activePresetId === 'low') return;

    // FPS estimation
    if (delta > 0) {
      const currentFps = 1 / delta;
      this.sampleAccum += currentFps;
      this.sampleCount++;

      // Check average every 1 second
      if (this.sampleCount >= 30) {
        const avgFps = this.sampleAccum / this.sampleCount;
        this.sampleAccum = 0;
        this.sampleCount = 0;

        if (avgFps < 40) {
          this.lowFpsDuration += 1;
          if (this.lowFpsDuration >= 3) {
            // Drop one tier down!
            if (this.activePresetId === 'high') {
              console.log('⚡ QualityManager: Auto-adjusting to Medium quality for smoother 60 FPS.');
              this.apply('medium');
            } else if (this.activePresetId === 'medium') {
              console.log('⚡ QualityManager: Auto-adjusting to Low quality for smoother performance.');
              this.apply('low');
            }
            this.lowFpsDuration = 0;
          }
        } else {
          this.lowFpsDuration = Math.max(0, this.lowFpsDuration - 0.5);
        }
      }
    }
  }
}
