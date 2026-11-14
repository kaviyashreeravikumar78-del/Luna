import { orbitVoice } from '../audio/OrbitVoice.js';

/**
 * LUNA: Mission Survival - Sol 1: Solar Power Cable Connect Mini-Game
 * A visual, colorful circuit connection game where children tap matching energy nodes.
 */
export class SolarPowerGame {
  constructor(options = {}) {
    this.options = options; // { onComplete: () => {} }
    this.element = this.createDOM();
    document.body.appendChild(this.element);

    this.selectedNode = null;
    this.connectedPairs = new Set();
  }

  createDOM() {
    const overlay = document.createElement('div');
    overlay.className = 'minigame-overlay';
    overlay.id = 'minigame-solar-power';

    overlay.innerHTML = `
      <div class="minigame-window">
        <div class="minigame-header">
          <div class="minigame-title-group">
            <span class="minigame-icon">⚡</span>
            <div>
              <h2 class="minigame-title">Power Up the Colony!</h2>
              <span class="minigame-subtitle">Tap matching colored energy plugs to complete the circuit</span>
            </div>
          </div>
          <button class="btn-minigame-close" aria-label="Close">✕</button>
        </div>

        <div class="minigame-board">
          <div style="font-size:1.05rem; font-weight:800; color:#FFD166; text-align:center;" id="solar-game-instruction">
            👉 Tap a plug on the left, then tap its matching color on the right!
          </div>

          <div class="cables-puzzle-container">
            <!-- Left Plugs (Solar Panels) -->
            <div class="cable-nodes-col" id="solar-left-nodes">
              <button class="cable-node-btn" data-color="red" style="background:#FF3B30;">🔴</button>
              <button class="cable-node-btn" data-color="blue" style="background:#0099FF;">🔵</button>
              <button class="cable-node-btn" data-color="yellow" style="background:#FFB703;">🟡</button>
              <button class="cable-node-btn" data-color="green" style="background:#06D6A0;">🟢</button>
            </div>

            <!-- Central Power Converter -->
            <div style="display:flex; flex-direction:column; align-items:center; gap:8px;">
              <div style="font-size:3.5rem;">🔋</div>
              <div style="font-size:1.1rem; font-weight:900; color:#00E5FF;" id="solar-voltage-counter">0 / 4 CABLES</div>
              <div style="width:140px; height:12px; background:rgba(255,255,255,0.15); border-radius:8px; overflow:hidden;">
                <div id="solar-progress-fill" style="width:0%; height:100%; background:#00E5FF; border-radius:8px; transition:width 0.3s ease;"></div>
              </div>
            </div>

            <!-- Right Plugs (Colony Battery Bank) -->
            <div class="cable-nodes-col" id="solar-right-nodes">
              <button class="cable-node-btn" data-color="blue" style="background:#0099FF;">🔵</button>
              <button class="cable-node-btn" data-color="red" style="background:#FF3B30;">🔴</button>
              <button class="cable-node-btn" data-color="green" style="background:#06D6A0;">🟢</button>
              <button class="cable-node-btn" data-color="yellow" style="background:#FFB703;">🟡</button>
            </div>
          </div>

          <div id="solar-celebrate-box" style="display:none;" class="celebrate-banner">
            <span style="font-size:2.5rem;">🌟⚡🌟</span>
            <h3 class="celebrate-title">POWER ACTIVATED!</h3>
            <p class="celebrate-text">Clean electric power is now flowing to all colony buildings! +15% Power Earned!</p>
          </div>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div style="display:flex; align-items:center; gap:10px;">
            <span style="font-size:1.8rem;">🤖</span>
            <span style="font-size:0.9rem; font-weight:700; color:#E2EAF4;">ORBIT: "Let's connect all 4 power cables!"</span>
          </div>
          <button class="btn-game-action" id="btn-solar-complete" style="display:none;">
            <span>Earn Mission Star ⭐ & Continue</span>
          </button>
        </div>
      </div>
    `;

    overlay.querySelector('.btn-minigame-close').addEventListener('click', () => this.close());
    overlay.querySelector('#btn-solar-complete').addEventListener('click', () => {
      this.close();
      if (this.options.onComplete) this.options.onComplete();
    });

    this.setupPuzzleInteractions(overlay);
    return overlay;
  }

  setupPuzzleInteractions(overlay) {
    const leftBtns = overlay.querySelectorAll('#solar-left-nodes .cable-node-btn');
    const rightBtns = overlay.querySelectorAll('#solar-right-nodes .cable-node-btn');

    leftBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.classList.contains('connected')) return;
        leftBtns.forEach(b => b.style.outline = 'none');
        btn.style.outline = '4px solid #FFFFFF';
        this.selectedNode = { side: 'left', color: btn.dataset.color, el: btn };
      });
    });

    rightBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.classList.contains('connected')) return;

        if (this.selectedNode && this.selectedNode.side === 'left') {
          if (this.selectedNode.color === btn.dataset.color) {
            // Correct match!
            this.selectedNode.el.classList.add('connected');
            btn.classList.add('connected');
            this.selectedNode.el.style.outline = 'none';
            this.connectedPairs.add(btn.dataset.color);

            this.selectedNode = null;
            this.updateProgress(overlay);
          } else {
            // Wrong color match - gentle shake
            btn.animate([{ transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }], { duration: 250 });
          }
        }
      });
    });
  }

  updateProgress(overlay) {
    const count = this.connectedPairs.size;
    const counter = overlay.querySelector('#solar-voltage-counter');
    const bar = overlay.querySelector('#solar-progress-fill');
    const inst = overlay.querySelector('#solar-game-instruction');

    counter.textContent = `${count} / 4 CABLES CONNECTED!`;
    bar.style.width = `${(count / 4) * 100}%`;

    if (count < 4) {
      inst.textContent = `Great! Connect ${4 - count} more matching plugs!`;
    } else {
      // Completed!
      inst.textContent = '🎉 All cables locked! Power circuit complete!';
      overlay.querySelector('#solar-celebrate-box').style.display = 'flex';
      overlay.querySelector('#btn-solar-complete').style.display = 'inline-flex';
      orbitVoice.speak("Hooray! The solar panels are fully connected! Clean power is now flowing to the entire Moon base!");
    }
  }

  show() {
    this.selectedNode = null;
    this.connectedPairs.clear();
    this.element.querySelectorAll('.cable-node-btn').forEach(b => {
      b.classList.remove('connected');
      b.style.outline = 'none';
    });
    this.element.querySelector('#solar-celebrate-box').style.display = 'none';
    this.element.querySelector('#btn-solar-complete').style.display = 'none';
    this.element.querySelector('#solar-voltage-counter').textContent = '0 / 4 CABLES';
    this.element.querySelector('#solar-progress-fill').style.width = '0%';
    this.element.querySelector('#solar-game-instruction').textContent = '👉 Tap a plug on the left, then tap its matching color on the right!';

    this.element.style.display = 'flex';
    requestAnimationFrame(() => this.element.classList.add('active'));
    orbitVoice.speak("Commander! Let's power up our Moon base! Connect the matching color cables!");
  }

  close() {
    this.element.classList.remove('active');
    setTimeout(() => {
      this.element.style.display = 'none';
    }, 250);
  }
}
