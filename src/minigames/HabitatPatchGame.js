import { orbitVoice } from '../audio/OrbitVoice.js';

/**
 * LUNA: Mission Survival - Sol 5: Habitat Life-Support Leak Repair Mini-Game
 * A mechanical repair game where children patch a leaking pipe and laser-weld it.
 */
export class HabitatPatchGame {
  constructor(options = {}) {
    this.options = options; // { onComplete: () => {} }
    this.element = this.createDOM();
    document.body.appendChild(this.element);

    this.patchPlaced = false;
    this.welded = false;
    this.valveTurned = false;
  }

  createDOM() {
    const overlay = document.createElement('div');
    overlay.className = 'minigame-overlay';
    overlay.id = 'minigame-habitat-patch';

    overlay.innerHTML = `
      <div class="minigame-window">
        <div class="minigame-header">
          <div class="minigame-title-group">
            <span class="minigame-icon">🔧💧</span>
            <div>
              <h2 class="minigame-title">Repair the Life-Support Pipe!</h2>
              <span class="minigame-subtitle">Patch the leak, laser-weld the seam, and restore pipe pressure</span>
            </div>
          </div>
          <button class="btn-minigame-close" aria-label="Close">✕</button>
        </div>

        <div class="minigame-board">
          <div style="font-size:1.05rem; font-weight:800; color:#00E5FF; text-align:center;" id="patch-instruction">
            👉 Step 1: Tap the magnetic patch to place it over the leaking crack!
          </div>

          <!-- Interactive Pipe Section Display -->
          <div style="width:100%; max-width:480px; height:120px; background:#1E293B; border:3px solid #64748B; border-radius:24px; position:relative; display:flex; align-items:center; justify-content:center; box-shadow:inset 0 4px 16px rgba(0,0,0,0.6);">
            <!-- Pipe Body -->
            <div style="width:90%; height:44px; background:linear-gradient(180deg, #94A3B8 0%, #475569 50%, #1E293B 100%); border-radius:10px; position:relative; display:flex; align-items:center; justify-content:center;">
              
              <!-- Leak Crack / Hissing Mist -->
              <div id="pipe-crack" style="width:40px; height:28px; background:radial-gradient(circle, #00E5FF 0%, transparent 80%); border-radius:50%; position:relative; animation:leakHiss 0.6s infinite alternate; cursor:pointer;">
                <span style="font-size:1.4rem; position:absolute; top:-12px; left:8px;">💨</span>
              </div>

              <!-- Magnetic Patch (Hidden at start) -->
              <div id="pipe-patch" style="display:none; width:60px; height:34px; background:#FFB703; border:2px solid #FFFFFF; border-radius:8px; position:absolute; cursor:pointer; box-shadow:0 0 12px #FFB703; align-items:center; justify-content:center; font-size:0.75rem; font-weight:900; color:#06101E;">
                PATCH
              </div>
            </div>
          </div>

          <!-- Repair Tools Row -->
          <div style="display:flex; gap:16px; align-items:center; justify-content:center; width:100%;">
            <button class="btn-game-action" id="btn-place-patch" style="background:#FFB703; color:#06101E;">
              🩹 Place Patch
            </button>
            <button class="btn-game-action" id="btn-laser-weld" style="background:#FF3B30; color:#FFF;" disabled>
              ⚡ Laser Weld
            </button>
            <button class="btn-game-action" id="btn-turn-valve" style="background:#06D6A0; color:#06101E;" disabled>
              🚰 Turn Valve
            </button>
          </div>

          <div id="habitat-celebrate-box" style="display:none;" class="celebrate-banner">
            <span style="font-size:2.5rem;">🎉🛡️💧</span>
            <h3 class="celebrate-title">PIPE COMPLETELY REPAIRED!</h3>
            <p class="celebrate-text">The leak is 100% sealed! Life-support pressure restored! +15% Water & Habitat Integrity!</p>
          </div>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div style="display:flex; align-items:center; gap:10px;">
            <span style="font-size:1.8rem;">🤖</span>
            <span style="font-size:0.9rem; font-weight:700; color:#E2EAF4;">ORBIT: "Hiss! Let's seal up that leak with the laser welder!"</span>
          </div>
          <button class="btn-game-action" id="btn-patch-complete" style="display:none;">
            <span>Earn Mission Star ⭐ & Continue</span>
          </button>
        </div>
      </div>
    `;

    overlay.querySelector('.btn-minigame-close').addEventListener('click', () => this.close());
    overlay.querySelector('#btn-patch-complete').addEventListener('click', () => {
      this.close();
      if (this.options.onComplete) this.options.onComplete();
    });

    this.setupRepairSteps(overlay);
    return overlay;
  }

  setupRepairSteps(overlay) {
    const crack = overlay.querySelector('#pipe-crack');
    const patch = overlay.querySelector('#pipe-patch');
    const patchBtn = overlay.querySelector('#btn-place-patch');
    const weldBtn = overlay.querySelector('#btn-laser-weld');
    const valveBtn = overlay.querySelector('#btn-turn-valve');
    const inst = overlay.querySelector('#patch-instruction');

    // Step 1: Place Patch
    const placePatchAction = () => {
      this.patchPlaced = true;
      crack.style.display = 'none';
      patch.style.display = 'flex';
      patchBtn.disabled = true;
      weldBtn.disabled = false;
      inst.textContent = '👉 Step 2: Great! Now tap the Laser Weld tool to seal the edges!';
    };

    patchBtn.addEventListener('click', placePatchAction);
    crack.addEventListener('click', placePatchAction);

    // Step 2: Laser Weld
    weldBtn.addEventListener('click', () => {
      this.welded = true;
      patch.style.background = '#06D6A0';
      patch.style.boxShadow = '0 0 18px #06D6A0';
      patch.textContent = 'SEALED';
      weldBtn.disabled = true;
      valveBtn.disabled = false;
      inst.textContent = '👉 Step 3: Sealed! Now tap Turn Valve to restore full water pressure!';
    });

    // Step 3: Turn Valve
    valveBtn.addEventListener('click', () => {
      this.valveTurned = true;
      valveBtn.disabled = true;
      inst.textContent = '🎉 Pipe pressure 100% nominal!';
      overlay.querySelector('#habitat-celebrate-box').style.display = 'flex';
      overlay.querySelector('#btn-patch-complete').style.display = 'inline-flex';
      orbitVoice.speak("Awesome engineering work! The leak is sealed and all our water is safe!");
    });
  }

  show() {
    this.patchPlaced = false;
    this.welded = false;
    this.valveTurned = false;

    this.element.querySelector('#pipe-crack').style.display = 'flex';
    const patch = this.element.querySelector('#pipe-patch');
    patch.style.display = 'none';
    patch.style.background = '#FFB703';
    patch.style.boxShadow = '0 0 12px #FFB703';
    patch.textContent = 'PATCH';

    this.element.querySelector('#btn-place-patch').disabled = false;
    this.element.querySelector('#btn-laser-weld').disabled = true;
    this.element.querySelector('#btn-turn-valve').disabled = true;
    this.element.querySelector('#habitat-celebrate-box').style.display = 'none';
    this.element.querySelector('#btn-patch-complete').style.display = 'none';
    this.element.querySelector('#patch-instruction').textContent = '👉 Step 1: Tap Place Patch over the leaking crack!';

    this.element.style.display = 'flex';
    requestAnimationFrame(() => this.element.classList.add('active'));
    orbitVoice.speak("Commander! There's a leak in the water pipe! Let's patch it up with the laser welder!");
  }

  close() {
    this.element.classList.remove('active');
    setTimeout(() => {
      this.element.style.display = 'none';
    }, 250);
  }
}
