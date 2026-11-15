import { MISSION_DATA } from '../data/mission.js';
import { BUILDINGS_DATA } from '../data/buildings.js';
import { orbitVoice } from '../audio/OrbitVoice.js';

/**
 * Game Screen Navigation Manager
 * Kid-friendly flow with interactive "How to Play with ORBIT" tutorial screen
 * Redesigned with warm rounded glass aesthetics matching the home screen.
 */
export class Navigation {
  constructor(options = {}) {
    this.options = options; // { onStartMission, onEnterColony, onResetCamera, onReplayOrbit, onSelectBuilding }
    this.currentScreen = 'welcome';
    this.createDOM();
  }

  createDOM() {
    this.navLayer = document.createElement('div');
    this.navLayer.id = 'ui-navigation-layer';
    this.navLayer.className = 'ui-navigation-layer';

    this.navLayer.innerHTML = `
      <!-- SCREEN 1: WELCOME SCREEN -->
      <section id="screen-welcome" class="game-screen active">
        <div class="welcome-container">
          <div class="badge-pill">
            <span class="pulse-indicator"></span>
            <span>MOON MISSION LUNA-01 🌕</span>
          </div>

          <h1 class="main-title">
            <span class="title-white">LUNA:</span><span class="title-orange">MISSION SURVIVAL</span>
          </h1>

          <p class="tagline">"${MISSION_DATA.tagline}"</p>

          <p class="description-blurb">
            You are the Commander of a futuristic Moon base! Take care of your 4 astronaut friends,
            inspect your high-tech buildings, and keep everyone happy and safe for 7 fun days on the Moon.
          </p>

          <div class="welcome-action-box">
            <button id="btn-start-mission" class="btn-glow-large">
              <span>START ADVENTURE 🚀</span>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
          </div>

          <div class="welcome-meta-grid">
            <div class="meta-col">
              <span class="meta-label">WHERE</span>
              <span class="meta-val">${MISSION_DATA.location}</span>
            </div>
            <div class="meta-col">
              <span class="meta-label">TIME</span>
              <span class="meta-val">${MISSION_DATA.durationDays} Moon Days</span>
            </div>
            <div class="meta-col">
              <span class="meta-label">SPACE CREW</span>
              <span class="meta-val">4 Astronaut Friends</span>
            </div>
          </div>
        </div>
      </section>

      <!-- SCREEN 2: HOW TO PLAY WITH ORBIT (KID-FRIENDLY VISUAL TUTORIAL) -->
      <section id="screen-how-to-play" class="game-screen">
        <div class="how-to-play-container">
          <!-- ORBIT Buddy Banner -->
          <div class="htp-robot-banner">
            <div class="htp-orbit-buddy-avatar">
              <svg width="68" height="68" viewBox="0 0 140 160">
                <!-- Mini Creature in Helmet -->
                <circle cx="70" cy="64" r="38" fill="#FDE2D2"/>
                <ellipse cx="45" cy="74" rx="7.5" ry="4.5" fill="#FF6584" opacity="0.75"/>
                <ellipse cx="95" cy="74" rx="7.5" ry="4.5" fill="#FF6584" opacity="0.75"/>
                <ellipse cx="70" cy="69" rx="3.5" ry="2.5" fill="#D95736"/>
                <!-- Happy Eyes ^ ^ -->
                <path d="M 44 65 Q 53 52 62 65" fill="none" stroke="#102C49" stroke-width="4" stroke-linecap="round"/>
                <path d="M 78 65 Q 87 52 96 65" fill="none" stroke="#102C49" stroke-width="4" stroke-linecap="round"/>
                <!-- Smile -->
                <path d="M 61 74 Q 70 85 79 74 Z" fill="#D95736" stroke="#102C49" stroke-width="1.8"/>
                <!-- Helmet -->
                <circle cx="70" cy="64" r="46" fill="rgba(0, 229, 255, 0.15)" stroke="#94A3B8" stroke-width="2.5"/>
              </svg>
            </div>
            <div class="htp-robot-text">
              <div class="badge-pill">
                <span class="pulse-indicator"></span>
                <span>YOUR SPACE COMPANION</span>
              </div>
              <h2 class="htp-title">"Hi! I'm ORBIT! Here's how to explore!"</h2>
              <p class="htp-subtitle">Commander, welcome to Outpost LUNA-01! Look after your 4 astronaut friends and explore your Moon base with these simple controls:</p>
            </div>
          </div>

          <!-- 4 Tutorial Cards Grid -->
          <div class="htp-cards-grid">
            <div class="htp-card">
              <div class="htp-card-icon">🖱️</div>
              <h3 class="htp-card-title">1. Look Around in 3D</h3>
              <p class="htp-card-desc">Click and drag your mouse (or swipe your finger) to spin the Moon base in any direction!</p>
            </div>

            <div class="htp-card">
              <div class="htp-card-icon">🔍</div>
              <h3 class="htp-card-title">2. Zoom Close & Far</h3>
              <p class="htp-card-desc">Scroll your mouse wheel (or pinch your screen) to get super close to buildings and astronaut friends!</p>
            </div>

            <div class="htp-card">
              <div class="htp-card-icon">👆</div>
              <h3 class="htp-card-title">3. Click to Inspect</h3>
              <p class="htp-card-desc">Click any building, rover, or greenhouse to open a fun info card and see how it works!</p>
            </div>

            <div class="htp-card">
              <div class="htp-card-icon">⭐</div>
              <h3 class="htp-card-title">4. Ask ORBIT Anytime</h3>
              <p class="htp-card-desc">Click the <strong>'ORBIT Guide'</strong> button in the top bar whenever you want me to give you a tour!</p>
            </div>
          </div>

          <div class="htp-footer">
            <button id="btn-back-to-welcome" class="btn btn-secondary">← Back to Menu</button>
            <button id="btn-enter-colony" class="btn-glow-large pulse-glow">
              <span>LET'S GO TO THE MOON BASE! 🚀</span>
            </button>
          </div>
        </div>
      </section>

      <!-- SCREEN 3: 3D COLONY HUD OVERLAY -->
      <section id="screen-colony" class="game-screen colony-hud">
        <!-- TOP HUD BAR -->
        <header class="hud-top-bar">
          <div class="hud-left">
            <div class="hud-mission-logo">
              <span class="logo-accent">LUNA</span>-01
            </div>
            <div class="hud-status-badge">
              <span class="pulse-indicator"></span>
              <span>DAY 1 OF 7 • SUNNY ON THE MOON ☀️</span>
            </div>
            <div class="hud-telemetry-item">
              <span class="hud-label">CREW:</span>
              <span class="hud-val text-green">4/4 HEALTHY & HAPPY</span>
            </div>
            <div class="hud-telemetry-item">
              <span class="hud-label">POWER:</span>
              <span class="hud-val text-blue">100% FULL</span>
            </div>
          </div>

          <div class="hud-right">
            <button id="btn-hud-orbit" class="btn-hud btn-hud-robot" title="Ask ORBIT for a tour!">
              <span>⭐ ORBIT Guide</span>
            </button>
            <button id="btn-hud-reset-cam" class="btn-hud" title="Reset 3D Camera">
              <span>🎥 Reset View</span>
            </button>
            <button id="btn-hud-mission-ctrl" class="btn-hud btn-hud-highlight" title="Enter Mission Control">
              <span>🚀 Mission Control</span>
            </button>
            <button id="btn-hud-menu" class="btn-hud" title="Return to Main Menu">
              <span>🏠 Main Menu</span>
            </button>
          </div>
        </header>

        <!-- BOTTOM STRUCTURE QUICK-DOCK -->
        <footer class="hud-bottom-dock">
          <div class="dock-container">
            <span class="dock-label">LOOK AT:</span>
            <div class="dock-buttons">
              <button class="dock-btn" data-building="habitat">🏠 Space House</button>
              <button class="dock-btn" data-building="greenhouse">🌱 Greenhouses</button>
              <button class="dock-btn" data-building="solar_array">⚡ Sun Panels</button>
              <button class="dock-btn" data-building="research_lab">🔬 Science Lab</button>
              <button class="dock-btn" data-building="antenna">📡 Radio Dish</button>
              <button class="dock-btn" data-building="rover">🚜 Moon Rover</button>
            </div>
          </div>
        </footer>
      </section>
    `;

    document.body.appendChild(this.navLayer);
    this.bindEvents();
  }

  bindEvents() {
    // Welcome Screen -> Go directly to How to Play
    const btnStart = this.navLayer.querySelector('#btn-start-mission');
    btnStart.addEventListener('mouseenter', () => orbitVoice.playChirp('hover'));
    btnStart.addEventListener('click', () => {
      orbitVoice.playChirp('click');
      this.switchScreen('how-to-play');
      if (this.options.onStartMission) this.options.onStartMission();
    });

    // How to Play Screen -> Back to Menu or Enter Colony
    const btnBackWel = this.navLayer.querySelector('#btn-back-to-welcome');
    if (btnBackWel) {
      btnBackWel.addEventListener('mouseenter', () => orbitVoice.playChirp('hover'));
      btnBackWel.addEventListener('click', () => {
        orbitVoice.playChirp('click');
        this.switchScreen('welcome');
      });
    }

    const btnEnter = this.navLayer.querySelector('#btn-enter-colony');
    btnEnter.addEventListener('mouseenter', () => orbitVoice.playChirp('hover'));
    btnEnter.addEventListener('click', () => {
      orbitVoice.playChirp('click');
      this.switchScreen('colony');
      if (this.options.onEnterColony) this.options.onEnterColony();
    });

    // Colony HUD buttons
    const btnHudOrbit = this.navLayer.querySelector('#btn-hud-orbit');
    btnHudOrbit.addEventListener('mouseenter', () => orbitVoice.playChirp('hover'));
    btnHudOrbit.addEventListener('click', () => {
      orbitVoice.playChirp('click');
      if (this.options.onReplayOrbit) this.options.onReplayOrbit();
    });

    const btnResetCam = this.navLayer.querySelector('#btn-hud-reset-cam');
    btnResetCam.addEventListener('mouseenter', () => orbitVoice.playChirp('hover'));
    btnResetCam.addEventListener('click', () => {
      orbitVoice.playChirp('click');
      if (this.options.onResetCamera) this.options.onResetCamera();
    });

    const btnMC = this.navLayer.querySelector('#btn-hud-mission-ctrl');
    btnMC.addEventListener('mouseenter', () => orbitVoice.playChirp('hover'));
    btnMC.addEventListener('click', () => {
      orbitVoice.playChirp('click');
      if (this.options.onOpenMissionControl) {
        this.options.onOpenMissionControl();
      }
    });

    const btnMenu = this.navLayer.querySelector('#btn-hud-menu');
    btnMenu.addEventListener('mouseenter', () => orbitVoice.playChirp('hover'));
    btnMenu.addEventListener('click', () => {
      orbitVoice.playChirp('click');
      this.switchScreen('welcome');
    });

    // Quick dock building buttons
    this.navLayer.querySelectorAll('.dock-btn').forEach(btn => {
      btn.addEventListener('mouseenter', () => orbitVoice.playChirp('hover'));
      btn.addEventListener('click', (e) => {
        orbitVoice.playChirp('click');
        const buildingId = e.currentTarget.getAttribute('data-building');
        if (buildingId && this.options.onSelectBuilding) {
          this.options.onSelectBuilding(buildingId);
        }
      });
    });
  }

  switchScreen(screenName) {
    this.currentScreen = screenName;
    const screens = this.navLayer.querySelectorAll('.game-screen');
    screens.forEach(s => s.classList.remove('active'));

    const target = this.navLayer.querySelector(`#screen-${screenName}`);
    if (target) {
      target.classList.add('active');
    }
  }
}
