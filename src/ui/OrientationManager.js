/**
 * LUNA: Mission Survival - Mobile Orientation Manager
 * Enforces Landscape orientation on mobile devices to ensure full 3D viewport
 * and unhindered access to mission controls.
 */
export class OrientationManager {
  static init() {
    if (this._initialized) return;
    this._initialized = true;

    this.createDOM();
    this.bindEvents();
    this.checkOrientation();
  }

  static createDOM() {
    if (document.getElementById('luna-orientation-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'luna-orientation-overlay';
    overlay.innerHTML = `
      <div class="orientation-card">
        <div class="orientation-anim-box">
          <div class="orientation-phone-graphic">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#00E5FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
              <line x1="12" y1="18" x2="12.01" y2="18"></line>
            </svg>
            <div class="orientation-rotate-arrow">⟲</div>
          </div>
        </div>

        <div class="orientation-badge">
          <span>🌕 OUTPOST LUNA-01</span>
        </div>

        <h2 class="orientation-title">Turn Phone Sideways!</h2>
        <p class="orientation-desc">
          Commander, please rotate your device to <strong>Landscape mode</strong> for the full 3D Moon view and easy astronaut controls!
        </p>
        <div class="orientation-hint">
          <span>🔄 Rotate 90° to Continue</span>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    this.overlay = overlay;

    // Inject minimal styling directly so it works instantly without stylesheet lag
    const style = document.createElement('style');
    style.id = 'luna-orientation-style';
    style.textContent = `
      #luna-orientation-overlay {
        position: fixed;
        inset: 0;
        z-index: 999999;
        background: rgba(6, 16, 30, 0.96);
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
        display: none;
        align-items: center;
        justify-content: center;
        font-family: 'Nunito', system-ui, -apple-system, sans-serif;
        padding: 24px;
        text-align: center;
        color: #FFFFFF;
        user-select: none;
      }

      .orientation-card {
        background: linear-gradient(135deg, rgba(16, 44, 73, 0.95), rgba(6, 16, 30, 0.98));
        border: 2px solid #00E5FF;
        border-radius: 28px;
        padding: 32px 24px;
        max-width: 360px;
        width: 100%;
        box-shadow: 0 16px 48px rgba(0, 0, 0, 0.7), 0 0 25px rgba(0, 229, 255, 0.35);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
      }

      .orientation-anim-box {
        position: relative;
        width: 80px;
        height: 80px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .orientation-phone-graphic {
        position: relative;
        animation: rotatePhoneAnim 2.6s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        transform-origin: center center;
      }

      .orientation-rotate-arrow {
        position: absolute;
        top: -8px;
        right: -10px;
        font-size: 1.8rem;
        color: #FFD166;
        animation: pulseArrow 1.3s ease-in-out infinite alternate;
      }

      @keyframes rotatePhoneAnim {
        0%, 20% {
          transform: rotate(0deg);
        }
        50%, 80% {
          transform: rotate(90deg);
        }
        100% {
          transform: rotate(0deg);
        }
      }

      @keyframes pulseArrow {
        0% { transform: scale(0.9); opacity: 0.7; }
        100% { transform: scale(1.15); opacity: 1; }
      }

      .orientation-badge {
        background: rgba(0, 229, 255, 0.15);
        border: 1px solid #00E5FF;
        padding: 4px 14px;
        border-radius: 999px;
        font-size: 0.78rem;
        font-weight: 800;
        letter-spacing: 0.08em;
        color: #00E5FF;
      }

      .orientation-title {
        margin: 4px 0 0 0;
        font-size: 1.45rem;
        font-weight: 900;
        color: #FFFFFF;
      }

      .orientation-desc {
        margin: 0;
        font-size: 0.95rem;
        line-height: 1.45;
        color: #CBD5E1;
      }

      .orientation-desc strong {
        color: #FFD166;
      }

      .orientation-hint {
        margin-top: 8px;
        background: rgba(255, 209, 102, 0.15);
        border: 1px dashed #FFD166;
        padding: 6px 16px;
        border-radius: 12px;
        font-size: 0.82rem;
        font-weight: 800;
        color: #FFD166;
      }
    `;
    document.head.appendChild(style);
  }

  static bindEvents() {
    const update = () => this.checkOrientation();

    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', () => {
      setTimeout(update, 100);
      setTimeout(update, 300);
    });

    // Try locking screen to landscape on first user gesture
    const tryLock = () => {
      if (screen?.orientation?.lock) {
        screen.orientation.lock('landscape').catch(() => {
          // Normal fallback: browsers allow locking only in fullscreen or installed PWA
        });
      }
    };
    window.addEventListener('click', tryLock, { once: true });
    window.addEventListener('touchstart', tryLock, { once: true });
  }

  static checkOrientation() {
    if (!this.overlay) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    // Detect if device is a phone/small screen in portrait mode
    const isMobileSize = Math.min(width, height) <= 768;
    const isPortrait = height > width;

    if (isMobileSize && isPortrait) {
      this.overlay.style.display = 'flex';
    } else {
      this.overlay.style.display = 'none';
    }
  }
}
