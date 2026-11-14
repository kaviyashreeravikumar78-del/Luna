import { NASAAlertPanel } from './NASAAlertPanel.js';
import { orbitVoice } from '../audio/OrbitVoice.js';

/**
 * LUNA: Mission Survival - Survival Event Modal
 * Interactive daily crisis presentation with ORBIT voice narration and 3 decision pathways.
 */
export class SurvivalEventModal {
  constructor(options = {}) {
    this.options = options; // { onSelectDecision: (decisionId) => {} }
    this.selectedDecisionId = null;
    this.currentEvent = null;
    this.element = this.createDOM();
    document.body.appendChild(this.element);
  }

  createDOM() {
    const overlay = document.createElement('div');
    overlay.className = 'survival-modal-overlay';
    overlay.id = 'modal-survival-event';

    overlay.innerHTML = `
      <div class="survival-modal-card">
        <div class="survival-modal-header">
          <div>
            <div class="survival-sol-badge" id="event-sol-badge">SOL 1 OF 7 • COLONY EVENT</div>
            <h2 class="survival-modal-title" id="event-title">Event Title</h2>
          </div>
          <button class="btn-voice-toggle" id="event-voice-toggle" title="Toggle Robot Voice" style="align-self:center;">
            🔊 Voice ON
          </button>
        </div>

        <div class="survival-modal-body">
          <!-- Situation Text -->
          <div class="survival-situation-box" id="event-situation">
            Situation description goes here.
          </div>

          <!-- Dynamic NASA Space Weather Container (Active on Sol 3) -->
          <div id="event-nasa-slot" style="display:none;"></div>

          <!-- ORBIT Robot Advice -->
          <div class="survival-orbit-guidance">
            <div class="survival-orbit-avatar">🤖</div>
            <div class="survival-orbit-content">
              <div class="survival-orbit-name">ORBIT TACTICAL ADVICE</div>
              <p class="survival-orbit-text" id="event-orbit-text">ORBIT guidance goes here.</p>
            </div>
          </div>

          <!-- Decisions Section -->
          <div>
            <h3 class="survival-decisions-heading">SELECT COMMAND RESPONSE (CHOOSE 1):</h3>
            <div class="survival-decisions-list" id="event-decisions-list">
              <!-- Dynamically populated choices -->
            </div>
          </div>
        </div>

        <div class="survival-modal-footer">
          <span style="font-size:0.84rem; color:#8CA0BA;" id="event-status-hint">Please select a response option above</span>
          <button class="btn-survival-action btn-survival-primary" id="btn-submit-decision" disabled>
            <span>Confirm Orders & Apply →</span>
          </button>
        </div>
      </div>
    `;

    // Voice Toggle
    const vToggle = overlay.querySelector('#event-voice-toggle');
    const updateVIcon = () => {
      vToggle.textContent = orbitVoice.isMuted ? '🔇 Muted' : '🔊 Voice ON';
    };
    vToggle.addEventListener('click', () => {
      orbitVoice.toggleMute();
      updateVIcon();
    });
    updateVIcon();

    // Confirm button
    overlay.querySelector('#btn-submit-decision').addEventListener('click', () => {
      if (this.selectedDecisionId && this.options.onSelectDecision) {
        this.close();
        this.options.onSelectDecision(this.selectedDecisionId);
      }
    });

    return overlay;
  }

  async show(event, nasaTelemetry = null) {
    this.currentEvent = event;
    this.selectedDecisionId = null;

    const solBadge = this.element.querySelector('#event-sol-badge');
    solBadge.textContent = `SOL ${event.sol} OF 7 • MISSION EVENT (${event.severity.toUpperCase()})`;

    this.element.querySelector('#event-title').textContent = event.title;
    this.element.querySelector('#event-situation').textContent = event.situation;
    this.element.querySelector('#event-orbit-text').textContent = event.orbitDialogue;

    // NASA Telemetry Container (Sol 3)
    const nasaSlot = this.element.querySelector('#event-nasa-slot');
    if (event.isNasaEvent && nasaTelemetry) {
      nasaSlot.innerHTML = '';
      nasaSlot.appendChild(NASAAlertPanel.render(nasaTelemetry));
      nasaSlot.style.display = 'block';
    } else {
      nasaSlot.style.display = 'none';
      nasaSlot.innerHTML = '';
    }

    // Render Decisions
    const list = this.element.querySelector('#event-decisions-list');
    list.innerHTML = event.decisions.map(d => `
      <div class="survival-decision-card" data-decision-id="${d.id}">
        <div class="decision-card-top">
          <span class="decision-card-label">${d.label}</span>
          <span class="decision-card-tag">${d.tag}</span>
        </div>
        <p class="decision-card-summary">${d.summary}</p>
        <p class="decision-orbit-tip">🤖 ORBIT: "${d.orbitAdvice}"</p>
      </div>
    `).join('');

    const submitBtn = this.element.querySelector('#btn-submit-decision');
    const hint = this.element.querySelector('#event-status-hint');
    submitBtn.disabled = true;
    hint.textContent = 'Please choose one of the three command options above.';

    list.querySelectorAll('.survival-decision-card').forEach(card => {
      card.addEventListener('click', () => {
        list.querySelectorAll('.survival-decision-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.selectedDecisionId = card.getAttribute('data-decision-id');
        submitBtn.disabled = false;
        hint.textContent = 'Ready! Click Confirm Orders to apply consequences.';

        // Have ORBIT speak the selected choice tip
        const choice = event.decisions.find(d => d.id === this.selectedDecisionId);
        if (choice) {
          orbitVoice.speak(choice.orbitAdvice);
        }
      });
    });

    this.element.style.display = 'flex';
    requestAnimationFrame(() => this.element.classList.add('active'));

    // Speak the event introduction aloud
    orbitVoice.speak(`Commander! Sol ${event.sol} alert! ${event.orbitDialogue}`);
  }

  close() {
    this.element.classList.remove('active');
    setTimeout(() => {
      this.element.style.display = 'none';
    }, 300);
  }
}
