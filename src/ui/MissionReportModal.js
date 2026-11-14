/**
 * LUNA: Mission Survival - Final Mission Report Modal
 * Final comprehensive debrief after 7 simulated days with Rank, statistics, and restart option.
 */
export class MissionReportModal {
  constructor(options = {}) {
    this.options = options; // { onRestart: () => {} }
    this.element = this.createDOM();
    document.body.appendChild(this.element);
  }

  createDOM() {
    const overlay = document.createElement('div');
    overlay.className = 'survival-modal-overlay';
    overlay.id = 'modal-mission-report';

    overlay.innerHTML = `
      <div class="survival-modal-card" style="max-width: 820px;">
        <div class="survival-modal-header" style="background: linear-gradient(90deg, rgba(232,183,107,0.15) 0%, transparent 100%);">
          <div>
            <div class="survival-sol-badge" style="background:rgba(232,183,107,0.25); border-color:#E8B76B; color:#FFD166;">
              EXPEDITION COMPLETED • FINAL DEBRIEF
            </div>
            <h2 class="survival-modal-title" id="report-title">MISSION ACCOMPLISHED!</h2>
          </div>
          <div style="font-family:'Nunito',sans-serif; font-size:1.8rem; font-weight:900; color:#FFD166; padding:8px 16px; border:2px solid #FFD166; border-radius:12px;" id="report-grade">
            RANK A
          </div>
        </div>

        <div class="survival-modal-body">
          <div class="survival-situation-box" style="border-left-color: #06D6A0;" id="report-narrative">
            Summary narrative
          </div>

          <!-- Key Metrics Summary Row -->
          <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:12px;">
            <div style="background:rgba(0,0,0,0.3); border:1px solid rgba(0,229,255,0.3); border-radius:10px; padding:12px; text-align:center;">
              <span style="font-size:0.75rem; text-transform:uppercase; color:#8CA0BA;">Average Crew Health</span>
              <div style="font-size:1.5rem; font-weight:800; color:#06D6A0;" id="report-avg-health">95%</div>
            </div>
            <div style="background:rgba(0,0,0,0.3); border:1px solid rgba(0,229,255,0.3); border-radius:10px; padding:12px; text-align:center;">
              <span style="font-size:0.75rem; text-transform:uppercase; color:#8CA0BA;">Remaining Resources</span>
              <div style="font-size:1.5rem; font-weight:800; color:#00E5FF;" id="report-avg-resource">68%</div>
            </div>
            <div style="background:rgba(0,0,0,0.3); border:1px solid rgba(0,229,255,0.3); border-radius:10px; padding:12px; text-align:center;">
              <span style="font-size:0.75rem; text-transform:uppercase; color:#8CA0BA;">Facility Integrity</span>
              <div style="font-size:1.5rem; font-weight:800; color:#E8B76B;" id="report-avg-facility">92%</div>
            </div>
          </div>

          <!-- Final Crew Statuses -->
          <div>
            <h4 style="font-size:0.85rem; text-transform:uppercase; color:#00E5FF; margin:0 0 8px;">Final Astronaut Vitals</h4>
            <div id="report-crew-list" style="display:grid; grid-template-columns: repeat(2, 1fr); gap:8px;"></div>
          </div>

          <!-- Final Facility Statuses -->
          <div>
            <h4 style="font-size:0.85rem; text-transform:uppercase; color:#00E5FF; margin:0 0 8px;">Colony Facilities Condition</h4>
            <div id="report-facility-list" style="display:grid; grid-template-columns: repeat(3, 1fr); gap:8px;"></div>
          </div>

          <!-- NASA Contribution Note -->
          <div style="background:rgba(0,229,255,0.06); border:1px solid rgba(0,229,255,0.25); border-radius:8px; padding:12px; font-size:0.82rem; color:#A4D4FF;">
            <strong>🛰️ NASA Space Weather Integration:</strong> Day 3 Solar Particle Event utilized verified telemetry from the NASA Space Weather Database Of Notifications, Knowledge, Information (DONKI).
          </div>
        </div>

        <div class="survival-modal-footer">
          <button class="btn-survival-action btn-survival-secondary" id="btn-report-close">
            <span>Review Colony HUD</span>
          </button>
          <button class="btn-survival-action btn-survival-primary" id="btn-report-restart">
            <span>Start New Expedition 🔄</span>
          </button>
        </div>
      </div>
    `;

    overlay.querySelector('#btn-report-close').addEventListener('click', () => {
      this.close();
    });

    overlay.querySelector('#btn-report-restart').addEventListener('click', () => {
      if (confirm("Reset mission and start a brand new expedition at Sol 1?")) {
        this.close();
        if (this.options.onRestart) this.options.onRestart();
      }
    });

    return overlay;
  }

  show(report) {
    this.element.querySelector('#report-title').textContent = report.outcomeTitle;
    this.element.querySelector('#report-grade').textContent = report.grade;
    this.element.querySelector('#report-narrative').textContent = report.narrative;
    this.element.querySelector('#report-avg-health').textContent = `${report.stats.averageHealth}%`;
    this.element.querySelector('#report-avg-resource').textContent = `${report.stats.averageResource}%`;
    this.element.querySelector('#report-avg-facility').textContent = `${report.stats.averageFacility}%`;

    // Crew List
    const cList = this.element.querySelector('#report-crew-list');
    cList.innerHTML = report.crewSummary.map(c => `
      <div style="background:rgba(0,0,0,0.25); padding:8px 12px; border-radius:6px; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-weight:700; font-size:0.88rem; color:#FFFFFF;">${c.name}</div>
          <div style="font-size:0.75rem; color:#8CA0BA;">${c.role}</div>
        </div>
        <span class="delta-tag delta-positive">${c.health}% (${c.status})</span>
      </div>
    `).join('');

    // Facility List
    const fList = this.element.querySelector('#report-facility-list');
    fList.innerHTML = report.facilitySummary.map(f => `
      <div style="background:rgba(0,0,0,0.25); padding:8px 10px; border-radius:6px; text-align:center;">
        <div style="font-size:0.8rem; font-weight:700; color:#FFFFFF; margin-bottom:4px;">${f.name.split('(')[0]}</div>
        <div style="font-size:0.95rem; font-weight:800; color:#00E5FF;">${f.condition}%</div>
        <div style="font-size:0.72rem; color:#8CA0BA;">${f.status}</div>
      </div>
    `).join('');

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
