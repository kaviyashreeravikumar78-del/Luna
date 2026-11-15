/**
 * LUNA: Mission Survival - Kid-Friendly Visual Action Overlay
 * Designed for young children (ages 5–12) including those who cannot read.
 * Uses giant colorful action buttons, large playful emojis, and visual step indicators.
 */
export class KidActionOverlay {
  constructor() {
    this.element = this.createDOM();
    document.body.appendChild(this.element);
  }

  createDOM() {
    const container = document.createElement('div');
    container.id = 'kid-action-overlay';
    container.className = 'kid-action-overlay';
    container.style.cssText = `
      position: fixed;
      bottom: 30px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 6000;
      display: none;
      flex-direction: column;
      align-items: center;
      gap: 14px;
      pointer-events: auto;
      font-family: 'Nunito', sans-serif;
    `;

    container.innerHTML = `
      <!-- Visual Step Indicators (⚪ ⚪ ⚪) -->
      <div id="kid-steps-row" style="display:none; gap:10px; align-items:center; background:rgba(6,16,30,0.85); padding:8px 18px; border-radius:20px; border:2px solid #00E5FF; box-shadow:0 4px 16px rgba(0,0,0,0.5);">
        <!-- Populated dynamically -->
      </div>

      <!-- Giant Interactive Tap Action Button -->
      <button id="kid-btn-action" style="
        background: linear-gradient(135deg, #00E5FF 0%, #0099FF 100%);
        color: #06101E;
        font-family: 'Nunito', sans-serif;
        font-size: 1.45rem;
        font-weight: 900;
        padding: 18px 44px;
        border-radius: 28px;
        border: 4px solid #FFFFFF;
        box-shadow: 0 8px 32px rgba(0, 229, 255, 0.7);
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 14px;
        transition: transform 0.15s cubic-bezier(0.16, 1, 0.3, 1);
        animation: pulseKidBtn 1.8s infinite ease-in-out;
      ">
        <span id="kid-btn-icon" style="font-size: 2.2rem;">⚡</span>
        <div style="display:flex; flex-direction:column; align-items:flex-start;">
          <span id="kid-btn-label">TAP TO PLAY!</span>
          <span id="kid-btn-sub" style="font-size: 0.85rem; font-weight: 800; color: #06101E; opacity: 0.85;">Easy 1-touch 3D action</span>
        </div>
      </button>

      <!-- Celebration & Star Award Banner -->
      <div id="kid-success-card" style="
        display: none;
        background: linear-gradient(135deg, rgba(16, 44, 73, 0.96) 0%, rgba(6, 16, 30, 0.98) 100%);
        border: 3.5px solid #06D6A0;
        border-radius: 24px;
        padding: 20px 36px;
        box-shadow: 0 12px 40px rgba(6, 214, 160, 0.5);
        flex-direction: column;
        align-items: center;
        gap: 14px;
        text-align: center;
        animation: popKidCelebrate 0.35s cubic-bezier(0.16, 1, 0.3, 1);
      ">
        <div style="font-size: 3rem;">🎉 ⭐ 🚀</div>
        <h2 id="kid-success-title" style="margin:0; font-size: 1.6rem; font-weight: 900; color: #FFD166;">
          MISSION COMPLETED! ⭐
        </h2>
        <button id="kid-btn-continue" style="
          background: linear-gradient(135deg, #06D6A0 0%, #00B4D8 100%);
          color: #06101E;
          font-family: 'Nunito', sans-serif;
          font-size: 1.35rem;
          font-weight: 900;
          padding: 14px 38px;
          border-radius: 22px;
          border: 3px solid #FFFFFF;
          cursor: pointer;
          box-shadow: 0 6px 20px rgba(6, 214, 160, 0.6);
        ">
          CONTINUE ADVENTURE ➔
        </button>
      </div>
    `;

    // Add pulse keyframes
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulseKidBtn {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
      @keyframes popKidCelebrate {
        from { transform: scale(0.8); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
      #kid-btn-action:active {
        transform: scale(0.95);
      }
    `;
    document.head.appendChild(style);

    return container;
  }

  showAction({ icon, label, sub, color, onTrigger }) {
    this.hide();

    const btn = this.element.querySelector('#kid-btn-action');
    const iconEl = this.element.querySelector('#kid-btn-icon');
    const labelEl = this.element.querySelector('#kid-btn-label');
    const subEl = this.element.querySelector('#kid-btn-sub');
    const stepsRow = this.element.querySelector('#kid-steps-row');
    const successCard = this.element.querySelector('#kid-success-card');

    stepsRow.style.display = 'none';
    successCard.style.display = 'none';

    iconEl.textContent = icon || '👉';
    labelEl.textContent = label || 'TAP HERE!';
    subEl.textContent = sub || 'Easy 3D action';
    if (color) {
      btn.style.background = `linear-gradient(135deg, ${color} 0%, #0099FF 100%)`;
      btn.style.boxShadow = `0 8px 32px ${color}88`;
    }

    btn.style.display = 'flex';
    btn.onclick = () => {
      if (onTrigger) onTrigger();
    };

    this.element.style.display = 'flex';
  }

  showMultiStepAction({ step, totalSteps, icon, label, sub, color, onTrigger }) {
    this.showAction({ icon, label, sub, color, onTrigger });

    const stepsRow = this.element.querySelector('#kid-steps-row');
    stepsRow.style.display = 'flex';
    stepsRow.innerHTML = '';

    for (let i = 1; i <= totalSteps; i++) {
      const dot = document.createElement('div');
      dot.style.cssText = `
        font-size: 1.35rem;
        transition: transform 0.2s;
      `;
      if (i < step) {
        dot.textContent = '⭐'; // Completed
      } else if (i === step) {
        dot.textContent = '🟡'; // Active
        dot.style.transform = 'scale(1.25)';
      } else {
        dot.textContent = '⚪'; // Pending
      }
      stepsRow.appendChild(dot);
    }
  }

  showSuccess(title, onContinue) {
    const btn = this.element.querySelector('#kid-btn-action');
    const stepsRow = this.element.querySelector('#kid-steps-row');
    const successCard = this.element.querySelector('#kid-success-card');
    const successTitle = this.element.querySelector('#kid-success-title');
    const btnCont = this.element.querySelector('#kid-btn-continue');

    btn.style.display = 'none';
    stepsRow.style.display = 'none';

    successTitle.textContent = title || 'MISSION COMPLETED! ⭐';
    successCard.style.display = 'flex';

    btnCont.onclick = () => {
      this.hide();
      if (onContinue) onContinue();
    };

    this.element.style.display = 'flex';
  }

  showFinalTrophyCelebration(onComplete) {
    this.showSuccess('🏆 7 DAYS COMPLETED! YOU ARE A HERO! 🏆', () => {
      if (onComplete) onComplete();
    });
  }

  updateLabel(text) {
    const labelEl = this.element.querySelector('#kid-btn-label');
    if (labelEl) labelEl.textContent = text;
  }

  hide() {
    this.element.style.display = 'none';
  }

  hideAction() {
    this.hide();
  }
}
