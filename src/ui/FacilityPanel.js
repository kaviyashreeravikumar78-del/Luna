import { FACILITIES_DATA } from '../data/facilities.js';

/**
 * LUNA: Mission Survival - Module 2 & 3: Animated Facility Monitoring Section
 * Includes rotating diagnostic radar telemetry sweeps, subsystem status LEDs,
 * and direct camera inspect links.
 */
export class FacilityPanel {
  constructor(options) {
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
          <h2 class="mc-panel-title">SURFACE BASE FACILITIES & DIAGNOSTICS (5/5)</h2>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <span class="pulse-indicator"></span>
          <span class="mc-panel-hint">Telemetry Uplink Nominal • Click any facility for inspection</span>
        </div>
      </div>

      <div class="mc-facility-grid">
        ${FACILITIES_DATA.map(fac => `
          <div class="facility-card" data-facility-id="${fac.id}">
            <div class="fac-card-top">
              <div class="fac-icon-wrap">
                <span class="fac-icon">${fac.icon}</span>
                <div class="fac-radar-sweep-ring"></div>
              </div>
              <div class="fac-title-group">
                <h3 class="fac-name">${fac.name}</h3>
                <span class="fac-status-badge" id="fac-badge-${fac.id}">
                  <span class="pulse-indicator"></span>
                  ${fac.status}
                </span>
              </div>
              <span class="fac-condition-tag" id="fac-cond-tag-${fac.id}">100% Integrity</span>
            </div>

            <!-- Animated Diagnostics Telemetry Strip -->
            <div class="fac-telemetry-strip">
              <div class="fac-scan-sweep"></div>
              <span class="fac-diag-text" id="fac-diag-${fac.id}">SUBSYSTEMS ONLINE • NOMINAL</span>
              <span class="fac-signal-bars">📶 ||||</span>
            </div>

            <p class="fac-purpose-text">${fac.purpose}</p>

            <div class="fac-card-footer">
              <span class="fac-res-tag">Linked: ${fac.relatedResource}</span>
              <button class="btn-fac-inspect" data-fac-btn="${fac.id}">Inspect →</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    section.querySelectorAll('.facility-card').forEach(card => {
      card.addEventListener('click', (e) => {
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
              <span class="fac-status-badge" id="fac-modal-status">
                <span class="pulse-indicator"></span> Operational
              </span>
              <span class="res-pct-badge" id="fac-modal-condition">100% Integrity</span>
            </div>
            <h3 class="mc-modal-title" id="fac-modal-name">Facility Name</h3>
          </div>
        </div>

        <div class="mc-modal-body">
          <div class="mc-modal-section">
            <h4 class="mc-section-heading">Facility Purpose & Function</h4>
            <p class="mc-modal-text" id="fac-modal-purpose">Purpose</p>
          </div>

          <div class="mc-modal-section">
            <h4 class="mc-section-heading">Detailed Operational Overview</h4>
            <p class="mc-modal-text" id="fac-modal-desc">Description</p>
          </div>

          <div class="mc-modal-section">
            <h4 class="mc-section-heading">Linked Colony Resource</h4>
            <div class="mc-facility-link-box" id="fac-modal-resource">
              <span class="mc-link-icon">⚡</span>
              <span class="mc-link-name">Resource Name</span>
            </div>
          </div>

          <div class="mc-modal-actions">
            <button class="btn-mc-colony-link" id="fac-btn-view-3d">
              <span>View in 3D Colony 🔍</span>
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.modal);

    this.modal.querySelector('.mc-modal-close').addEventListener('click', () => {
      this.closeModal();
    });

    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.closeModal();
    });
  }

  openModal(facilityId) {
    const data = FACILITIES_DATA.find(f => f.id === facilityId);
    if (!data) return;

    const live = this.currentFacilities[facilityId] || {};
    const integrity = live.condition !== undefined ? live.condition : 100;
    const statusText = live.status || data.status;

    this.modal.querySelector('#fac-modal-icon').textContent = data.icon;
    this.modal.querySelector('#fac-modal-name').textContent = data.name;
    this.modal.querySelector('#fac-modal-purpose').textContent = data.purpose;
    this.modal.querySelector('#fac-modal-desc').textContent = data.description;

    const statusBadge = this.modal.querySelector('#fac-modal-status');
    statusBadge.innerHTML = `<span class="pulse-indicator"></span> ${statusText}`;

    const condBadge = this.modal.querySelector('#fac-modal-condition');
    condBadge.textContent = `${integrity}% Integrity`;
    condBadge.style.color = integrity > 75 ? '#06D6A0' : integrity > 45 ? '#FFB703' : '#FF3B30';

    this.modal.querySelector('#fac-modal-resource').innerHTML = `
      <span class="mc-link-icon">⚙️</span>
      <span class="mc-link-name">${data.relatedResource}</span>
    `;

    const viewBtn = this.modal.querySelector('#fac-btn-view-3d');
    viewBtn.onclick = () => {
      this.closeModal();
      if (this.options.onViewInColony) {
        this.options.onViewInColony(data.buildingTarget);
      }
    };

    this.modal.style.display = 'flex';
  }

  closeModal() {
    this.modal.style.display = 'none';
  }

  update(facilitiesState) {
    if (!facilitiesState) return;
    this.currentFacilities = facilitiesState;

    Object.keys(facilitiesState).forEach(id => {
      const fac = facilitiesState[id];
      if (!fac) return;

      const condTag = this.element.querySelector(`#fac-cond-tag-${id}`);
      const badge = this.element.querySelector(`#fac-badge-${id}`);
      const diag = this.element.querySelector(`#fac-diag-${id}`);

      if (condTag) {
        condTag.textContent = `${fac.condition}% Integrity`;
        condTag.style.color = fac.condition > 75 ? '#06D6A0' : fac.condition > 45 ? '#FFB703' : '#FF3B30';
      }

      if (badge && fac.status) {
        badge.innerHTML = `<span class="pulse-indicator"></span> ${fac.status}`;
      }

      if (diag) {
        if (fac.condition < 50) {
          diag.textContent = 'DEGRADED INTEGRITY • REPAIR REQUIRED';
          diag.style.color = '#FF3B30';
        } else if (fac.condition < 80) {
          diag.textContent = 'MONITORING ANOMALY • ATTENTION';
          diag.style.color = '#FFB703';
        } else {
          diag.textContent = 'SUBSYSTEMS ONLINE • NOMINAL';
          diag.style.color = '#06D6A0';
        }
      }
    });
  }
}
