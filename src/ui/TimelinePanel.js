import { TIMELINE_DATA } from '../data/timeline.js';

/**
 * LUNA: Mission Survival - Module 2 & 3: Seven-Day Mission Progression Timeline
 * Dynamically highlights completed, active, and upcoming Sols based on GameState.
 */
export class TimelinePanel {
  constructor() {
    this.currentDay = 1;
    this.currentDayDecided = false;
    this.element = this.createDOM();
    this.createModal();
  }

  createDOM() {
    const section = document.createElement('section');
    section.className = 'mc-panel mc-timeline-panel';
    section.id = 'mc-section-timeline';

    section.innerHTML = `
      <div class="mc-panel-header">
        <div class="mc-panel-title-row">
          <span class="mc-panel-icon">🗓️</span>
          <h2 class="mc-panel-title">SEVEN-DAY MISSION PROGRESSION TIMELINE</h2>
        </div>
        <span class="mc-panel-hint">Click any day to view planned mission activities</span>
      </div>

      <div class="mc-timeline-track">
        ${TIMELINE_DATA.map(day => {
          const isActive = (day.dayNumber === 1);
          return `
            <div class="timeline-day-card ${isActive ? 'day-active' : 'day-locked'}" data-day="${day.dayNumber}">
              <div class="day-card-badge-row">
                <span class="day-number-tag">DAY ${day.dayNumber}</span>
                <span class="day-state-tag ${isActive ? 'state-active' : 'state-locked'}">
                  ${isActive ? '● CURRENT SOL' : '🔒 LOCKED'}
                </span>
              </div>

              <div class="day-card-icon">${day.icon}</div>
              <h3 class="day-card-title">${day.title}</h3>
              <p class="day-card-desc">${day.shortDesc}</p>

              <div class="day-card-footer">
                <span class="day-action-hint">${isActive ? 'Active Now' : 'Upcoming'}</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    section.querySelectorAll('.timeline-day-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const dayNum = parseInt(e.currentTarget.getAttribute('data-day'), 10);
        this.openModal(dayNum);
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
          <div class="mc-modal-icon-wrap" id="day-modal-icon">🚀</div>
          <div>
            <div class="mc-modal-status-row">
              <span class="res-status-badge status-excellent" id="day-modal-status">ACTIVE SOL 1</span>
              <span class="day-number-tag" id="day-modal-num">DAY 1</span>
            </div>
            <h3 class="mc-modal-title" id="day-modal-title">Activity Title</h3>
          </div>
        </div>

        <div class="mc-modal-body">
          <div class="mc-modal-section">
            <h4 class="mc-section-heading">Day Overview</h4>
            <p class="mc-modal-text" id="day-modal-desc">Description</p>
          </div>

          <div class="mc-modal-section">
            <h4 class="mc-section-heading">Planned Mission Objectives</h4>
            <ul class="crew-resp-list" id="day-modal-objectives">
              <!-- Dynamically populated -->
            </ul>
          </div>

          <div class="mc-modal-section">
            <div class="day-notice-box" id="day-modal-notice">
              Notice
            </div>
          </div>
        </div>

        <div class="mc-modal-footer">
          <button class="btn-mc btn-mc-primary mc-modal-dismiss-btn">Dismiss Briefing</button>
        </div>
      </div>
    `;

    document.body.appendChild(this.modal);

    this.modal.querySelector('.mc-modal-close').addEventListener('click', () => this.closeModal());
    this.modal.querySelector('.mc-modal-dismiss-btn').addEventListener('click', () => this.closeModal());
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.closeModal();
    });
  }

  update(currentDay, currentDayDecided) {
    this.currentDay = currentDay || 1;
    this.currentDayDecided = currentDayDecided || false;

    this.element.querySelectorAll('.timeline-day-card').forEach(card => {
      const dayNum = parseInt(card.getAttribute('data-day'), 10);
      const stateBadge = card.querySelector('.day-state-tag');
      const hint = card.querySelector('.day-action-hint');

      card.classList.remove('day-completed', 'day-active', 'day-locked');

      if (dayNum < this.currentDay) {
        card.classList.add('day-completed');
        if (stateBadge) {
          stateBadge.textContent = '✅ COMPLETED';
          stateBadge.className = 'day-state-tag state-active';
        }
        if (hint) hint.textContent = 'Survived';
      } else if (dayNum === this.currentDay) {
        card.classList.add('day-active');
        if (stateBadge) {
          stateBadge.textContent = this.currentDayDecided ? '✅ ORDERS APPLIED' : '🚨 EVENT PENDING';
          stateBadge.className = 'day-state-tag state-active';
        }
        if (hint) hint.textContent = this.currentDayDecided ? 'Ready to advance' : 'Decision required';
      } else {
        card.classList.add('day-locked');
        if (stateBadge) {
          stateBadge.textContent = '🔒 UPCOMING';
          stateBadge.className = 'day-state-tag state-locked';
        }
        if (hint) hint.textContent = 'Locked';
      }
    });
  }

  openModal(dayNumber) {
    const data = TIMELINE_DATA.find(d => d.dayNumber === dayNumber);
    if (!data) return;

    this.modal.querySelector('#day-modal-icon').textContent = data.icon;
    this.modal.querySelector('#day-modal-num').textContent = `SOL ${data.dayNumber}`;
    this.modal.querySelector('#day-modal-title').textContent = data.title;
    this.modal.querySelector('#day-modal-desc').textContent = data.fullDesc;

    const statusBadge = this.modal.querySelector('#day-modal-status');
    if (dayNumber < this.currentDay) {
      statusBadge.textContent = 'SOL COMPLETED';
      statusBadge.className = 'res-status-badge status-excellent';
    } else if (dayNumber === this.currentDay) {
      statusBadge.textContent = `CURRENT SOL (${this.currentDayDecided ? 'DECIDED' : 'PENDING'})`;
      statusBadge.className = 'res-status-badge status-warning';
    } else {
      statusBadge.textContent = 'UPCOMING SOL';
      statusBadge.className = 'res-status-badge status-critical';
    }

    const objContainer = this.modal.querySelector('#day-modal-objectives');
    objContainer.innerHTML = data.objectives.map(o => `<li>${o}</li>`).join('');

    this.modal.querySelector('#day-modal-notice').innerHTML = `
      <strong>Expedition Note:</strong> ${data.shortDesc}
    `;

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
