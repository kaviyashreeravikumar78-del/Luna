import { orbitVoice } from '../audio/OrbitVoice.js';

const CREW_BIOS = {
  evelyn: {
    id: 'evelyn',
    name: 'Dr. Evelyn Vance',
    role: 'Mission Commander',
    roleIcon: '👩‍🚀',
    avatarEmoji: '👩‍🚀',
    avatarColor: '#D95736',
    fact: "Dr. Evelyn has logged over 450 spacewalk hours! She keeps everyone working safely together.",
    specialty: "Flight Command & Base Safety"
  },
  marcus: {
    id: 'marcus',
    name: 'Marcus Diaz',
    role: 'Chief Engineer',
    roleIcon: '👨‍🔧',
    avatarEmoji: '👨‍🔧',
    avatarColor: '#3A86FF',
    fact: "Marcus designed our lunar solar array tracking joints and repairs any broken rover parts!",
    specialty: "Robotics & Power Systems"
  },
  aris: {
    id: 'aris',
    name: 'Dr. Aris Thorne',
    role: 'Astrobiologist',
    roleIcon: '🌱',
    avatarEmoji: '🌱',
    avatarColor: '#06D6A0',
    fact: "Dr. Aris grows fresh salad greens in our bio-dome to give the crew fresh food and crisp oxygen!",
    specialty: "Plant Science & Oxygen Cycle"
  },
  maya: {
    id: 'maya',
    name: 'Maya Lin',
    role: 'Comms Specialist',
    roleIcon: '📡',
    avatarEmoji: '📡',
    avatarColor: '#FFD166',
    fact: "Maya beams messages across 384,000 km so we can chat with Earth in just 1.3 seconds!",
    specialty: "Deep Space Radio & Telemetry"
  }
};

/**
 * LUNA: Mission Survival - Module 2 & 3: Crew Character Cards
 * 4 character cards with avatars, role badges, animated ECG heartbeat lines,
 * and tap-for-fact popups (max 2 short lines).
 */
export class CrewPanel {
  constructor() {
    this.currentCrew = {};
    this.element = this.createDOM();
    this.createModal();
  }

  createDOM() {
    const section = document.createElement('section');
    section.className = 'mc-panel mc-crew-panel';
    section.id = 'mc-section-crew';

    section.innerHTML = `
      <div class="mc-panel-header">
        <div class="mc-panel-title-row">
          <span class="mc-panel-icon">👩‍🚀</span>
          <h2 class="mc-panel-title">EXPEDITION ASTRONAUT CREW (4)</h2>
        </div>
        <span class="mc-panel-hint">Tap any astronaut to view their mission dossier</span>
      </div>

      <!-- 4 Character Cards Grid -->
      <div class="mc-crew-cards-grid">
        ${Object.keys(CREW_BIOS).map(key => {
          const c = CREW_BIOS[key];
          return `
            <div class="mc-crew-char-card" data-crew-id="${c.id}" title="Inspect ${c.name}">
              <div class="mc-char-avatar-box" style="border-color: ${c.avatarColor}">
                <span class="mc-char-emoji">${c.avatarEmoji}</span>
                <span class="mc-char-status-dot healthy" id="crew-dot-${c.id}"></span>
              </div>

              <div class="mc-char-info">
                <div class="mc-char-name-row">
                  <h3 class="mc-char-name">${c.name}</h3>
                  <span class="mc-char-role-badge" style="background: ${c.avatarColor}20; color:${c.avatarColor}; border-color:${c.avatarColor}40">
                    ${c.roleIcon} ${c.role}
                  </span>
                </div>

                <!-- Animated Heartbeat / ECG Line -->
                <div class="mc-char-heartbeat-box">
                  <svg class="mc-char-ecg-svg" viewBox="0 0 160 28">
                    <path class="mc-ecg-trace" d="M 0 14 L 30 14 L 35 14 L 40 4 L 45 24 L 50 10 L 55 18 L 60 14 L 160 14" stroke="${c.avatarColor}"/>
                  </svg>
                  <span class="mc-char-bpm" id="crew-bpm-${c.id}">♥ 72 BPM</span>
                </div>

                <!-- Health Bar & Pct -->
                <div class="mc-char-health-row">
                  <div class="mc-char-bar-track">
                    <div class="mc-char-bar-fill" id="crew-bar-${c.id}" style="width: 100%; background: ${c.avatarColor}"></div>
                  </div>
                  <span class="mc-char-hp-val" id="crew-val-${c.id}">100%</span>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Click & hover interactions
    section.querySelectorAll('.mc-crew-char-card').forEach(card => {
      card.addEventListener('mouseenter', () => orbitVoice.playChirp('hover'));
      card.addEventListener('click', (e) => {
        orbitVoice.playChirp('click');
        const id = e.currentTarget.getAttribute('data-crew-id');
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
      <div class="mc-modal-card mc-crew-modal-card">
        <button class="mc-modal-close" aria-label="Close">✕</button>
        <div class="mc-modal-header">
          <div class="mc-modal-icon-wrap" id="crew-modal-avatar">👩‍🚀</div>
          <div>
            <div class="mc-modal-status-row">
              <span class="res-status-badge status-excellent" id="crew-modal-status">100% HEALTHY</span>
              <span class="day-number-tag" id="crew-modal-role">Commander</span>
            </div>
            <h3 class="mc-modal-title" id="crew-modal-name">Astronaut Name</h3>
          </div>
        </div>

        <div class="mc-modal-body">
          <div class="mc-modal-section">
            <h4 class="mc-section-heading">Astronaut Fun Fact</h4>
            <p class="mc-modal-text" id="crew-modal-fact" style="font-size: 1.05rem; font-weight: 600; color: #F8FAFC;">Fact</p>
          </div>

          <div class="mc-modal-section">
            <h4 class="mc-section-heading">Moon Base Specialty</h4>
            <p class="mc-modal-text" id="crew-modal-specialty">Specialty</p>
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

  update(crew) {
    if (!crew) return;
    this.currentCrew = { ...crew };

    const keys = ['evelyn', 'marcus', 'aris', 'maya'];
    keys.forEach(key => {
      const data = crew[key] || (key === 'aris' ? crew['chen'] : null);
      if (!data) return;

      const health = Math.max(0, Math.min(100, Math.round(data.health || 0)));
      const barEl = this.element.querySelector(`#crew-bar-${key}`);
      const valEl = this.element.querySelector(`#crew-val-${key}`);
      const dotEl = this.element.querySelector(`#crew-dot-${key}`);
      const bpmEl = this.element.querySelector(`#crew-bpm-${key}`);

      if (barEl) barEl.style.width = `${health}%`;
      if (valEl) valEl.textContent = `${health}%`;

      if (dotEl) {
        dotEl.className = 'mc-char-status-dot';
        if (health >= 70) {
          dotEl.classList.add('healthy');
          if (bpmEl) bpmEl.textContent = '♥ 72 BPM';
        } else if (health >= 40) {
          dotEl.classList.add('warning');
          if (bpmEl) bpmEl.textContent = '♥ 88 BPM';
        } else {
          dotEl.classList.add('critical');
          if (bpmEl) bpmEl.textContent = '♥ 105 BPM ⚠️';
        }
      }
    });
  }

  openModal(crewId) {
    const bio = CREW_BIOS[crewId];
    if (!bio) return;

    const data = this.currentCrew[crewId] || (crewId === 'aris' ? this.currentCrew['chen'] : null);
    const health = data ? data.health : 100;

    this.modal.querySelector('#crew-modal-avatar').textContent = bio.avatarEmoji;
    this.modal.querySelector('#crew-modal-name').textContent = bio.name;
    this.modal.querySelector('#crew-modal-role').textContent = bio.role;
    this.modal.querySelector('#crew-modal-fact').textContent = bio.fact;
    this.modal.querySelector('#crew-modal-specialty').textContent = bio.specialty;

    const statusBadge = this.modal.querySelector('#crew-modal-status');
    if (health >= 70) {
      statusBadge.textContent = `${health}% • HEALTHY & HAPPY`;
      statusBadge.className = 'res-status-badge status-excellent';
    } else if (health >= 40) {
      statusBadge.textContent = `${health}% • FATIGUED`;
      statusBadge.className = 'res-status-badge status-warning';
    } else {
      statusBadge.textContent = `${health}% • NEEDS MEDICAL AID`;
      statusBadge.className = 'res-status-badge status-critical';
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
