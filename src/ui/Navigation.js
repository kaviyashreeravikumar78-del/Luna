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

      <!-- SCREEN 2: 3D COLONY HUD OVERLAY -->
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
    // Welcome Screen -> Go directly to Mission Control Deck!
    const btnStart = this.navLayer.querySelector('#btn-start-mission');
    btnStart.addEventListener('mouseenter', () => orbitVoice.playChirp('hover'));
    btnStart.addEventListener('click', () => {
      orbitVoice.playChirp('click');
      this.switchScreen('colony');
      if (this.options.onOpenMissionControl) {
        this.options.onOpenMissionControl();
      }
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
      if (this.options.onReturnToMenu) {
        this.options.onReturnToMenu();
      }
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
