import { level3Audio } from '../audio/Level3Audio.js';
import '../styles/level3-hud.css';
import nasaData from '../data/nasa_sep_events.json';

/**
 * Level 3 Minimal Modern HUD
 * - Top-left: Sol 3 & Stars
 * - Top-center: Objective chip (max 5 words)
 * - Top-right: 4 Astronaut status badges + Countdown ring + Real NASA Data badge + Pause
 * - Shield charging progress bar
 * - Touch joystick and Action button
 * - Win, Fail, Pause, and NASA DONKI modals
 */
export class Level3HUD {
  constructor(options = {}) {
    this.options = options;
    this.stars = 0;
    this.totalSeconds = options.totalSeconds || 90;
    this.remainingSeconds = this.totalSeconds;
    this.nasaEvent = nasaData.events[0]; // Real NASA DONKI SEP record

    this.element = this.createDOM();
    document.body.appendChild(this.element);

    this.bindEvents();
  }

  createDOM() {
    const wrap = document.createElement('div');
    wrap.className = 'l3-hud-overlay';
    wrap.id = 'l3-hud-overlay';

    const circumference = 2 * Math.PI * 18; // r=18 => ~113.1

    wrap.innerHTML = `
      <!-- TOP BAR -->
      <div class="l3-top-bar">
        <div class="l3-badge-group">
          <div class="l3-sol-pill">
            <span class="l3-sol-dot"></span>
            <span>SOL 3 • SOLAR STORM</span>
          </div>
          <div class="l3-stars-pill" id="l3-stars-pill">⭐ 0 / 3 STARS</div>
        </div>

        <!-- Center Objective Chip -->
        <div class="l3-objective-chip" id="l3-objective-chip">
          <span id="l3-obj-icon">🏃‍♂️</span>
          <span id="l3-obj-text">Gather the astronauts!</span>
        </div>

        <!-- Right Side: Crew Status, Timer Ring, NASA Badge, Pause -->
        <div class="l3-right-group">
          <!-- 4 Astronaut Badges -->
          <div class="l3-crew-safe-card" title="Astronaut Shelter Status">
            <div class="l3-crew-icons-wrap">
              <div class="l3-astro-badge" id="l3-badge-0" title="Dr. Evelyn Vance">
                👩‍🚀
                <span class="l3-astro-check">✓</span>
              </div>
              <div class="l3-astro-badge" id="l3-badge-1" title="Marcus Diaz">
                👨‍🔧
                <span class="l3-astro-check">✓</span>
              </div>
              <div class="l3-astro-badge" id="l3-badge-2" title="Dr. Aris Thorne">
                🌱
                <span class="l3-astro-check">✓</span>
              </div>
              <div class="l3-astro-badge" id="l3-badge-3" title="Maya Lin">
                📡
                <span class="l3-astro-check">✓</span>
              </div>
            </div>
            <span class="l3-crew-count-text" id="l3-crew-count">0/4 SAFE</span>
          </div>

          <!-- Circular Countdown Ring -->
          <div class="l3-countdown-card" title="Time until radiation wave reaches outpost">
            <div class="l3-timer-ring-wrap">
              <svg class="l3-timer-svg" viewBox="0 0 44 44">
                <circle cx="22" cy="22" r="18" class="l3-timer-track" />
                <circle cx="22" cy="22" r="18" class="l3-timer-bar" id="l3-timer-bar"
                  stroke-dasharray="${circumference}" stroke-dashoffset="0" />
              </svg>
              <span class="l3-timer-center-icon" id="l3-timer-icon">☀️</span>
            </div>
            <div class="l3-timer-info">
              <span class="l3-timer-label">STORM WAVE</span>
              <span class="l3-timer-val" id="l3-timer-val">90s</span>
            </div>
          </div>

          <!-- Real NASA DONKI Data Button -->
          <button class="btn-nasa-data-pill" id="btn-l3-nasa" title="View Real NASA Space Weather Observation">
            <span>🛰️ NASA Alert</span>
          </button>

          <!-- Pause Button -->
          <button class="btn-l3-pause" id="btn-l3-pause" title="Pause Game">
            <span>⏸️</span>
          </button>
        </div>
      </div>

      <!-- SHIELD CHARGE BAR -->
      <div class="l3-charge-bar-wrap" id="l3-charge-wrap">
        <span class="l3-charge-title">HOLD SPACE TO CHARGE SHIELD</span>
        <div class="l3-charge-track">
          <div class="l3-charge-fill" id="l3-charge-fill"></div>
        </div>
      </div>

      <!-- GO! POPUP -->
      <div class="l3-go-popup" id="l3-go-popup">GO! 🚨</div>

      <!-- MOBILE TOUCH CONTROLS -->
      <div class="l3-touch-controls" id="l3-touch-controls">
        <div class="l3-joystick-zone" id="l3-joystick">
          <div class="l3-joystick-knob" id="l3-joystick-knob"></div>
        </div>
        <div class="l3-action-btn-zone">
          <button class="btn-l3-action" id="btn-l3-action">✋</button>
          <span class="l3-action-hint">ALERT / CHARGE</span>
        </div>
      </div>

      <!-- MODAL BACKDROP -->
      <div class="l3-modal-backdrop" id="l3-modal-backdrop">
        <div class="l3-modal-window" id="l3-modal-window">
          <!-- Dynamically populated -->
        </div>
      </div>
    `;

    return wrap;
  }

  bindEvents() {
    // NASA data button
    const btnNasa = this.element.querySelector('#btn-l3-nasa');
    btnNasa.addEventListener('click', () => {
      level3Audio.playClick();
      this.showNasaDataModal();
    });

    // Pause button
    const btnPause = this.element.querySelector('#btn-l3-pause');
    btnPause.addEventListener('click', () => {
      level3Audio.playClick();
      if (this.options.onPause) this.options.onPause();
    });

    // Touch controls setup
    this.setupTouchControls();
  }

  setupTouchControls() {
    const joystick = this.element.querySelector('#l3-joystick');
    const knob = this.element.querySelector('#l3-joystick-knob');
    const actionBtn = this.element.querySelector('#btn-l3-action');

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
    const chip = this.element.querySelector('#l3-objective-chip');
    const iconEl = this.element.querySelector('#l3-obj-icon');
    const textEl = this.element.querySelector('#l3-obj-text');

    if (iconEl) iconEl.textContent = icon;
    if (textEl) textEl.textContent = text;

    if (chip) {
      if (urgent) chip.classList.add('urgent');
      else chip.classList.remove('urgent');
    }
  }

  updateAstronautStatus(index, state) {
    const badge = this.element.querySelector(`#l3-badge-${index}`);
    if (!badge) return;

    badge.classList.remove('gathered', 'sheltered');
    if (state === 'gathered') {
      badge.classList.add('gathered');
    } else if (state === 'sheltered') {
      badge.classList.add('sheltered');
    }
  }

  updateCrewSafeCount(count, total = 4) {
    const countEl = this.element.querySelector('#l3-crew-count');
    if (countEl) {
      countEl.textContent = `${count}/${total} SAFE`;
      if (count === total) {
        countEl.style.color = '#06D6A0';
      }
    }
  }

  updateCountdown(remaining, total) {
    this.remainingSeconds = remaining;
    const valEl = this.element.querySelector('#l3-timer-val');
    const barEl = this.element.querySelector('#l3-timer-bar');

    if (valEl) {
      valEl.textContent = `${Math.ceil(remaining)}s`;
    }

    if (barEl) {
      const circumference = 2 * Math.PI * 18;
      const progress = Math.max(0, Math.min(1, remaining / total));
      const offset = circumference * (1 - progress);
      barEl.style.strokeDashoffset = offset;

      barEl.classList.remove('warning', 'danger');
      if (remaining <= 20) {
        barEl.classList.add('danger');
      } else if (remaining <= 40) {
        barEl.classList.add('warning');
      }
    }
  }

  showChargeBar(progress) {
    const wrap = this.element.querySelector('#l3-charge-wrap');
    const fill = this.element.querySelector('#l3-charge-fill');
    if (wrap) wrap.classList.add('visible');
    if (fill) fill.style.width = `${Math.min(100, Math.max(0, progress * 100))}%`;
  }

  hideChargeBar() {
    const wrap = this.element.querySelector('#l3-charge-wrap');
    if (wrap) wrap.classList.remove('visible');
  }

  showGoPopup() {
    const popup = this.element.querySelector('#l3-go-popup');
    if (!popup) return;
    popup.classList.add('active');
    setTimeout(() => {
      popup.classList.remove('active');
    }, 1200);
  }

  showNasaDataModal(onClose) {
    const backdrop = this.element.querySelector('#l3-modal-backdrop');
    const windowEl = this.element.querySelector('#l3-modal-window');

    const event = this.nasaEvent;
    const instrumentName = event.instruments && event.instruments[0] ? event.instruments[0].displayName : 'REleASE:ACE/EPAM';

    windowEl.innerHTML = `
      <div style="font-size: 2.2rem;">🛰️☀️</div>
      <h3 class="l3-modal-title">Real NASA DONKI Space Weather Alert</h3>
      <p class="l3-modal-text">
        This mission is driven by real NASA scientific records from the Historic Solar Superstorm of May 2024!
      </p>

      <div class="l3-nasa-badge-box">
        <div class="l3-nasa-badge-header">
          <span class="l3-nasa-tag">NASA SEP EVENT RECORD</span>
          <a href="${event.link}" target="_blank" rel="noopener noreferrer" class="l3-nasa-link">
            Official DONKI View ↗
          </a>
        </div>
        <div class="l3-nasa-item"><strong>Event ID:</strong> ${event.sepID}</div>
        <div class="l3-nasa-item"><strong>Observation Time:</strong> ${event.eventTime}</div>
        <div class="l3-nasa-item"><strong>Detector:</strong> ${instrumentName}</div>
        <div class="l3-science-note">
          Scientific fact: Solar energetic particles travel through space at high speeds. Space habitats use thick shielding and magnetic deflectors to safeguard astronauts.
        </div>
      </div>

      <div class="l3-modal-actions">
        <button class="btn-l3-modal-primary" id="btn-close-nasa-modal">Return to Mission</button>
      </div>
    `;

    backdrop.classList.add('open');

    windowEl.querySelector('#btn-close-nasa-modal').addEventListener('click', () => {
      level3Audio.playClick();
      backdrop.classList.remove('open');
      if (onClose) onClose();
    });
  }

  showPauseModal(onResume, onRestart, onExit) {
    const backdrop = this.element.querySelector('#l3-modal-backdrop');
    const windowEl = this.element.querySelector('#l3-modal-window');

    windowEl.innerHTML = `
      <div style="font-size: 2.2rem;">⏸️</div>
      <h3 class="l3-modal-title">Mission Paused</h3>
      <p class="l3-modal-text">Outpost LUNA-01 needs your leadership, Commander!</p>

      <div class="l3-modal-actions">
        <button class="btn-l3-modal-primary" id="btn-pause-resume">Resume ▶</button>
        <button class="btn-l3-modal-secondary" id="btn-pause-restart">Restart 🔄</button>
        <button class="btn-l3-modal-secondary" id="btn-pause-mute">${level3Audio.isMuted ? '🔇 Sound: MUTED' : '🔊 Sound: ON'}</button>
        <button class="btn-l3-modal-secondary" id="btn-pause-exit">Mission Control 🚀</button>
      </div>
    `;

    backdrop.classList.add('open');

    windowEl.querySelector('#btn-pause-resume').addEventListener('click', () => {
      level3Audio.playClick();
      backdrop.classList.remove('open');
      if (onResume) onResume();
    });

    windowEl.querySelector('#btn-pause-restart').addEventListener('click', () => {
      level3Audio.playClick();
      backdrop.classList.remove('open');
      if (onRestart) onRestart();
    });

    const muteBtn = windowEl.querySelector('#btn-pause-mute');
    muteBtn.addEventListener('click', () => {
      level3Audio.setMuted(!level3Audio.isMuted);
      muteBtn.textContent = level3Audio.isMuted ? '🔇 Sound: MUTED' : '🔊 Sound: ON';
      level3Audio.playClick();
    });

    windowEl.querySelector('#btn-pause-exit').addEventListener('click', () => {
      level3Audio.playClick();
      backdrop.classList.remove('open');
      if (onExit) onExit();
    });
  }

  showWinModal(data = {}) {
    const backdrop = this.element.querySelector('#l3-modal-backdrop');
    const windowEl = this.element.querySelector('#l3-modal-window');

    const stars = data.stars || 3;
    const starString = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
    const event = this.nasaEvent;
    const instrumentName = event.instruments && event.instruments[0] ? event.instruments[0].displayName : 'REleASE:ACE/EPAM';

    windowEl.innerHTML = `
      <div style="font-size: 2.4rem;">🛡️🎉</div>
      <h3 class="l3-modal-title">BASE SHIELDED & CREW SAFE!</h3>
      <div class="l3-modal-stars">${starString}</div>
      <p class="l3-modal-text">
        Outstanding leadership Commander! All 4 astronauts made it into the bunker and the radiation shield absorbed the cosmic wave!
      </p>

      <div class="l3-nasa-badge-box">
        <div class="l3-nasa-badge-header">
          <span class="l3-nasa-tag">VERIFIED NASA SPACE WEATHER EVENT</span>
          <a href="${event.link}" target="_blank" rel="noopener noreferrer" class="l3-nasa-link">
            NASA Portal ↗
          </a>
        </div>
        <div class="l3-nasa-item"><strong>DONKI ID:</strong> ${event.sepID}</div>
        <div class="l3-nasa-item"><strong>Particle Instrument:</strong> ${instrumentName}</div>
        <div class="l3-science-note">
          "Solar storms send fast particles. Astronauts shelter and use shielding to stay safe. (The rescue and health effects in this game are simulated)."
        </div>
      </div>

      <div class="l3-modal-actions">
        <button class="btn-l3-modal-primary" id="btn-win-continue">
          Continue to Day 4 ➔
        </button>
      </div>
    `;

    backdrop.classList.add('open');

    windowEl.querySelector('#btn-win-continue').addEventListener('click', () => {
      level3Audio.playClick();
      backdrop.classList.remove('open');
      if (data.onContinue) data.onContinue();
    });
  }

  showFailModal(onRetry, onExit) {
    const backdrop = this.element.querySelector('#l3-modal-backdrop');
    const windowEl = this.element.querySelector('#l3-modal-window');

    windowEl.innerHTML = `
      <div style="font-size: 2.4rem;">☀️⏳</div>
      <h3 class="l3-modal-title">Storm Arrived Too Soon!</h3>
      <p class="l3-modal-text">
        The cosmic radiation wave reached the outpost before everyone was inside and shielded. Let's try again and hurry!
      </p>

      <div class="l3-modal-actions">
        <button class="btn-l3-modal-primary" id="btn-fail-retry">
          Try Again 🔄
        </button>
        <button class="btn-l3-modal-secondary" id="btn-fail-exit">
          Back to Mission Control 🚀
        </button>
      </div>
    `;

    backdrop.classList.add('open');

    windowEl.querySelector('#btn-fail-retry').addEventListener('click', () => {
      level3Audio.playClick();
      backdrop.classList.remove('open');
      if (onRetry) onRetry();
    });

    windowEl.querySelector('#btn-fail-exit').addEventListener('click', () => {
      level3Audio.playClick();
      backdrop.classList.remove('open');
      if (onExit) onExit();
    });
  }

  hideModals() {
    const backdrop = this.element.querySelector('#l3-modal-backdrop');
    if (backdrop) backdrop.classList.remove('open');
  }

  dispose() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}
