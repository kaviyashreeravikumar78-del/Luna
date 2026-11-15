import * as THREE from 'three';
import { MissionHeader } from '../ui/MissionHeader.js';
import { ResourcePanel } from '../ui/ResourcePanel.js';
import { CrewPanel } from '../ui/CrewPanel.js';
import { FacilityPanel } from '../ui/FacilityPanel.js';
import { TimelinePanel } from '../ui/TimelinePanel.js';
import { MissionControlOrbitGuide } from '../ui/MissionControlOrbitGuide.js';
import { SurvivalEventModal } from '../ui/SurvivalEventModal.js';
import { DecisionResultModal } from '../ui/DecisionResultModal.js';
import { DailySummaryModal } from '../ui/DailySummaryModal.js';
import { MissionReportModal } from '../ui/MissionReportModal.js';
import { gameState } from '../simulation/GameState.js';
import { orbitVoice } from '../audio/OrbitVoice.js';
import '../styles/survival.css';

/**
 * LUNA: Mission Survival - Module 2 & 3: Mission Control Master Scene
 * Redesigned as a kid-friendly game mission-select HUD matching the home screen's visual identity:
 *  - Low-poly moon landscape visible through dark navy frosted glass
 *  - 7-node visual level map timeline
 *  - Big glowing orange pill button for current mission
 *  - 4 big circular animated gauges
 *  - 4 astronaut character cards with ECG lines
 *  - 5 facility icon tiles with OK/Warning LEDs
 */
export class MissionControlScene {
  constructor(options = {}) {
    this.options = options; // { onReturnToColony, onViewInColony, onPlaySolAction }
    this.element = this.createDOM();
    this.init3DHologram();
    this.initSurvivalModals();
    this.setupSimulationSubscription();
  }

  createDOM() {
    this.container = document.createElement('div');
    this.container.id = 'mission-control-view';
    this.container.className = 'mission-control-view';

    // 1. Mission Header (Unclipped, clean game HUD bar)
    this.header = new MissionHeader({
      onReturnToColony: () => {
        if (this.options.onReturnToColony) this.options.onReturnToColony();
      },
      onExplainDashboard: () => {
        this.orbitGuide.replay();
      },
      onResetMission: () => {
        gameState.reset();
      }
    });
    this.container.appendChild(this.header.element);

    // Scrollable Central Command Deck Content
    this.deckBody = document.createElement('main');
    this.deckBody.className = 'mc-deck-body';

    // 2. Day Timeline (7-Node Visual Level Map)
    this.timelinePanel = new TimelinePanel();
    this.deckBody.appendChild(this.timelinePanel.element);

    // 3. Sol Action HUD Bar (Big Glowing Orange Pill Button & Concise Alert Strip)
    this.survivalBar = document.createElement('div');
    this.survivalBar.className = 'mc-survival-action-bar';
    this.survivalBar.id = 'mc-survival-action-bar';
    this.deckBody.appendChild(this.survivalBar);

    // 4. Resource Panel (4 Big Circular Animated Gauges)
    this.resourcePanel = new ResourcePanel();
    this.deckBody.appendChild(this.resourcePanel.element);

    // 5. Crew Panel (4 Astronaut Character Cards)
    this.crewPanel = new CrewPanel();
    this.deckBody.appendChild(this.crewPanel.element);

    // 6. Facility Panel (5 Base Surface Facility Tiles)
    this.facilityPanel = new FacilityPanel({
      onViewInColony: (facilityId) => {
        if (this.options.onViewInColony) this.options.onViewInColony(facilityId);
      }
    });
    this.deckBody.appendChild(this.facilityPanel.element);

    // Optional Holographic Radar Canvas Container (hidden if compact)
    const holoBox = document.createElement('div');
    holoBox.id = 'mc-holo-canvas-box';
    holoBox.style.display = 'none';
    this.deckBody.appendChild(holoBox);

    this.container.appendChild(this.deckBody);

    // 7. ORBIT Companion Guided Tour
    this.orbitGuide = new MissionControlOrbitGuide(() => {
      console.log("Mission Control tutorial completed.");
    });

    return this.container;
  }

  initSurvivalModals() {
    // 1. Daily Event Modal
    this.eventModal = new SurvivalEventModal({
      onSelectDecision: (decisionId) => {
        const result = gameState.applyDecision(decisionId);
        this.resultModal.show(result);
      }
    });

    // 2. Decision Result Modal
    this.resultModal = new DecisionResultModal({
      onContinue: () => {
        this.summaryModal.show(gameState);
      }
    });

    // 3. Daily Summary & Sol Transition Modal
    this.summaryModal = new DailySummaryModal({
      onAdvanceSol: () => {
        const adv = gameState.advanceDay();
        if (adv.completed) {
          this.reportModal.show(adv.report);
        }
      }
    });

    // 4. Final Mission Report Modal
    this.reportModal = new MissionReportModal({
      onRestart: () => {
        gameState.reset();
      }
    });
  }

  setupSimulationSubscription() {
    gameState.subscribe((state) => {
      this.updateFromGameState(state);
    });
    this.updateFromGameState(gameState);
  }

  updateFromGameState(state) {
    this.header.update(state);
    this.resourcePanel.update(state.resources);
    this.crewPanel.update(state.crew);
    this.facilityPanel.update(state.facilities);
    this.timelinePanel.update(state.currentDay, state.currentDayDecided);
    this.renderSurvivalBar(state);
  }

  renderSurvivalBar(state) {
    const isDecided = state.currentDayDecided;
    const isMissionOver = (state.missionStatus === 'completed' || state.missionStatus === 'failed');
    const event = state.currentDayEvent;

    if (isMissionOver) {
      this.survivalBar.innerHTML = `
        <div class="mc-alert-strip">
          <span class="mc-alert-dot gold">●</span>
          <span class="mc-alert-text">
            ${state.missionStatus === 'completed' ? '🏆 7-Day Expedition Successfully Completed!' : '❌ Mission Ended. Review Survival Logs.'}
          </span>
        </div>
        <button class="btn-mc-start-pill btn-glow-large" id="btn-open-final-report">
          <span>VIEW MISSION REPORT 🏆</span>
        </button>
      `;
      const btn = this.survivalBar.querySelector('#btn-open-final-report');
      btn.addEventListener('mouseenter', () => orbitVoice.playChirp('hover'));
      btn.addEventListener('click', () => {
        orbitVoice.playChirp('click');
        this.reportModal.show(state.finalReport || MissionResult.evaluate(state));
      });
      return;
    }

    if (!isDecided && event) {
      this.survivalBar.innerHTML = `
        <div class="mc-alert-strip">
          <span class="mc-alert-dot red">●</span>
          <span class="mc-alert-text">
            <strong>Sol ${state.currentDay}:</strong> ${event.title} • Target: ${event.facilityName || 'Lunar Base'}
          </span>
        </div>
        <button class="btn-mc-start-pill btn-glow-large pulse-glow" id="btn-open-sol-event">
          <span>START MISSION 🚀</span>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </button>
      `;
      const btn = this.survivalBar.querySelector('#btn-open-sol-event');
      btn.addEventListener('mouseenter', () => orbitVoice.playChirp('hover'));
      btn.addEventListener('click', async () => {
        orbitVoice.playChirp('click');
        if (this.options.onPlaySolAction) {
          this.options.onPlaySolAction(event);
        } else {
          let nasaData = null;
          if (event.isNasaEvent) {
            nasaData = await gameState.getNASASepAlert();
          }
          this.eventModal.show(event, nasaData);
        }
      });
    } else {
      const nextSol = state.currentDay + 1;
      this.survivalBar.innerHTML = `
        <div class="mc-alert-strip">
          <span class="mc-alert-dot green">●</span>
          <span class="mc-alert-text">
            <strong>Sol ${state.currentDay} Complete:</strong> Systems nominal! Ready to advance to Sol ${nextSol}.
          </span>
        </div>
        <button class="btn-mc-start-pill btn-glow-large" id="btn-advance-sol-bar">
          <span>${nextSol > 7 ? 'VIEW FINAL REPORT 🏆' : `ADVANCE TO SOL ${nextSol} ➔`}</span>
        </button>
      `;
      const btn = this.survivalBar.querySelector('#btn-advance-sol-bar');
      btn.addEventListener('mouseenter', () => orbitVoice.playChirp('hover'));
      btn.addEventListener('click', () => {
        orbitVoice.playChirp('click');
        this.summaryModal.show(state);
      });
    }
  }

  init3DHologram() {
    const box = this.container.querySelector('#mc-holo-canvas-box');
    if (!box) return;

    this.holoScene = new THREE.Scene();
    this.holoCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    this.holoCamera.position.set(0, 2.2, 4.8);
    this.holoCamera.lookAt(0, 0, 0);

    this.holoRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.holoRenderer.setSize(180, 180);
    this.holoRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    box.appendChild(this.holoRenderer.domElement);

    const moonGeo = new THREE.IcosahedronGeometry(1.3, 3);
    const moonWireMat = new THREE.MeshBasicMaterial({
      color: 0x00E5FF,
      wireframe: true,
      transparent: true,
      opacity: 0.4,
    });
    this.holoMoon = new THREE.Mesh(moonGeo, moonWireMat);
    this.holoScene.add(this.holoMoon);
  }

  show() {
    this.container.classList.add('active');
    this.updateFromGameState(gameState);
    if (this.guideTimeout) clearTimeout(this.guideTimeout);
    this.guideTimeout = setTimeout(() => {
      if (this.container && this.container.classList.contains('active')) {
        this.orbitGuide.start(false);
      }
    }, 700);
  }

  hide() {
    if (this.guideTimeout) {
      clearTimeout(this.guideTimeout);
      this.guideTimeout = null;
    }
    if (this.orbitGuide) {
      this.orbitGuide.skip();
    }
    this.container.classList.remove('active');
  }

  destroy() {
    if (this.holoAnimId) cancelAnimationFrame(this.holoAnimId);
    if (this.holoRenderer && this.holoRenderer.domElement) {
      this.holoRenderer.domElement.remove();
    }
  }
}
