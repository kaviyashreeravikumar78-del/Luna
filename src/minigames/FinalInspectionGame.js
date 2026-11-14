import { orbitVoice } from '../audio/OrbitVoice.js';

/**
 * LUNA: Mission Survival - Sol 7: Final Inspection & Grand Celebration Finale
 * Interactive inspection checklist with golden approval stamps and final victory ceremony.
 */
export class FinalInspectionGame {
  constructor(options = {}) {
    this.options = options; // { onComplete: () => {} }
    this.element = this.createDOM();
    document.body.appendChild(this.element);

    this.inspected = [false, false, false, false, false];
  }

  createDOM() {
    const overlay = document.createElement('div');
    overlay.className = 'minigame-overlay';
    overlay.id = 'minigame-final-inspection';

    overlay.innerHTML = `
      <div class="minigame-window" style="max-width: 780px;">
        <div class="minigame-header">
          <div class="minigame-title-group">
            <span class="minigame-icon">🏆🌕</span>
            <div>
              <h2 class="minigame-title">Final Colony Inspection! (Sol 7)</h2>
              <span class="minigame-subtitle">Stamp each station's checklist to launch the grand mission celebration!</span>
            </div>
          </div>
          <button class="btn-minigame-close" aria-label="Close">✕</button>
        </div>

        <div class="minigame-board">
          <div style="font-size:1.05rem; font-weight:800; color:#FFD166; text-align:center;" id="inspect-instruction">
            👉 Tap each of the 5 base stations to give your Commander's Golden Stamp!
          </div>

          <!-- 5 Station Checklist Cards -->
          <div style="display:grid; grid-template-columns: repeat(5, 1fr); gap:12px; width:100%;" id="inspect-stations-grid">
            <div class="inspect-card" data-idx="0" style="background:rgba(0,0,0,0.3); border:2px solid #00E5FF; border-radius:14px; padding:12px; text-align:center; cursor:pointer; transition:all 0.2s;">
              <div style="font-size:2.2rem; margin-bottom:4px;">🏠</div>
              <div style="font-size:0.82rem; font-weight:800; color:#FFFFFF;">Main Habitat</div>
              <div class="stamp-slot" style="font-size:0.75rem; font-weight:900; color:#8CA0BA; margin-top:8px;">[ TAP STAMP ]</div>
            </div>

            <div class="inspect-card" data-idx="1" style="background:rgba(0,0,0,0.3); border:2px solid #FFB703; border-radius:14px; padding:12px; text-align:center; cursor:pointer; transition:all 0.2s;">
              <div style="font-size:2.2rem; margin-bottom:4px;">⚡</div>
              <div style="font-size:0.82rem; font-weight:800; color:#FFFFFF;">Solar Farm</div>
              <div class="stamp-slot" style="font-size:0.75rem; font-weight:900; color:#8CA0BA; margin-top:8px;">[ TAP STAMP ]</div>
            </div>

            <div class="inspect-card" data-idx="2" style="background:rgba(0,0,0,0.3); border:2px solid #06D6A0; border-radius:14px; padding:12px; text-align:center; cursor:pointer; transition:all 0.2s;">
              <div style="font-size:2.2rem; margin-bottom:4px;">🌱</div>
              <div style="font-size:0.82rem; font-weight:800; color:#FFFFFF;">Greenhouse</div>
              <div class="stamp-slot" style="font-size:0.75rem; font-weight:900; color:#8CA0BA; margin-top:8px;">[ TAP STAMP ]</div>
            </div>

            <div class="inspect-card" data-idx="3" style="background:rgba(0,0,0,0.3); border:2px solid #3A86FF; border-radius:14px; padding:12px; text-align:center; cursor:pointer; transition:all 0.2s;">
              <div style="font-size:2.2rem; margin-bottom:4px;">🔬</div>
              <div style="font-size:0.82rem; font-weight:800; color:#FFFFFF;">Science Lab</div>
              <div class="stamp-slot" style="font-size:0.75rem; font-weight:900; color:#8CA0BA; margin-top:8px;">[ TAP STAMP ]</div>
            </div>

            <div class="inspect-card" data-idx="4" style="background:rgba(0,0,0,0.3); border:2px solid #E8B76B; border-radius:14px; padding:12px; text-align:center; cursor:pointer; transition:all 0.2s;">
              <div style="font-size:2.2rem; margin-bottom:4px;">📡</div>
              <div style="font-size:0.82rem; font-weight:800; color:#FFFFFF;">Radio Dish</div>
              <div class="stamp-slot" style="font-size:0.75rem; font-weight:900; color:#8CA0BA; margin-top:8px;">[ TAP STAMP ]</div>
            </div>
          </div>

          <!-- Grand Finale Victory Banner -->
          <div id="final-celebrate-box" style="display:none; width:100%;" class="celebrate-banner">
            <span style="font-size:3.5rem;">🏆🌟👨‍🚀🎉</span>
            <h3 class="celebrate-title" style="font-size:2rem;">SEVEN DAYS SURVIVED ON THE MOON!</h3>
            <p class="celebrate-text" style="font-size:1.1rem; line-height:1.5;">
              Outstanding leadership, Commander! You kept all four astronauts safe, warm, and happy!
              Outpost LUNA-01 is a triumph for humanity!
            </p>
            <div style="font-size:1.8rem; margin-top:8px;">
              ⭐⭐⭐⭐⭐⭐⭐ (7 / 7 Stars Earned!)
            </div>
          </div>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div style="display:flex; align-items:center; gap:10px;">
            <span style="font-size:1.8rem;">🤖</span>
            <span style="font-size:0.9rem; font-weight:700; color:#E2EAF4;">ORBIT: "You are the best Moon Commander ever!"</span>
          </div>
          <button class="btn-game-action" id="btn-final-complete" style="display:none;">
            <span>Celebrate in 3D Colony 🚀</span>
          </button>
        </div>
      </div>
    `;

    overlay.querySelector('.btn-minigame-close').addEventListener('click', () => this.close());
    overlay.querySelector('#btn-final-complete').addEventListener('click', () => {
      this.close();
      if (this.options.onComplete) this.options.onComplete();
    });

    this.setupInspection(overlay);
    return overlay;
  }

  setupInspection(overlay) {
    const cards = overlay.querySelectorAll('.inspect-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        const idx = parseInt(card.dataset.idx, 10);
        if (this.inspected[idx]) return;

        this.inspected[idx] = true;
        card.style.background = 'rgba(6,214,160,0.2)';
        card.style.borderColor = '#06D6A0';
        card.querySelector('.stamp-slot').innerHTML = '<span style="color:#06D6A0; font-weight:900;">⭐ PASSED!</span>';

        const count = this.inspected.filter(Boolean).length;
        if (count === 5) {
          overlay.querySelector('#inspect-instruction').textContent = '🎉 All stations approved! Ready for the celebration!';
          overlay.querySelector('#final-celebrate-box').style.display = 'flex';
          overlay.querySelector('#btn-final-complete').style.display = 'inline-flex';
          orbitVoice.speak("You did it, Commander! All seven days on the Moon completed! You are an amazing space explorer!");
        } else {
          overlay.querySelector('#inspect-instruction').textContent = `👉 Great! ${count}/5 stations approved! Tap the remaining stations!`;
        }
      });
    });
  }

  show() {
    this.inspected = [false, false, false, false, false];
    this.element.querySelectorAll('.inspect-card').forEach(card => {
      card.style.background = 'rgba(0,0,0,0.3)';
      card.style.borderColor = '#00E5FF';
      card.querySelector('.stamp-slot').textContent = '[ TAP STAMP ]';
      card.querySelector('.stamp-slot').style.color = '#8CA0BA';
    });

    this.element.querySelector('#final-celebrate-box').style.display = 'none';
    this.element.querySelector('#btn-final-complete').style.display = 'none';
    this.element.querySelector('#inspect-instruction').textContent = '👉 Tap each of the 5 base stations to give your Commander\'s Golden Stamp!';

    this.element.style.display = 'flex';
    requestAnimationFrame(() => this.element.classList.add('active'));
    orbitVoice.speak("Commander! Sol 7 final check! Stamp each base station to complete our 7-day adventure!");
  }

  close() {
    this.element.classList.remove('active');
    setTimeout(() => {
      this.element.style.display = 'none';
    }, 250);
  }
}
