import { BUILDINGS_DATA } from '../data/buildings.js';
import { gameState } from '../simulation/GameState.js';

/**
 * Manages the slide-in/modal Building Information Card
 * Kid-friendly language and clean layout
 */
export class InformationPanel {
  constructor(onFocusCallback) {
    this.onFocus = onFocusCallback;
    this.createDOM();
  }

  createDOM() {
    this.container = document.createElement('div');
    this.container.className = 'info-panel-overlay';
    this.container.style.display = 'none';

    this.container.innerHTML = `
      <div class="info-panel-card">
        <button class="panel-close-btn" id="panel-close-btn" aria-label="Close Panel">✕</button>
        <div class="panel-header">
          <div class="panel-badge-row">
            <span class="panel-icon" id="panel-icon">🏠</span>
            <div class="panel-status-pill">
              <span class="status-pulse-dot"></span>
              <span id="panel-status-text">All Good</span>
            </div>
          </div>
          <h2 class="panel-title" id="panel-title">Structure Name</h2>
          <p class="panel-tagline" id="panel-tagline">Tagline</p>
        </div>

        <div class="panel-body">
          <div class="panel-section">
            <h3 class="section-title">What is this building?</h3>
            <p class="section-desc" id="panel-desc">Description</p>
          </div>

          <div class="panel-section">
            <h3 class="section-title">Why our astronauts need it:</h3>
            <p class="section-desc" id="panel-purpose">Purpose</p>
          </div>

          <div class="panel-section">
            <h3 class="section-title">Cool Facts & Stats:</h3>
            <div class="specs-grid" id="panel-specs-grid">
              <!-- Dynamically populated -->
            </div>
          </div>
        </div>

        <div class="panel-actions">
          <button class="btn btn-secondary" id="panel-focus-btn">🔍 Look Closer</button>
          <button class="btn btn-primary" id="panel-dismiss-btn">Close ✕</button>
        </div>
      </div>
    `;

    document.body.appendChild(this.container);

    // Event Listeners
    this.container.querySelector('#panel-close-btn').addEventListener('click', () => this.hide());
    this.container.querySelector('#panel-dismiss-btn').addEventListener('click', () => this.hide());
    this.container.querySelector('#panel-focus-btn').addEventListener('click', () => {
      if (this.currentBuildingId && this.onFocus) {
        this.onFocus(this.currentBuildingId);
      }
    });

    // Close when clicking outside the card
    this.container.addEventListener('click', (e) => {
      if (e.target === this.container) {
        this.hide();
      }
    });
  }

  show(buildingId) {
    const data = BUILDINGS_DATA[buildingId];
    if (!data) return;

    this.currentBuildingId = buildingId;
    const liveFac = gameState.facilities[buildingId];

    this.container.querySelector('#panel-icon').textContent = data.icon;
    
    // Live condition & status
    const statusTextEl = this.container.querySelector('#panel-status-text');
    if (liveFac) {
      statusTextEl.textContent = `${liveFac.condition}% Integrity (${liveFac.status})`;
      statusTextEl.parentElement.style.background = `${liveFac.statusColor || '#06D6A0'}25`;
      statusTextEl.parentElement.style.borderColor = liveFac.statusColor || '#06D6A0';
    } else {
      statusTextEl.textContent = data.status;
    }

    this.container.querySelector('#panel-title').textContent = data.name;
    this.container.querySelector('#panel-tagline').textContent = data.tagline;
    this.container.querySelector('#panel-desc').textContent = data.description;
    this.container.querySelector('#panel-purpose').textContent = data.purpose;

    // Check if building is currently affected by today's event
    const activeEv = gameState.currentDayEvent;
    const isAffected = (activeEv && activeEv.facilityId === buildingId && !gameState.currentDayDecided);

    const specsGrid = this.container.querySelector('#panel-specs-grid');
    let specsHtml = data.specs.map(spec => `
      <div class="spec-item">
        <span class="spec-label">${spec.label}</span>
        <span class="spec-val">${spec.value}</span>
      </div>
    `).join('');

    if (isAffected) {
      specsHtml = `
        <div class="spec-item" style="grid-column: 1 / -1; background: rgba(255,183,3,0.18); border: 1px solid #FFB703;">
          <span class="spec-label" style="color:#FFB703;">⚠️ ACTIVE SOL ${gameState.currentDay} ANOMALY</span>
          <span class="spec-val" style="color:#FFF;">${activeEv.title} (Action Required in Mission Control)</span>
        </div>
      ` + specsHtml;
    }

    specsGrid.innerHTML = specsHtml;

    this.container.style.display = 'flex';
    requestAnimationFrame(() => {
      this.container.classList.add('active');
    });
  }

  hide() {
    this.container.classList.remove('active');
    setTimeout(() => {
      this.container.style.display = 'none';
      this.currentBuildingId = null;
    }, 250);
  }
}
