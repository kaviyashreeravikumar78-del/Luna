/**
 * LUNA: Mission Survival - Decision Result Modal ("Decision Applied")
 * Displays immediate consequence feedback showing resource, facility, and astronaut deltas.
 */
export class DecisionResultModal {
  constructor(options = {}) {
    this.options = options; // { onContinue: () => {} }
    this.element = this.createDOM();
    document.body.appendChild(this.element);
  }

  createDOM() {
    const overlay = document.createElement('div');
    overlay.className = 'survival-modal-overlay';
    overlay.id = 'modal-decision-result';

    overlay.innerHTML = `
      <div class="survival-modal-card" style="max-width: 680px;">
        <div class="survival-modal-header">
          <div>
            <div class="survival-sol-badge">DECISION APPLIED • SOL OUTCOME</div>
            <h2 class="survival-modal-title" id="result-modal-title">Operational Orders Executed</h2>
          </div>
        </div>

        <div class="survival-modal-body">
          <div class="survival-situation-box" style="border-left-color: #06D6A0;" id="result-modal-log">
            <!-- Narrative summary -->
          </div>

          <!-- Delta Changes Grid -->
          <div style="display:flex; flex-direction:column; gap:16px;">
            <div>
              <h4 style="font-size:0.85rem; text-transform:uppercase; color:#00E5FF; margin:0 0 8px; letter-spacing:0.5px;">Resource Impact</h4>
              <div id="result-resource-deltas" style="display:flex; flex-wrap:wrap; gap:8px;"></div>
            </div>

            <div>
              <h4 style="font-size:0.85rem; text-transform:uppercase; color:#00E5FF; margin:0 0 8px; letter-spacing:0.5px;">Facility Impact</h4>
              <div id="result-facility-deltas" style="display:flex; flex-direction:column; gap:6px;"></div>
            </div>

            <div>
              <h4 style="font-size:0.85rem; text-transform:uppercase; color:#00E5FF; margin:0 0 8px; letter-spacing:0.5px;">Astronaut Health Impact</h4>
              <div id="result-crew-deltas" style="display:flex; flex-direction:column; gap:6px;"></div>
            </div>
          </div>
        </div>

        <div class="survival-modal-footer" style="justify-content: flex-end;">
          <button class="btn-survival-action btn-survival-primary" id="btn-result-continue">
            <span>Continue Mission →</span>
          </button>
        </div>
      </div>
    `;

    overlay.querySelector('#btn-result-continue').addEventListener('click', () => {
      this.close();
      if (this.options.onContinue) this.options.onContinue();
    });

    return overlay;
  }

  show(resultSummary) {
    this.element.querySelector('#result-modal-title').textContent = `Orders Applied: ${resultSummary.tag}`;
    this.element.querySelector('#result-modal-log').textContent = resultSummary.logText;

    // 1. Resources
    const resBox = this.element.querySelector('#result-resource-deltas');
    if (resultSummary.resourceChanges && resultSummary.resourceChanges.length > 0) {
      resBox.innerHTML = resultSummary.resourceChanges.map(rc => {
        const cls = rc.delta > 0 ? 'delta-positive' : rc.delta < 0 ? 'delta-negative' : 'delta-neutral';
        const sign = rc.delta > 0 ? '+' : '';
        return `
          <span class="delta-tag ${cls}">
            ${rc.resource.toUpperCase()}: ${sign}${rc.delta}% (Now ${rc.next}%)
          </span>
        `;
      }).join('');
    } else {
      resBox.innerHTML = '<span class="delta-tag delta-neutral">No direct resource changes</span>';
    }

    // 2. Facilities
    const facBox = this.element.querySelector('#result-facility-deltas');
    if (resultSummary.facilityChanges && resultSummary.facilityChanges.length > 0) {
      facBox.innerHTML = resultSummary.facilityChanges.map(fc => {
        const cls = fc.delta > 0 ? 'delta-positive' : fc.delta < 0 ? 'delta-negative' : 'delta-neutral';
        const sign = fc.delta > 0 ? '+' : '';
        return `
          <div style="font-size:0.88rem; display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.25); padding:6px 12px; border-radius:6px;">
            <span>${fc.name}</span>
            <span class="delta-tag ${cls}">${sign}${fc.delta}% Integrity (${fc.status})</span>
          </div>
        `;
      }).join('');
    } else {
      facBox.innerHTML = '<span class="delta-tag delta-neutral">Facilities unaffected</span>';
    }

    // 3. Crew
    const crewBox = this.element.querySelector('#result-crew-deltas');
    if (resultSummary.crewChanges && resultSummary.crewChanges.length > 0) {
      crewBox.innerHTML = resultSummary.crewChanges.map(cc => {
        const cls = cc.delta > 0 ? 'delta-positive' : cc.delta < 0 ? 'delta-negative' : 'delta-neutral';
        const sign = cc.delta > 0 ? '+' : '';
        return `
          <div style="font-size:0.88rem; background:rgba(0,0,0,0.25); padding:8px 12px; border-radius:6px; display:flex; flex-direction:column; gap:2px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <strong>${cc.name}</strong>
              <span class="delta-tag ${cls}">${sign}${cc.delta}% Health (${cc.status})</span>
            </div>
            <span style="font-size:0.8rem; color:#A4B6CC;">Reason: ${cc.reason}</span>
          </div>
        `;
      }).join('');
    } else {
      crewBox.innerHTML = '<span class="delta-tag delta-neutral">All 4 astronauts safe (0 health change)</span>';
    }

    this.element.style.display = 'flex';
    requestAnimationFrame(() => this.element.classList.add('active'));
  }

  close() {
    this.element.classList.remove('active');
    setTimeout(() => {
      this.element.style.display = 'none';
    }, 300);
  }
}
