import { ResourceEngine } from '../simulation/ResourceEngine.js';

/**
 * LUNA: Mission Survival - Daily Summary & Sol Transition Modal
 * Provides daily debrief, resource burn estimates, and the "Advance to Next Sol" trigger.
 */
export class DailySummaryModal {
  constructor(options = {}) {
    this.options = options; // { onAdvanceSol: () => {} }
    this.element = this.createDOM();
    document.body.appendChild(this.element);
  }

  createDOM() {
    const overlay = document.createElement('div');
    overlay.className = 'survival-modal-overlay';
    overlay.id = 'modal-daily-summary';

    overlay.innerHTML = `
      <div class="survival-modal-card" style="max-width: 660px;">
        <div class="survival-modal-header">
          <div>
            <div class="survival-sol-badge" id="summary-sol-badge">SOL 1 COMPLETE</div>
            <h2 class="survival-modal-title" id="summary-modal-title">Daily Expedition Debrief</h2>
          </div>
        </div>

        <div class="survival-modal-body">
          <div class="survival-situation-box" style="border-left-color: #FFB703;">
            <p style="margin:0 0 6px;" id="summary-narrative-text">
              Sol orders successfully completed. All base telemetries have stabilized.
            </p>
            <span style="font-size:0.82rem; color:#A4B6CC;">
              Advancing to the next sol will deduct standard daily life-support burn (O2: -5%, H2O: -6%, Food: -5%, Power: -7%).
            </span>
          </div>

          <!-- Current Resources Snapshot -->
          <div>
            <h4 style="font-size:0.85rem; text-transform:uppercase; color:#00E5FF; margin:0 0 8px;">Colony Reserves Status</h4>
            <div class="mc-resource-grid" id="summary-resource-grid" style="display:grid; grid-template-columns: repeat(4, 1fr); gap:10px;">
              <!-- Populated dynamically -->
            </div>
          </div>

          <!-- Active Warnings Box -->
          <div id="summary-warnings-box" style="display:none; background:rgba(255,59,48,0.12); border:1px solid #FF3B30; border-radius:8px; padding:12px;">
            <div style="font-size:0.85rem; font-weight:800; color:#FF8080; margin-bottom:4px;">⚠️ ACTIVE BASE ALERTS</div>
            <div id="summary-warnings-list" style="font-size:0.84rem; color:#FFD1D1; display:flex; flex-direction:column; gap:4px;"></div>
          </div>
        </div>

        <div class="survival-modal-footer" style="justify-content: flex-end;">
          <button class="btn-survival-action btn-survival-primary" id="btn-advance-sol">
            <span>Advance to Sol 2 →</span>
          </button>
        </div>
      </div>
    `;

    overlay.querySelector('#btn-advance-sol').addEventListener('click', () => {
      this.close();
      if (this.options.onAdvanceSol) this.options.onAdvanceSol();
    });

    return overlay;
  }

  show(gameState) {
    const isDay7 = (gameState.currentDay >= 7);
    this.element.querySelector('#summary-sol-badge').textContent = `SOL ${gameState.currentDay} COMPLETE • DAILY DEBRIEF`;
    this.element.querySelector('#summary-modal-title').textContent = isDay7
      ? 'Seven-Day Expedition Completed! 🏆'
      : `Ready for Sol ${gameState.currentDay + 1}`;

    const btn = this.element.querySelector('#btn-advance-sol');
    btn.innerHTML = isDay7
      ? '<span>View Final Mission Report 🏆</span>'
      : `<span>Advance to Sol ${gameState.currentDay + 1} 🚀</span>`;

    // Render Resources
    const grid = this.element.querySelector('#summary-resource-grid');
    grid.innerHTML = ['oxygen', 'water', 'food', 'power'].map(k => {
      const val = gameState.resources[k] ?? 100;
      const tier = ResourceEngine.getTier(val);
      return `
        <div style="background:rgba(0,0,0,0.3); border:1px solid ${tier.color}; border-radius:8px; padding:10px; text-align:center;">
          <div style="font-size:0.75rem; text-transform:uppercase; color:#A4B6CC;">${k}</div>
          <div style="font-size:1.2rem; font-weight:800; color:${tier.color}; margin:4px 0;">${val}%</div>
          <div style="font-size:0.72rem; color:#CAD5E2;">${tier.label}</div>
        </div>
      `;
    }).join('');

    // Warnings
    const warnBox = this.element.querySelector('#summary-warnings-box');
    const warnList = this.element.querySelector('#summary-warnings-list');
    const warnings = gameState.warnings || [];
    if (warnings.length > 0) {
      warnBox.style.display = 'block';
      warnList.innerHTML = warnings.map(w => `<div>• ${w.message}</div>`).join('');
    } else {
      warnBox.style.display = 'none';
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
