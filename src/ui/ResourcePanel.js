import { RESOURCES_DATA, getResourceStatus } from '../data/resources.js';
import { orbitVoice } from '../audio/OrbitVoice.js';

/**
 * LUNA: Mission Survival - Module 2 & 3: Big Animated Circular Resource Gauges
 * Features 4 big animated radial gauges (Oxygen, Water, Food, Power) with icons,
 * smooth number counters, color-coded health states, warning pulses, and hover tooltips.
 */
export class ResourcePanel {
  constructor() {
    this.currentResources = { oxygen: 100, water: 100, food: 100, power: 100 };
    this.displayedValues = { oxygen: 100, water: 100, food: 100, power: 100 };
    this.element = this.createDOM();
    this.createModal();
  }

  createDOM() {
    const section = document.createElement('section');
    section.className = 'mc-panel mc-resource-panel';
    section.id = 'mc-section-resources';

    section.innerHTML = `
      <div class="mc-panel-header">
        <div class="mc-panel-title-row">
          <span class="mc-panel-icon">⚡</span>
          <h2 class="mc-panel-title">VITAL LIFE SUPPORT RESERVES</h2>
        </div>
        <div class="mc-panel-telemetry-badge">
          <span class="pulse-indicator"></span>
          <span>4 Systems Synchronized</span>
        </div>
      </div>

      <!-- 4 Big Animated Circular Gauges Grid -->
      <div class="mc-gauge-grid">
        ${RESOURCES_DATA.map(res => {
          const statusInfo = getResourceStatus(res.percentage);
          const circumference = 2 * Math.PI * 46; // Radius = 46, Circumference ~ 289
          return `
            <div class="mc-gauge-card state-${statusInfo.class}" data-resource-id="${res.id}" title="Click to inspect ${res.name}">
              <div class="mc-gauge-ring-wrap">
                <svg class="mc-gauge-svg" viewBox="0 0 110 110">
                  <!-- Background Track -->
                  <circle cx="55" cy="55" r="46" class="mc-gauge-track"/>
                  <!-- Glowing Foreground Progress Ring -->
                  <circle
                    cx="55" cy="55" r="46"
                    class="mc-gauge-bar bar-${res.id}"
                    id="gauge-ring-${res.id}"
                    stroke-dasharray="${circumference}"
                    stroke-dashoffset="0"
                  />
                </svg>

                <!-- Center Content: Icon & Smooth Number ONLY (Spacious & Clean) -->
                <div class="mc-gauge-center">
                  <span class="mc-gauge-icon">${res.icon}</span>
                  <span class="mc-gauge-val" id="gauge-val-${res.id}">100%</span>
                </div>
              </div>

              <!-- Title, State Tag & 1-Line Info Below the Ring -->
              <div class="mc-gauge-footer">
                <h3 class="mc-gauge-title">${res.name}</h3>
                <span class="mc-gauge-badge ${statusInfo.class}" id="gauge-badge-${res.id}">${statusInfo.label}</span>
                <span class="mc-gauge-subtext" id="gauge-sub-${res.id}">Full capacity reserves</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Click & hover interactions
    section.querySelectorAll('.mc-gauge-card').forEach(card => {
      card.addEventListener('mouseenter', () => orbitVoice.playChirp('hover'));
      card.addEventListener('click', (e) => {
        orbitVoice.playChirp('click');
        const id = e.currentTarget.getAttribute('data-resource-id');
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
          <div class="mc-modal-icon-wrap" id="res-modal-icon">💧</div>
          <div>
            <div class="mc-modal-status-row">
              <span class="res-status-badge status-excellent" id="res-modal-status">100% • EXCELLENT</span>
              <span class="res-pct-badge" id="res-modal-val">100%</span>
            </div>
            <h3 class="mc-modal-title" id="res-modal-name">Resource Name</h3>
          </div>
        </div>

        <div class="mc-modal-body">
          <div class="mc-modal-section">
            <h4 class="mc-section-heading">Kid-Friendly Science Fact</h4>
            <p class="mc-modal-text" id="res-modal-fact">Did you know? Moon ice under dark craters can make water and rocket fuel!</p>
          </div>

          <div class="mc-modal-section">
            <h4 class="mc-section-heading">How Our Moon Base Produces It</h4>
            <p class="mc-modal-text" id="res-modal-how">Autonomous life-support recycling.</p>
          </div>
        </div>

        <div class="mc-modal-footer">
          <button class="btn-mc btn-mc-primary mc-modal-dismiss-btn">Got it! ✓</button>
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
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.closeModal();
    });
  }

  update(resources) {
    if (!resources) return;
    this.currentResources = { ...resources };

    const circumference = 2 * Math.PI * 46;

    Object.keys(resources).forEach(key => {
      const targetVal = Math.round(resources[key] || 0);
      const card = this.element.querySelector(`.mc-gauge-card[data-resource-id="${key}"]`);
      const valEl = this.element.querySelector(`#gauge-val-${key}`);
      const ringEl = this.element.querySelector(`#gauge-ring-${key}`);
      const badgeEl = this.element.querySelector(`#gauge-badge-${key}`);
      const subEl = this.element.querySelector(`#gauge-sub-${key}`);

      if (!card || !valEl || !ringEl) return;

      // Animate stroke dashoffset
      const offset = circumference - (targetVal / 100) * circumference;
      ringEl.style.strokeDashoffset = `${offset}`;

      // Smooth number count animation
      this.animateCounter(key, valEl, targetVal);

      // Color coding & warning pulse
      card.classList.remove('state-excellent', 'state-good', 'state-warning', 'state-critical', 'state-pulsing');
      if (targetVal >= 70) {
        card.classList.add('state-excellent');
        if (badgeEl) { badgeEl.textContent = 'NOMINAL'; badgeEl.className = 'mc-gauge-badge status-excellent'; }
        if (subEl) subEl.textContent = 'Full capacity reserves';
      } else if (targetVal >= 40) {
        card.classList.add('state-good');
        if (badgeEl) { badgeEl.textContent = 'SUFFICIENT'; badgeEl.className = 'mc-gauge-badge status-good'; }
        if (subEl) subEl.textContent = 'Controlled consumption';
      } else if (targetVal >= 20) {
        card.classList.add('state-warning', 'state-pulsing');
        if (badgeEl) { badgeEl.textContent = 'LOW ⚠️'; badgeEl.className = 'mc-gauge-badge status-warning'; }
        if (subEl) subEl.textContent = 'Conserve usage!';
      } else {
        card.classList.add('state-critical', 'state-pulsing');
        if (badgeEl) { badgeEl.textContent = 'CRITICAL 🚨'; badgeEl.className = 'mc-gauge-badge status-critical'; }
        if (subEl) subEl.textContent = 'Emergency depletion danger!';
      }
    });
  }

  animateCounter(key, el, targetVal) {
    const current = this.displayedValues[key] ?? targetVal;
    if (current === targetVal) {
      el.textContent = `${targetVal}%`;
      return;
    }

    const step = targetVal > current ? 1 : -1;
    const interval = setInterval(() => {
      this.displayedValues[key] += step;
      el.textContent = `${this.displayedValues[key]}%`;
      if (this.displayedValues[key] === targetVal) {
        clearInterval(interval);
      }
    }, 25);
  }

  openModal(resourceId) {
    const data = RESOURCES_DATA.find(r => r.id === resourceId);
    if (!data) return;

    const currentVal = this.currentResources[resourceId] ?? data.percentage;

    this.modal.querySelector('#res-modal-icon').textContent = data.icon;
    this.modal.querySelector('#res-modal-name').textContent = data.name;
    this.modal.querySelector('#res-modal-val').textContent = `${currentVal}%`;

    const statusBadge = this.modal.querySelector('#res-modal-status');
    if (currentVal >= 70) {
      statusBadge.textContent = 'SAFE & STABLE';
      statusBadge.className = 'res-status-badge status-excellent';
    } else if (currentVal >= 40) {
      statusBadge.textContent = 'NORMAL';
      statusBadge.className = 'res-status-badge status-good';
    } else {
      statusBadge.textContent = 'LOW SUPPLY WARNING';
      statusBadge.className = 'res-status-badge status-critical';
    }

    this.modal.querySelector('#res-modal-fact').textContent = data.scienceFact || data.shortDesc;
    this.modal.querySelector('#res-modal-how').textContent = data.howItWorks || "Recycled continuously through closed-loop life-support systems on the base.";

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
