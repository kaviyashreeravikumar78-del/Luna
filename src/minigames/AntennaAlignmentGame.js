import { orbitVoice } from '../audio/OrbitVoice.js';

/**
 * LUNA: Mission Survival - Sol 6: Space Radio Dish Alignment Mini-Game
 * A signal tracking game where children steer the antenna beam to lock onto Earth.
 */
export class AntennaAlignmentGame {
  constructor(options = {}) {
    this.options = options; // { onComplete: () => {} }
    this.element = this.createDOM();
    document.body.appendChild(this.element);

    this.currentAngle = 45; // degrees
    this.targetAngle = 180; // target is South/Earth
    this.isLocked = false;
  }

  createDOM() {
    const overlay = document.createElement('div');
    overlay.className = 'minigame-overlay';
    overlay.id = 'minigame-antenna-align';

    overlay.innerHTML = `
      <div class="minigame-window">
        <div class="minigame-header">
          <div class="minigame-title-group">
            <span class="minigame-icon">📡🌍</span>
            <div>
              <h2 class="minigame-title">Align the Space Radio Dish!</h2>
              <span class="minigame-subtitle">Rotate the dish beam to lock onto planet Earth</span>
            </div>
          </div>
          <button class="btn-minigame-close" aria-label="Close">✕</button>
        </div>

        <div class="minigame-board">
          <div style="font-size:1.05rem; font-weight:800; color:#E8B76B; text-align:center;" id="antenna-instruction">
            👉 Tap the ◀ and ▶ buttons to rotate the radar beam toward Earth!
          </div>

          <!-- Circular Radar Display -->
          <div style="width:260px; height:260px; border-radius:50%; background:radial-gradient(circle, #0A1E36 0%, #040A14 100%); border:3px solid #00E5FF; position:relative; display:flex; align-items:center; justify-content:center; box-shadow:0 0 30px rgba(0,229,255,0.25);">
            <!-- Concentric Range Rings -->
            <div style="width:190px; height:190px; border-radius:50%; border:1px dashed rgba(0,229,255,0.3); position:absolute;"></div>
            <div style="width:110px; height:110px; border-radius:50%; border:1px dashed rgba(0,229,255,0.3); position:absolute;"></div>

            <!-- Outpost LUNA-01 at Center -->
            <div style="width:20px; height:20px; border-radius:50%; background:#FFB703; position:absolute; z-index:5; box-shadow:0 0 10px #FFB703;"></div>

            <!-- Earth Target Marker (Fixed at Bottom/180 deg) -->
            <div style="position:absolute; bottom:20px; left:112px; font-size:2rem; z-index:4; animation:floatEarth 3s infinite alternate;">
              🌍
            </div>

            <!-- Rotating Radar Dish Beam -->
            <div id="radar-beam" style="width:6px; height:120px; background:linear-gradient(0deg, #00E5FF 0%, transparent 100%); position:absolute; top:10px; left:127px; transform-origin:bottom center; transform:rotate(45deg); transition:transform 0.15s ease;">
              <div style="width:18px; height:18px; border-radius:50%; background:#00E5FF; position:absolute; top:-6px; left:-6px; box-shadow:0 0 14px #00E5FF;"></div>
            </div>
          </div>

          <!-- Signal Strength Meter -->
          <div style="width:100%; max-width:340px; display:flex; flex-direction:column; gap:6px;">
            <div style="display:flex; justify-content:space-between; font-size:0.88rem; font-weight:800;">
              <span style="color:#8CA0BA;">EARTH SIGNAL LINK:</span>
              <span id="signal-pct-text" style="color:#FF3B30;">15% (Weak)</span>
            </div>
            <div style="width:100%; height:14px; background:rgba(255,255,255,0.15); border-radius:8px; overflow:hidden;">
              <div id="signal-meter-fill" style="width:15%; height:100%; background:#FF3B30; border-radius:8px; transition:width 0.2s, background 0.2s;"></div>
            </div>
          </div>

          <!-- Steer Controls -->
          <div style="display:flex; gap:20px; align-items:center;">
            <button class="btn-game-action" id="btn-steer-left" style="padding:12px 28px; font-size:1.4rem;">
              ◀ Rotate Left
            </button>
            <button class="btn-game-action" id="btn-steer-right" style="padding:12px 28px; font-size:1.4rem;">
              Rotate Right ▶
            </button>
          </div>

          <div id="antenna-celebrate-box" style="display:none;" class="celebrate-banner">
            <span style="font-size:2.5rem;">🎉📡🌍</span>
            <h3 class="celebrate-title">5-BAR SIGNAL LOCKED!</h3>
            <p class="celebrate-text">Incoming message from Earth: "LUNA-01, we hear you loud and clear! Congratulations on Sol 6!"</p>
          </div>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div style="display:flex; align-items:center; gap:10px;">
            <span style="font-size:1.8rem;">🤖</span>
            <span style="font-size:0.9rem; font-weight:700; color:#E2EAF4;">ORBIT: "Rotate the dish until the beam points straight at planet Earth!"</span>
          </div>
          <button class="btn-game-action" id="btn-antenna-complete" style="display:none;">
            <span>Earn Mission Star ⭐ & Continue</span>
          </button>
        </div>
      </div>
    `;

    overlay.querySelector('.btn-minigame-close').addEventListener('click', () => this.close());
    overlay.querySelector('#btn-antenna-complete').addEventListener('click', () => {
      this.close();
      if (this.options.onComplete) this.options.onComplete();
    });

    this.setupSteering(overlay);
    return overlay;
  }

  setupSteering(overlay) {
    const beam = overlay.querySelector('#radar-beam');
    const leftBtn = overlay.querySelector('#btn-steer-left');
    const rightBtn = overlay.querySelector('#btn-steer-right');

    const updateSignal = () => {
      beam.style.transform = `rotate(${this.currentAngle}deg)`;

      // Angular distance to Earth target (180 deg)
      const diff = Math.abs(this.currentAngle - this.targetAngle);
      let strength = Math.max(10, Math.round(100 - diff * 0.9));

      const pctEl = overlay.querySelector('#signal-pct-text');
      const fillEl = overlay.querySelector('#signal-meter-fill');

      fillEl.style.width = `${strength}%`;

      if (diff <= 8) {
        // Full Lock!
        strength = 100;
        this.isLocked = true;
        pctEl.textContent = '100% LOCKED! 📶';
        pctEl.style.color = '#00FF88';
        fillEl.style.background = '#00FF88';
        fillEl.style.width = '100%';
        beam.style.background = 'linear-gradient(0deg, #00FF88 0%, transparent 100%)';

        leftBtn.disabled = true;
        rightBtn.disabled = true;

        overlay.querySelector('#antenna-instruction').textContent = '🎉 Signal lock established with Earth!';
        overlay.querySelector('#antenna-celebrate-box').style.display = 'flex';
        overlay.querySelector('#btn-antenna-complete').style.display = 'inline-flex';
        orbitVoice.speak("Earth signal locked! Hear that chime? Earth Mission Control says they hear us loud and clear!");
      } else if (strength >= 60) {
        pctEl.textContent = `${strength}% (Getting Stronger!)`;
        pctEl.style.color = '#FFB703';
        fillEl.style.background = '#FFB703';
      } else {
        pctEl.textContent = `${strength}% (Weak Signal)`;
        pctEl.style.color = '#FF3B30';
        fillEl.style.background = '#FF3B30';
      }
    };

    leftBtn.addEventListener('click', () => {
      if (this.isLocked) return;
      this.currentAngle = (this.currentAngle - 18 + 360) % 360;
      updateSignal();
    });

    rightBtn.addEventListener('click', () => {
      if (this.isLocked) return;
      this.currentAngle = (this.currentAngle + 18) % 360;
      updateSignal();
    });
  }

  show() {
    this.currentAngle = 45;
    this.isLocked = false;

    const beam = this.element.querySelector('#radar-beam');
    beam.style.transform = 'rotate(45deg)';
    beam.style.background = 'linear-gradient(0deg, #00E5FF 0%, transparent 100%)';

    this.element.querySelector('#btn-steer-left').disabled = false;
    this.element.querySelector('#btn-steer-right').disabled = false;
    this.element.querySelector('#signal-pct-text').textContent = '15% (Weak)';
    this.element.querySelector('#signal-pct-text').style.color = '#FF3B30';
    this.element.querySelector('#signal-meter-fill').style.width = '15%';
    this.element.querySelector('#signal-meter-fill').style.background = '#FF3B30';
    this.element.querySelector('#antenna-celebrate-box').style.display = 'none';
    this.element.querySelector('#btn-antenna-complete').style.display = 'none';
    this.element.querySelector('#antenna-instruction').textContent = '👉 Tap the ◀ and ▶ buttons to rotate the radar beam toward Earth!';

    this.element.style.display = 'flex';
    requestAnimationFrame(() => this.element.classList.add('active'));
    orbitVoice.speak("Commander! Point our Space Radio Dish at planet Earth so we can make video calls!");
  }

  close() {
    this.element.classList.remove('active');
    setTimeout(() => {
      this.element.style.display = 'none';
    }, 250);
  }
}
