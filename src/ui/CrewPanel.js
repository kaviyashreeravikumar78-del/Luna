import { CREW_DATA } from '../data/crew.js';

/**
 * LUNA: Mission Survival - Module 2 & 3: Animated Crew Monitoring & ECG Oscilloscope
 * Features live animated real-time ECG cardiac oscilloscope waveforms for all 4 astronauts,
 * biometric telemetry meters, and interactive medical detail modal.
 */
export class CrewPanel {
  constructor() {
    this.currentCrew = {};
    this.ecgAnimId = null;
    this.ecgData = {};
    this.element = this.createDOM();
    this.createModal();
    this.initECGAnimation();
  }

  createDOM() {
    const section = document.createElement('section');
    section.className = 'mc-panel mc-crew-panel';
    section.id = 'mc-section-crew';

    section.innerHTML = `
      <div class="mc-panel-header">
        <div class="mc-panel-title-row">
          <span class="mc-panel-icon">👩‍🚀</span>
          <h2 class="mc-panel-title">EXPEDITION CREW BIOMETRICS & DOSSIERS (4/4)</h2>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <span class="pulse-indicator"></span>
          <span class="mc-panel-hint">Live Biometric ECG Waveforms Active • Click any card for dossier</span>
        </div>
      </div>

      <div class="mc-crew-grid">
        ${CREW_DATA.map(crew => {
          const bpm = crew.id === 'marcus' ? 72 : crew.id === 'elena' ? 68 : crew.id === 'chen' ? 74 : 70;
          return `
            <div class="crew-profile-card" data-crew-id="${crew.id}">
              <div class="crew-card-top">
                <div class="crew-avatar-ring" style="border-color: ${crew.avatarColor}">
                  <span class="crew-avatar-initial">${crew.avatarInitial}</span>
                  <div class="crew-holo-scan-bar"></div>
                </div>
                <div class="crew-name-box">
                  <h3 class="crew-card-name">${crew.name}</h3>
                  <span class="crew-card-role">${crew.role}</span>
                </div>
                <span class="crew-health-pill" id="crew-health-pill-${crew.id}">100% HEALTH</span>
              </div>

              <!-- Live Animated ECG Oscilloscope Waveform -->
              <div class="crew-ecg-container">
                <div class="crew-ecg-header">
                  <span class="crew-ecg-heart" id="crew-ecg-bpm-${crew.id}">♥ ${bpm} BPM</span>
                  <span class="crew-ecg-stats" id="crew-ecg-vitals-${crew.id}">O₂ 99% • 36.8°C</span>
                </div>
                <canvas class="crew-ecg-canvas" id="ecg-canvas-${crew.id}" width="280" height="48"></canvas>
              </div>

              <div class="crew-health-bar-track">
                <div class="crew-health-bar-fill" id="crew-health-bar-${crew.id}" style="width: 100%; background: ${crew.avatarColor}"></div>
              </div>

              <div class="crew-activity-box">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <span class="crew-activity-label">STATUS CONDITION:</span>
                  <span class="crew-live-dot">● LIVE</span>
                </div>
                <p class="crew-activity-text" id="crew-cond-text-${crew.id}">Nominal vital signs</p>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    section.querySelectorAll('.crew-profile-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-crew-id');
        this.openModal(id);
      });
    });

    return section;
  }

  initECGAnimation() {
    // Setup state for each astronaut's ECG trace
    CREW_DATA.forEach(crew => {
      this.ecgData[crew.id] = {
        x: 0,
        bpm: crew.id === 'marcus' ? 72 : crew.id === 'elena' ? 68 : crew.id === 'chen' ? 74 : 70,
        color: crew.avatarColor || '#00E5FF',
        points: new Array(280).fill(24),
        phase: Math.random() * 100
      };
    });

    const draw = () => {
      this.ecgAnimId = requestAnimationFrame(draw);

      CREW_DATA.forEach(crew => {
        const canvas = this.element.querySelector(`#ecg-canvas-${crew.id}`);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const data = this.ecgData[crew.id];

        const w = canvas.width;
        const h = canvas.height;
        const baseline = h / 2;

        // Advance sweep
        data.phase += 1;
        const beatInterval = Math.round(3600 / data.bpm); // Frames per beat cycle
        const cyclePos = data.phase % beatInterval;

        let y = baseline;
        if (cyclePos >= 10 && cyclePos < 16) {
          // P-wave (small bump)
          y = baseline - Math.sin((cyclePos - 10) / 6 * Math.PI) * 4;
        } else if (cyclePos >= 18 && cyclePos < 20) {
          // Q-wave (small dip)
          y = baseline + 3;
        } else if (cyclePos >= 20 && cyclePos < 24) {
          // R-spike (giant sharp heart contraction spike)
          y = baseline - 20;
        } else if (cyclePos >= 24 && cyclePos < 27) {
          // S-wave (sharp dip)
          y = baseline + 8;
        } else if (cyclePos >= 34 && cyclePos < 44) {
          // T-wave (medium rounded bump)
          y = baseline - Math.sin((cyclePos - 34) / 10 * Math.PI) * 6;
        } else {
          // Resting baseline with tiny biological noise
          y = baseline + (Math.random() - 0.5) * 1.2;
        }

        data.points[data.x] = y;

        // Render CRT-style oscilloscope display
        ctx.fillStyle = 'rgba(6, 16, 30, 0.22)';
        ctx.fillRect(0, 0, w, h);

        // Draw faint medical grid
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let gx = 0; gx < w; gx += 20) { ctx.moveTo(gx, 0); ctx.lineTo(gx, h); }
        for (let gy = 0; gy < h; gy += 12) { ctx.moveTo(0, gy); ctx.lineTo(w, gy); }
        ctx.stroke();

        // Draw ECG waveform trace
        ctx.lineWidth = 2.0;
        ctx.strokeStyle = data.color;
        ctx.shadowColor = data.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();

        for (let i = 0; i < w; i++) {
          if (i === 0) {
            ctx.moveTo(i, data.points[i]);
          } else {
            ctx.lineTo(i, data.points[i]);
          }
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Draw sweeping blip
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = '#FFFFFF';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(data.x, y, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Advance sweep cursor
        data.x = (data.x + 2) % w;
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
          <div class="crew-avatar-ring modal-avatar" id="crew-modal-avatar">
            <span class="crew-avatar-initial" id="crew-modal-initial">E</span>
          </div>
          <div>
            <div class="mc-modal-status-row">
              <span class="res-status-badge status-excellent" id="crew-modal-health">100% Health</span>
              <span class="crew-station-tag" id="crew-modal-station">Station: HAB-01</span>
            </div>
            <h3 class="mc-modal-title" id="crew-modal-name">Astronaut Name</h3>
            <span class="mc-modal-subtitle" id="crew-modal-role">Role</span>
          </div>
        </div>

        <div class="mc-modal-body">
          <div class="mc-modal-section">
            <h4 class="mc-section-heading">Current Medical Condition & Log</h4>
            <p class="mc-modal-text" id="crew-modal-reason" style="color:#00E5FF; font-weight:600;">Nominal</p>
          </div>

          <div class="mc-modal-section">
            <h4 class="mc-section-heading">Live Biometric Telemetry</h4>
            <div class="mc-metrics-grid" id="crew-modal-vitals">
              <!-- Dynamically populated -->
            </div>
          </div>

          <div class="mc-modal-section">
            <h4 class="mc-section-heading">Astronaut Profile & Background</h4>
            <p class="mc-modal-text" id="crew-modal-bio">Bio</p>
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

  openModal(crewId) {
    const data = CREW_DATA.find(c => c.id === crewId);
    if (!data) return;

    const liveState = this.currentCrew[crewId] || {};
    const health = liveState.health !== undefined ? liveState.health : 100;
    const condition = liveState.condition || 'Nominal vital signs';

    const avatarRing = this.modal.querySelector('#crew-modal-avatar');
    avatarRing.style.borderColor = data.avatarColor;
    this.modal.querySelector('#crew-modal-initial').textContent = data.avatarInitial;
    this.modal.querySelector('#crew-modal-name').textContent = data.name;
    this.modal.querySelector('#crew-modal-role').textContent = data.role;
    this.modal.querySelector('#crew-modal-station').textContent = `Station: ${data.assignedStation}`;

    const healthBadge = this.modal.querySelector('#crew-modal-health');
    healthBadge.textContent = `${health}% Health`;
    healthBadge.className = 'res-status-badge ' + (health > 80 ? 'status-excellent' : health > 50 ? 'status-warning' : 'status-critical');

    this.modal.querySelector('#crew-modal-reason').textContent = condition;
    this.modal.querySelector('#crew-modal-bio').textContent = data.bio;

    const vitalsWrap = this.modal.querySelector('#crew-modal-vitals');
    vitalsWrap.innerHTML = `
      <div class="mc-metric-item">
        <span class="mc-metric-label">Heart Rate (ECG)</span>
        <span class="mc-metric-value" style="color:#06D6A0">♥ ${this.ecgData[crewId]?.bpm || 72} BPM</span>
      </div>
      <div class="mc-metric-item">
        <span class="mc-metric-label">Suit O₂ Saturation</span>
        <span class="mc-metric-value" style="color:#00E5FF">99.2% SpO₂</span>
      </div>
      <div class="mc-metric-item">
        <span class="mc-metric-label">Core Temperature</span>
        <span class="mc-metric-value" style="color:#FFB703">36.8°C</span>
      </div>
      <div class="mc-metric-item">
        <span class="mc-metric-label">Radiation Exposure</span>
        <span class="mc-metric-value" style="color:#A7C98D">0.08 mSv/day (Safe)</span>
      </div>
    `;

    this.modal.style.display = 'flex';
  }

  closeModal() {
    this.modal.style.display = 'none';
  }

  update(crewState) {
    if (!crewState) return;
    this.currentCrew = crewState;

    Object.keys(crewState).forEach(id => {
      const live = crewState[id];
      if (!live) return;

      const healthPill = this.element.querySelector(`#crew-health-pill-${id}`);
      const healthBar = this.element.querySelector(`#crew-health-bar-${id}`);
      const condText = this.element.querySelector(`#crew-cond-text-${id}`);
      const bpmText = this.element.querySelector(`#crew-ecg-bpm-${id}`);

      if (healthPill) {
        healthPill.textContent = `${live.health}% HEALTH`;
        healthPill.style.background = live.health > 80 ? 'rgba(6,214,160,0.2)' : live.health > 50 ? 'rgba(255,183,3,0.2)' : 'rgba(255,59,48,0.25)';
        healthPill.style.color = live.health > 80 ? '#06D6A0' : live.health > 50 ? '#FFB703' : '#FF3B30';
      }

      if (healthBar) {
        healthBar.style.width = `${live.health}%`;
        healthBar.style.background = live.health > 80 ? '#06D6A0' : live.health > 50 ? '#FFB703' : '#FF3B30';
      }

      if (condText && live.condition) {
        condText.textContent = live.condition;
      }

      // If health drops, ECG bpm increases and changes color!
      if (this.ecgData[id]) {
        if (live.health < 60) {
          this.ecgData[id].bpm = 108;
          this.ecgData[id].color = '#FF3B30';
          if (bpmText) bpmText.textContent = `♥ 108 BPM (HIGH)`;
        } else if (live.health < 80) {
          this.ecgData[id].bpm = 88;
          this.ecgData[id].color = '#FFB703';
          if (bpmText) bpmText.textContent = `♥ 88 BPM`;
        } else {
          this.ecgData[id].bpm = id === 'marcus' ? 72 : id === 'elena' ? 68 : id === 'chen' ? 74 : 70;
          this.ecgData[id].color = CREW_DATA.find(c => c.id === id)?.avatarColor || '#00E5FF';
          if (bpmText) bpmText.textContent = `♥ ${this.ecgData[id].bpm} BPM`;
        }
      }
    });
  }

  destroy() {
    if (this.ecgAnimId) cancelAnimationFrame(this.ecgAnimId);
  }
}
