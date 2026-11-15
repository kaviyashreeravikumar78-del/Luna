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
      <section id="screen-colony" class="game-screen colony-hud"></section>
    `;

    document.body.appendChild(this.navLayer);
    this.bindEvents();
  }

  bindEvents() {
    // Welcome Screen -> Go directly to Mission Control Deck!
    const btnStart = this.navLayer.querySelector('#btn-start-mission');
    if (btnStart) {
      btnStart.addEventListener('mouseenter', () => orbitVoice.playChirp('hover'));
      btnStart.addEventListener('click', () => {
        orbitVoice.playChirp('click');
        this.switchScreen('colony');
        if (this.options.onOpenMissionControl) {
          this.options.onOpenMissionControl();
        }
      });
    }
  }

  switchScreen(screenName) {
    this.currentScreen = screenName;
    const screens = this.navLayer.querySelectorAll('.game-screen');
    screens.forEach(s => s.classList.remove('active'));

    const target = this.navLayer.querySelector(`#screen-${screenName}`);
    if (target) {
      target.classList.add('active');
    }

    if (this.options.onScreenChange) {
      this.options.onScreenChange(screenName);
    }
  }
}
