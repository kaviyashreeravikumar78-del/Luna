import { orbitVoice } from '../audio/OrbitVoice.js';

/**
 * LUNA: Mission Survival - Sol 4: Greenhouse Gardening Adventure Mini-Game
 * A hands-on farming game where children plant seeds, water soil, turn on lights, and harvest food.
 */
export class GreenhouseGame {
  constructor(options = {}) {
    this.options = options; // { onComplete: () => {} }
    this.element = this.createDOM();
    document.body.appendChild(this.element);

    this.plantStages = [0, 0, 0]; // 0: Empty, 1: Planted, 2: Watered, 3: Grown, 4: Harvested
  }

  createDOM() {
    const overlay = document.createElement('div');
    overlay.className = 'minigame-overlay';
    overlay.id = 'minigame-greenhouse';

    overlay.innerHTML = `
      <div class="minigame-window">
        <div class="minigame-header">
          <div class="minigame-title-group">
            <span class="minigame-icon">🌱🍓</span>
            <div>
              <h2 class="minigame-title">Greenhouse Gardening!</h2>
              <span class="minigame-subtitle">Plant seeds, add water, and turn on the grow lamps to harvest food</span>
            </div>
          </div>
          <button class="btn-minigame-close" aria-label="Close">✕</button>
        </div>

        <div class="minigame-board">
          <div style="font-size:1.05rem; font-weight:800; color:#A7C98D; text-align:center;" id="garden-instruction">
            👉 Step 1: Tap each soil box to plant seeds!
          </div>

          <!-- 3 Soil Planter Boxes -->
          <div class="greenhouse-garden-row">
            <div class="garden-pot" data-idx="0">
              <div class="garden-plant-stage">🟫</div>
              <span class="garden-pot-label">Space Carrots 🥕</span>
            </div>
            <div class="garden-pot" data-idx="1">
              <div class="garden-plant-stage">🟫</div>
              <span class="garden-pot-label">Strawberries 🍓</span>
            </div>
            <div class="garden-pot" data-idx="2">
              <div class="garden-plant-stage">🟫</div>
              <span class="garden-pot-label">Moon Wheat 🌾</span>
            </div>
          </div>

          <!-- Gardening Tools Controls -->
          <div style="display:flex; gap:16px; align-items:center; justify-content:center; width:100%; margin-top:8px;">
            <button class="btn-game-action" id="btn-water-plants" style="background:#0099FF; color:#FFF;" disabled>
              💧 Water Sprinkler
            </button>
            <button class="btn-game-action" id="btn-light-plants" style="background:#FFB703; color:#06101E;" disabled>
              ☀️ Sunshine Grow Lamp
            </button>
          </div>

          <div id="greenhouse-celebrate-box" style="display:none;" class="celebrate-banner">
            <span style="font-size:2.5rem;">🥗🧺🍓</span>
            <h3 class="celebrate-title">DELICIOUS HARVEST!</h3>
            <p class="celebrate-text">The astronauts have fresh crunchy carrots and sweet berries! +20% Food Supplies!</p>
          </div>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div style="display:flex; align-items:center; gap:10px;">
            <span style="font-size:1.8rem;">🤖</span>
            <span style="font-size:0.9rem; font-weight:700; color:#E2EAF4;">ORBIT: "Plants need seeds, water, and warm light to grow!"</span>
          </div>
          <button class="btn-game-action" id="btn-greenhouse-complete" style="display:none;">
            <span>Earn Mission Star ⭐ & Continue</span>
          </button>
        </div>
      </div>
    `;

    overlay.querySelector('.btn-minigame-close').addEventListener('click', () => this.close());
    overlay.querySelector('#btn-greenhouse-complete').addEventListener('click', () => {
      this.close();
      if (this.options.onComplete) this.options.onComplete();
    });

    this.setupGardening(overlay);
    return overlay;
  }

  setupGardening(overlay) {
    const pots = overlay.querySelectorAll('.garden-pot');
    const waterBtn = overlay.querySelector('#btn-water-plants');
    const lightBtn = overlay.querySelector('#btn-light-plants');
    const inst = overlay.querySelector('#garden-instruction');

    // Step 1: Tap to plant
    pots.forEach(pot => {
      pot.addEventListener('click', () => {
        const idx = parseInt(pot.dataset.idx, 10);
        if (this.plantStages[idx] === 0) {
          this.plantStages[idx] = 1;
          pot.querySelector('.garden-plant-stage').textContent = '🌱';

          if (this.plantStages.every(s => s >= 1)) {
            waterBtn.disabled = false;
            inst.textContent = '👉 Step 2: Great! Now tap the Water Sprinkler to give plants a drink!';
          }
        } else if (this.plantStages[idx] === 3) {
          // Harvest!
          this.plantStages[idx] = 4;
          const fruits = ['🥕', '🍓', '🌾'];
          pot.querySelector('.garden-plant-stage').textContent = `🧺 ${fruits[idx]}`;

          if (this.plantStages.every(s => s === 4)) {
            inst.textContent = '🎉 All fresh crops harvested!';
            overlay.querySelector('#greenhouse-celebrate-box').style.display = 'flex';
            overlay.querySelector('#btn-greenhouse-complete').style.display = 'inline-flex';
            orbitVoice.speak("Yum! Look at all those fresh, crunchy vegetables! Delicious food for our astronauts!");
          }
        }
      });
    });

    // Step 2: Water Sprinkler
    waterBtn.addEventListener('click', () => {
      pots.forEach((p, idx) => {
        this.plantStages[idx] = 2;
        p.querySelector('.garden-plant-stage').textContent = '🌿';
      });
      waterBtn.disabled = true;
      lightBtn.disabled = false;
      inst.textContent = '👉 Step 3: Perfect! Now turn on the Sunshine Grow Lamp!';
    });

    // Step 3: Grow Lamp
    lightBtn.addEventListener('click', () => {
      const matureFruits = ['🥕🥕', '🍓🍓', '🌾🌾'];
      pots.forEach((p, idx) => {
        this.plantStages[idx] = 3;
        p.querySelector('.garden-plant-stage').textContent = matureFruits[idx];
      });
      lightBtn.disabled = true;
      inst.textContent = '👉 Step 4: The crops are ripe! Tap each planter box to harvest!';
    });
  }

  show() {
    this.plantStages = [0, 0, 0];
    this.element.querySelectorAll('.garden-pot .garden-plant-stage').forEach(el => {
      el.textContent = '🟫';
    });
    this.element.querySelector('#btn-water-plants').disabled = true;
    this.element.querySelector('#btn-light-plants').disabled = true;
    this.element.querySelector('#greenhouse-celebrate-box').style.display = 'none';
    this.element.querySelector('#btn-greenhouse-complete').style.display = 'none';
    this.element.querySelector('#garden-instruction').textContent = '👉 Step 1: Tap each soil box to plant seeds!';

    this.element.style.display = 'flex';
    requestAnimationFrame(() => this.element.classList.add('active'));
    orbitVoice.speak("Commander! Let's grow fresh food! Tap the pots to plant your space seeds!");
  }

  close() {
    this.element.classList.remove('active');
    setTimeout(() => {
      this.element.style.display = 'none';
    }, 250);
  }
}
