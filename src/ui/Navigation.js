import { MISSION_DATA } from '../data/mission.js';
import { BUILDINGS_DATA } from '../data/buildings.js';

/**
 * Game Screen Navigation Manager
 * Friendly, kid-friendly flow with interactive "How to Play with ORBIT" tutorial screen
 */
export class Navigation {
  constructor(options) {
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

      <!-- SCREEN 2: MISSION BRIEFING -->
      <section id="screen-briefing" class="game-screen">
        <div class="briefing-container">
          <div class="briefing-header">
            <div class="badge-pill">
              <span class="pulse-indicator"></span>
              <span>YOUR MISSION ASSIGNMENT 📋</span>
            </div>
            <h2 class="briefing-title">MEET YOUR CREW & BASE!</h2>
            <p class="briefing-objective">
              <strong>YOUR GOAL:</strong> Keep your 4 space friends safe, warm, and happy while exploring the Moon base!
            </p>
          </div>

          <div class="briefing-crew-section">
            <h3 class="section-heading">YOUR 4 ASTRONAUT FRIENDS</h3>
            <div class="crew-cards-row">
              ${MISSION_DATA.crew.map(c => `
                <div class="crew-card">
                  <div class="crew-avatar" style="border-color: ${c.avatarColor}">
                    <span>${c.name.split(' ')[1] ? c.name.split(' ')[1][0] : 'A'}</span>
                  </div>
                  <div class="crew-details">
                    <span class="crew-name">${c.name}</span>
                    <span class="crew-role">${c.role}</span>
                    <div class="crew-status-row">
                      <span class="crew-status-dot"></span>
                      <span>${c.status} • O2: ${c.oxygenLevel}%</span>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="briefing-base-preview">
            <div class="spec-highlight-card">
              <span class="spec-title">BASE TELEMETRY</span>
              <span class="spec-detail">6 Surface Facilities Operational • Autonomous Power Active • Comms Linked</span>
            </div>
          </div>

          <div class="briefing-footer">
            <button id="btn-back-to-welcome" class="btn btn-secondary">← Back to Menu</button>
            <button id="btn-to-how-to-play" class="btn btn-primary btn-large">
              <span>HOW TO PLAY WITH ORBIT 🤖 →</span>
            </button>
          </div>
        </div>
      </section>

      <!-- SCREEN 2.5: HOW TO PLAY WITH THE ROBOT (KID-FRIENDLY TUTORIAL SCREEN) -->
      <section id="screen-how-to-play" class="game-screen">
        <div class="how-to-play-container">
          <div class="htp-robot-banner">
            <div class="htp-robot-avatar">
              <div class="orbit-eye-pulse"></div>
            </div>
            <div class="htp-robot-text">
              <span class="htp-badge">MEET YOUR ROBOT GUIDE</span>
              <h2 class="htp-title">"Hi! I'm ORBIT! Here's how to play!"</h2>
              <p class="htp-subtitle">Exploring the Moon base is super fun and easy. Here are the 4 simple controls:</p>
            </div>
          </div>

          <div class="htp-cards-grid">
            <div class="htp-card">
              <div class="htp-card-icon">🖱️</div>
              <h3 class="htp-card-title">1. Look Around in 3D</h3>
              <p class="htp-card-desc">Click and drag your mouse (or swipe your finger) to spin the Moon base around in any direction!</p>
            </div>

            <div class="htp-card">
              <div class="htp-card-icon">🔍</div>
              <h3 class="htp-card-title">2. Zoom Close & Far</h3>
              <p class="htp-card-desc">Scroll your mouse wheel (or pinch the screen) to get super close to buildings and astronaut friends!</p>
            </div>

            <div class="htp-card">
              <div class="htp-card-icon">👆</div>
              <h3 class="htp-card-title">3. Click to Explore</h3>
              <p class="htp-card-desc">Click any building, rover, or greenhouse to open a fun info card and see what it does!</p>
            </div>

            <div class="htp-card">
              <div class="htp-card-icon">🤖</div>
              <h3 class="htp-card-title">4. Ask ORBIT Anytime</h3>
              <p class="htp-card-desc">Click the <strong>'ORBIT Guide'</strong> button in the top bar whenever you want me to give you a guided tour!</p>
            </div>
          </div>

          <div class="htp-footer">
            <button id="btn-back-to-briefing" class="btn btn-secondary">← Back to Crew</button>
            <button id="btn-enter-colony" class="btn btn-primary btn-large btn-glow-pulse">
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
              <span>🤖 ORBIT Guide</span>
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
    // Welcome Screen -> Go to Briefing
    this.navLayer.querySelector('#btn-start-mission').addEventListener('click', () => {
      this.switchScreen('briefing');
      if (this.options.onStartMission) this.options.onStartMission();
    });

    // Briefing Screen -> Go to How to Play or Back
    this.navLayer.querySelector('#btn-back-to-welcome').addEventListener('click', () => {
      this.switchScreen('welcome');
    });

    this.navLayer.querySelector('#btn-to-how-to-play').addEventListener('click', () => {
      this.switchScreen('how-to-play');
    });

    // How to Play Screen -> Go to Colony or Back
    this.navLayer.querySelector('#btn-back-to-briefing').addEventListener('click', () => {
      this.switchScreen('briefing');
    });

    this.navLayer.querySelector('#btn-enter-colony').addEventListener('click', () => {
      this.switchScreen('colony');
      if (this.options.onEnterColony) this.options.onEnterColony();
    });

    // Colony HUD buttons
    this.navLayer.querySelector('#btn-hud-orbit').addEventListener('click', () => {
      if (this.options.onReplayOrbit) this.options.onReplayOrbit();
    });

    this.navLayer.querySelector('#btn-hud-reset-cam').addEventListener('click', () => {
      if (this.options.onResetCamera) this.options.onResetCamera();
    });

    this.navLayer.querySelector('#btn-hud-mission-ctrl').addEventListener('click', () => {
      if (this.options.onOpenMissionControl) {
        this.options.onOpenMissionControl();
      }
    });

    this.navLayer.querySelector('#btn-hud-menu').addEventListener('click', () => {
      this.switchScreen('welcome');
    });

    // Quick dock building buttons
    this.navLayer.querySelectorAll('.dock-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
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
