import { orbitVoice } from '../audio/OrbitVoice.js';

/**
 * LUNA: Mission Survival - Mission Control Top HUD Header
 * Clean, unclipped game mission-select HUD matching the home screen's visual identity.
 * Shows:
 *  - Mission badge (LUNA-01)
 *  - Sol status (Day X of 7)
 *  - Crew status (4 small astronaut icons, green = healthy)
 *  - Action buttons ("Back to Colony", "Help" with ORBIT, "Reset")
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
      <!-- LEFT: Mission Badge, Sol Pill, Crew Dots -->
      <div class="mc-header-left">
        <div class="mc-brand-box">
          <span class="mc-logo-badge">LUNA-01</span>
          <div class="mc-sol-pill" id="header-sol-pill">
            <span class="pulse-indicator"></span>
            <span id="header-sol-text">Day 1 of 7</span>
          </div>
        </div>

        <!-- 4 Astronaut Health Icons -->
        <div class="mc-crew-dots-strip" title="Crew Vitals Status">
          <span class="mc-crew-dots-label">Crew:</span>
          <div class="mc-crew-dots" id="header-crew-dots">
            <div class="mc-crew-dot healthy" data-crew="evelyn" title="Cmdr. Evelyn: Healthy">
              <span>👩‍🚀</span>
              <span class="dot-indicator"></span>
            </div>
            <div class="mc-crew-dot healthy" data-crew="marcus" title="Eng. Marcus: Healthy">
              <span>👨‍🔧</span>
              <span class="dot-indicator"></span>
            </div>
            <div class="mc-crew-dot healthy" data-crew="chen" title="Bio. Aris: Healthy">
              <span>🌱</span>
              <span class="dot-indicator"></span>
            </div>
            <div class="mc-crew-dot healthy" data-crew="maya" title="Spec. Maya: Healthy">
              <span>📡</span>
              <span class="dot-indicator"></span>
            </div>
          </div>
        </div>
      </div>

      <!-- CENTER: Title -->
      <div class="mc-header-center">
        <h1 class="mc-header-title">MISSION CONTROL</h1>
        <span class="mc-header-sub">South Pole Outpost Command</span>
      </div>

      <!-- RIGHT: Action Buttons -->
      <div class="mc-header-right">
        <button id="btn-mc-return-colony" class="btn-mc btn-mc-secondary" title="Return to 3D Lunar Colony">
          <span>← Back to Colony</span>
        </button>
        <button id="btn-mc-orbit-guide" class="btn-mc btn-mc-help" title="Ask ORBIT for help!">
          <span>❓ Help</span>
        </button>
        <button id="btn-mc-reset-mission" class="btn-mc btn-mc-reset" title="Reset mission and start fresh">
          <span>🔄 Reset</span>
        </button>
      </div>
    `;

    // Audio micro-interactions & event listeners
    const resetBtn = header.querySelector('#btn-mc-reset-mission');
    const helpBtn = header.querySelector('#btn-mc-orbit-guide');
    const colonyBtn = header.querySelector('#btn-mc-return-colony');

    [resetBtn, helpBtn, colonyBtn].forEach(btn => {
      if (!btn) return;
      btn.addEventListener('mouseenter', () => orbitVoice.playChirp('hover'));
    });

    resetBtn.addEventListener('click', () => {
      orbitVoice.playChirp('click');
      if (confirm("Reset mission? This will restart the 7-day expedition from Sol 1.")) {
        if (this.options.onResetMission) this.options.onResetMission();
      }
    });

    helpBtn.addEventListener('click', () => {
      orbitVoice.playChirp('click');
      if (this.options.onExplainDashboard) this.options.onExplainDashboard();
    });

    colonyBtn.addEventListener('click', () => {
      orbitVoice.playChirp('click');
      if (this.options.onReturnToColony) this.options.onReturnToColony();
    });

    return header;
  }

  update(gameState) {
    if (!gameState) return;

    // 1. Sol Timeline pill
    const solEl = this.element.querySelector('#header-sol-text');
    if (solEl) {
      solEl.textContent = `Day ${gameState.currentDay} of ${gameState.maxDays || 7}`;
    }

    // 2. Crew 4-dot status
    if (gameState.crew) {
      const crewKeys = ['evelyn', 'marcus', 'chen', 'maya'];
      crewKeys.forEach(key => {
        const member = gameState.crew[key];
        const dot = this.element.querySelector(`.mc-crew-dot[data-crew="${key}"]`);
        if (dot && member) {
          dot.classList.remove('healthy', 'warning', 'critical');
          if (member.health >= 70) {
            dot.classList.add('healthy');
            dot.title = `${member.name}: ${member.health}% Healthy`;
          } else if (member.health >= 40) {
            dot.classList.add('warning');
            dot.title = `${member.name}: ${member.health}% Injured`;
          } else {
            dot.classList.add('critical');
            dot.title = `${member.name}: ${member.health}% Critical!`;
          }
        }
      });
    }
  }
}
