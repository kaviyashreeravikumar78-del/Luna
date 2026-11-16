import { level1Audio } from '../audio/Level1Audio.js';
import '../styles/level1-hud.css';

/**
 * Minimal Kid-Friendly HUD for Level 1
 * Features:
 * - Top-left: Sol & Stars
 * - Top-center: ONE short objective chip (max 5 words)
 * - Top-right: Colony battery bar & pause button
 * - Floating power popups (+8%)
 * - Win/Fail modals & mobile touch controls
 */
export class Level1HUD {
  constructor(options = {}) {
    this.options = options;
    this.battery = 25;
    this.stars = 0;
    this.element = this.createDOM();
    document.body.appendChild(this.element);
    this.bindEvents();
  }

  createDOM() {
    const wrap = document.createElement('div');
    wrap.className = 'l1-hud-overlay';
    wrap.id = 'l1-hud-overlay';

    wrap.innerHTML = `
      <!-- TOP MINIMAL HUD BAR -->
      <div class="l1-top-bar">
        <div class="l1-badge-group">
          <div class="l1-sol-pill">SOL 1 • DAY 1</div>
          <div class="l1-stars-pill" id="l1-stars-val">⭐ 0 / 3 STARS</div>
        </div>

        <div class="l1-objective-chip" id="l1-objective-chip">
          <span id="l1-obj-icon">🧹</span>
          <span id="l1-obj-text">Clean the panels (0/6)</span>
        </div>

        <div class="l1-right-group">
          <div class="l1-battery-card">
            <span class="l1-battery-icon">🔋</span>
            <div class="l1-battery-info">
              <div class="l1-battery-header">
                <span class="l1-battery-label">COLONY POWER</span>
                <span class="l1-battery-val" id="l1-battery-num">25%</span>
              </div>
              <div class="l1-battery-track">
                <div class="l1-battery-fill" id="l1-battery-fill" style="width: 25%;"></div>
              </div>
            </div>
          </div>

          <button class="btn-l1-pause" id="btn-l1-pause" title="Pause Game">⏸️</button>
        </div>
      </div>

      <!-- BIG "GO!" INTRO BANNER -->
      <div class="l1-go-banner" id="l1-go-banner">GO! 🚀</div>

      <!-- PAUSE MODAL -->
      <div class="l1-modal-backdrop" id="l1-pause-modal">
        <div class="l1-modal-card">
          <h3 class="l1-modal-title">MISSION PAUSED</h3>
          <p style="color:#94A3B8; font-size:0.95rem; margin:0;">Outpost LUNA-01: Sol 1 Power Up</p>
          <div class="l1-modal-btn-stack">
            <button class="btn-l1-action btn-l1-primary" id="btn-l1-resume">▶ Resume Mission</button>
            <button class="btn-l1-action btn-l1-secondary" id="btn-l1-restart">🔄 Restart Level 1</button>
            <button class="btn-l1-action btn-l1-secondary" id="btn-l1-mute">🔊 Sound: ON</button>
            <button class="btn-l1-action btn-l1-secondary" id="btn-l1-back-mc">🚀 Back to Mission Control</button>
          </div>
        </div>
      </div>

      <!-- REWARD MODAL (WIN) -->
      <div class="l1-modal-backdrop" id="l1-win-modal">
        <div class="l1-modal-card">
          <span style="font-size:3.2rem;">🏆⚡🎉</span>
          <h3 class="l1-modal-title">COLONY POWER RESTORED!</h3>
          <p style="color:#E2E8F0; font-size:1.05rem; margin:0.2rem 0;">
            All 6 solar panels are shiny clean and powering Outpost LUNA-01!
          </p>
          <div class="l1-stars-row" id="l1-win-stars">
            <span class="l1-star-icon">⭐</span>
            <span class="l1-star-icon">⭐</span>
            <span class="l1-star-icon">⭐</span>
          </div>
          <p style="color:#00E5FF; font-weight:800; font-size:1.1rem; margin:0.2rem 0;">
            ⚡ Power +15% Added to Life-Support!
          </p>
          <div class="l1-modal-btn-stack">
            <button class="btn-l1-action btn-l1-primary" id="btn-l1-win-continue">
              <span>Continue to Mission Control ➔</span>
            </button>
          </div>
        </div>
      </div>

      <!-- FAIL MODAL -->
      <div class="l1-modal-backdrop" id="l1-fail-modal">
        <div class="l1-modal-card">
          <span style="font-size:3.2rem;">🔋⚠️</span>
          <h3 class="l1-modal-title" style="color:#FFB703;">POWER LOW!</h3>
          <p style="color:#E2E8F0; font-size:1.05rem; margin:0.4rem 0;">
            The battery ran out of power! Don't worry Commander, let's brush the dust faster!
          </p>
          <div class="l1-modal-btn-stack">
            <button class="btn-l1-action btn-l1-primary" id="btn-l1-fail-retry">
              <span>🔄 Try Again!</span>
            </button>
            <button class="btn-l1-action btn-l1-secondary" id="btn-l1-fail-mc">
              <span>Back to Mission Control</span>
            </button>
          </div>
        </div>
      </div>

      <!-- MOBILE TOUCH CONTROLS -->
      <div class="l1-touch-dock" id="l1-touch-dock">
        <div class="l1-virtual-stick" id="l1-stick">
          <div class="l1-stick-knob" id="l1-stick-knob"></div>
        </div>
        <button class="l1-touch-btn-action" id="l1-touch-action-btn">
          <span>⚡</span>
          <span style="font-size:0.75rem;">ACTION</span>
        </button>
      </div>

      <!-- SOLAR PANEL AIM ON-SCREEN CONTROLS -->
      <div class="l1-panel-aim-dock" id="l1-panel-aim-dock" style="display: none;">
        <div class="l1-aim-title">☀️ AIM SOLAR PANEL AT SUN</div>
        <div class="l1-aim-controls">
          <button class="btn-l1-aim btn-l1-aim-left" id="btn-l1-aim-left" aria-label="Tilt Left/Up">
            <span class="aim-arrow">◀</span>
            <span class="aim-text">TILT UP</span>
            <span class="aim-hint">[Q]</span>
          </button>
          <div class="l1-aim-meter">
            <div class="l1-aim-bar-track">
              <div class="l1-aim-bar-fill" id="l1-aim-bar-fill"></div>
            </div>
            <span class="l1-aim-status" id="l1-aim-status">Tilt to Align!</span>
          </div>
          <button class="btn-l1-aim btn-l1-aim-right" id="btn-l1-aim-right" aria-label="Tilt Right/Down">
            <span class="aim-hint">[E]</span>
            <span class="aim-text">TILT DOWN</span>
            <span class="aim-arrow">▶</span>
          </button>
        </div>
      </div>
    `;

    return wrap;
  }

  bindEvents() {
    // Pause button
    const btnPause = this.element.querySelector('#btn-l1-pause');
    const pauseModal = this.element.querySelector('#l1-pause-modal');

    btnPause.addEventListener('click', () => {
      pauseModal.classList.add('active');
      if (this.options.onPause) this.options.onPause();
    });

    // Pause menu buttons
    this.element.querySelector('#btn-l1-resume').addEventListener('click', () => {
      pauseModal.classList.remove('active');
      if (this.options.onResume) this.options.onResume();
    });

    this.element.querySelector('#btn-l1-restart').addEventListener('click', () => {
      pauseModal.classList.remove('active');
      if (this.options.onRestart) this.options.onRestart();
    });

    const muteBtn = this.element.querySelector('#btn-l1-mute');
    muteBtn.addEventListener('click', () => {
      level1Audio.setMuted(!level1Audio.isMuted);
      muteBtn.textContent = level1Audio.isMuted ? '🔇 Sound: MUTED' : '🔊 Sound: ON';
      if (this.options.onToggleMute) this.options.onToggleMute(level1Audio.isMuted);
    });

    this.element.querySelector('#btn-l1-back-mc').addEventListener('click', () => {
      pauseModal.classList.remove('active');
      if (this.options.onReturnToMissionControl) this.options.onReturnToMissionControl();
    });

    // Win continue button
    this.element.querySelector('#btn-l1-win-continue').addEventListener('click', () => {
      this.element.querySelector('#l1-win-modal').classList.remove('active');
      if (this.options.onWinContinue) this.options.onWinContinue();
    });

    // Fail retry buttons
    this.element.querySelector('#btn-l1-fail-retry').addEventListener('click', () => {
      this.element.querySelector('#l1-fail-modal').classList.remove('active');
      if (this.options.onRestart) this.options.onRestart();
    });

    this.element.querySelector('#btn-l1-fail-mc').addEventListener('click', () => {
      this.element.querySelector('#l1-fail-modal').classList.remove('active');
      if (this.options.onReturnToMissionControl) this.options.onReturnToMissionControl();
    });

    // Mobile Touch Joystick
    this.setupTouchJoystick();

    // Solar Panel Aim On-Screen Controls
    this.setupAimControls();

    // Touch Action Button (Supports both pointer & touch events for all mobile phones)
    const actBtn = this.element.querySelector('#l1-touch-action-btn');
    const startAction = (e) => {
      if (e && e.cancelable) e.preventDefault();
      if (this.options.onActionPress) this.options.onActionPress();
    };
    const endAction = (e) => {
      if (e && e.cancelable) e.preventDefault();
      if (this.options.onActionRelease) this.options.onActionRelease();
    };

    actBtn.addEventListener('pointerdown', startAction);
    actBtn.addEventListener('pointerup', endAction);
    actBtn.addEventListener('pointerleave', endAction);
    actBtn.addEventListener('touchstart', startAction, { passive: false });
    actBtn.addEventListener('touchend', endAction, { passive: false });
    actBtn.addEventListener('touchcancel', endAction, { passive: false });
  }

  setupTouchJoystick() {
    const stick = this.element.querySelector('#l1-stick');
    const knob = this.element.querySelector('#l1-stick-knob');
    let active = false;
    let center = { x: 0, y: 0 };
    const maxR = 35;

    const onMove = (e) => {
      if (!active) return;
      const t = e.touches ? e.touches[0] : e;
      const dx = t.clientX - center.x;
      const dy = t.clientY - center.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      const clampedDist = Math.min(dist, maxR);

      const kx = Math.cos(angle) * clampedDist;
      const ky = Math.sin(angle) * clampedDist;

      knob.style.transform = `translate(${kx}px, ${ky}px)`;

      if (this.options.onJoystickMove) {
        this.options.onJoystickMove(kx / maxR, ky / maxR);
      }
    };

    const onEnd = () => {
      active = false;
      knob.style.transform = 'translate(0px, 0px)';
      if (this.options.onJoystickMove) {
        this.options.onJoystickMove(0, 0);
      }
    };

    stick.addEventListener('touchstart', (e) => {
      active = true;
      const rect = stick.getBoundingClientRect();
      center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      onMove(e);
    });

    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onEnd);
  }

  setupAimControls() {
    const leftBtn = this.element.querySelector('#btn-l1-aim-left');
    const rightBtn = this.element.querySelector('#btn-l1-aim-right');
    if (!leftBtn || !rightBtn) return;

    const startLeft = (e) => {
      if (e && e.cancelable) e.preventDefault();
      leftBtn.classList.add('active');
      if (this.options.onAimLeftPress) this.options.onAimLeftPress();
    };
    const endLeft = (e) => {
      if (e && e.cancelable) e.preventDefault();
      leftBtn.classList.remove('active');
      if (this.options.onAimLeftRelease) this.options.onAimLeftRelease();
    };

    const startRight = (e) => {
      if (e && e.cancelable) e.preventDefault();
      rightBtn.classList.add('active');
      if (this.options.onAimRightPress) this.options.onAimRightPress();
    };
    const endRight = (e) => {
      if (e && e.cancelable) e.preventDefault();
      rightBtn.classList.remove('active');
      if (this.options.onAimRightRelease) this.options.onAimRightRelease();
    };

    leftBtn.addEventListener('pointerdown', startLeft);
    leftBtn.addEventListener('pointerup', endLeft);
    leftBtn.addEventListener('pointerleave', endLeft);
    leftBtn.addEventListener('touchstart', startLeft, { passive: false });
    leftBtn.addEventListener('touchend', endLeft, { passive: false });
    leftBtn.addEventListener('touchcancel', endLeft, { passive: false });

    rightBtn.addEventListener('pointerdown', startRight);
    rightBtn.addEventListener('pointerup', endRight);
    rightBtn.addEventListener('pointerleave', endRight);
    rightBtn.addEventListener('touchstart', startRight, { passive: false });
    rightBtn.addEventListener('touchend', endRight, { passive: false });
    rightBtn.addEventListener('touchcancel', endRight, { passive: false });
  }

  showAimDock(show = true, progress = 0, statusText = "Aim at Sun!") {
    const dock = this.element.querySelector('#l1-panel-aim-dock');
    if (!dock) return;
    if (show) {
      dock.style.display = 'flex';
      const fill = dock.querySelector('#l1-aim-bar-fill');
      const status = dock.querySelector('#l1-aim-status');
      if (fill) fill.style.width = `${Math.min(100, Math.max(0, progress * 100))}%`;
      if (status) status.textContent = statusText;
    } else {
      dock.style.display = 'none';
    }
  }

  setObjective(text, icon = '🧹') {
    const chipText = this.element.querySelector('#l1-obj-text');
    const chipIcon = this.element.querySelector('#l1-obj-icon');
    if (chipText) chipText.textContent = text;
    if (chipIcon) chipIcon.textContent = icon;
  }

  setBattery(pct) {
    this.battery = Math.max(0, Math.min(100, Math.round(pct)));
    const fill = this.element.querySelector('#l1-battery-fill');
    const num = this.element.querySelector('#l1-battery-num');
    if (num) num.textContent = `${this.battery}%`;
    if (fill) {
      fill.style.width = `${this.battery}%`;
      fill.classList.remove('warning', 'critical');
      if (this.battery < 20) {
        fill.classList.add('critical');
      } else if (this.battery < 45) {
        fill.classList.add('warning');
      }
    }
  }

  setStars(count) {
    this.stars = Math.max(0, Math.min(3, count));
    const pill = this.element.querySelector('#l1-stars-val');
    if (pill) pill.textContent = `⭐ ${this.stars} / 3 STARS`;
  }

  showGoBanner(callback) {
    const banner = this.element.querySelector('#l1-go-banner');
    banner.classList.add('show');
    setTimeout(() => {
      banner.classList.remove('show');
      if (callback) callback();
    }, 1100);
  }

  showPowerPopup(x, y, text = "+8% ⚡") {
    const pop = document.createElement('div');
    pop.className = 'l1-power-popup';
    pop.textContent = text;
    pop.style.left = `${x}px`;
    pop.style.top = `${y}px`;
    this.element.appendChild(pop);
    setTimeout(() => pop.remove(), 1200);
  }

  showWin(stars = 3) {
    const modal = this.element.querySelector('#l1-win-modal');
    const starsBox = this.element.querySelector('#l1-win-stars');
    if (starsBox) {
      starsBox.innerHTML = Array(stars).fill('<span class="l1-star-icon">⭐</span>').join('');
    }
    modal.classList.add('active');
  }

  showFail() {
    this.element.querySelector('#l1-fail-modal').classList.add('active');
  }

  dispose() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}
