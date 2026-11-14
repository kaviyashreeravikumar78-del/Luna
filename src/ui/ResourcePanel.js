import { RESOURCES_DATA, getResourceStatus } from '../data/resources.js';

/**
 * LUNA: Mission Survival - Module 2 & 3: Animated Resource Monitoring & Liquid Wave Tanks
 * Renders real-time animated liquid waveforms with bubbles and plasma sparks for each vital colony resource.
 */
export class ResourcePanel {
  constructor() {
    this.currentResources = { oxygen: 100, water: 100, food: 100, power: 100 };
    this.waveAnimId = null;
    this.waveStates = {};
    this.element = this.createDOM();
    this.createModal();
    this.initWaveAnimation();
  }

  createDOM() {
    const section = document.createElement('section');
    section.className = 'mc-panel mc-resource-panel';
    section.id = 'mc-section-resources';

    section.innerHTML = `
      <div class="mc-panel-header">
        <div class="mc-panel-title-row">
          <span class="mc-panel-icon">📊</span>
          <h2 class="mc-panel-title">VITAL COLONY LIFE SUPPORT RESERVES</h2>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <span class="pulse-indicator"></span>
          <span class="mc-panel-hint">Live Hydrostatic Telemetry Active • Click any card for details</span>
        </div>
      </div>

      <div class="mc-resource-grid">
        ${RESOURCES_DATA.map(res => {
          const statusInfo = getResourceStatus(res.percentage);
          return `
            <div class="resource-card" data-resource-id="${res.id}">
              <div class="res-card-top">
                <span class="res-icon" style="background: ${res.color}15; border-color: ${res.color}40">${res.icon}</span>
                <div class="res-title-group">
                  <h3 class="res-name">${res.name}</h3>
                  <span class="res-status-badge ${statusInfo.class}" id="res-badge-${res.id}">${statusInfo.label}</span>
                </div>
                <div class="res-pct-val" id="res-val-${res.id}" style="color: ${res.color}">
                  ${res.percentage}%
                </div>
              </div>

              <!-- Live Animated Hydrodynamic Liquid Tank -->
              <div class="res-tank-frame">
                <canvas class="res-liquid-canvas" id="res-canvas-${res.id}" width="280" height="44"></canvas>
                <div class="res-tank-glass-glare"></div>
              </div>

              <div class="res-card-bottom-info">
                <p class="res-short-desc">${res.shortDesc}</p>
                <span class="res-flow-rate" id="res-flow-${res.id}">Flow: Nominal</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    section.querySelectorAll('.resource-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-resource-id');
        this.openModal(id);
      });
    });

    return section;
  }

  initWaveAnimation() {
    RESOURCES_DATA.forEach(res => {
      this.waveStates[res.id] = {
        phase: Math.random() * 10,
        color: res.color,
        pct: 100,
        bubbles: Array.from({ length: 8 }, () => ({
          x: Math.random() * 280,
          y: 20 + Math.random() * 20,
          s: 1.2 + Math.random() * 2.2,
          vy: 0.4 + Math.random() * 0.6
        }))
      };
    });

    const draw = () => {
      this.waveAnimId = requestAnimationFrame(draw);

      RESOURCES_DATA.forEach(res => {
        const canvas = this.element.querySelector(`#res-canvas-${res.id}`);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const state = this.waveStates[res.id];

        const w = canvas.width;
        const h = canvas.height;

        state.phase += 0.045;

        // Clear canvas with dark tank interior
        ctx.fillStyle = '#06101E';
        ctx.fillRect(0, 0, w, h);

        // Water level Y based on percentage
        const fillHeight = (state.pct / 100) * (h - 8);
        const baseY = h - fillHeight;

        // Draw Liquid Gradient
        const grad = ctx.createLinearGradient(0, baseY, 0, h);
        grad.addColorStop(0, state.color);
        grad.addColorStop(1, '#06101E');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(0, h);

        // Primary Sinusoidal Wave
        for (let x = 0; x <= w; x += 4) {
          const wave1 = Math.sin(x * 0.035 + state.phase) * 3.5;
          const wave2 = Math.cos(x * 0.02 - state.phase * 0.7) * 2.0;
          ctx.lineTo(x, baseY + wave1 + wave2);
        }

        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fill();

        // Wave surface crest highlight
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = state.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 4) {
          const wave1 = Math.sin(x * 0.035 + state.phase) * 3.5;
          const wave2 = Math.cos(x * 0.02 - state.phase * 0.7) * 2.0;
          if (x === 0) ctx.moveTo(x, baseY + wave1 + wave2);
          else ctx.lineTo(x, baseY + wave1 + wave2);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Animated rising bubbles
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        state.bubbles.forEach(b => {
          b.y -= b.vy;
          if (b.y < baseY) {
            b.y = h - 2;
            b.x = Math.random() * w;
          }
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.s, 0, Math.PI * 2);
          ctx.fill();
        });

        // Special electric sparks on Power tank
        if (res.id === 'power' && state.pct > 20) {
          ctx.strokeStyle = '#FFD166';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          const sparkX = Math.random() * w;
          ctx.moveTo(sparkX, baseY);
          ctx.lineTo(sparkX + (Math.random() - 0.5) * 16, baseY - 6 + (Math.random() - 0.5) * 8);
          ctx.stroke();
        }
      });
    };

    draw();
  }

  createModal() {
    this.modal = document.createElement('div');
    this.modal.className = 'mc-modal-overlay';
    this.modal.style.display = 'none';

    this.modal.innerHTML = `
      <div class="mc-modal-card">
        <button class="mc-modal-close" aria-label="Close">✕</button>
        <div class="mc-modal-header">
          <div class="mc-modal-icon-wrap" id="res-modal-icon">💨</div>
          <div>
            <div class="mc-modal-status-row">
              <span class="res-status-badge status-excellent" id="res-modal-status">Excellent</span>
              <span class="res-pct-badge" id="res-modal-pct">100% Full</span>
            </div>
            <h3 class="mc-modal-title" id="res-modal-title">Resource Name</h3>
          </div>
        </div>

        <div class="mc-modal-body">
          <div class="mc-modal-section">
            <h4 class="mc-section-heading">Why is this vital for the Moon base?</h4>
            <p class="mc-modal-text" id="res-modal-desc">Description</p>
          </div>

          <div class="mc-modal-section">
            <h4 class="mc-section-heading">Supporting Facility</h4>
            <div class="mc-facility-link-box" id="res-modal-facility">
              <span class="mc-link-icon">⚙️</span>
              <span class="mc-link-name">Facility Name</span>
            </div>
          </div>

          <div class="mc-modal-section">
            <h4 class="mc-section-heading">Live Telemetry Metrics</h4>
            <div class="mc-metrics-grid" id="res-modal-metrics">
              <!-- Dynamically populated -->
            </div>
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

  openModal(resourceId) {
    const data = RESOURCES_DATA.find(r => r.id === resourceId);
    if (!data) return;

    const currentPct = this.currentResources[resourceId] !== undefined ? this.currentResources[resourceId] : data.percentage;
    const statusInfo = getResourceStatus(currentPct);

    this.modal.querySelector('#res-modal-icon').textContent = data.icon;
    this.modal.querySelector('#res-modal-title').textContent = data.name;
    this.modal.querySelector('#res-modal-desc').textContent = data.description;

    const statusBadge = this.modal.querySelector('#res-modal-status');
    statusBadge.textContent = statusInfo.label;
    statusBadge.className = `res-status-badge ${statusInfo.class}`;

    const pctBadge = this.modal.querySelector('#res-modal-pct');
    pctBadge.textContent = `${currentPct}% Remaining`;
    pctBadge.style.color = data.color;

    this.modal.querySelector('#res-modal-facility').innerHTML = `
      <span class="mc-link-icon">⚙️</span>
      <span class="mc-link-name">${data.facility}</span>
    `;

    const metricsWrap = this.modal.querySelector('#res-modal-metrics');
    metricsWrap.innerHTML = `
      <div class="mc-metric-item">
        <span class="mc-metric-label">Daily Outpost Consumption</span>
        <span class="mc-metric-value" style="color:#00E5FF">${data.consumptionRate}</span>
      </div>
      <div class="mc-metric-item">
        <span class="mc-metric-label">Reserve Runway</span>
        <span class="mc-metric-value" style="color:#06D6A0">${Math.round(currentPct / 12)} Sols buffer</span>
      </div>
      <div class="mc-metric-item">
        <span class="mc-metric-label">Critical Warning Threshold</span>
        <span class="mc-metric-value" style="color:#FFB703">&lt; 30% Storage</span>
      </div>
      <div class="mc-metric-item">
        <span class="mc-metric-label">Purification Efficiency</span>
        <span class="mc-metric-value" style="color:#E8B76B">98.4% Closed-Loop</span>
      </div>
    `;

    this.modal.style.display = 'flex';
  }

  closeModal() {
    this.modal.style.display = 'none';
  }

  update(resourcesState) {
    if (!resourcesState) return;
    this.currentResources = resourcesState;

    Object.keys(resourcesState).forEach(id => {
      const pct = resourcesState[id];
      const valEl = this.element.querySelector(`#res-val-${id}`);
      const badgeEl = this.element.querySelector(`#res-badge-${id}`);
      const flowEl = this.element.querySelector(`#res-flow-${id}`);

      if (valEl) valEl.textContent = `${pct}%`;

      if (badgeEl) {
        const statusInfo = getResourceStatus(pct);
        badgeEl.textContent = statusInfo.label;
        badgeEl.className = `res-status-badge ${statusInfo.class}`;
      }

      if (flowEl) {
        flowEl.textContent = pct > 75 ? 'Flow: Nominal ✅' : pct > 40 ? 'Flow: Compensating ⚠️' : 'Flow: CRITICAL 🚨';
        flowEl.style.color = pct > 75 ? '#06D6A0' : pct > 40 ? '#FFB703' : '#FF3B30';
      }

      // Update liquid level
      if (this.waveStates[id]) {
        this.waveStates[id].pct = pct;
        if (pct < 30) {
          this.waveStates[id].color = '#FF3B30';
        } else if (pct < 60) {
          this.waveStates[id].color = '#FFB703';
        } else {
          this.waveStates[id].color = RESOURCES_DATA.find(r => r.id === id)?.color || '#00E5FF';
        }
      }
    });
  }

  destroy() {
    if (this.waveAnimId) cancelAnimationFrame(this.waveAnimId);
  }
}
