import { level6Audio } from '../audio/Level6Audio.js';
import '../styles/level6-hud.css';

/**
 * Level 6 (Communication) Minimal Modern HUD
 * - Top-left: Sol 6 & Stars
 * - Top-center: Objective chip (max 5 words)
 * - Top-right: Signal Strength meter & Lock status
 * - Rhythm highway overlay for Phase 3 message transmission
 * - Touch steering controls (virtual joystick & action button)
 * - Win and Fail modals with Science Honesty disclaimer
 */
export class Level6HUD {
  constructor(options = {}) {
    this.options = options;
    this.signalStrength = 0;
    this.lockProgress = 0;
    this.combo = 0;

    this.element = this.createDOM();
    document.body.appendChild(this.element);

    this.bindEvents();
  }

  createDOM() {
    const wrap = document.createElement('div');
    wrap.className = 'l6-hud-overlay';
    wrap.id = 'l6-hud-overlay';

    wrap.innerHTML = `
      <!-- TOP HUD BAR -->
      <div class="l6-top-bar">
        <div class="l6-badge-group">
          <div class="l6-sol-pill">
            <span class="l6-sol-dot"></span>
            <span>SOL 6 • DEEP SPACE COMMS</span>
          </div>
          <div class="l6-stars-pill" id="l6-stars-pill">⭐ 0 / 3 STARS</div>
        </div>

        <!-- Center Objective Chip -->
        <div class="l6-objective-chip" id="l6-objective-chip">
          <span id="l6-obj-icon">📡</span>
          <span id="l6-obj-text">Aim dish at satellite!</span>
        </div>

        <!-- Top-Right: Signal Strength + Lock Badge + Pause -->
        <div class="l6-right-group">
          <!-- Signal Strength Meter -->
          <div class="l6-signal-card" title="Carrier Signal Strength">
            <span class="l6-signal-icon">📶</span>
            <div class="l6-signal-info">
              <div class="l6-signal-head">
                <span>SIGNAL</span>
                <span id="l6-signal-num">0%</span>
              </div>
              <div class="l6-signal-track">
                <div class="l6-signal-fill" id="l6-signal-fill"></div>
              </div>
            </div>
          </div>

          <!-- Lock Badge -->
          <div class="l6-lock-badge" id="l6-lock-badge" title="Target Lock Status">
            <span id="l6-lock-icon">🔒</span>
            <span id="l6-lock-text">UNLOCKED</span>
          </div>

          <!-- Pause Button -->
          <button class="btn-l6-pause" id="btn-l6-pause" title="Pause Game">
            <span>⏸️</span>
          </button>
        </div>
      </div>

      <!-- PHASE 3: TRANSMISSION RHYTHM HIGHWAY -->
      <div class="l6-rhythm-container" id="l6-rhythm-container">
        <div class="l6-rhythm-header">
          <span>TRANSMIT DATA PACKETS TO EARTH</span>
          <span class="l6-combo-tag" id="l6-combo-tag">COMBO: 0x</span>
        </div>

        <div class="l6-rhythm-track" id="l6-rhythm-track">
          <!-- Target strike zone -->
          <div class="l6-target-strike-zone" id="l6-strike-zone">
            <span>⚡</span>
          </div>
          <div class="l6-feedback-popup" id="l6-feedback-popup">PERFECT!</div>
        </div>
      </div>

      <!-- GO! POPUP -->
      <div class="l6-go-popup" id="l6-go-popup">GO! 📡</div>

      <!-- MOBILE TOUCH CONTROLS -->
      <div class="l6-touch-controls" id="l6-touch-controls">
        <div class="l6-joystick-zone" id="l6-joystick">
          <div class="l6-joystick-knob" id="l6-joystick-knob"></div>
        </div>
        <div class="l6-action-btn-zone">
          <button class="btn-l6-action" id="btn-l6-action">📡</button>
          <span class="l6-action-hint">AIM / TRANSMIT</span>
        </div>
      </div>

      <!-- MODALS -->
      <div class="l6-modal-backdrop" id="l6-modal-backdrop">
        <div class="l6-modal-window" id="l6-modal-window">
          <!-- Dynamically populated -->
        </div>
      </div>
    `;

    return wrap;
  }

  bindEvents() {
    const btnPause = this.element.querySelector('#btn-l6-pause');
    btnPause.addEventListener('click', () => {
      level6Audio.playClick();
      if (this.options.onPause) this.options.onPause();
    });

    this.setupTouchControls();
  }

  setupTouchControls() {
    const joystick = this.element.querySelector('#l6-joystick');
    const knob = this.element.querySelector('#l6-joystick-knob');
    const actionBtn = this.element.querySelector('#btn-l6-action');

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

    actionBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (this.options.onActionDown) this.options.onActionDown();
    });

    actionBtn.addEventListener('pointerup', (e) => {
      e.preventDefault();
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

  setObjective(icon, text, locked = false) {
    const chip = this.element.querySelector('#l6-objective-chip');
    const iconEl = this.element.querySelector('#l6-obj-icon');
    const textEl = this.element.querySelector('#l6-obj-text');

    if (iconEl) iconEl.textContent = icon;
    if (textEl) textEl.textContent = text;

    if (chip) {
      if (locked) chip.classList.add('locked');
      else chip.classList.remove('locked');
    }
  }

  updateSignal(strength, lockProg = 0) {
    this.signalStrength = strength;
    this.lockProgress = lockProg;

    const numEl = this.element.querySelector('#l6-signal-num');
    const fillEl = this.element.querySelector('#l6-signal-fill');
    const lockBadge = this.element.querySelector('#l6-lock-badge');
    const lockText = this.element.querySelector('#l6-lock-text');

    const pct = Math.round(strength * 100);
    if (numEl) numEl.textContent = `${pct}%`;

    if (fillEl) {
      fillEl.style.width = `${pct}%`;
      fillEl.classList.remove('medium', 'locked');
      if (lockProg >= 1.0) {
        fillEl.classList.add('locked');
      } else if (strength >= 0.5) {
        fillEl.classList.add('medium');
      }
    }

    if (lockBadge && lockText) {
      if (lockProg >= 1.0) {
        lockBadge.classList.add('active');
        lockText.textContent = '100% LOCKED';
      } else if (lockProg > 0) {
        lockBadge.classList.remove('active');
        lockText.textContent = `LOCKING ${Math.round(lockProg * 100)}%`;
      } else {
        lockBadge.classList.remove('active');
        lockText.textContent = 'UNLOCKED';
      }
    }
  }

  showRhythmHighway() {
    const el = this.element.querySelector('#l6-rhythm-container');
    if (el) el.classList.add('visible');
  }

  hideRhythmHighway() {
    const el = this.element.querySelector('#l6-rhythm-container');
    if (el) el.classList.remove('visible');
  }

  updateCombo(combo) {
    this.combo = combo;
    const tag = this.element.querySelector('#l6-combo-tag');
    if (tag) tag.textContent = `COMBO: ${combo}x`;
  }

  showHitFeedback(text, isPerfect = true) {
    const popup = this.element.querySelector('#l6-feedback-popup');
    const zone = this.element.querySelector('#l6-strike-zone');

    if (popup) {
      popup.textContent = text;
      popup.style.color = isPerfect ? '#06D6A0' : '#FFD166';
      popup.classList.add('show');
      setTimeout(() => popup.classList.remove('show'), 400);
    }

    if (zone) {
      zone.classList.add('hit');
      setTimeout(() => zone.classList.remove('hit'), 150);
    }
  }

  showGoPopup() {
    const popup = this.element.querySelector('#l6-go-popup');
    if (!popup) return;
    popup.classList.add('active');
    setTimeout(() => popup.classList.remove('active'), 1200);
  }

  showWinModal(data = {}) {
    const backdrop = this.element.querySelector('#l6-modal-backdrop');
    const windowEl = this.element.querySelector('#l6-modal-window');

    const stars = data.stars || 3;
    const starString = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);

    windowEl.innerHTML = `
      <div style="font-size: 2.5rem;">📡🌍✨</div>
      <h3 class="l6-modal-title">EARTH CONNECTION ESTABLISHED!</h3>
      <div class="l6-modal-stars">${starString}</div>
      <p class="l6-modal-text">
        Sensational tracking, Commander! You aimed the giant dish, locked onto the orbiting NASA satellite, and beamed our mission data all the way home to Earth!
      </p>

      <div class="l6-real-idea-box">
        <span class="l6-real-idea-tag">REAL IDEA</span>
        NASA uses big antennas and satellites to talk to astronauts and spacecraft. (All signal lock and transmission mechanics in this game are simulated).
      </div>

      <div class="l6-modal-actions">
        <button class="btn-l6-primary" id="btn-win-continue">
          Continue to Day 7 ➔
        </button>
      </div>
    `;

    backdrop.classList.add('open');

    windowEl.querySelector('#btn-win-continue').addEventListener('click', () => {
      level6Audio.playClick();
      backdrop.classList.remove('open');
      if (data.onContinue) data.onContinue();
    });
  }

  showFailModal(onRetry, onExit) {
    const backdrop = this.element.querySelector('#l6-modal-backdrop');
    const windowEl = this.element.querySelector('#l6-modal-window');

    windowEl.innerHTML = `
      <div style="font-size: 2.5rem;">📡⚠️</div>
      <h3 class="l6-modal-title">Signal Lost!</h3>
      <p class="l6-modal-text">
        The satellite moved out of alignment before the transmission finished. Let's aim the dish and try again!
      </p>

      <div class="l6-modal-actions">
        <button class="btn-l6-primary" id="btn-fail-retry">
          Try Again 🔄
        </button>
        <button class="btn-l6-secondary" id="btn-fail-exit">
          Mission Control 🚀
        </button>
      </div>
    `;

    backdrop.classList.add('open');

    windowEl.querySelector('#btn-fail-retry').addEventListener('click', () => {
      level6Audio.playClick();
      backdrop.classList.remove('open');
      if (onRetry) onRetry();
    });

    windowEl.querySelector('#btn-fail-exit').addEventListener('click', () => {
      level6Audio.playClick();
      backdrop.classList.remove('open');
      if (onExit) onExit();
    });
  }

  showPauseModal(onResume, onRestart, onMute, onExit) {
    const backdrop = this.element.querySelector('#l6-modal-backdrop');
    const windowEl = this.element.querySelector('#l6-modal-window');

    windowEl.innerHTML = `
      <div style="font-size: 2.2rem;">⏸️</div>
      <h3 class="l6-modal-title">Mission Paused</h3>
      <p class="l6-modal-text">Deep Space Network uplink in standby.</p>

      <div class="l6-modal-actions">
        <button class="btn-l6-primary" id="btn-pause-resume">Resume ▶</button>
        <button class="btn-l6-secondary" id="btn-pause-restart">Restart 🔄</button>
        <button class="btn-l6-secondary" id="btn-pause-mute">${level6Audio.isMuted ? '🔇 Sound: MUTED' : '🔊 Sound: ON'}</button>
        <button class="btn-l6-secondary" id="btn-pause-exit">Mission Control 🚀</button>
      </div>
    `;

    backdrop.classList.add('open');

    windowEl.querySelector('#btn-pause-resume').addEventListener('click', () => {
      level6Audio.playClick();
      backdrop.classList.remove('open');
      if (onResume) onResume();
    });

    windowEl.querySelector('#btn-pause-restart').addEventListener('click', () => {
      level6Audio.playClick();
      backdrop.classList.remove('open');
      if (onRestart) onRestart();
    });

    const muteBtn = windowEl.querySelector('#btn-pause-mute');
    muteBtn.addEventListener('click', () => {
      level6Audio.setMuted(!level6Audio.isMuted);
      muteBtn.textContent = level6Audio.isMuted ? '🔇 Sound: MUTED' : '🔊 Sound: ON';
      level6Audio.playClick();
      if (onMute) onMute(level6Audio.isMuted);
    });

    windowEl.querySelector('#btn-pause-exit').addEventListener('click', () => {
      level6Audio.playClick();
      backdrop.classList.remove('open');
      if (onExit) onExit();
    });
  }

  hideModals() {
    const backdrop = this.element.querySelector('#l6-modal-backdrop');
    if (backdrop) backdrop.classList.remove('open');
  }

  dispose() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}
