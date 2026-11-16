import { level4Audio } from '../audio/Level4Audio.js';
import { orbit } from '../components/Orbit.js';
import '../styles/level4-hud.css';

/**
 * Level 4 Dedicated HUD - Hydroponic Bio-Domes & Food Production
 * Features:
 * - Sol 4 & Stars badge
 * - Prominent objective chip
 * - Temperature gauge (Cold 11°C -> Warm 22°C)
 * - Prominent floating action button (bottom center, unblocked by ORBIT)
 * - Mobile Touch joystick + Action button
 * - Win, Fail, and Pause modals (with auto-docking for ORBIT)
 */
export class Level4HUD {
  constructor(options = {}) {
    this.options = options;
    this.element = this.createDOM();
    this.bindEvents();
    document.body.appendChild(this.element);
  }

  createDOM() {
    const wrap = document.createElement('div');
    wrap.className = 'l4-hud-root';
    wrap.id = 'level4-hud';

    wrap.innerHTML = `
      <!-- TOP STATUS BAR -->
      <div class="l4-top-bar">
        <div class="l4-badge-group">
          <div class="l4-sol-pill">SOL 4 • BIO-DOMES</div>
          <div class="l4-stars-pill" id="l4-stars-display">⭐⭐⭐</div>
        </div>

        <!-- Center Objective Chip -->
        <div class="l4-objective-chip" id="l4-objective-chip">
          <span class="l4-obj-icon" id="l4-obj-icon">🌱</span>
          <span id="l4-obj-text">Enter Greenhouse Bio-Dome!</span>
        </div>

        <!-- Right Cluster -->
        <div class="l4-right-cluster">
          <div class="l4-temp-pill cold" id="l4-temp-pill">
            <span>❄️</span>
            <span id="l4-temp-text">11°C (CHILLY)</span>
          </div>
          <button class="btn-l4-pause" id="btn-l4-pause" aria-label="Pause Game">⏸</button>
        </div>
      </div>

      <!-- FLOATING ACTION DOCK: BOTTOM CENTER (Unblocked by ORBIT) -->
      <div class="l4-action-dock" id="l4-action-dock" style="display: none;">
        <button class="btn-l4-action" id="btn-l4-action" aria-label="Perform Action">
          <span class="l4-action-icon" id="l4-action-icon">🌱</span>
          <span class="l4-action-text" id="l4-action-text">PLANT SEEDS [SPACE]</span>
          <span class="l4-action-key">[SPACE]</span>
        </button>
      </div>

      <!-- MOBILE TOUCH CONTROLS -->
      <div class="l4-touch-controls" id="l4-touch-controls">
        <div class="l4-joystick-zone" id="l4-joystick">
          <div class="l4-joystick-knob" id="l4-joystick-knob"></div>
        </div>
        <div class="l4-action-btn-zone">
          <button class="btn-l4-touch-action" id="btn-l4-touch-action">🌱</button>
          <span class="l4-action-hint" id="l4-touch-hint">ACTION</span>
        </div>
      </div>

      <!-- MODAL BACKDROP -->
      <div class="l4-modal-backdrop" id="l4-modal-backdrop">
        <div class="l4-modal-window" id="l4-modal-window">
          <!-- Dynamically populated -->
        </div>
      </div>
    `;

    return wrap;
  }

  bindEvents() {
    // Pause button
    const btnPause = this.element.querySelector('#btn-l4-pause');
    btnPause.addEventListener('click', () => {
      level4Audio.playClick();
      if (this.options.onPause) this.options.onPause();
    });

    // Floating action button
    const actionBtn = this.element.querySelector('#btn-l4-action');
    if (actionBtn) {
      const triggerAction = (e) => {
        if (e && e.cancelable) e.preventDefault();
        actionBtn.classList.add('active');
        if (this.options.onActionPress) this.options.onActionPress();
      };
      const releaseAction = () => {
        actionBtn.classList.remove('active');
      };
      actionBtn.addEventListener('pointerdown', triggerAction);
      actionBtn.addEventListener('pointerup', releaseAction);
      actionBtn.addEventListener('touchstart', triggerAction, { passive: false });
      actionBtn.addEventListener('touchend', releaseAction, { passive: false });
    }

    // Touch controls setup
    this.setupTouchControls();
  }

  setupTouchControls() {
    const joystick = this.element.querySelector('#l4-joystick');
    const knob = this.element.querySelector('#l4-joystick-knob');
    const touchActionBtn = this.element.querySelector('#btn-l4-touch-action');

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

    // Touch Action button
    touchActionBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (this.options.onActionPress) this.options.onActionPress();
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
    const chip = this.element.querySelector('#l4-objective-chip');
    const iconEl = this.element.querySelector('#l4-obj-icon');
    const textEl = this.element.querySelector('#l4-obj-text');

    if (iconEl) iconEl.textContent = icon;
    if (textEl) textEl.textContent = text;

    if (chip) {
      if (urgent) chip.classList.add('urgent');
      else chip.classList.remove('urgent');
    }
  }

  setTemperature(tempC, isWarm = false) {
    const pill = this.element.querySelector('#l4-temp-pill');
    const text = this.element.querySelector('#l4-temp-text');
    if (!pill || !text) return;

    if (isWarm) {
      pill.className = 'l4-temp-pill warm';
      text.textContent = `${tempC}°C (OPTIMAL ☀️)`;
    } else {
      pill.className = 'l4-temp-pill cold';
      text.textContent = `${tempC}°C (CHILLY ❄️)`;
    }
  }

  showActionButton(visible, label = "PLANT SEEDS", icon = "🌱") {
    const dock = this.element.querySelector('#l4-action-dock');
    const textEl = this.element.querySelector('#l4-action-text');
    const iconEl = this.element.querySelector('#l4-action-icon');
    const touchBtn = this.element.querySelector('#btn-l4-touch-action');
    const touchHint = this.element.querySelector('#l4-touch-hint');

    if (dock) {
      dock.style.display = visible ? 'flex' : 'none';
    }
    if (textEl) textEl.textContent = label;
    if (iconEl) iconEl.textContent = icon;
    if (touchBtn) touchBtn.textContent = icon;
    if (touchHint) touchHint.textContent = label.split(' ')[0];
  }

  showPauseModal(onResume, onRestart, onExit) {
    const backdrop = this.element.querySelector('#l4-modal-backdrop');
    const windowEl = this.element.querySelector('#l4-modal-window');

    windowEl.innerHTML = `
      <div style="font-size: 2.4rem;">⏸️🌱</div>
      <h3 class="l4-modal-title">MISSION PAUSED</h3>
      <p class="l4-modal-text">Outpost LUNA-01 • Sol 4 Hydroponic Bio-Domes</p>

      <div class="l4-modal-actions">
        <button class="btn-l4-modal-primary" id="btn-pause-resume">Resume Expedition ▶</button>
        <button class="btn-l4-modal-secondary" id="btn-pause-restart">Restart Sol 4 🔄</button>
        <button class="btn-l4-modal-secondary" id="btn-pause-mute">${level4Audio.isMuted ? '🔇 Sound: MUTED' : '🔊 Sound: ON'}</button>
        <button class="btn-l4-modal-secondary" id="btn-pause-exit">Mission Control 🚀</button>
      </div>
    `;

    backdrop.classList.add('open');
    orbit?.dockForModal();

    windowEl.querySelector('#btn-pause-resume').addEventListener('click', () => {
      level4Audio.playClick();
      backdrop.classList.remove('open');
      orbit?.undockFromModal();
      if (onResume) onResume();
    });

    windowEl.querySelector('#btn-pause-restart').addEventListener('click', () => {
      level4Audio.playClick();
      backdrop.classList.remove('open');
      orbit?.undockFromModal();
      if (onRestart) onRestart();
    });

    const muteBtn = windowEl.querySelector('#btn-pause-mute');
    muteBtn.addEventListener('click', () => {
      level4Audio.setMuted(!level4Audio.isMuted);
      muteBtn.textContent = level4Audio.isMuted ? '🔇 Sound: MUTED' : '🔊 Sound: ON';
      level4Audio.playClick();
    });

    windowEl.querySelector('#btn-pause-exit').addEventListener('click', () => {
      level4Audio.playClick();
      backdrop.classList.remove('open');
      orbit?.undockFromModal();
      if (onExit) onExit();
    });
  }

  showWinModal(data = {}) {
    orbit?.dockForModal();
    const backdrop = this.element.querySelector('#l4-modal-backdrop');
    const windowEl = this.element.querySelector('#l4-modal-window');

    const stars = data.stars || 3;
    const starString = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);

    windowEl.innerHTML = `
      <div style="font-size: 2.4rem;">🍓🥕🌾🎉</div>
      <h3 class="l4-modal-title">FRESH LUNAR HARVEST READY!</h3>
      <div class="l4-modal-stars">${starString}</div>
      <p class="l4-modal-text">
        Sensational farming, Commander! You planted seeds, engaged infrared thermal lamps to protect against crater freeze, and harvested fresh food for the crew!
      </p>

      <div class="l4-nasa-box">
        <strong>NASA SCIENCE: HYDROPONIC LUNAR FARMING</strong><br>
        Moon plants do not require soil! Instead, nutrient-rich water mist is sprayed directly onto roots inside closed-loop bio-domes. Dwarf crops produce crunchy vegetables and fresh breathable oxygen for astronauts!
      </div>

      <div class="l4-modal-actions">
        <button class="btn-l4-modal-primary" id="btn-win-continue">
          Continue to Day 5 ➔
        </button>
      </div>
    `;

    backdrop.classList.add('open');

    windowEl.querySelector('#btn-win-continue').addEventListener('click', () => {
      level4Audio.playClick();
      backdrop.classList.remove('open');
      orbit?.undockFromModal();
      if (data.onContinue) data.onContinue();
    });
  }

  showFailModal(onRetry, onExit) {
    orbit?.dockForModal();
    const backdrop = this.element.querySelector('#l4-modal-backdrop');
    const windowEl = this.element.querySelector('#l4-modal-window');

    windowEl.innerHTML = `
      <div style="font-size: 2.4rem;">❄️🥀</div>
      <h3 class="l4-modal-title">Crops Froze in Shadow!</h3>
      <p class="l4-modal-text">
        The crater shadow cooled the greenhouse too fast. Let's restart and activate the infrared thermal lamps quickly!
      </p>

      <div class="l4-modal-actions">
        <button class="btn-l4-modal-primary" id="btn-fail-retry">
          Try Again 🔄
        </button>
        <button class="btn-l4-modal-secondary" id="btn-fail-exit">
          Back to Mission Control 🚀
        </button>
      </div>
    `;

    backdrop.classList.add('open');

    windowEl.querySelector('#btn-fail-retry').addEventListener('click', () => {
      level4Audio.playClick();
      backdrop.classList.remove('open');
      orbit?.undockFromModal();
      if (onRetry) onRetry();
    });

    windowEl.querySelector('#btn-fail-exit').addEventListener('click', () => {
      level4Audio.playClick();
      backdrop.classList.remove('open');
      orbit?.undockFromModal();
      if (onExit) onExit();
    });
  }

  hideModals() {
    const backdrop = this.element.querySelector('#l4-modal-backdrop');
    if (backdrop) backdrop.classList.remove('open');
  }

  dispose() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}
