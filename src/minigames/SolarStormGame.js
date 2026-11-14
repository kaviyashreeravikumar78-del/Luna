import { orbitVoice } from '../audio/OrbitVoice.js';
import { donkiService } from '../nasa/DonkiService.js';

/**
 * LUNA: Mission Survival - Sol 3: NASA Solar Storm Shelter Mini-Game
 * Real NASA DONKI SEP alert with a child-friendly astronaut shelter and blast-shield action game.
 */
export class SolarStormGame {
  constructor(options = {}) {
    this.options = options; // { onComplete: () => {} }
    this.element = this.createDOM();
    document.body.appendChild(this.element);

    this.stepsCompleted = {
      crewCalled: [false, false, false],
      shieldLowered: false,
      doorLocked: false,
    };
  }

  createDOM() {
    const overlay = document.createElement('div');
    overlay.className = 'minigame-overlay';
    overlay.id = 'minigame-solar-storm';

    overlay.innerHTML = `
      <div class="minigame-window">
        <div class="minigame-header">
          <div class="minigame-title-group">
            <span class="minigame-icon">☀️🚨</span>
            <div>
              <h2 class="minigame-title">NASA Solar Storm Shelter!</h2>
              <span class="minigame-subtitle">Protect our 4 astronauts from the high-energy solar particle event</span>
            </div>
          </div>
          <button class="btn-minigame-close" aria-label="Close">✕</button>
        </div>

        <div class="minigame-board">
          <!-- Child-Friendly NASA Information Card -->
          <div style="background:rgba(14,28,54,0.9); border:2px solid #00E5FF; border-radius:14px; padding:12px 18px; width:100%; display:flex; justify-content:space-between; align-items:center; gap:12px;">
            <div style="display:flex; align-items:center; gap:10px;">
              <span style="font-size:1.8rem;">🛰️</span>
              <div>
                <div style="font-size:0.8rem; font-weight:900; color:#00E5FF; text-transform:uppercase;">NASA DONKI Space Weather Alert</div>
                <div style="font-size:0.92rem; font-weight:700; color:#FFFFFF;" id="nasa-storm-event-id">Event: Solar Energetic Particle (SEP) detected</div>
              </div>
            </div>
            <a href="https://ccmc.gsfc.nasa.gov/DONKI/" target="_blank" rel="noopener noreferrer" style="color:#00E5FF; font-size:0.8rem; text-decoration:none; padding:4px 10px; border:1px solid #00E5FF; border-radius:8px;">
              NASA DONKI Portal ↗
            </a>
          </div>

          <div style="font-size:0.95rem; color:#D6ECFF; text-align:center;">
            The Sun sent a burst of high-speed space particles! Complete all 3 emergency tasks to protect the base!
          </div>

          <!-- 3 Protection Action Zones -->
          <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:16px; width:100%;">
            <!-- Task 1: Call Astronauts Inside -->
            <div style="background:rgba(0,0,0,0.3); border:2px solid #00E5FF; border-radius:14px; padding:14px; text-align:center; display:flex; flex-direction:column; gap:8px;">
              <div style="font-size:0.85rem; font-weight:800; color:#00E5FF;">1. CALL CREW INSIDE</div>
              <div style="display:flex; justify-content:center; gap:6px;">
                <button class="btn-crew-call" data-idx="0" style="padding:8px 12px; font-size:1.4rem; border-radius:10px; border:2px solid #3A86FF; background:rgba(58,134,255,0.2); cursor:pointer;">👨‍🚀</button>
                <button class="btn-crew-call" data-idx="1" style="padding:8px 12px; font-size:1.4rem; border-radius:10px; border:2px solid #68B255; background:rgba(104,178,85,0.2); cursor:pointer;">👩‍🔬</button>
                <button class="btn-crew-call" data-idx="2" style="padding:8px 12px; font-size:1.4rem; border-radius:10px; border:2px solid #E8B76B; background:rgba(232,183,107,0.2); cursor:pointer;">👩‍🚀</button>
              </div>
              <span id="crew-shelter-status" style="font-size:0.8rem; color:#A4B6CC; font-weight:700;">Tap all 3 to bring inside</span>
            </div>

            <!-- Task 2: Pull Radiation Blast Shield Lever -->
            <div style="background:rgba(0,0,0,0.3); border:2px solid #FFB703; border-radius:14px; padding:14px; text-align:center; display:flex; flex-direction:column; justify-content:space-between; gap:8px;">
              <div style="font-size:0.85rem; font-weight:800; color:#FFB703;">2. LOWER SHIELD</div>
              <button id="btn-pull-lever" style="background:#FFB703; color:#06101E; font-size:1.1rem; font-weight:900; padding:10px; border-radius:12px; border:none; cursor:pointer; box-shadow:0 4px 14px rgba(255,183,3,0.4);">
                🕹️ PULL LEVER!
              </button>
              <span id="shield-lever-status" style="font-size:0.8rem; color:#A4B6CC; font-weight:700;">Shield Raised (Up)</span>
            </div>

            <!-- Task 3: Spin Airlock Door Lock Wheel -->
            <div style="background:rgba(0,0,0,0.3); border:2px solid #FF3B30; border-radius:14px; padding:14px; text-align:center; display:flex; flex-direction:column; justify-content:space-between; gap:8px;">
              <div style="font-size:0.85rem; font-weight:800; color:#FF3B30;">3. LOCK AIRLOCK</div>
              <button id="btn-spin-wheel" style="background:#FF3B30; color:#FFFFFF; font-size:1.1rem; font-weight:900; padding:10px; border-radius:12px; border:none; cursor:pointer; box-shadow:0 4px 14px rgba(255,59,48,0.4);">
                🎡 SPIN LOCK!
              </button>
              <span id="airlock-lock-status" style="font-size:0.8rem; color:#A4B6CC; font-weight:700;">Airlock Unlocked</span>
            </div>
          </div>

          <div id="storm-celebrate-box" style="display:none;" class="celebrate-banner">
            <span style="font-size:2.5rem;">🛡️🌟🛡️</span>
            <h3 class="celebrate-title">100% SHIELDED & SAFE!</h3>
            <p class="celebrate-text">All astronauts sheltered inside HAB-01! The solar storm passed safely overhead!</p>
          </div>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div style="display:flex; align-items:center; gap:10px;">
            <span style="font-size:1.8rem;">🤖</span>
            <span style="font-size:0.9rem; font-weight:700; color:#E2EAF4;">ORBIT: "Quick, Commander! Let's get everyone to safety!"</span>
          </div>
          <button class="btn-game-action" id="btn-storm-complete" style="display:none;">
            <span>Earn Mission Star ⭐ & Continue</span>
          </button>
        </div>
      </div>
    `;

    overlay.querySelector('.btn-minigame-close').addEventListener('click', () => this.close());
    overlay.querySelector('#btn-storm-complete').addEventListener('click', () => {
      this.close();
      if (this.options.onComplete) this.options.onComplete();
    });

    this.setupActions(overlay);
    return overlay;
  }

  setupActions(overlay) {
    // 1. Crew Call Buttons
    const crewBtns = overlay.querySelectorAll('.btn-crew-call');
    crewBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx, 10);
        this.stepsCompleted.crewCalled[idx] = true;
        btn.style.background = '#06D6A0';
        btn.style.borderColor = '#06D6A0';
        btn.textContent = '✅';
        btn.disabled = true;

        const count = this.stepsCompleted.crewCalled.filter(Boolean).length;
        overlay.querySelector('#crew-shelter-status').textContent = (count === 3)
          ? '✅ All 3 astronauts inside!'
          : `${count} / 3 astronauts safe`;

        this.checkAllTasks(overlay);
      });
    });

    // 2. Shield Lever
    const leverBtn = overlay.querySelector('#btn-pull-lever');
    leverBtn.addEventListener('click', () => {
      this.stepsCompleted.shieldLowered = true;
      leverBtn.textContent = '✅ SHIELD LOCKED!';
      leverBtn.style.background = '#06D6A0';
      leverBtn.disabled = true;
      overlay.querySelector('#shield-lever-status').textContent = '✅ Heavy Shield Deployed!';
      this.checkAllTasks(overlay);
    });

    // 3. Airlock Lock Wheel
    const wheelBtn = overlay.querySelector('#btn-spin-wheel');
    wheelBtn.addEventListener('click', () => {
      this.stepsCompleted.doorLocked = true;
      wheelBtn.textContent = '✅ AIRLOCK SEALED!';
      wheelBtn.style.background = '#06D6A0';
      wheelBtn.disabled = true;
      overlay.querySelector('#airlock-lock-status').textContent = '✅ Airtight Seal Active!';
      this.checkAllTasks(overlay);
    });
  }

  checkAllTasks(overlay) {
    const allCrew = this.stepsCompleted.crewCalled.every(Boolean);
    const shield = this.stepsCompleted.shieldLowered;
    const lock = this.stepsCompleted.doorLocked;

    if (allCrew && shield && lock) {
      overlay.querySelector('#storm-celebrate-box').style.display = 'flex';
      overlay.querySelector('#btn-storm-complete').style.display = 'inline-flex';
      orbitVoice.speak("Hurrah! All astronauts are safe inside the bunker! Great job protecting our crew, Commander!");
    }
  }

  async show() {
    this.stepsCompleted = {
      crewCalled: [false, false, false],
      shieldLowered: false,
      doorLocked: false,
    };

    // Reset UI
    this.element.querySelectorAll('.btn-crew-call').forEach(b => {
      b.style.background = 'rgba(58,134,255,0.2)';
      b.style.borderColor = '#3A86FF';
      b.textContent = '👨‍🚀';
      b.disabled = false;
    });

    const leverBtn = this.element.querySelector('#btn-pull-lever');
    leverBtn.textContent = '🕹️ PULL LEVER!';
    leverBtn.style.background = '#FFB703';
    leverBtn.disabled = false;

    const wheelBtn = this.element.querySelector('#btn-spin-wheel');
    wheelBtn.textContent = '🎡 SPIN LOCK!';
    wheelBtn.style.background = '#FF3B30';
    wheelBtn.disabled = false;

    this.element.querySelector('#crew-shelter-status').textContent = 'Tap all 3 to bring inside';
    this.element.querySelector('#shield-lever-status').textContent = 'Shield Raised (Up)';
    this.element.querySelector('#airlock-lock-status').textContent = 'Airlock Unlocked';
    this.element.querySelector('#storm-celebrate-box').style.display = 'none';
    this.element.querySelector('#btn-storm-complete').style.display = 'none';

    // Fetch real NASA telemetry
    try {
      const data = await donkiService.fetchSepEvent();
      this.element.querySelector('#nasa-storm-event-id').textContent = `NASA Record: ${data.eventId} (${data.eventTime})`;
    } catch (e) {
      this.element.querySelector('#nasa-storm-event-id').textContent = 'NASA Record: SEP-2024-05-11 (Solar Cycle 25)';
    }

    this.element.style.display = 'flex';
    requestAnimationFrame(() => this.element.classList.add('active'));
    orbitVoice.speak("Commander! NASA space weather warning! Call the crew inside, lower the blast shield, and seal the door!");
  }

  close() {
    this.element.classList.remove('active');
    setTimeout(() => {
      this.element.style.display = 'none';
    }, 250);
  }
}
