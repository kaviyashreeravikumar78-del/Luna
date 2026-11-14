/**
 * LUNA: Mission Survival - Module 2 & 3: Mission Control Top Header
 * Features live telemetry indicators, animated radio audio equalizer spectrum,
 * and command deck status.
 */
export class MissionHeader {
  constructor(options) {
    this.options = options; // { onReturnToColony, onExplainDashboard, onResetMission }
    this.element = this.createDOM();
  }

  createDOM() {
    const header = document.createElement('header');
    header.className = 'mc-header';
    header.id = 'mc-section-header';

    header.innerHTML = `
      <div class="mc-header-left">
        <div class="mc-brand-box">
          <span class="mc-logo-badge">LUNA-01</span>
          <div class="mc-title-group">
            <h1 class="mc-header-title">MISSION CONTROL</h1>
            <span class="mc-header-sub">Outpost Command & Telemetry Deck</span>
          </div>

          <!-- Animated Deep Space Radio Audio Spectrum Equalizer -->
          <div class="mc-audio-visualizer" title="Deep Space Radio Uplink Frequency">
            <span class="eq-bar eq-bar-1"></span>
            <span class="eq-bar eq-bar-2"></span>
            <span class="eq-bar eq-bar-3"></span>
            <span class="eq-bar eq-bar-4"></span>
            <span class="eq-bar eq-bar-5"></span>
            <span class="eq-bar eq-bar-6"></span>
            <span class="eq-bar eq-bar-7"></span>
          </div>
        </div>

        <div class="mc-telemetry-pill-group">
          <div class="mc-badge-pill" id="header-status-pill">
            <span class="pulse-indicator"></span>
            <span id="header-status-text">STATUS: OPERATIONAL</span>
          </div>
          <div class="mc-stat-item">
            <span class="mc-stat-label">LOCATION:</span>
            <span class="mc-stat-val">Lunar South Pole</span>
          </div>
          <div class="mc-stat-item">
            <span class="mc-stat-label">TIMELINE:</span>
            <span class="mc-stat-val text-gold" id="header-sol-text">SOL 1 OF 7</span>
          </div>
          <div class="mc-stat-item">
            <span class="mc-stat-label">CREW:</span>
            <span class="mc-stat-val text-cyan" id="header-crew-text">4 / 4 HEALTHY</span>
          </div>
        </div>
      </div>

      <div class="mc-header-right">
        <button id="btn-mc-reset-mission" class="btn-mc-reset-mission" title="Reset mission and start fresh">
          🔄 Reset
        </button>
        <button id="btn-mc-orbit-guide" class="btn-mc btn-mc-robot" title="Ask ORBIT to explain this deck!">
          <span>🤖 Explain Dashboard</span>
        </button>
        <button id="btn-mc-return-colony" class="btn-mc btn-mc-primary" title="Return to the 3D Lunar Colony">
          <span>← Return to 3D Colony</span>
        </button>
      </div>
    `;

    header.querySelector('#btn-mc-reset-mission').addEventListener('click', () => {
      if (confirm("Are you sure you want to abort the current mission and restart at Sol 1?")) {
        if (this.options.onResetMission) this.options.onResetMission();
      }
    });

    header.querySelector('#btn-mc-orbit-guide').addEventListener('click', () => {
      if (this.options.onExplainDashboard) this.options.onExplainDashboard();
    });

    header.querySelector('#btn-mc-return-colony').addEventListener('click', () => {
      if (this.options.onReturnToColony) this.options.onReturnToColony();
    });

    return header;
  }

  update(gameState) {
    if (!gameState) return;

    // 1. Sol Timeline
    const solEl = this.element.querySelector('#header-sol-text');
    if (solEl) {
      solEl.textContent = `SOL ${gameState.currentDay} OF ${gameState.maxDays}`;
    }

    // 2. Crew Count
    const healthyCount = Object.values(gameState.crew).filter(c => c.health >= 60).length;
    const crewEl = this.element.querySelector('#header-crew-text');
    if (crewEl) {
      crewEl.textContent = `${healthyCount} / 4 HEALTHY`;
      crewEl.className = healthyCount === 4 ? 'mc-stat-val text-cyan' : 'mc-stat-val text-gold';
    }

    // 3. Status
    const statusEl = this.element.querySelector('#header-status-text');
    if (statusEl) {
      if (gameState.missionStatus === 'completed') {
        statusEl.textContent = 'STATUS: EXPEDITION COMPLETED 🏆';
      } else if (gameState.missionStatus === 'failed') {
        statusEl.textContent = 'STATUS: EMERGENCY FAILURE ❌';
      } else if (gameState.warnings && gameState.warnings.length > 0) {
        statusEl.textContent = `STATUS: ${gameState.warnings.length} WARNINGS ⚠️`;
      } else {
        statusEl.textContent = 'STATUS: OPERATIONAL ✅';
      }
    }
  }
}
