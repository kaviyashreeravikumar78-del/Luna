import { level7Audio } from '../audio/Level7Audio.js';
import '../styles/level7-hud.css';

/**
 * Level 7 (Final Colony Check & Finale) Minimal Modern HUD
 * - Top-left: Sol 7 & Stars
 * - Top-center: Objective chip (max 5 words)
 * - Top-right: 5-facility checklist badges [☀️, 🌱, 🏠, 📡, 🔬]
 * - Bottom-left: Radar mini-map and Rover/Walk toggle button
 * - Mobile touch controls (joystick & action button)
 * - Interactive 15-20s facility mini-challenge modals
 * - Grand Finale Mission Certificate screen with rank, stats, and download option
 */
export class Level7HUD {
  constructor(options = {}) {
    this.options = options;
    this.checkedCount = 0;
    this.totalFacilities = 5;

    this.element = this.createDOM();
    document.body.appendChild(this.element);

    this.minimapCanvas = this.element.querySelector('#l7-minimap-canvas');
    this.minimapCtx = this.minimapCanvas.getContext('2d');

    this.bindEvents();
  }

  createDOM() {
    const wrap = document.createElement('div');
    wrap.className = 'l7-hud-overlay';
    wrap.id = 'l7-hud-overlay';

    wrap.innerHTML = `
      <!-- TOP HUD BAR -->
      <div class="l7-top-bar">
        <div class="l7-badge-group">
          <div class="l7-sol-pill">
            <span class="l7-sol-dot"></span>
            <span>SOL 7 • MISSION FINALE</span>
          </div>
          <div class="l7-stars-pill" id="l7-stars-pill">⭐ 0 / 3 STARS</div>
        </div>

        <!-- Center Objective Chip -->
        <div class="l7-objective-chip" id="l7-objective-chip">
          <span id="l7-obj-icon">🏆</span>
          <span id="l7-obj-text">Visit all 5 facilities!</span>
        </div>

        <!-- Top-Right: 5 Facility Check Badges + Pause -->
        <div class="l7-right-group">
          <div class="l7-facility-checklist-card" title="Colony Facilities Checked">
            <div class="l7-fac-badges-wrap">
              <div class="l7-fac-dot" id="l7-fac-solar" title="Solar Array">
                ☀️<span class="l7-fac-check-mark">✓</span>
              </div>
              <div class="l7-fac-dot" id="l7-fac-greenhouse" title="Greenhouse">
                🌱<span class="l7-fac-check-mark">✓</span>
              </div>
              <div class="l7-fac-dot" id="l7-fac-habitat" title="Main Habitat">
                🏠<span class="l7-fac-check-mark">✓</span>
              </div>
              <div class="l7-fac-dot" id="l7-fac-antenna" title="Antenna">
                📡<span class="l7-fac-check-mark">✓</span>
              </div>
              <div class="l7-fac-dot" id="l7-fac-lab" title="Research Lab">
                🔬<span class="l7-fac-check-mark">✓</span>
              </div>
            </div>
            <span class="l7-fac-count-text" id="l7-fac-count">0 / 5</span>
          </div>

          <!-- Pause Button -->
          <button class="btn-l7-pause" id="btn-l7-pause" title="Pause Game">
            <span>⏸️</span>
          </button>
        </div>
      </div>

      <!-- BOTTOM-LEFT: RADAR MINI-MAP & VEHICLE TOGGLE -->
      <div class="l7-bottom-left-group">
        <div class="l7-minimap-card">
          <canvas id="l7-minimap-canvas" width="100" height="100"></canvas>
        </div>
        <button class="btn-l7-rover-toggle" id="btn-l7-rover-toggle">
          <span>🚜 Ride Rover</span>
        </button>
      </div>

      <!-- TOUCH CONTROLS -->
      <div class="l7-touch-controls">
        <button class="btn-l7-action" id="btn-l7-action">⭐</button>
      </div>

      <!-- GO! POPUP -->
      <div class="l7-go-popup" id="l7-go-popup">GO! 🚀</div>

      <!-- INTERACTIVE FACILITY CHALLENGE MODAL -->
      <div class="l7-challenge-modal-backdrop" id="l7-chal-backdrop">
        <div class="l7-challenge-window" id="l7-chal-window">
          <!-- Dynamically populated -->
        </div>
      </div>

      <!-- MISSION CERTIFICATE BACKDROP -->
      <div class="l7-certificate-backdrop" id="l7-cert-backdrop">
        <div class="l7-certificate-card" id="l7-cert-card">
          <!-- Dynamically populated -->
        </div>
      </div>
    `;

    return wrap;
  }

  bindEvents() {
    // Pause button
    const btnPause = this.element.querySelector('#btn-l7-pause');
    btnPause.addEventListener('click', () => {
      level7Audio.playClick();
      if (this.options.onPause) this.options.onPause();
    });

    // Rover Toggle
    const btnRover = this.element.querySelector('#btn-l7-rover-toggle');
    btnRover.addEventListener('click', () => {
      level7Audio.playClick();
      if (this.options.onToggleRover) this.options.onToggleRover();
    });

    // Mobile Action Button
    const btnAction = this.element.querySelector('#btn-l7-action');
    btnAction.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (this.options.onActionTrigger) this.options.onActionTrigger();
    });
  }

  setRoverButtonState(isDriving) {
    const btn = this.element.querySelector('#btn-l7-rover-toggle');
    if (btn) {
      btn.innerHTML = isDriving ? '<span>👨‍🚀 On Foot</span>' : '<span>🚜 Ride Rover</span>';
    }
  }

  setObjective(icon, text, complete = false) {
    const chip = this.element.querySelector('#l7-objective-chip');
    const iconEl = this.element.querySelector('#l7-obj-icon');
    const textEl = this.element.querySelector('#l7-obj-text');

    if (iconEl) iconEl.textContent = icon;
    if (textEl) textEl.textContent = text;

    if (chip) {
      if (complete) chip.classList.add('complete');
      else chip.classList.remove('complete');
    }
  }

  updateFacilityStatus(facilityId, isChecked) {
    const dot = this.element.querySelector(`#l7-fac-${facilityId}`);
    if (dot && isChecked) {
      dot.classList.add('checked');
    }
  }

  updateChecklistCount(count, total = 5) {
    this.checkedCount = count;
    const countEl = this.element.querySelector('#l7-fac-count');
    if (countEl) {
      countEl.textContent = `${count} / ${total}`;
      if (count === total) {
        countEl.style.color = '#06D6A0';
      }
    }
  }

  updateMinimap(playerPos, facilities = []) {
    if (!this.minimapCtx) return;
    const ctx = this.minimapCtx;
    const w = 100;
    const h = 100;
    const cx = w / 2;
    const cy = h / 2;
    const scale = 2.1; // map range

    ctx.clearRect(0, 0, w, h);

    // Colony disc outline
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 45, 0, Math.PI * 2);
    ctx.stroke();

    // Draw Facility blips
    facilities.forEach(fac => {
      const fx = cx + fac.pos.x * scale;
      const fy = cy + fac.pos.z * scale;

      ctx.fillStyle = fac.checked ? '#06D6A0' : '#FFD166';
      ctx.beginPath();
      ctx.arc(fx, fy, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Player dot
    const px = cx + playerPos.x * scale;
    const py = cy + playerPos.z * scale;

    ctx.fillStyle = '#00E5FF';
    ctx.beginPath();
    ctx.arc(px, py, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  showFacilityChallenge(chal, onFinish) {
    const backdrop = this.element.querySelector('#l7-chal-backdrop');
    const windowEl = this.element.querySelector('#l7-chal-window');

    windowEl.innerHTML = `
      <div class="l7-chal-icon">${chal.icon}</div>
      <h3 class="l7-chal-title">${chal.title}</h3>
      <p class="l7-chal-instruction">${chal.instruction}</p>
      <button class="l7-chal-action-btn" id="btn-chal-action">
        ${chal.actionLabel || 'PERFORM CHECK ✓'}
      </button>
    `;

    backdrop.classList.add('open');

    windowEl.querySelector('#btn-chal-action').addEventListener('click', () => {
      level7Audio.playClick();
      backdrop.classList.remove('open');
      if (onFinish) onFinish();
    });
  }

  hideFacilityChallenge() {
    const backdrop = this.element.querySelector('#l7-chal-backdrop');
    if (backdrop) backdrop.classList.remove('open');
  }

  showGoPopup() {
    const popup = this.element.querySelector('#l7-go-popup');
    if (!popup) return;
    popup.classList.add('active');
    setTimeout(() => popup.classList.remove('active'), 1200);
  }

  showCertificate(data = {}) {
    const backdrop = this.element.querySelector('#l7-cert-backdrop');
    const cardEl = this.element.querySelector('#l7-cert-card');

    const totalStars = data.totalStars || 21;
    let rank = 'MISSION COMMANDER 🚀';
    if (totalStars >= 19) rank = 'LEGENDARY COMMANDER 🌟';
    else if (totalStars >= 15) rank = 'MISSION COMMANDER 🚀';
    else if (totalStars >= 11) rank = 'LUNAR PILOT 🛸';
    else rank = 'SPACE CADET 👨‍🚀';

    const res = data.resources || { oxygen: 96, water: 94, food: 95, power: 92 };

    cardEl.innerHTML = `
      <div class="l7-cert-header-icon">🏆🌕✨</div>
      <h2 class="l7-cert-title">LUNA-01 MISSION COMPLETE</h2>
      <div class="l7-cert-rank-pill">${rank}</div>
      <div class="l7-cert-stars-total">⭐ ${totalStars} / 21 STARS EARNED</div>

      <div class="l7-cert-stats-row">
        <div class="l7-cert-stat-box">
          <span class="l7-cert-stat-label">O₂ OXYGEN</span>
          <span class="l7-cert-stat-val">${res.oxygen}%</span>
        </div>
        <div class="l7-cert-stat-box">
          <span class="l7-cert-stat-label">H₂O WATER</span>
          <span class="l7-cert-stat-val">${res.water}%</span>
        </div>
        <div class="l7-cert-stat-box">
          <span class="l7-cert-stat-label">FOOD</span>
          <span class="l7-cert-stat-val">${res.food}%</span>
        </div>
        <div class="l7-cert-stat-box">
          <span class="l7-cert-stat-label">POWER</span>
          <span class="l7-cert-stat-val">${res.power}%</span>
        </div>
      </div>

      <div class="l7-cert-real-idea">
        <strong>Real idea:</strong> Astronauts do careful checks of their whole base every day. (All simulation values are for educational play).
      </div>

      <div class="l7-cert-actions">
        <button class="btn-l7-cert-primary" id="btn-cert-download">📥 Save Certificate</button>
        <button class="btn-l7-cert-secondary" id="btn-cert-replay">🔄 Play Again</button>
        <button class="btn-l7-cert-secondary" id="btn-cert-exit">🚀 Mission Control</button>
      </div>
    `;

    backdrop.classList.add('open');

    cardEl.querySelector('#btn-cert-download').addEventListener('click', () => {
      level7Audio.playClick();
      window.print();
    });

    cardEl.querySelector('#btn-cert-replay').addEventListener('click', () => {
      level7Audio.playClick();
      backdrop.classList.remove('open');
      if (data.onPlayAgain) data.onPlayAgain();
    });

    cardEl.querySelector('#btn-cert-exit').addEventListener('click', () => {
      level7Audio.playClick();
      backdrop.classList.remove('open');
      if (data.onExit) data.onExit();
    });
  }

  dispose() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}
