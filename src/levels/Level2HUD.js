import { level2Audio } from '../audio/Level2Audio.js';
import '../styles/level2-hud.css';

/**
 * Minimal Kid-Friendly Driving HUD for Level 2 (Water Hunt)
 * Features:
 * - Top-left: Sol 2 & Stars
 * - Top-center: ONE short objective chip (max 5 words)
 * - Top-right: Water tank level (0/3), Rover battery, and Pause button
 * - Mini-map radar scope in corner
 * - Radar ping button & Hot/Cold proximity indicator
 * - Drill action button
 * - Win/Fail modals with Science Honesty disclaimer
 */
export class Level2HUD {
  constructor(options = {}) {
    this.options = options;
    this.battery = 100;
    this.tankCount = 0;
    this.maxTank = 3;
    this.stars = 0;
    this.radarCooldown = false;

    this.element = this.createDOM();
    document.body.appendChild(this.element);

    this.minimapCanvas = this.element.querySelector('#l2-minimap-canvas');
    this.minimapCtx = this.minimapCanvas.getContext('2d');

    this.bindEvents();
  }

  createDOM() {
    const wrap = document.createElement('div');
    wrap.className = 'l2-hud-overlay';
    wrap.id = 'l2-hud-overlay';

    wrap.innerHTML = `
      <!-- TOP MINIMAL HUD BAR -->
      <div class="l2-top-bar">
        <div class="l2-badge-group">
          <div class="l2-sol-pill">SOL 2 • ROVER EXPEDITION</div>
          <div class="l2-stars-pill" id="l2-stars-val">⭐ 0 / 3 STARS</div>
        </div>

        <div class="l2-objective-chip" id="l2-objective-chip">
          <span id="l2-obj-icon">🚜</span>
          <span id="l2-obj-text">Drive into the crater!</span>
        </div>

        <div class="l2-right-group">
          <!-- Water Tank Fill Gauge -->
          <div class="l2-tank-card">
            <span class="l2-tank-icon">🧊</span>
            <div class="l2-tank-info">
              <div class="l2-tank-header">
                <span class="l2-tank-label">ICE TANK</span>
                <span class="l2-tank-val" id="l2-tank-num">0 / 3</span>
              </div>
              <div class="l2-tank-track">
                <div class="l2-tank-fill" id="l2-tank-fill" style="width: 0%;"></div>
              </div>
            </div>
          </div>

          <!-- Rover Battery Gauge -->
          <div class="l2-battery-card">
            <span class="l2-battery-icon">🔋</span>
            <div class="l2-battery-info">
              <div class="l2-battery-header">
                <span class="l2-battery-label">ROVER POWER</span>
                <span class="l2-battery-val" id="l2-battery-num">100%</span>
              </div>
              <div class="l2-battery-track">
                <div class="l2-battery-fill" id="l2-battery-fill" style="width: 100%;"></div>
              </div>
            </div>
          </div>

          <button class="btn-l2-pause" id="btn-l2-pause" title="Pause Game">⏸️</button>
        </div>
      </div>

      <!-- DIAMOND WAYPOINT TRACKER & COMPASS (Always Visible Diamond Locations) -->
      <div class="l2-diamond-tracker" id="l2-diamond-tracker">
        <div class="l2-tracker-title">💎 LUNAR DIAMOND LOCATIONS (3 SITES):</div>
        <div class="l2-diamond-pills" id="l2-diamond-pills">
          <button class="l2-diamond-pill active" id="l2-pill-1" data-id="1" title="Click to drive to Site 1">
            <span class="pill-gem">💎</span>
            <span class="pill-name">Crater Rim</span>
            <span class="pill-dist" id="l2-dist-1">--m</span>
            <span class="pill-arrow" id="l2-arrow-1">➔</span>
          </button>
          <button class="l2-diamond-pill" id="l2-pill-2" data-id="2" title="Click to drive to Site 2">
            <span class="pill-gem">💎</span>
            <span class="pill-name">Deep Shadow</span>
            <span class="pill-dist" id="l2-dist-2">--m</span>
            <span class="pill-arrow" id="l2-arrow-2">➔</span>
          </button>
          <button class="l2-diamond-pill" id="l2-pill-3" data-id="3" title="Click to drive to Site 3">
            <span class="pill-gem">💎</span>
            <span class="pill-name">Glaze Pocket</span>
            <span class="pill-dist" id="l2-dist-3">--m</span>
            <span class="pill-arrow" id="l2-arrow-3">➔</span>
          </button>
        </div>
      </div>

      <!-- CORNER MINI-MAP (Radar Sonar Scope) -->
      <div class="l2-minimap-wrap">
        <canvas class="l2-minimap-canvas" id="l2-minimap-canvas" width="110" height="110"></canvas>
        <span class="l2-minimap-label">RADAR MAP</span>
      </div>

      <!-- RADAR SIGNAL PROXIMITY METER (Hot/Cold) -->
      <div class="l2-radar-meter" id="l2-radar-meter">
        <span id="l2-radar-meter-icon">📡</span>
        <span id="l2-radar-meter-text">RADAR: SEARCHING...</span>
      </div>

      <!-- FLOATING ACTION DOCK: BREAK DIAMOND ICE (Bottom Center, Unblocked by ORBIT) -->
      <div class="l2-action-dock" id="l2-action-dock" style="display: none;">
        <button class="btn-l2-break-action" id="btn-l2-break-action" aria-label="Break Diamond Ice">
          <span class="l2-break-icon">⛏️💎</span>
          <span class="l2-break-text">BREAK DIAMOND ICE</span>
          <span class="l2-break-key">[SPACE]</span>
        </button>
      </div>

      <!-- RADAR PING BUTTON DOCK -->
      <div class="l2-radar-dock">
        <button class="btn-l2-radar" id="btn-l2-radar" title="Press Space to Ping Radar!">
          <span class="btn-l2-radar-icon">📡</span>
          <span class="btn-l2-radar-text">PING</span>
        </button>
      </div>

      <!-- BIG "GO!" INTRO BANNER -->
      <div class="l2-go-banner" id="l2-go-banner">GO! 🚀</div>

      <!-- PAUSE MODAL -->
      <div class="l2-modal-backdrop" id="l2-pause-modal">
        <div class="l2-modal-card">
          <h3 class="l2-modal-title">MISSION PAUSED</h3>
          <p style="color:#94A3B8; font-size:0.95rem; margin:0;">Outpost LUNA-01: Sol 2 Water Hunt</p>
          <div class="l2-modal-btn-stack">
            <button class="btn-l2-action btn-l2-primary" id="btn-l2-resume">▶ Resume Driving</button>
            <button class="btn-l2-action btn-l2-secondary" id="btn-l2-restart">🔄 Restart Level 2</button>
            <button class="btn-l2-action btn-l2-secondary" id="btn-l2-mute">🔊 Sound: ON</button>
            <button class="btn-l2-action btn-l2-secondary" id="btn-l2-back-mc">🚀 Back to Mission Control</button>
          </div>
        </div>
      </div>

      <!-- REWARD MODAL (WIN) -->
      <div class="l2-modal-backdrop" id="l2-win-modal">
        <div class="l2-modal-card">
          <span style="font-size:3.2rem;">💧🚜🎉</span>
          <h3 class="l2-modal-title">WATER RESERVES RESTORED!</h3>
          <p style="color:#E2E8F0; font-size:1.05rem; margin:0.2rem 0;">
            All 3 lunar ice deposits collected and melted into fresh drinking water!
          </p>
          <div class="l2-stars-row" id="l2-win-stars">
            <span class="l2-star-icon">⭐</span>
            <span class="l2-star-icon">⭐</span>
            <span class="l2-star-icon">⭐</span>
          </div>
          <p style="color:#00E5FF; font-weight:800; font-size:1.1rem; margin:0.2rem 0;">
            💧 Water Reserves +15% Replenished!
          </p>
          <div class="l2-science-disclaimer">
            🔬 <strong>Real Moon Science:</strong> Evidence shows water ice really hides inside permanently shadowed craters at the Moon's south pole! (Game locations and amounts are simulated for fun).
          </div>
          <div class="l2-modal-btn-stack">
            <button class="btn-l2-action btn-l2-primary" id="btn-l2-win-continue">
              <span>Continue to Mission Control ➔</span>
            </button>
          </div>
        </div>
      </div>

      <!-- FAIL MODAL -->
      <div class="l2-modal-backdrop" id="l2-fail-modal">
        <div class="l2-modal-card">
          <span style="font-size:3.2rem;">🔋⚠️</span>
          <h3 class="l2-modal-title" style="color:#FFB703;">ROVER NEEDS A RECHARGE!</h3>
          <p style="color:#E2E8F0; font-size:1.05rem; margin:0.4rem 0;">
            The battery ran low in the dark crater! Collect floating blue crystals along the way to stay charged!
          </p>
          <div class="l2-modal-btn-stack">
            <button class="btn-l2-action btn-l2-primary" id="btn-l2-fail-retry">
              <span>🔄 Try Again!</span>
            </button>
            <button class="btn-l2-action btn-l2-secondary" id="btn-l2-fail-mc">
              <span>Back to Mission Control</span>
            </button>
          </div>
        </div>
      </div>

      <!-- MOBILE TOUCH CONTROLS -->
      <div class="l2-touch-dock" id="l2-touch-dock">
        <!-- D-PAD DRIVING BUTTONS -->
        <div class="l2-dpad-controls" id="l2-dpad-controls">
          <button class="btn-l2-dpad btn-dpad-up" id="btn-l2-up" title="Drive Forward">
            ▲<span class="dpad-sub">DRIVE</span>
          </button>
          <div class="l2-dpad-row">
            <button class="btn-l2-dpad btn-dpad-left" id="btn-l2-left" title="Steer Left">
              ◀<span class="dpad-sub">LEFT</span>
            </button>
            <button class="btn-l2-dpad btn-dpad-down" id="btn-l2-down" title="Reverse">
              ▼<span class="dpad-sub">BACK</span>
            </button>
            <button class="btn-l2-dpad btn-dpad-right" id="btn-l2-right" title="Steer Right">
              ▶<span class="dpad-sub">RIGHT</span>
            </button>
          </div>
        </div>

        <!-- VIRTUAL JOYSTICK -->
        <div class="l2-virtual-stick" id="l2-stick">
          <div class="l2-stick-knob" id="l2-stick-knob"></div>
        </div>
      </div>
    `;

    return wrap;
  }

  bindEvents() {
    // Pause button
    const btnPause = this.element.querySelector('#btn-l2-pause');
    const pauseModal = this.element.querySelector('#l2-pause-modal');

    btnPause.addEventListener('click', () => {
      pauseModal.classList.add('active');
      if (this.options.onPause) this.options.onPause();
    });

    this.element.querySelector('#btn-l2-resume').addEventListener('click', () => {
      pauseModal.classList.remove('active');
      if (this.options.onResume) this.options.onResume();
    });

    this.element.querySelector('#btn-l2-restart').addEventListener('click', () => {
      pauseModal.classList.remove('active');
      if (this.options.onRestart) this.options.onRestart();
    });

    const muteBtn = this.element.querySelector('#btn-l2-mute');
    muteBtn.addEventListener('click', () => {
      level2Audio.setMuted(!level2Audio.isMuted);
      muteBtn.textContent = level2Audio.isMuted ? '🔇 Sound: MUTED' : '🔊 Sound: ON';
      if (this.options.onToggleMute) this.options.onToggleMute(level2Audio.isMuted);
    });

    this.element.querySelector('#btn-l2-back-mc').addEventListener('click', () => {
      pauseModal.classList.remove('active');
      if (this.options.onReturnToMissionControl) this.options.onReturnToMissionControl();
    });

    // Radar Ping button
    const radarBtn = this.element.querySelector('#btn-l2-radar');
    radarBtn.addEventListener('click', () => {
      this.triggerRadarPing();
    });

    // Break diamond action button (Bottom Center, Unblocked)
    const breakBtn = this.element.querySelector('#btn-l2-break-action');
    if (breakBtn) {
      const triggerBreak = (e) => {
        if (e && e.cancelable) e.preventDefault();
        breakBtn.classList.add('active');
        if (this.options.onBreakDiamond) {
          this.options.onBreakDiamond();
        }
      };
      const releaseBreak = () => {
        breakBtn.classList.remove('active');
      };
      breakBtn.addEventListener('pointerdown', triggerBreak);
      breakBtn.addEventListener('pointerup', releaseBreak);
      breakBtn.addEventListener('touchstart', triggerBreak, { passive: false });
      breakBtn.addEventListener('touchend', releaseBreak, { passive: false });
    }

    // Win continue button
    this.element.querySelector('#btn-l2-win-continue').addEventListener('click', () => {
      this.element.querySelector('#l2-win-modal').classList.remove('active');
      if (this.options.onWinContinue) this.options.onWinContinue();
    });

    // Fail retry buttons
    this.element.querySelector('#btn-l2-fail-retry').addEventListener('click', () => {
      this.element.querySelector('#l2-fail-modal').classList.remove('active');
      if (this.options.onRestart) this.options.onRestart();
    });

    this.element.querySelector('#btn-l2-fail-mc').addEventListener('click', () => {
      this.element.querySelector('#l2-fail-modal').classList.remove('active');
      if (this.options.onReturnToMissionControl) this.options.onReturnToMissionControl();
    });

    // Touch controls: Joystick + D-Pad
    this.setupTouchJoystick();
    this.setupDPadControls();

    // Diamond Pills Click
    [1, 2, 3].forEach(id => {
      const pill = this.element.querySelector(`#l2-pill-${id}`);
      if (pill) {
        pill.addEventListener('click', () => {
          if (this.options.onSelectTargetDiamond) {
            this.options.onSelectTargetDiamond(id);
          }
        });
      }
    });
  }

  triggerRadarPing() {
    if (this.radarCooldown) return;
    this.radarCooldown = true;

    const radarBtn = this.element.querySelector('#btn-l2-radar');
    radarBtn.classList.add('cooldown');

    if (this.options.onRadarPing) {
      this.options.onRadarPing();
    }

    // Cooldown duration ~2.5s
    setTimeout(() => {
      this.radarCooldown = false;
      radarBtn.classList.remove('cooldown');
    }, 2500);
  }

  setupTouchJoystick() {
    const stick = this.element.querySelector('#l2-stick');
    const knob = this.element.querySelector('#l2-stick-knob');
    let active = false;
    let center = { x: 0, y: 0 };
    const maxR = 35;

    const onMove = (e) => {
      if (!active) return;
      const t = e.touches ? e.touches[0] : e;
      const dx = t.clientX - center.x;
      const dy = t.clientY - center.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      const clampedDist = Math.min(dist, maxR);

      const kx = Math.cos(angle) * clampedDist;
      const ky = Math.sin(angle) * clampedDist;

      knob.style.transform = `translate(${kx}px, ${ky}px)`;

      if (this.options.onJoystickMove) {
        this.options.onJoystickMove(kx / maxR, ky / maxR);
      }
    };

    const onEnd = () => {
      active = false;
      knob.style.transform = 'translate(0px, 0px)';
      if (this.options.onJoystickMove) {
        this.options.onJoystickMove(0, 0);
      }
    };

    stick.addEventListener('touchstart', (e) => {
      active = true;
      const rect = stick.getBoundingClientRect();
      center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      onMove(e);
    });

    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onEnd);
  }

  setupDPadControls() {
    const bindBtn = (id, onStart, onEnd) => {
      const btn = this.element.querySelector(id);
      if (!btn) return;
      const start = (e) => {
        if (e && e.cancelable) e.preventDefault();
        btn.classList.add('active');
        onStart();
      };
      const end = (e) => {
        if (e && e.cancelable) e.preventDefault();
        btn.classList.remove('active');
        onEnd();
      };
      btn.addEventListener('pointerdown', start);
      btn.addEventListener('pointerup', end);
      btn.addEventListener('pointerleave', end);
      btn.addEventListener('touchstart', start, { passive: false });
      btn.addEventListener('touchend', end, { passive: false });
      btn.addEventListener('touchcancel', end, { passive: false });
    };

    bindBtn('#btn-l2-up', 
      () => { if (this.options.onThrottleChange) this.options.onThrottleChange(1); },
      () => { if (this.options.onThrottleChange) this.options.onThrottleChange(0); }
    );
    bindBtn('#btn-l2-down', 
      () => { if (this.options.onThrottleChange) this.options.onThrottleChange(-1); },
      () => { if (this.options.onThrottleChange) this.options.onThrottleChange(0); }
    );
    bindBtn('#btn-l2-left', 
      () => { if (this.options.onSteerChange) this.options.onSteerChange(1); },
      () => { if (this.options.onSteerChange) this.options.onSteerChange(0); }
    );
    bindBtn('#btn-l2-right', 
      () => { if (this.options.onSteerChange) this.options.onSteerChange(-1); },
      () => { if (this.options.onSteerChange) this.options.onSteerChange(0); }
    );
  }

  showBreakButton(visible, label = "BREAK DIAMOND ICE") {
    const dock = this.element.querySelector('#l2-action-dock');
    const text = this.element.querySelector('#btn-l2-break-action .l2-break-text');
    if (dock) {
      dock.style.display = visible ? 'flex' : 'none';
    }
    if (text && label) {
      text.textContent = label;
    }
  }

  showDrillButton(visible) {
    this.showBreakButton(visible);
  }

  updateDiamondTracker(sites = [], roverPos, roverHeading = 0) {
    sites.forEach(site => {
      const pill = this.element.querySelector(`#l2-pill-${site.id}`);
      const distEl = this.element.querySelector(`#l2-dist-${site.id}`);
      const arrowEl = this.element.querySelector(`#l2-arrow-${site.id}`);
      if (!pill || !distEl) return;

      if (site.collected) {
        pill.classList.add('collected');
        pill.classList.remove('active');
        distEl.textContent = "✔ EXTRACTED";
        if (arrowEl) arrowEl.textContent = "✨";
        return;
      }

      const dist = Math.round(roverPos.distanceTo(site.pos));
      distEl.textContent = `${dist}m`;

      if (arrowEl) {
        const dx = site.pos.x - roverPos.x;
        const dz = site.pos.z - roverPos.z;
        const targetAngle = Math.atan2(-dx, -dz);
        let diff = targetAngle - roverHeading;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        const deg = (diff * 180) / Math.PI;
        arrowEl.style.transform = `rotate(${deg}deg)`;
      }
    });
  }

  setObjective(text, icon = '🚜') {
    const chipText = this.element.querySelector('#l2-obj-text');
    const chipIcon = this.element.querySelector('#l2-obj-icon');
    if (chipText) chipText.textContent = text;
    if (chipIcon) chipIcon.textContent = icon;
  }

  setBattery(pct) {
    this.battery = Math.max(0, Math.min(100, Math.round(pct)));
    const fill = this.element.querySelector('#l2-battery-fill');
    const num = this.element.querySelector('#l2-battery-num');
    if (num) num.textContent = `${this.battery}%`;
    if (fill) {
      fill.style.width = `${this.battery}%`;
      fill.classList.remove('warning', 'critical');
      if (this.battery < 20) {
        fill.classList.add('critical');
      } else if (this.battery < 45) {
        fill.classList.add('warning');
      }
    }
  }

  setTank(current, max = 3) {
    this.tankCount = current;
    this.maxTank = max;
    const num = this.element.querySelector('#l2-tank-num');
    const fill = this.element.querySelector('#l2-tank-fill');
    if (num) num.textContent = `${current} / ${max}`;
    if (fill) fill.style.width = `${(current / max) * 100}%`;
  }

  setStars(count) {
    this.stars = Math.max(0, Math.min(3, count));
    const pill = this.element.querySelector('#l2-stars-val');
    if (pill) pill.textContent = `⭐ ${this.stars} / 3 STARS`;
  }

  showRadarMeter(statusText, statusClass = 'cold') {
    const meter = this.element.querySelector('#l2-radar-meter');
    const text = this.element.querySelector('#l2-radar-meter-text');
    const icon = this.element.querySelector('#l2-radar-meter-icon');

    meter.className = `l2-radar-meter show ${statusClass}`;
    text.textContent = statusText;

    if (statusClass === 'cold') icon.textContent = '❄️';
    else if (statusClass === 'warm') icon.textContent = '📡';
    else if (statusClass === 'hot') icon.textContent = '🎯';

    clearTimeout(this.meterTimer);
    this.meterTimer = setTimeout(() => {
      meter.classList.remove('show');
    }, 2800);
  }

  showDrillButton(visible) {
    const btn = this.element.querySelector('#btn-l2-drill');
    if (btn) btn.style.display = visible ? 'flex' : 'none';
  }

  showGoBanner(callback) {
    const banner = this.element.querySelector('#l2-go-banner');
    banner.classList.add('show');
    setTimeout(() => {
      banner.classList.remove('show');
      if (callback) callback();
    }, 1100);
  }

  showPopup(x, y, text = "+1 Ice Block! 🧊", color = "#00E5FF") {
    const pop = document.createElement('div');
    pop.className = 'l2-popup-float';
    pop.style.color = color;
    pop.textContent = text;
    pop.style.left = `${x}px`;
    pop.style.top = `${y}px`;
    this.element.appendChild(pop);
    setTimeout(() => pop.remove(), 1200);
  }

  /**
   * Draws the corner radar minimap (Rover, Base, and expanding ping wave)
   */
  updateMinimap(roverPos, basePos, pingPulse, discoveredSites = []) {
    const ctx = this.minimapCtx;
    if (!ctx) return;

    const w = 110;
    const h = 110;
    const cx = w / 2;
    const cy = h / 2;
    const scale = 0.85; // 1 world meter = 0.85 minimap pixels

    ctx.clearRect(0, 0, w, h);

    // Circular background
    ctx.fillStyle = '#06101E';
    ctx.beginPath();
    ctx.arc(cx, cy, 52, 0, Math.PI * 2);
    ctx.fill();

    // Radar grid rings
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.2)';
    ctx.lineWidth = 1;
    [18, 36, 50].forEach(r => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Dark Crater Zone indicator (northern half)
    ctx.fillStyle = 'rgba(11, 25, 44, 0.6)';
    ctx.beginPath();
    ctx.arc(cx, cy - 22, 28, 0, Math.PI * 2);
    ctx.fill();

    // Base Station Dot (Orange)
    const bx = cx + (basePos.x - roverPos.x) * scale;
    const by = cy + (basePos.z - roverPos.z) * scale;
    ctx.fillStyle = '#FF9E00';
    ctx.beginPath();
    ctx.arc(bx, by, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Diamond Ice Deposits (Always visible on Radar with glowing cyan diamond icon)
    discoveredSites.forEach(site => {
      const sx = cx + (site.pos.x - roverPos.x) * scale;
      const sy = cy + (site.pos.z - roverPos.z) * scale;

      // Only draw if inside circular radar scope
      const distFromCenter = Math.hypot(sx - cx, sy - cy);
      if (distFromCenter < 50) {
        if (!site.collected) {
          // Draw glowing diamond
          ctx.save();
          ctx.translate(sx, sy);
          ctx.fillStyle = '#00FFFF';
          ctx.shadowColor = '#00E5FF';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.moveTo(0, -5);
          ctx.lineTo(5, 0);
          ctx.lineTo(0, 5);
          ctx.lineTo(-5, 0);
          ctx.closePath();
          ctx.fill();

          // White inner core
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(0, 0, 1.8, 0, Math.PI * 2);
          ctx.fill();

          // Site number label
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#FFD166';
          ctx.font = 'bold 9px Nunito, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`${site.id}`, 0, -7);
          ctx.restore();
        } else {
          // Extracted mark
          ctx.fillStyle = '#06D6A0';
          ctx.beginPath();
          ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    });

    // Expanding Ping Pulse Wave
    if (pingPulse && pingPulse.active) {
      ctx.strokeStyle = `rgba(0, 229, 255, ${pingPulse.opacity})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, pingPulse.radius * scale, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Rover Center Dot
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = '#00E5FF';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  showWin(stars = 3) {
    const modal = this.element.querySelector('#l2-win-modal');
    const starsBox = this.element.querySelector('#l2-win-stars');
    if (starsBox) {
      starsBox.innerHTML = Array(stars).fill('<span class="l2-star-icon">⭐</span>').join('');
    }
    modal.classList.add('active');
  }

  showFail() {
    this.element.querySelector('#l2-fail-modal').classList.add('active');
  }

  dispose() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}
