import { FACILITIES_DATA } from '../data/facilities.js';
import { gameState } from '../simulation/GameState.js';
import { orbitVoice } from '../audio/OrbitVoice.js';

/**
 * LUNA: Mission Survival - Module 2 & 3: Clean Facility Icon Tiles
 * 5 facility tiles with OK/Warning LEDs, hover glow, and active mission blink.
 */
export class FacilityPanel {
  constructor(options = {}) {
    this.options = options; // { onViewInColony: (facilityId) => {} }
    this.currentFacilities = {};
    this.element = this.createDOM();
    this.createModal();
  }

  createDOM() {
    const section = document.createElement('section');
    section.className = 'mc-panel mc-facility-panel';
    section.id = 'mc-section-facilities';

    section.innerHTML = `
      <div class="mc-panel-header">
        <div class="mc-panel-title-row">
          <span class="mc-panel-icon">🏛️</span>
          <h2 class="mc-panel-title">BASE SURFACE FACILITIES (5)</h2>
        </div>
        <span class="mc-panel-hint">Tap any facility to inspect or view in 3D</span>
      </div>

      <!-- 5 Facility Icon Tiles Grid -->
      <div class="mc-facility-tiles-grid">
        ${FACILITIES_DATA.map(fac => `
          <div class="mc-fac-tile" data-facility-id="${fac.id}" title="Inspect ${fac.name}">
            <div class="mc-fac-tile-top">
              <span class="mc-fac-icon-box">${fac.icon}</span>
              <div class="mc-fac-led-wrap" title="System Status: Operational">
                <span class="mc-fac-led ok" id="fac-led-${fac.id}"></span>
                <span class="mc-fac-led-label" id="fac-led-text-${fac.id}">OK</span>
              </div>
            </div>

            <div class="mc-fac-info">
              <h3 class="mc-fac-name">${fac.name.split('(')[0].trim()}</h3>
              <span class="mc-fac-res-tag">Linked: ${fac.relatedResource.split('&')[0].trim()}</span>
            </div>

            <div class="mc-fac-mission-beacon" id="fac-beacon-${fac.id}" style="display: none;">
              <span>⭐ TODAY'S OBJECTIVE</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    // Click & hover interactions
    section.querySelectorAll('.mc-fac-tile').forEach(tile => {
      tile.addEventListener('mouseenter', () => orbitVoice.playChirp('hover'));
      tile.addEventListener('click', (e) => {
        orbitVoice.playChirp('click');
        const id = e.currentTarget.getAttribute('data-facility-id');
        this.openModal(id);
      });
    });

    return section;
  }

  createModal() {
    this.modal = document.createElement('div');
    this.modal.className = 'mc-modal-overlay';
    this.modal.style.display = 'none';

    this.modal.innerHTML = `
      <div class="mc-modal-card">
        <button class="mc-modal-close" aria-label="Close">✕</button>
        <div class="mc-modal-header">
          <div class="mc-modal-icon-wrap" id="fac-modal-icon">🏠</div>
          <div>
            <div class="mc-modal-status-row">
              <span class="res-status-badge status-excellent" id="fac-modal-status">100% OPERATIONAL</span>
              <span class="day-number-tag" id="fac-modal-tag">BASE FACILITY</span>
            </div>
            <h3 class="mc-modal-title" id="fac-modal-name">Facility Name</h3>
          </div>
        </div>

        <div class="mc-modal-body">
          <div class="mc-modal-section">
            <h4 class="mc-section-heading">Facility Mission Function</h4>
            <p class="mc-modal-text" id="fac-modal-purpose">Purpose</p>
          </div>

          <div class="mc-modal-section">
            <h4 class="mc-section-heading">Kid-Friendly Overview</h4>
            <p class="mc-modal-text" id="fac-modal-desc">Description</p>
          </div>

          <div class="mc-modal-section">
            <div class="mc-modal-actions" style="margin-top: 0.5rem;">
              <button class="btn-mc btn-mc-primary" id="fac-btn-view-3d">
                <span>View in 3D Colony 🔍</span>
              </button>
            </div>
          </div>
        </div>

        <div class="mc-modal-footer">
          <button class="btn-mc btn-mc-secondary mc-modal-dismiss-btn">Close</button>
        </div>
      </div>
    `;

    document.body.appendChild(this.modal);

    const closeBtn = this.modal.querySelector('.mc-modal-close');
    const dismissBtn = this.modal.querySelector('.mc-modal-dismiss-btn');
    [closeBtn, dismissBtn].forEach(b => {
      b.addEventListener('click', () => {
        orbitVoice.playChirp('click');
        this.closeModal();
      });
    });

    this.modal.querySelector('#fac-btn-view-3d').addEventListener('click', () => {
      orbitVoice.playChirp('click');
      this.closeModal();
      if (this.currentActiveModalFacility && this.options.onViewInColony) {
        this.options.onViewInColony(this.currentActiveModalFacility);
      }
    });

    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.closeModal();
    });
  }

  update(facilities) {
    if (!facilities) return;
    this.currentFacilities = { ...facilities };

    const todayFacilityId = gameState.currentDayEvent?.facilityId || null;

    FACILITIES_DATA.forEach(fac => {
      const tile = this.element.querySelector(`.mc-fac-tile[data-facility-id="${fac.id}"]`);
      const ledEl = this.element.querySelector(`#fac-led-${fac.id}`);
      const textEl = this.element.querySelector(`#fac-led-text-${fac.id}`);
      const beaconEl = this.element.querySelector(`#fac-beacon-${fac.id}`);

      if (!tile) return;

      const data = facilities[fac.id] || { status: 'Operational', integrity: 100 };
      const isDamaged = (data.status === 'Damaged' || data.integrity < 60);

      tile.classList.remove('tile-warning', 'tile-active-mission');

      if (isDamaged) {
        tile.classList.add('tile-warning');
        if (ledEl) { ledEl.className = 'mc-fac-led warning'; }
        if (textEl) { textEl.textContent = 'WARN'; }
      } else {
        if (ledEl) { ledEl.className = 'mc-fac-led ok'; }
        if (textEl) { textEl.textContent = 'OK'; }
      }

      // Blink if relevant to today's mission
      if (todayFacilityId === fac.id && !gameState.currentDayDecided) {
        tile.classList.add('tile-active-mission');
        if (beaconEl) beaconEl.style.display = 'flex';
      } else {
        if (beaconEl) beaconEl.style.display = 'none';
      }
    });
  }

  openModal(facilityId) {
    const data = FACILITIES_DATA.find(f => f.id === facilityId);
    if (!data) return;

    this.currentActiveModalFacility = facilityId;

    this.modal.querySelector('#fac-modal-icon').textContent = data.icon;
    this.modal.querySelector('#fac-modal-name').textContent = data.name;
    this.modal.querySelector('#fac-modal-purpose').textContent = data.purpose;
    this.modal.querySelector('#fac-modal-desc').textContent = data.description;

    const currentStatus = this.currentFacilities[facilityId];
    const isDamaged = currentStatus && (currentStatus.status === 'Damaged' || currentStatus.integrity < 60);

    const statusBadge = this.modal.querySelector('#fac-modal-status');
    if (isDamaged) {
      statusBadge.textContent = 'MAINTENANCE NEEDED ⚠️';
      statusBadge.className = 'res-status-badge status-warning';
    } else {
      statusBadge.textContent = '100% OPERATIONAL';
      statusBadge.className = 'res-status-badge status-excellent';
    }

    this.modal.style.display = 'flex';
    requestAnimationFrame(() => this.modal.classList.add('active'));
  }

  closeModal() {
    this.modal.classList.remove('active');
    setTimeout(() => {
      this.modal.style.display = 'none';
    }, 200);
  }
}
