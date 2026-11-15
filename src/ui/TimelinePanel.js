import { TIMELINE_DATA } from '../data/timeline.js';
import { orbitVoice } from '../audio/OrbitVoice.js';

/**
 * LUNA: Mission Survival - Module 2 & 3: 7-Node Game Level Map Timeline
 * Visual 7-node game progression path:
 *  - Completed: Gold stars (⭐⭐⭐) & glowing route
 *  - Current: Pulsing orange node with PLAY indicator
 *  - Locked: Padlock (🔒) with frosted node
 */
export class TimelinePanel {
  constructor(options = {}) {
    this.options = options; // { onSelectDay }
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
          <span class="mc-panel-icon">🗺️</span>
          <h2 class="mc-panel-title">MISSION EXPEDITION MAP (7 SOLS)</h2>
        </div>
        <span class="mc-panel-hint">Tap any Sol node to inspect mission objectives</span>
      </div>

      <!-- 7-Node Visual Game Level Progression Track -->
      <div class="mc-level-map-container">
        <!-- Connecting Line / Path -->
        <div class="mc-level-track-rail">
          <div class="mc-level-track-progress" id="timeline-progress-bar" style="width: 14%;"></div>
        </div>

        <div class="mc-level-nodes-row" id="timeline-nodes-row">
          ${TIMELINE_DATA.map(day => {
            const isFirst = day.dayNumber === 1;
            return `
              <div class="mc-level-node ${isFirst ? 'node-active' : 'node-locked'}" data-day="${day.dayNumber}">
                <div class="mc-node-halo"></div>
                <div class="mc-node-disc">
                  <div class="mc-node-icon-box">
                    <span class="mc-node-symbol">${day.icon}</span>
                  </div>
                  <div class="mc-node-status-indicator">
                    <span class="mc-node-status-symbol">${isFirst ? '▶' : '🔒'}</span>
                  </div>
                </div>

                <div class="mc-node-stars" id="node-stars-${day.dayNumber}">
                  <!-- Dynamically populated stars -->
                </div>

                <div class="mc-node-label-box">
                  <span class="mc-node-sol">SOL ${day.dayNumber}</span>
                  <span class="mc-node-name">${day.title}</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    // Click & hover interactions
    section.querySelectorAll('.mc-level-node').forEach(node => {
      node.addEventListener('mouseenter', () => orbitVoice.playChirp('hover'));
      node.addEventListener('click', (e) => {
        orbitVoice.playChirp('click');
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
              <span class="day-number-tag" id="day-modal-num">SOL 1</span>
            </div>
            <h3 class="mc-modal-title" id="day-modal-title">Activity Title</h3>
          </div>
        </div>

        <div class="mc-modal-body">
          <div class="mc-modal-section">
            <h4 class="mc-section-heading">Mission Brief</h4>
            <p class="mc-modal-text" id="day-modal-desc">Description</p>
          </div>

          <div class="mc-modal-section">
            <h4 class="mc-section-heading">Core Objectives</h4>
            <ul class="crew-resp-list" id="day-modal-objectives">
              <!-- Dynamically populated -->
            </ul>
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

  update(currentDay, currentDayDecided) {
    this.currentDay = currentDay || 1;
    this.currentDayDecided = currentDayDecided || false;

    // Update progress bar width across 7 nodes
    const progressBar = this.element.querySelector('#timeline-progress-bar');
    if (progressBar) {
      const pct = Math.min(100, Math.max(14, ((this.currentDay - 1) / 6) * 100));
      progressBar.style.width = `${pct}%`;
    }

    this.element.querySelectorAll('.mc-level-node').forEach(node => {
      const dayNum = parseInt(node.getAttribute('data-day'), 10);
      const symbolEl = node.querySelector('.mc-node-status-symbol');
      const starsBox = node.querySelector(`#node-stars-${dayNum}`);

      node.classList.remove('node-completed', 'node-active', 'node-locked');

      if (dayNum < this.currentDay) {
        node.classList.add('node-completed');
        if (symbolEl) symbolEl.textContent = '★';
        if (starsBox) {
          starsBox.innerHTML = `
            <span class="mc-star filled">⭐</span>
            <span class="mc-star filled">⭐</span>
            <span class="mc-star filled">⭐</span>
          `;
        }
      } else if (dayNum === this.currentDay) {
        node.classList.add('node-active');
        if (symbolEl) symbolEl.textContent = this.currentDayDecided ? '✓' : '▶';
        if (starsBox) {
          starsBox.innerHTML = `<span class="mc-node-current-tag">ACTIVE</span>`;
        }
      } else {
        node.classList.add('node-locked');
        if (symbolEl) symbolEl.textContent = '🔒';
        if (starsBox) {
          starsBox.innerHTML = `<span class="mc-star locked">☆</span>`;
        }
      }
    });
  }

  openModal(dayNumber) {
    const data = TIMELINE_DATA.find(d => d.dayNumber === dayNumber);
    if (!data) return;

    this.modal.querySelector('#day-modal-icon').textContent = data.icon;
    this.modal.querySelector('#day-modal-num').textContent = `SOL ${data.dayNumber}`;
    this.modal.querySelector('#day-modal-title').textContent = data.title;
    this.modal.querySelector('#day-modal-desc').textContent = data.shortDesc;

    const statusBadge = this.modal.querySelector('#day-modal-status');
    if (dayNumber < this.currentDay) {
      statusBadge.textContent = 'SOL COMPLETED ⭐⭐⭐';
      statusBadge.className = 'res-status-badge status-excellent';
    } else if (dayNumber === this.currentDay) {
      statusBadge.textContent = `CURRENT SOL (${this.currentDayDecided ? 'ORDERS EXECUTED' : 'READY TO PLAY'})`;
      statusBadge.className = 'res-status-badge status-warning';
    } else {
      statusBadge.textContent = 'LOCKED SOL 🔒';
      statusBadge.className = 'res-status-badge status-critical';
    }

    const objContainer = this.modal.querySelector('#day-modal-objectives');
    objContainer.innerHTML = (data.objectives || []).slice(0, 3).map(o => `<li>${o}</li>`).join('');

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
