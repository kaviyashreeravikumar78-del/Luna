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
import '../styles/survival.css';

/**
 * LUNA: Mission Survival - Module 2 & 3: Mission Control Master Scene
 * Combines 3D animated holographic lunar display with live 7-day survival simulation engine.
 */
export class MissionControlScene {
  constructor(options) {
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

    // 1. Mission Header with animated audio spectrum visualizer
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

    // Top Holographic 3D Status Banner
    const holoBanner = document.createElement('div');
    holoBanner.className = 'mc-holo-banner';
    holoBanner.innerHTML = `
      <div class="mc-holo-canvas-box" id="mc-holo-canvas-box"></div>
      <div class="mc-holo-text-box">
        <div style="display:flex; align-items:center; gap:8px;">
          <span class="mc-holo-tag">HOLOGRAPHIC TELEMETRY LINK</span>
          <span class="crew-live-dot">● SATELLITE RADAR ACTIVE</span>
        </div>
        <h2 class="mc-holo-heading">Outpost LUNA-01 • South Pole Shackleton Rim</h2>
        <p class="mc-holo-sub">Autonomous closed-loop life support synchronized. Orbital satellite constellation sweep active with NASA Deep Space Network.</p>
        <div class="mc-holo-coords-row">
          <span class="mc-holo-coord">LAT: 89.9° S</span>
          <span class="mc-holo-coord">LON: 0.0° E</span>
          <span class="mc-holo-coord">ALT: 1,737 km</span>
          <span class="mc-holo-coord" style="color:#06D6A0;">UPLINK: 5 BARS ✅</span>
        </div>
      </div>
    `;
    this.deckBody.appendChild(holoBanner);

    // Sol Action HUD Bar (Module 3 Survival Engine Trigger)
    this.survivalBar = document.createElement('div');
    this.survivalBar.className = 'mc-survival-action-bar';
    this.survivalBar.id = 'mc-survival-action-bar';
    this.deckBody.appendChild(this.survivalBar);

    // 2. Resource Panel (Animated Liquid Tanks)
    this.resourcePanel = new ResourcePanel();
    this.deckBody.appendChild(this.resourcePanel.element);

    // 3. Crew Panel (Live ECG Heartbeat Oscilloscopes)
    this.crewPanel = new CrewPanel();
    this.deckBody.appendChild(this.crewPanel.element);

    // 4. Facility Panel (Radar Sweeps & Telemetry Strips)
    this.facilityPanel = new FacilityPanel({
      onViewInColony: (facilityId) => {
        if (this.options.onViewInColony) this.options.onViewInColony(facilityId);
      }
    });
    this.deckBody.appendChild(this.facilityPanel.element);

    // 5. Timeline Panel
    this.timelinePanel = new TimelinePanel();
    this.deckBody.appendChild(this.timelinePanel.element);

    this.container.appendChild(this.deckBody);

    // 6. Dedicated ORBIT Assistant Tutorial
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
        <div class="mc-survival-info">
          <span class="mc-survival-sol-pill" style="background:#FFB703; color:#06101E;">
            ${state.missionStatus === 'completed' ? '🏆 MISSION COMPLETE' : '❌ EXPEDITION FAILED'}
          </span>
          <div>
            <h3 class="mc-survival-event-title">${state.finalReport ? state.finalReport.outcomeTitle : 'Seven-Day Expedition Concluded'}</h3>
            <p class="mc-survival-event-sub">All 7 simulated Sols recorded. Review final commander survival debrief.</p>
          </div>
        </div>
        <button class="btn-mc-survival-action" id="btn-open-final-report">
          <span>View Mission Report 🏆</span>
        </button>
      `;
      this.survivalBar.querySelector('#btn-open-final-report').addEventListener('click', () => {
        this.reportModal.show(state.finalReport || MissionResult.evaluate(state));
      });
      return;
    }

    if (!isDecided && event) {
      this.survivalBar.innerHTML = `
        <div class="mc-survival-info">
          <span class="mc-survival-sol-pill">SOL ${state.currentDay} OF 7 • MISSION ACTIVE</span>
          <div>
            <h3 class="mc-survival-event-title">${event.title}</h3>
            <p class="mc-survival-event-sub">3D physical mission ready! Take direct command in the lunar colony.</p>
          </div>
        </div>
        <button class="btn-mc-survival-action" id="btn-open-sol-event">
          <span>Start 3D Mission: ${event.facilityName || 'Colony'} 🚀</span>
        </button>
      `;
      this.survivalBar.querySelector('#btn-open-sol-event').addEventListener('click', async () => {
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
        <div class="mc-survival-info">
          <span class="mc-survival-sol-pill" style="background:#06D6A0; color:#06101E;">SOL ${state.currentDay} COMPLETE</span>
          <div>
            <h3 class="mc-survival-event-title">Orders Executed: ${state.lastDecisionResult ? state.lastDecisionResult.tag : 'Systems Nominal'}</h3>
            <p class="mc-survival-event-sub">Ready to advance to Sol ${nextSol}. Baseline daily consumption will be calculated.</p>
          </div>
        </div>
        <button class="btn-mc-survival-action" id="btn-advance-sol-bar">
          <span>${nextSol > 7 ? 'View Final Mission Report 🏆' : `Advance to Sol ${nextSol} 🚀`}</span>
        </button>
      `;
      this.survivalBar.querySelector('#btn-advance-sol-bar').addEventListener('click', () => {
        this.summaryModal.show(state);
      });
    }
  }

  /**
   * Expansive 3D rotating holographic wireframe moon with 3 satellites,
   * sweeping radar cone, crater telemetry nodes, and South Pole base marker
   */
  init3DHologram() {
    const box = this.container.querySelector('#mc-holo-canvas-box');
    if (!box) return;

    this.holoScene = new THREE.Scene();
    this.holoCamera = new THREE.PerspectiveCamera(45, 260 / 175, 0.1, 100);
    this.holoCamera.position.set(0, 2.2, 4.8);
    this.holoCamera.lookAt(0, 0, 0);

    this.holoRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.holoRenderer.setSize(260, 175);
    this.holoRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    box.appendChild(this.holoRenderer.domElement);

    // 1. Holographic Wireframe Lunar Sphere
    const moonGeo = new THREE.IcosahedronGeometry(1.3, 3);
    const moonWireMat = new THREE.MeshBasicMaterial({
      color: 0x00E5FF,
      wireframe: true,
      transparent: true,
      opacity: 0.55,
    });
    this.holoMoon = new THREE.Mesh(moonGeo, moonWireMat);
    this.holoScene.add(this.holoMoon);

    // Glowing Deep Navy Core
    const coreGeo = new THREE.SphereGeometry(1.25, 20, 20);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x0E2542,
      transparent: true,
      opacity: 0.88,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    this.holoMoon.add(core);

    // South Pole Colony Beacon on Moon Surface
    const basePinGeo = new THREE.ConeGeometry(0.08, 0.35, 8);
    const basePinMat = new THREE.MeshBasicMaterial({ color: 0xFFB703 });
    const basePin = new THREE.Mesh(basePinGeo, basePinMat);
    basePin.position.set(0, -1.35, 0); // South Pole
    basePin.rotation.x = Math.PI;
    this.holoMoon.add(basePin);

    // Crater Telemetry Nodes (Small cyan dots on surface)
    const craterGeo = new THREE.SphereGeometry(0.04, 6, 6);
    const craterMat = new THREE.MeshBasicMaterial({ color: 0x00E5FF });
    const craterCoords = [
      { x: 0.6, y: 0.8, z: 0.7 },
      { x: -0.8, y: 0.2, z: 0.9 },
      { x: 0.9, y: -0.4, z: 0.6 },
      { x: -0.5, y: -0.7, z: 0.8 },
      { x: 0.2, y: 0.5, z: -1.1 }
    ];
    craterCoords.forEach(c => {
      const node = new THREE.Mesh(craterGeo, craterMat);
      node.position.set(c.x, c.y, c.z);
      this.holoMoon.add(node);
    });

    // 2. Three Concentric Tilted Orbital Trajectory Rings
    this.holoSatellites = [];
    const ringConfigs = [
      { radius: 1.8, tiltX: 0.35, tiltZ: 0.1, speed: 0.8, color: 0xE8B76B, satColor: 0x00E5FF, name: 'LRO-Surveyor' },
      { radius: 2.2, tiltX: -0.4, tiltZ: 0.3, speed: -0.6, color: 0x00E5FF, satColor: 0xFFB703, name: 'Artemis-Gateway' },
      { radius: 2.6, tiltX: 0.15, tiltZ: -0.5, speed: 0.45, color: 0x697DAF, satColor: 0x06D6A0, name: 'DSN-Relay' }
    ];

    ringConfigs.forEach(rc => {
      const rGeo = new THREE.RingGeometry(rc.radius - 0.02, rc.radius + 0.02, 48);
      const rMat = new THREE.MeshBasicMaterial({ color: rc.color, side: THREE.DoubleSide, transparent: true, opacity: 0.45 });
      const ring = new THREE.Mesh(rGeo, rMat);
      ring.rotation.x = Math.PI * 0.5 + rc.tiltX;
      ring.rotation.z = rc.tiltZ;
      this.holoScene.add(ring);

      // Satellite body
      const satGroup = new THREE.Group();
      const satBody = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.08), new THREE.MeshBasicMaterial({ color: 0xFFFFFF }));
      satGroup.add(satBody);

      // Solar Wings
      const wing = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.02, 0.06), new THREE.MeshBasicMaterial({ color: rc.satColor }));
      satGroup.add(wing);

      this.holoScene.add(satGroup);
      this.holoSatellites.push({ satGroup, ring, radius: rc.radius, speed: rc.speed, tiltX: rc.tiltX, tiltZ: rc.tiltZ, angle: Math.random() * Math.PI * 2 });
    });

    // 3. Sweeping 360-degree Radar Beam
    const radarGeo = new THREE.RingGeometry(0.1, 2.7, 32, 1, 0, Math.PI * 0.25);
    const radarMat = new THREE.MeshBasicMaterial({
      color: 0x00E5FF,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.22
    });
    this.radarBeam = new THREE.Mesh(radarGeo, radarMat);
    this.radarBeam.rotation.x = Math.PI / 2;
    this.holoScene.add(this.radarBeam);

    // Animation loop
    this.animateHolo = () => {
      this.holoAnimId = requestAnimationFrame(this.animateHolo);
      if (this.container.classList.contains('active')) {
        const time = performance.now() * 0.001;

        // Rotate Moon
        this.holoMoon.rotation.y = time * 0.35;
        this.holoMoon.rotation.x = Math.sin(time * 0.2) * 0.12;

        // Radar Sweep
        if (this.radarBeam) {
          this.radarBeam.rotation.z = -time * 1.5;
        }

        // Orbit Satellites along trajectories
        this.holoSatellites.forEach(s => {
          s.angle += s.speed * 0.025;
          const x = Math.cos(s.angle) * s.radius;
          const y = Math.sin(s.angle) * s.radius * Math.sin(s.tiltX);
          const z = Math.sin(s.angle) * s.radius * Math.cos(s.tiltX);
          s.satGroup.position.set(x, y, z);
          s.satGroup.rotation.y = s.angle;
        });

        this.holoRenderer.render(this.holoScene, this.holoCamera);
      }
    };
    this.animateHolo();
  }

  show() {
    this.container.classList.add('active');
    this.updateFromGameState(gameState);
    setTimeout(() => {
      this.orbitGuide.start(false);
    }, 600);
  }

  hide() {
    this.container.classList.remove('active');
  }

  destroy() {
    if (this.holoAnimId) cancelAnimationFrame(this.holoAnimId);
    if (this.holoRenderer && this.holoRenderer.domElement) {
      this.holoRenderer.domElement.remove();
    }
  }
}
