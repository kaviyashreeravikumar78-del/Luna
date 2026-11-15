import { level5Audio } from '../audio/Level5Audio.js';
import '../styles/level5-hud.css';

/**
 * Level 5 (Habitat Repair) Minimal Modern HUD
 * - Top-left: Sol 5 & Stars
 * - Top-center: Objective chip (max 5 words)
 * - Top-right: Pressure gauge + Leaks sealed count + Pause button
 * - Center-bottom: Sonar Leak Detector widget with proximity dots
 * - Action Progress bar (Foam sealing & Valve turning)
 * - Touch joystick + Action button
 * - Win and Fail modals with Science Honesty disclaimer
 */
export class Level5HUD {
  constructor(options = {}) {
    this.options = options;
    this.pressure = 100;
    this.leaksSealed = 0;
    this.totalLeaks = 2;

    this.element = this.createDOM();
    document.body.appendChild(this.element);

    this.bindEvents();
  }

  createDOM() {
    const wrap = document.createElement('div');
    wrap.className = 'l5-hud-overlay';
    wrap.id = 'l5-hud-overlay';

    wrap.innerHTML = `
      <!-- TOP HUD BAR -->
      <div class="l5-top-bar">
        <div class="l5-badge-group">
          <div class="l5-sol-pill">
            <span class="l5-sol-dot"></span>
            <span>SOL 5 • HABITAT REPAIR</span>
          </div>
          <div class="l5-stars-pill" id="l5-stars-pill">⭐ 0 / 3 STARS</div>
        </div>

        <!-- Center Objective Chip -->
        <div class="l5-objective-chip" id="l5-objective-chip">
          <span id="l5-obj-icon">🔍</span>
          <span id="l5-obj-text">Find the air leak!</span>
        </div>

        <!-- Top-Right: Leaks sealed + Pressure Gauge + Pause -->
        <div class="l5-right-group">
          <!-- Leaks Sealed Badge -->
          <div class="l5-leaks-card" title="Sealed Leaks">
            <span class="l5-leak-icon">🔧</span>
            <span class="l5-leak-val" id="l5-leak-val">0 / 2 LEAKS</span>
          </div>

          <!-- Pressure Gauge -->
          <div class="l5-pressure-card" title="Habitat Air Pressure">
            <span class="l5-pressure-icon">💨</span>
            <div class="l5-pressure-info">
              <div class="l5-pressure-head">
                <span>PRESSURE</span>
                <span id="l5-pressure-num">100%</span>
              </div>
              <div class="l5-pressure-track">
                <div class="l5-pressure-fill" id="l5-pressure-fill" style="width: 100%;"></div>
              </div>
            </div>
          </div>

          <!-- Pause Button -->
          <button class="btn-l5-pause" id="btn-l5-pause" title="Pause Game">
            <span>⏸️</span>
          </button>
        </div>
      </div>

      <!-- LEAK DETECTOR SONAR BAR -->
      <div class="l5-detector-card" id="l5-detector-card">
        <span class="l5-detector-icon">📡</span>
        <span class="l5-detector-text" id="l5-detector-text">DETECTOR: SEARCHING...</span>
        <div class="l5-proximity-dots">
          <div class="l5-prox-dot" id="l5-pdot-0"></div>
          <div class="l5-prox-dot" id="l5-pdot-1"></div>
          <div class="l5-prox-dot" id="l5-pdot-2"></div>
          <div class="l5-prox-dot" id="l5-pdot-3"></div>
        </div>
      </div>

      <!-- ACTION PROGRESS (FOAM SEALING / VALVE TURN) -->
      <div class="l5-action-progress-wrap" id="l5-action-wrap">
        <span class="l5-action-title" id="l5-action-title">HOLD SPACE TO SPRAY FOAM</span>
        <div class="l5-action-track">
          <div class="l5-action-fill" id="l5-action-fill"></div>
        </div>
      </div>

      <!-- GO! POPUP -->
      <div class="l5-go-popup" id="l5-go-popup">GO! 💨</div>

      <!-- MOBILE TOUCH CONTROLS -->
      <div class="l5-touch-controls" id="l5-touch-controls">
        <div class="l5-joystick-zone" id="l5-joystick">
          <div class="l5-joystick-knob" id="l5-joystick-knob"></div>
        </div>
        <div class="l5-action-btn-zone">
          <button class="btn-l5-action" id="btn-l5-action">🔧</button>
          <span class="l5-action-hint">SEAL / VALVE</span>
        </div>
      </div>

      <!-- MODALS -->
      <div class="l5-modal-backdrop" id="l5-modal-backdrop">
        <div class="l5-modal-window" id="l5-modal-window">
          <!-- Dynamically populated -->
        </div>
      </div>
    `;

    return wrap;
  }

  bindEvents() {
    // Pause button
    const btnPause = this.element.querySelector('#btn-l5-pause');
    btnPause.addEventListener('click', () => {
      level5Audio.playClick();
      if (this.options.onPause) this.options.onPause();
    });

    // Touch controls setup
    this.setupTouchControls();
  }

  setupTouchControls() {
    const joystick = this.element.querySelector('#l5-joystick');
    const knob = this.element.querySelector('#l5-joystick-knob');
    const actionBtn = this.element.querySelector('#btn-l5-action');

    let touchId = null;
    let startX = 0, startY = 0;

    joystick.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.changedTouches[0];
      touchId = touch.identifier;
      const rect = joystick.getBoundingClientRect();
      startX = rect.left + rect.width / 2;
      startY = rect.top + rect.height / 2;
      this.handleJoystickMove(touch.clientX, touch.clientY, startX, startY, knob);
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      if (touchId === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchId) {
          this.handleJoystickMove(e.changedTouches[i].clientX, e.changedTouches[i].clientY, startX, startY, knob);
          break;
        }
      }
    }, { passive: false });

    const endJoystick = (e) => {
      if (touchId === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchId) {
          touchId = null;
          knob.style.transform = 'translate(0px, 0px)';
          if (this.options.onTouchMove) this.options.onTouchMove(0, 0);
          break;
        }
      }
    };

    window.addEventListener('touchend', endJoystick);
    window.addEventListener('touchcancel', endJoystick);

    // Action button
    actionBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (this.options.onActionDown) this.options.onActionDown();
    });

    actionBtn.addEventListener('pointerup', (e) => {
      e.preventDefault();
      if (this.options.onActionUp) this.options.onActionUp();
    });

    actionBtn.addEventListener('pointerleave', (e) => {
      if (this.options.onActionUp) this.options.onActionUp();
    });
  }

  handleJoystickMove(clientX, clientY, centerX, centerY, knob) {
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const maxRadius = 40;
    const dist = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);
    const clampedDist = Math.min(dist, maxRadius);

    const nx = Math.cos(angle) * clampedDist;
    const ny = Math.sin(angle) * clampedDist;

    knob.style.transform = `translate(${nx}px, ${ny}px)`;

    const normX = nx / maxRadius;
    const normY = ny / maxRadius;

    if (this.options.onTouchMove) {
      this.options.onTouchMove(normX, normY);
    }
  }

  setObjective(icon, text, urgent = false) {
    const chip = this.element.querySelector('#l5-objective-chip');
    const iconEl = this.element.querySelector('#l5-obj-icon');
    const textEl = this.element.querySelector('#l5-obj-text');

    if (iconEl) iconEl.textContent = icon;
    if (textEl) textEl.textContent = text;

    if (chip) {
      if (urgent) chip.classList.add('urgent');
      else chip.classList.remove('urgent');
    }
  }

  updatePressure(percent) {
    this.pressure = Math.max(0, Math.min(100, percent));
    const numEl = this.element.querySelector('#l5-pressure-num');
    const fillEl = this.element.querySelector('#l5-pressure-fill');

    if (numEl) numEl.textContent = `${Math.round(this.pressure)}%`;
    if (fillEl) {
      fillEl.style.width = `${this.pressure}%`;
      fillEl.classList.remove('medium', 'low');
      if (this.pressure < 30) {
        fillEl.classList.add('low');
      } else if (this.pressure < 60) {
        fillEl.classList.add('medium');
      }
    }
  }

  updateLeaksSealed(count, total = 2) {
    this.leaksSealed = count;
    this.totalLeaks = total;
    const valEl = this.element.querySelector('#l5-leak-val');
    if (valEl) {
      valEl.textContent = `${count} / ${total} LEAKS`;
      if (count === total) {
        valEl.style.color = '#06D6A0';
      }
    }
  }

  updateDetectorProximity(prox = 0) {
    // prox: 0 to 1
    const textEl = this.element.querySelector('#l5-detector-text');
    const dots = [
      this.element.querySelector('#l5-pdot-0'),
      this.element.querySelector('#l5-pdot-1'),
      this.element.querySelector('#l5-pdot-2'),
      this.element.querySelector('#l5-pdot-3'),
    ];

    dots.forEach((dot, idx) => {
      if (!dot) return;
      dot.classList.remove('active', 'close');
      const threshold = (idx + 1) * 0.25;
      if (prox >= threshold) {
        dot.classList.add(prox >= 0.75 ? 'close' : 'active');
      }
    });

    if (textEl) {
      if (prox >= 0.8) {
        textEl.textContent = 'LEAK LOCATED! APPLY FOAM!';
        textEl.style.color = '#FF5E57';
      } else if (prox >= 0.4) {
        textEl.textContent = 'AIR STREAM NEARBY...';
        textEl.style.color = '#FFB703';
      } else {
        textEl.textContent = 'DETECTOR: SEARCHING...';
        textEl.style.color = '#00E5FF';
      }
    }
  }

  showActionProgress(title, progress) {
    const wrap = this.element.querySelector('#l5-action-wrap');
    const titleEl = this.element.querySelector('#l5-action-title');
    const fillEl = this.element.querySelector('#l5-action-fill');

    if (wrap) wrap.classList.add('visible');
    if (titleEl) titleEl.textContent = title;
    if (fillEl) fillEl.style.width = `${Math.min(100, Math.max(0, progress * 100))}%`;
  }

  hideActionProgress() {
    const wrap = this.element.querySelector('#l5-action-wrap');
    if (wrap) wrap.classList.remove('visible');
  }

  showGoPopup() {
    const popup = this.element.querySelector('#l5-go-popup');
    if (!popup) return;
    popup.classList.add('active');
    setTimeout(() => {
      popup.classList.remove('active');
    }, 1200);
  }

  showWinModal(data = {}) {
    const backdrop = this.element.querySelector('#l5-modal-backdrop');
    const windowEl = this.element.querySelector('#l5-modal-window');

    const stars = data.stars || 3;
    const starString = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);

    windowEl.innerHTML = `
      <div style="font-size: 2.5rem;">🏠💨✨</div>
      <h3 class="l5-modal-title">HABITAT SEALED & SAFE!</h3>
      <div class="l5-modal-stars">${starString}</div>
      <p class="l5-modal-text">
        Great work, Commander! You located both micro-leaks, applied airtight foam sealant, and restored nominal habitat pressure!
      </p>

      <div class="l5-real-idea-box">
        <span class="l5-real-idea-tag">REAL IDEA</span>
        Astronauts check their spacecraft carefully and patch leaks to keep the air in. (All game pressure values and repair mechanics are simulated).
      </div>

      <div class="l5-modal-actions">
        <button class="btn-l5-primary" id="btn-win-continue">
          Continue to Sol 6 ➔
        </button>
      </div>
    `;

    backdrop.classList.add('open');

    windowEl.querySelector('#btn-win-continue').addEventListener('click', () => {
      level5Audio.playClick();
      backdrop.classList.remove('open');
      if (data.onContinue) data.onContinue();
    });
  }

  showFailModal(onRetry, onExit) {
    const backdrop = this.element.querySelector('#l5-modal-backdrop');
    const windowEl = this.element.querySelector('#l5-modal-window');

    windowEl.innerHTML = `
      <div style="font-size: 2.5rem;">💨⚠️</div>
      <h3 class="l5-modal-title">Pressure is Low!</h3>
      <p class="l5-modal-text">
        The air escaped before the leaks were sealed. Let's trace the hiss and patch them fast!
      </p>

      <div class="l5-modal-actions">
        <button class="btn-l5-primary" id="btn-fail-retry">
          Try Again 🔄
        </button>
        <button class="btn-l5-secondary" id="btn-fail-exit">
          Mission Control 🚀
        </button>
      </div>
    `;

    backdrop.classList.add('open');

    windowEl.querySelector('#btn-fail-retry').addEventListener('click', () => {
      level5Audio.playClick();
      backdrop.classList.remove('open');
      if (onRetry) onRetry();
    });

    windowEl.querySelector('#btn-fail-exit').addEventListener('click', () => {
      level5Audio.playClick();
      backdrop.classList.remove('open');
      if (onExit) onExit();
    });
  }

  showPauseModal(onResume, onRestart, onMute, onExit) {
    const backdrop = this.element.querySelector('#l5-modal-backdrop');
    const windowEl = this.element.querySelector('#l5-modal-window');

    windowEl.innerHTML = `
      <div style="font-size: 2.2rem;">⏸️</div>
      <h3 class="l5-modal-title">Mission Paused</h3>
      <p class="l5-modal-text">Habitat pressure maintenance in progress.</p>

      <div class="l5-modal-actions">
        <button class="btn-l5-primary" id="btn-pause-resume">Resume ▶</button>
        <button class="btn-l5-secondary" id="btn-pause-restart">Restart 🔄</button>
        <button class="btn-l5-secondary" id="btn-pause-mute">${level5Audio.isMuted ? '🔇 Sound: MUTED' : '🔊 Sound: ON'}</button>
        <button class="btn-l5-secondary" id="btn-pause-exit">Mission Control 🚀</button>
      </div>
    `;

    backdrop.classList.add('open');

    windowEl.querySelector('#btn-pause-resume').addEventListener('click', () => {
      level5Audio.playClick();
      backdrop.classList.remove('open');
      if (onResume) onResume();
    });

    windowEl.querySelector('#btn-pause-restart').addEventListener('click', () => {
      level5Audio.playClick();
      backdrop.classList.remove('open');
      if (onRestart) onRestart();
    });

    const muteBtn = windowEl.querySelector('#btn-pause-mute');
    muteBtn.addEventListener('click', () => {
      level5Audio.setMuted(!level5Audio.isMuted);
      muteBtn.textContent = level5Audio.isMuted ? '🔇 Sound: MUTED' : '🔊 Sound: ON';
      level5Audio.playClick();
      if (onMute) onMute(level5Audio.isMuted);
    });

    windowEl.querySelector('#btn-pause-exit').addEventListener('click', () => {
      level5Audio.playClick();
      backdrop.classList.remove('open');
      if (onExit) onExit();
    });
  }

  hideModals() {
    const backdrop = this.element.querySelector('#l5-modal-backdrop');
    if (backdrop) backdrop.classList.remove('open');
  }

  dispose() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}
