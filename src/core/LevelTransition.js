import { orbitVoice } from '../audio/OrbitVoice.js';
import '../styles/level-transition.css';

/**
 * Shared Level Transition Helper
 * Handles smooth circular iris wipes (orange/navy style) and cinematic level transitions.
 * Reusable across Levels 1-7.
 */
export class LevelTransition {
  static overlay = null;
  static isTransitioning = false;

  static init() {
    if (this.overlay) return;

    this.overlay = document.createElement('div');
    this.overlay.className = 'level-transition-overlay';
    this.overlay.id = 'level-transition-overlay';

    this.overlay.innerHTML = `
      <div class="level-transition-iris" id="lt-iris"></div>
      <div class="level-transition-ring" id="lt-ring"></div>
      <div class="level-transition-content" id="lt-content">
        <div class="level-transition-badge" id="lt-badge">
          <span>🚀 EXPEDITION LUNA-01</span>
        </div>
        <h2 class="level-transition-title" id="lt-title">
          DAY 1: <span class="title-accent">POWER UP</span>
        </h2>
        <p class="level-transition-subtitle" id="lt-subtitle">
          Lunar dust is blocking the solar panels. Clean them to restore power!
        </p>
        <div class="level-transition-loader-box" id="lt-loader-box">
          <div class="level-transition-mascot">⭐🤖</div>
          <div class="level-transition-track">
            <div class="level-transition-fill" id="lt-fill"></div>
          </div>
        </div>
      </div>
      <button class="btn-level-skip" id="lt-btn-skip">Skip Intro ➔</button>
    `;

    document.body.appendChild(this.overlay);

    this.overlay.querySelector('#lt-btn-skip').addEventListener('click', () => {
      if (this.currentSkipHandler) {
        this.currentSkipHandler();
      }
    });
  }

  /**
   * Plays a complete circular iris transition into a level
   * @param {Object} options
   * @param {string} options.badge - e.g. "SOL 1 • MISSION"
   * @param {string} options.title - e.g. "POWER UP"
   * @param {string} options.subtitle - Brief 1-line description
   * @param {Function} options.onMidpoint - Called when screen is completely covered by iris
   * @param {Function} options.onComplete - Called when transition fully finishes and scene is revealed
   * @param {boolean} options.skipIntro - If true, skips the middle loading pause
   */
  static play(options = {}) {
    this.init();
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    const {
      badge = 'SOL 1 • EXPEDITION',
      title = 'DAY 1: <span class="title-accent">POWER UP</span>',
      subtitle = 'Moon dust is blocking our solar panels. Restore power to Outpost LUNA-01!',
      onMidpoint = null,
      onComplete = null,
      skipIntro = false
    } = options;

    const iris = this.overlay.querySelector('#lt-iris');
    const content = this.overlay.querySelector('#lt-content');
    const badgeEl = this.overlay.querySelector('#lt-badge');
    const titleEl = this.overlay.querySelector('#lt-title');
    const subtitleEl = this.overlay.querySelector('#lt-subtitle');
    const fillEl = this.overlay.querySelector('#lt-fill');
    const skipBtn = this.overlay.querySelector('#lt-btn-skip');

    badgeEl.textContent = badge;
    titleEl.innerHTML = title;
    subtitleEl.textContent = subtitle;
    fillEl.style.width = '0%';

    this.overlay.classList.add('active');
    iris.className = 'level-transition-iris';

    let skipped = false;
    const triggerComplete = () => {
      if (skipped) return;
      skipped = true;
      this.currentSkipHandler = null;

      // Iris opens to reveal the loaded level
      content.classList.remove('visible');
      skipBtn.style.display = 'none';
      iris.classList.add('open');

      setTimeout(() => {
        this.overlay.classList.remove('active');
        this.isTransitioning = false;
        if (onComplete) onComplete();
      }, 650);
    };

    this.currentSkipHandler = () => {
      triggerComplete();
    };

    // 1. Close iris over the old scene (0.65s)
    requestAnimationFrame(() => {
      iris.classList.add('closed');
    });

    setTimeout(() => {
      // 2. Midpoint reached (old scene is fully obscured)
      if (onMidpoint) onMidpoint();

      if (skipIntro) {
        // Instant opening for fast retries
        setTimeout(triggerComplete, 150);
        return;
      }

      // Show title and animated progress
      content.classList.add('visible');
      skipBtn.style.display = 'inline-flex';

      // Animate loading bar (1.0s)
      let progress = 0;
      const progressInterval = setInterval(() => {
        if (skipped) {
          clearInterval(progressInterval);
          return;
        }
        progress += 25;
        fillEl.style.width = `${progress}%`;
        if (progress >= 100) {
          clearInterval(progressInterval);
          setTimeout(triggerComplete, 250);
        }
      }, 250);
    }, 650);
  }

  /**
   * Reverse transition back from a level to Mission Control
   */
  static exitToMissionControl(onMidpoint, onComplete) {
    this.init();
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    const iris = this.overlay.querySelector('#lt-iris');
    const content = this.overlay.querySelector('#lt-content');
    const skipBtn = this.overlay.querySelector('#lt-btn-skip');

    content.classList.remove('visible');
    skipBtn.style.display = 'none';
    this.overlay.classList.add('active');

    iris.className = 'level-transition-iris';
    requestAnimationFrame(() => {
      iris.classList.add('closed');
    });

    setTimeout(() => {
      if (onMidpoint) onMidpoint();

      setTimeout(() => {
        iris.classList.remove('closed');
        iris.classList.add('open');
        setTimeout(() => {
          this.overlay.classList.remove('active');
          this.isTransitioning = false;
          if (onComplete) onComplete();
        }, 650);
      }, 200);
    }, 650);
  }
}
