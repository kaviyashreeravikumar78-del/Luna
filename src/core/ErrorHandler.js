/**
 * LUNA: Mission Survival - Global Error Handler & Crash Recovery
 * Catches runtime exceptions and unhandled promise rejections, prevents white screens,
 * and provides a kid-friendly recovery card to safely return to Mission Control.
 */
export class ErrorHandler {
  static init(game) {
    this.game = game;
    this.modal = null;

    window.onerror = (message, source, lineno, colno, error) => {
      console.error('[LUNA Crash Guard]', message, error);
      this.showRecoveryUI(message);
      return true; // Prevent default browser error reporting
    };

    window.onunhandledrejection = (event) => {
      console.error('[LUNA Promise Guard]', event.reason);
      this.showRecoveryUI(event.reason ? event.reason.message || event.reason : 'Network / Resource issue');
    };
  }

  static showRecoveryUI(detail) {
    if (this.modal) return; // Prevent duplicate popups

    const overlay = document.createElement('div');
    overlay.id = 'luna-crash-recovery';
    overlay.style.cssText = `
      position: fixed;
      top: 0; left: 0; width: 100vw; height: 100dvh;
      background: rgba(10, 22, 40, 0.95);
      backdrop-filter: blur(12px);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Nunito', sans-serif;
      padding: 20px;
    `;

    overlay.innerHTML = `
      <div style="
        background: linear-gradient(135deg, #102C49, #06101E);
        border: 2px solid #00E5FF;
        border-radius: 28px;
        padding: 32px 28px;
        max-width: 480px;
        width: 100%;
        text-align: center;
        box-shadow: 0 16px 48px rgba(0, 0, 0, 0.75);
      ">
        <div style="font-size: 3rem; margin-bottom: 12px;">🛸🔧</div>
        <h2 style="color: #FFFFFF; font-size: 1.5rem; font-weight: 900; margin: 0 0 10px 0;">
          Space Turbulence Detected!
        </h2>
        <p style="color: #D6ECFF; font-size: 1rem; line-height: 1.4; margin: 0 0 20px 0;">
          ORBIT noticed a small hiccup in the lunar simulation. Don't worry, your mission progress is safe!
        </p>
        <button id="btn-recovery-return" style="
          background: linear-gradient(135deg, #00E5FF, #0077B6);
          color: #06101E;
          border: none;
          padding: 14px 28px;
          border-radius: 16px;
          font-size: 1.1rem;
          font-weight: 900;
          cursor: pointer;
          box-shadow: 0 4px 16px rgba(0, 229, 255, 0.4);
          transition: transform 0.15s ease;
        ">
          🚀 Return to Mission Control
        </button>
      </div>
    `;

    document.body.appendChild(overlay);
    this.modal = overlay;

    const btn = overlay.querySelector('#btn-recovery-return');
    btn.addEventListener('click', () => {
      this.recover();
    });
  }

  static recover() {
    if (this.modal) {
      this.modal.remove();
      this.modal = null;
    }

    try {
      if (this.game) {
        if (this.game.currentLevel) {
          this.game.currentLevel.dispose();
          this.game.currentLevel = null;
        }
        const wipe = document.getElementById('level-transition-overlay');
        if (wipe) wipe.remove();

        if (this.game.missionControl) {
          this.game.missionControl.show();
        }
      }
    } catch (e) {
      console.warn('Fallback reload during recovery:', e);
      window.location.reload();
    }
  }
}
