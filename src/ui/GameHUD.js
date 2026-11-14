import { orbitVoice } from '../audio/OrbitVoice.js';
import { gameState } from '../simulation/GameState.js';

/**
 * LUNA: Mission Survival - Child-Friendly In-Game Adventure HUD
 * Top Bar: Sol counter, Golden Stars ⭐, Life-Support Gauges (O2, Water, Food, Power)
 * Middle Banner: Active daily mission objective
 * Bottom Bar: Context interaction prompt card ([E] / Tap to play), ORBIT speech bubble, touch controls
 * Rover HUD: Live ice collection counter and exit button
 */
export class GameHUD {
  constructor(options = {}) {
    this.options = options; // { onOpenMissionControl, onResetCamera, onReplayOrbit, onInteractStation, onExitRover }
    this.element = this.createDOM();
    document.body.appendChild(this.element);

    this.currentPromptAction = null;
    this.isRoverActive = false;
    this.touchJoystickActive = false;
    this.joystickCenter = { x: 0, y: 0 };

    this.bindEvents();
    this.update(gameState);
  }

  createDOM() {
    const container = document.createElement('div');
    container.className = 'game-adventure-hud';
    container.id = 'game-adventure-hud';
    container.style.display = 'none'; // Hidden until entering colony

    container.innerHTML = `
      <!-- TOP HUD BAR -->
      <div class="hud-top-bar">
        <!-- Sol & Stars Card -->
        <div class="hud-sol-card">
          <div class="hud-sol-pill" id="hud-sol-pill">SOL 1 / 7</div>
          <div class="hud-stars-row" id="hud-stars-row">
            <span id="hud-stars-display">⭐ 0/7</span>
          </div>
        </div>

        <!-- Resources Cluster -->
        <div class="hud-resources-cluster">
          <div class="hud-res-item" title="Colony Oxygen Reserves">
            <span>🫁</span>
            <div class="hud-res-bar">
              <div class="hud-res-fill" id="hud-o2-fill" style="width:100%; background:#00E5FF;"></div>
            </div>
            <span id="hud-o2-val" style="font-size:0.85rem; color:#00E5FF;">100%</span>
          </div>

          <div class="hud-res-item" title="Drinking & Cooling Water">
            <span>💧</span>
            <div class="hud-res-bar">
              <div class="hud-res-fill" id="hud-water-fill" style="width:100%; background:#0099FF;"></div>
            </div>
            <span id="hud-water-val" style="font-size:0.85rem; color:#0099FF;">100%</span>
          </div>

          <div class="hud-res-item" title="Hydroponic Food Supplies">
            <span>🥗</span>
            <div class="hud-res-bar">
              <div class="hud-res-fill" id="hud-food-fill" style="width:100%; background:#06D6A0;"></div>
            </div>
            <span id="hud-food-val" style="font-size:0.85rem; color:#06D6A0;">100%</span>
          </div>

          <div class="hud-res-item" title="Solar & Battery Power">
            <span>⚡</span>
            <div class="hud-res-bar">
              <div class="hud-res-fill" id="hud-power-fill" style="width:100%; background:#FFB703;"></div>
            </div>
            <span id="hud-power-val" style="font-size:0.85rem; color:#FFB703;">100%</span>
          </div>
        </div>

        <!-- Controls Group -->
        <div class="hud-controls-group">
          <button class="btn-hud-round" id="btn-hud-deck" title="Open Mission Control Monitoring Deck">
            <span>🚀 Mission Control</span>
          </button>
          <button class="btn-hud-round" id="btn-hud-ask-orbit" title="Ask ORBIT for Help">
            <span>🤖 Ask ORBIT</span>
          </button>
          <button class="btn-hud-round" id="btn-hud-cam-reset" title="Reset Camera View">
            <span>🎥 View Base</span>
          </button>
        </div>
      </div>

      <!-- ACTIVE MISSION BANNER (Center) -->
      <div class="hud-mission-banner" id="hud-mission-banner">
        <span style="font-size:1.4rem;">🎯</span>
        <span id="hud-mission-text">SOL 1: Walk to the Solar Panels to connect power cables!</span>
      </div>

      <!-- ROVER DRIVING OVERLAY (Visible during Rover Mode) -->
      <div id="hud-rover-panel" style="display:none; align-self:center; background:linear-gradient(135deg, rgba(217,87,54,0.95), rgba(16,44,73,0.95)); border:2px solid #00E5FF; border-radius:24px; padding:12px 28px; box-shadow:0 8px 30px rgba(0,0,0,0.6); align-items:center; gap:20px; z-index:2600;">
        <div style="display:flex; align-items:center; gap:12px;">
          <span style="font-size:2.2rem;">🚜</span>
          <div>
            <div style="font-size:0.85rem; font-weight:800; color:#00E5FF; text-transform:uppercase;">ROVER EXPEDITION ACTIVE</div>
            <div style="font-size:1.15rem; font-weight:900; color:#FFFFFF;" id="hud-rover-ice-status">🧊 Collect Ice Crystals: 0 / 5</div>
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:12px;">
          <span style="font-size:0.85rem; color:#D6ECFF; font-weight:700;">Drive: W,A,S,D or Arrows</span>
          <button id="btn-exit-rover-hud" style="background:#FF3B30; color:#FFF; border:none; padding:8px 16px; border-radius:12px; font-weight:800; cursor:pointer;">
            🛑 Exit Rover
          </button>
        </div>
      </div>

      <!-- BOTTOM HUD BAR -->
      <div class="hud-bottom-bar">
        <!-- Virtual Joystick for Touch / Mobile -->
        <div class="hud-virtual-joystick" id="hud-virtual-joystick">
          <div class="hud-joystick-knob" id="hud-joystick-knob"></div>
        </div>

        <!-- ORBIT Speech Companion Bubble -->
        <div class="hud-orbit-bubble" id="hud-orbit-bubble">
          <span class="hud-orbit-face">🤖</span>
          <p class="hud-orbit-msg" id="hud-orbit-msg">
            Hello Commander! Walk with W, A, S, D or the Arrow keys. Approach any building to explore!
          </p>
        </div>

        <!-- Proximity Action Prompt Card -->
        <div class="hud-prompt-card" id="hud-prompt-card" style="display:none;">
          <span class="hud-key-badge">[E] or TAP</span>
          <span id="hud-prompt-text">Connect Solar Power ⚡</span>
        </div>
      </div>
    `;

    return container;
  }

  bindEvents() {
    // Mission Control Deck
    this.element.querySelector('#btn-hud-deck').addEventListener('click', () => {
      if (this.options.onOpenMissionControl) {
        this.options.onOpenMissionControl();
      }
    });

    // Ask ORBIT
    this.element.querySelector('#btn-hud-ask-orbit').addEventListener('click', () => {
      this.playOrbitHint();
    });

    // Reset Camera
    this.element.querySelector('#btn-hud-cam-reset').addEventListener('click', () => {
      if (this.options.onResetCamera) {
        this.options.onResetCamera();
      }
    });

    // Proximity Prompt Card Click
    this.element.querySelector('#hud-prompt-card').addEventListener('click', () => {
      if (this.currentPromptAction) {
        this.currentPromptAction();
      }
    });

    // Exit Rover HUD button
    this.element.querySelector('#btn-exit-rover-hud').addEventListener('click', () => {
      if (this.options.onExitRover) {
        this.options.onExitRover();
      }
    });

    // Virtual Touch Joystick
    this.setupTouchJoystick();
  }

  setupTouchJoystick() {
    const joystick = this.element.querySelector('#hud-virtual-joystick');
    const knob = this.element.querySelector('#hud-joystick-knob');

    // Show on touch devices
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      joystick.style.display = 'block';
    }

    const onTouchMove = (e) => {
      if (!this.touchJoystickActive) return;
      const touch = e.touches[0];
      const dx = touch.clientX - this.joystickCenter.x;
      const dy = touch.clientY - this.joystickCenter.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxR = 35;

      const normX = Math.max(-1, Math.min(1, dx / maxR));
      const normY = Math.max(-1, Math.min(1, dy / maxR));

      knob.style.transform = `translate(${normX * maxR}px, ${normY * maxR}px)`;

      if (this.options.onJoystickMove) {
        this.options.onJoystickMove(normX, -normY);
      }
    };

    const onTouchEnd = () => {
      this.touchJoystickActive = false;
      knob.style.transform = 'translate(0px, 0px)';
      if (this.options.onJoystickMove) {
        this.options.onJoystickMove(0, 0);
      }
    };

    joystick.addEventListener('touchstart', (e) => {
      this.touchJoystickActive = true;
      const rect = joystick.getBoundingClientRect();
      this.joystickCenter = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };
      onTouchMove(e);
    });

    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onTouchEnd);
  }

  show() {
    this.element.style.display = 'flex';
    this.update(gameState);
  }

  hide() {
    this.element.style.display = 'none';
  }

  update(state) {
    if (!state) return;

    // 1. Sol Pill
    const solPill = this.element.querySelector('#hud-sol-pill');
    if (solPill) {
      solPill.textContent = `SOL ${state.currentDay} / 7`;
    }

    // 2. Stars
    const starsEarned = (state.decisionHistory ? state.decisionHistory.length : 0);
    const starsDisplay = this.element.querySelector('#hud-stars-display');
    if (starsDisplay) {
      starsDisplay.textContent = `⭐ ${starsEarned} / 7 STARS`;
    }

    // 3. Resources
    const r = state.resources;
    if (r) {
      this.updateRes('hud-o2-fill', 'hud-o2-val', r.oxygen);
      this.updateRes('hud-water-fill', 'hud-water-val', r.water);
      this.updateRes('hud-food-fill', 'hud-food-val', r.food);
      this.updateRes('hud-power-fill', 'hud-power-val', r.power);
    }

    // 4. Mission Banner
    this.updateMissionBanner(state);
  }

  updateRes(fillId, valId, value) {
    const fill = this.element.querySelector(`#${fillId}`);
    const val = this.element.querySelector(`#${valId}`);
    const clamped = Math.max(0, Math.min(100, Math.round(value)));

    if (fill) fill.style.width = `${clamped}%`;
    if (val) {
      val.textContent = `${clamped}%`;
      if (clamped < 25) {
        val.style.color = '#FF3B30';
        if (fill) fill.style.background = '#FF3B30';
      }
    }
  }

  updateMissionBanner(state) {
    const banner = this.element.querySelector('#hud-mission-text');
    if (!banner) return;

    const sol = state.currentDay;
    const isDecided = state.currentDayDecided;

    if (state.missionStatus === 'completed') {
      banner.innerHTML = '🏆 MISSION COMPLETED! South Pole Expedition Victorious!';
      return;
    }

    if (isDecided) {
      const nextSol = sol + 1;
      banner.innerHTML = `
        <span style="color:#06D6A0;">✅ Sol ${sol} Mission Completed!</span>
        <button id="btn-hud-advance-now" class="btn-hud-advance" style="background:#06D6A0; color:#06101E; font-family:'Nunito', sans-serif; font-size:0.92rem; font-weight:900; border:none; border-radius:14px; padding:6px 14px; cursor:pointer; margin-left:12px; box-shadow:0 2px 10px rgba(6,214,160,0.5); transition:transform 0.2s;">
          ${nextSol > 7 ? 'View Final Report 🏆' : `Advance to Sol ${nextSol} 🚀`}
        </button>
      `;

      const btnAdv = banner.querySelector('#btn-hud-advance-now');
      if (btnAdv) {
        btnAdv.addEventListener('click', (e) => {
          e.stopPropagation();
          if (this.options.onAdvanceSol) {
            this.options.onAdvanceSol();
          }
        });
      }
      return;
    }

    switch (sol) {
      case 1:
        banner.textContent = '⚡ Sol 1: Walk to the Solar Panels to connect power cables!';
        break;
      case 2:
        banner.textContent = '💧 Sol 2: Walk to the Main Habitat to repair the life-support pipe!';
        break;
      case 3:
        banner.textContent = '☀️🚨 Sol 3: NASA Solar Storm! Run to the Habitat Shelter & lock shields!';
        break;
      case 4:
        banner.textContent = '🌱 Sol 4: Visit the Greenhouse Bio-Domes to plant and grow fresh food!';
        break;
      case 5:
        banner.textContent = '📡 Sol 5: Walk to the Space Radio Dish and align the Earth antenna!';
        break;
      case 6:
        banner.textContent = '🚜 Sol 6: Jump into the Lunar Rover and collect 5 Ice Crystals in craters for the Lab!';
        break;
      case 7:
        banner.textContent = '🏆 Sol 7: Final Base Inspection! Inspect all stations for victory!';
        break;
      default:
        banner.textContent = `Sol ${sol}: Explore and maintain the colony!`;
    }
  }

  showProximityPrompt(station, onAction) {
    const card = this.element.querySelector('#hud-prompt-card');
    const text = this.element.querySelector('#hud-prompt-text');

    if (!station) {
      this.hideProximityPrompt();
      return;
    }

    this.currentPromptAction = onAction;
    text.textContent = station.prompt || `Inspect ${station.name}`;
    card.style.display = 'flex';
  }

  hideProximityPrompt() {
    const card = this.element.querySelector('#hud-prompt-card');
    if (card) card.style.display = 'none';
    this.currentPromptAction = null;
  }

  showRoverMode(collected, total) {
    this.isRoverActive = true;
    const panel = this.element.querySelector('#hud-rover-panel');
    const status = this.element.querySelector('#hud-rover-ice-status');
    if (panel) panel.style.display = 'flex';
    if (status) status.textContent = `🧊 Collect Ice Crystals: ${collected} / ${total}`;
    this.hideProximityPrompt();
    this.speakOrbit("Driving Lunar Rover! Steer around craters and drive over glowing blue ice crystals!");
  }

  updateRoverIce(collected, total) {
    const status = this.element.querySelector('#hud-rover-ice-status');
    if (status) {
      if (collected >= total) {
        status.textContent = `🎉 All ${total} Ice Crystals Collected! Drive back to base!`;
        this.speakOrbit("Great driving! All 5 ice deposits gathered! Now drive the rover back to the outpost!");
      } else {
        status.textContent = `🧊 Collect Ice Crystals: ${collected} / ${total}`;
      }
    }
  }

  hideRoverMode() {
    this.isRoverActive = false;
    const panel = this.element.querySelector('#hud-rover-panel');
    if (panel) panel.style.display = 'none';
  }

  speakOrbit(message) {
    const msgEl = this.element.querySelector('#hud-orbit-msg');
    if (msgEl) {
      msgEl.textContent = message;
    }
    orbitVoice.speak(message);
  }

  playOrbitHint() {
    const sol = gameState.currentDay;
    let hint = "";

    switch (sol) {
      case 1:
        hint = "Commander! Walk over to the Solar Panels to connect matching colored energy plugs and charge our colony batteries!";
        break;
      case 2:
        hint = "A water pipe is leaking under the Habitat! Walk over to the Main Habitat Hub, place the magnetic patch, laser-weld the seam, and tighten the valve to save our water!";
        break;
      case 3:
        hint = "Emergency alert from NASA! A solar particle storm is approaching! Walk to the Habitat shelter, bring everyone inside, and pull the blast shield!";
        break;
      case 4:
        hint = "Time to do some gardening! Head over to the Greenhouse bio-domes, plant our carrot and strawberry seeds, water them, and turn on the grow lights!";
        break;
      case 5:
        hint = "Static on the radio! Walk over to the Space Radio Dish on the rock terrace and swivel the beam until we lock onto Earth at 100 percent!";
        break;
      case 6:
        hint = "Hop on the Lunar Rover! Drive across the terrain with W, A, S, D and scoop up 5 blue ice crystals to power our geological science lab!";
        break;
      case 7:
        hint = "Today is our final Sol on the Moon! Visit each station and stamp our commander seal of approval to complete our seven-day mission!";
        break;
      default:
        hint = "Keep your four astronauts safe and happy, Commander!";
    }

    this.speakOrbit(hint);
  }
}
