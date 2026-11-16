import * as THREE from 'three';
import { CONFIG } from './config.js';
import { createLighting } from '../world/createLighting.js';
import { createTerrain } from '../world/createTerrain.js';
import { createEnvironment } from '../world/createEnvironment.js';
import { createColonyDecorations } from '../world/createColonyDecorations.js';

import { createHabitat } from '../objects/Habitat.js';
import { createGreenhouse } from '../objects/Greenhouse.js';
import { createSolarArray } from '../objects/SolarArray.js';
import { createResearchLab } from '../objects/ResearchLab.js';
import { createAntenna } from '../objects/Antenna.js';
import { createLunarRover } from '../objects/LunarRover.js';
import { createAstronauts } from '../objects/Astronaut.js';
import { createOrbitRobot } from '../objects/OrbitRobot.js';

import { ColonyCameraManager } from '../interactions/CameraControls.js';
import { ObjectInteraction } from '../interactions/ObjectInteraction.js';
import { InformationPanel } from '../ui/InformationPanel.js';
import { OrbitTutorial } from '../ui/OrbitTutorial.js';
import { Navigation } from '../ui/Navigation.js';
import { BUILDINGS_DATA } from '../data/buildings.js';
import { MissionControlScene } from '../scenes/MissionControlScene.js';
import { gameState } from '../simulation/GameState.js';
import { PlayerController } from '../gameplay/PlayerController.js';
import { RoverDrivingController } from '../gameplay/RoverDrivingController.js';
import { Adventure3DEngine } from '../gameplay/Adventure3DEngine.js';
import { KidActionOverlay } from '../ui/KidActionOverlay.js';
import { OrbitScienceDebriefModal } from '../ui/OrbitScienceDebriefModal.js';
import { GameHUD } from '../ui/GameHUD.js';
import { orbitVoice } from '../audio/OrbitVoice.js';
import { LevelTransition } from '../core/LevelTransition.js';
import { Level1Power } from '../levels/Level1Power.js';
import { Level2Water } from '../levels/Level2Water.js';
import { Level3Storm } from '../levels/Level3Storm.js';
import { Level5Habitat } from '../levels/Level5Habitat.js';
import { Level6Comms } from '../levels/Level6Comms.js';
import { Level7Final } from '../levels/Level7Final.js';
import { QualityManager } from '../core/QualityManager.js';
import { ErrorHandler } from '../core/ErrorHandler.js';

import '../styles/mission-control.css';
import '../styles/gameplay.css';

/**
 * Main Game Controller - LUNA: Mission Survival
 * Module 1: 3D Lunar Colony & Lighting
 * Module 2: Mission Control Monitoring Deck
 * Module 3: Child-Friendly Action Adventure 3D Survival Engine
 */
export class Game {
  constructor(canvasContainer) {
    this.container = canvasContainer;
    this.clock = new THREE.Clock();
    this.targetOrbitPos = new THREE.Vector3(2.5, 3.5, 5.0);
    this.currentLevel = null;
    this.gameState = gameState;

    this.initThree();
    this.buildWorld();
    this.setupInteractions();
    this.setupUI();
    this.setupGameplay();

    this.qualityManager = new QualityManager(this);
    ErrorHandler.init(this);

    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);

    window.addEventListener('resize', () => this.onWindowResize());
    window.addEventListener('orientationchange', () => {
      setTimeout(() => this.onWindowResize(), 150);
      setTimeout(() => this.onWindowResize(), 350);
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.clock.stop();
      } else {
        this.clock.start();
      }
    });
  }

  initThree() {
    // 1. Scene
    this.scene = new THREE.Scene();

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(
      CONFIG.camera.fov,
      window.innerWidth / window.innerHeight,
      CONFIG.camera.near,
      CONFIG.camera.far
    );
    this.camera.position.set(
      CONFIG.camera.defaultPos.x,
      CONFIG.camera.defaultPos.y,
      CONFIG.camera.defaultPos.z
    );

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Mobile touch action & gesture prevention
    this.renderer.domElement.style.touchAction = 'none';
    this.renderer.domElement.style.userSelect = 'none';
    this.renderer.domElement.style.webkitUserSelect = 'none';

    this.container.appendChild(this.renderer.domElement);

    // 4. Camera Controls Manager
    this.cameraManager = new ColonyCameraManager(this.camera, this.renderer.domElement);
  }

  buildWorld() {
    // Environment, Lighting, Terrain
    this.lighting = createLighting(this.scene);
    this.terrain = createTerrain(this.scene);
    this.environment = createEnvironment(this.scene);

    // Six Essential Structures
    this.habitat = createHabitat();
    this.scene.add(this.habitat);

    this.greenhouse = createGreenhouse();
    this.scene.add(this.greenhouse);

    this.solarArray = createSolarArray();
    this.scene.add(this.solarArray);

    this.researchLab = createResearchLab();
    this.scene.add(this.researchLab);

    this.antenna = createAntenna();
    this.scene.add(this.antenna);

    this.rover = createLunarRover();
    this.scene.add(this.rover);

    // Four Astronaut Characters
    this.astronautData = createAstronauts();
    this.scene.add(this.astronautData.group);

    // 3D ORBIT Robot
    this.orbitRobot = createOrbitRobot();
    this.scene.add(this.orbitRobot);

    // Rich Surface Infrastructure & Decorations (Landing Pad, Cargo Lander, Tanks, Conduits, Lights, Sensors)
    this.decorations = createColonyDecorations(this.scene);

    // Module 3: 3D Facility Warning Indicators
    this.initFacilityAlertRings();
  }

  /**
   * Toggles visibility of all Module 1 colony assets when entering/leaving dedicated mini-games.
   * Significantly reduces draw calls from ~1000 down to < 100 in dedicated levels.
   */
  setColonyVisible(visible) {
    if (this.terrain) this.terrain.visible = visible;
    if (this.decorations && this.decorations.group) this.decorations.group.visible = visible;
    if (this.facilityAlerts) this.facilityAlerts.forEach(ring => { if (ring) ring.visible = visible; });
    if (this.habitat) this.habitat.visible = visible;
    if (this.greenhouse) this.greenhouse.visible = visible;
    if (this.solarArray) this.solarArray.visible = visible;
    if (this.researchLab) this.researchLab.visible = visible;
    if (this.antenna) this.antenna.visible = visible;
    if (this.rover) this.rover.visible = visible;
    if (this.playerAstronaut) this.playerAstronaut.visible = visible;
    if (this.astronautData && this.astronautData.group) this.astronautData.group.visible = visible;
    if (this.orbitRobot) this.orbitRobot.visible = visible;
  }

  initFacilityAlertRings() {
    this.facilityAlerts = new Map();
    const positions = {
      habitat: { x: 0, y: 7.2, z: -2.5 },
      solar_array: { x: -2.8, y: 1.8, z: 3.8 },
      greenhouse: { x: 6.8, y: 3.2, z: -0.6 },
      research_lab: { x: 5.5, y: 3.4, z: 2.2 },
      antenna: { x: 5.2, y: 4.8, z: -5.5 },
    };

    const ringGeo = new THREE.TorusGeometry(1.2, 0.07, 8, 24);
    Object.entries(positions).forEach(([fId, pos]) => {
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xFFAA00,
        transparent: true,
        opacity: 0.85,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(pos.x, pos.y, pos.z);
      ring.visible = false;
      this.scene.add(ring);
      this.facilityAlerts.set(fId, ring);
    });
  }

  setupInteractions() {
    this.infoPanel = new InformationPanel((buildingId) => {
      const bData = BUILDINGS_DATA[buildingId];
      if (bData && bData.cameraView) {
        this.cameraManager.flyTo(bData.cameraView.position, bData.cameraView.target);
      }
    });

    this.interaction = new ObjectInteraction(
      this.scene,
      this.camera,
      this.renderer.domElement,
      (buildingId) => {
        this.infoPanel.show(buildingId);
        const bData = BUILDINGS_DATA[buildingId];
        if (bData && bData.cameraView) {
          this.cameraManager.flyTo(bData.cameraView.position, bData.cameraView.target);
        }
      }
    );
    this.interaction.enabled = false; // Enabled only when exploring the colony directly

    this.tutorial = new OrbitTutorial(
      this.cameraManager,
      this.interaction,
      (targetPos) => {
        if (targetPos) {
          this.targetOrbitPos.set(targetPos.x, targetPos.y, targetPos.z);
        }
      },
      () => {
        console.log("ORBIT Tutorial completed.");
        this.targetOrbitPos.set(2.5, 3.5, 5.0);
        setTimeout(() => {
          this.startSolMission(gameState.currentDay);
        }, 800);
      }
    );
  }

  setupUI() {
    // Module 2: Mission Control Scene Instance
    this.missionControl = new MissionControlScene({
      onReturnToColony: () => {
        this.missionControl.hide();
        this.navigation.switchScreen('colony');
        if (this.gameHUD) this.gameHUD.show();
        if (this.playerController) this.playerController.enabled = true;
        if (this.interaction) this.interaction.enabled = true;
        this.cameraManager.reset(1000);
      },
      onViewInColony: (facilityId) => {
        this.missionControl.hide();
        this.navigation.switchScreen('colony');
        if (this.gameHUD) this.gameHUD.show();
        if (this.playerController) this.playerController.enabled = true;
        if (this.interaction) this.interaction.enabled = true;

        // Center and fly camera to the facility
        const bData = BUILDINGS_DATA[facilityId];
        if (bData && bData.cameraView) {
          this.cameraManager.flyTo(bData.cameraView.position, bData.cameraView.target, 1200);
        }

        // Highlight with 3D glowing beacon
        this.interaction.highlightBuilding(facilityId);

        // Open colony information panel
        setTimeout(() => {
          this.infoPanel.show(facilityId);
        }, 500);
      },
      onPlaySolAction: (event) => {
        this.missionControl.hide();
        this.navigation.switchScreen('colony');
        this.startSolMission(gameState.currentDay);
      }
    });
    document.body.appendChild(this.missionControl.element);

    this.navigation = new Navigation({
      onStartMission: () => {
        if (this.gameHUD) this.gameHUD.hide();
        this.missionControl.show();
      },
      onEnterColony: () => {
        this.cameraManager.reset(1200);
        if (this.gameHUD) this.gameHUD.show();
        // If currentDay was already decided (e.g. reloaded from localStorage), auto-advance to next Sol!
        if (gameState.currentDayDecided && gameState.currentDay < 7) {
          gameState.advanceDay();
          if (this.gameHUD) this.gameHUD.update(gameState);
        }
        
        setTimeout(() => {
          orbit.say("Hello Commander! Walk with W, A, S, D or the Arrow keys. Approach any building to explore!", {
            emotion: 'happy',
            gesture: 'wave'
          });
        }, 1000);
      },
      onResetCamera: () => {
        this.cameraManager.reset(1000);
      },
      onReplayOrbit: () => {
        this.tutorial.replay();
      },
      onOpenMissionControl: () => {
        if (this.gameHUD) this.gameHUD.hide();
        if (this.playerController) this.playerController.enabled = false;
        if (this.interaction) this.interaction.enabled = false;
        this.missionControl.show();
      },
      onScreenChange: (screenName) => {
        const isColony = (screenName === 'colony');
        if (this.playerController) this.playerController.enabled = isColony;
        if (this.interaction) this.interaction.enabled = isColony;
      },
      onReturnToMenu: () => {
        if (this.gameHUD) this.gameHUD.hide();
        if (this.playerController) this.playerController.enabled = false;
        if (this.interaction) this.interaction.enabled = false;
        this.cameraManager.flyTo({ x: 26, y: 21, z: 30 }, { x: 0, y: 1.5, z: 0 }, 1500);
      },
      onSelectBuilding: (buildingId) => {
        this.infoPanel.show(buildingId);
        const bData = BUILDINGS_DATA[buildingId];
        if (bData && bData.cameraView) {
          this.cameraManager.flyTo(bData.cameraView.position, bData.cameraView.target);
        }
      }
    });
  }

  setupGameplay() {
    // 1. Identify Commander Astronaut as player character (index 0)
    this.playerAstronaut = this.astronautData.astronauts[0];

    // 2. Instantiate 3D Player Walking Controller
    this.playerController = new PlayerController(this.playerAstronaut, this.camera, {
      onNearStation: (station) => {
        if (this.gameHUD) {
          this.gameHUD.showProximityPrompt(station, () => {
            this.handleStationAction(station.id);
          });
        }
      },
      onLeaveStation: () => {
        if (this.gameHUD) {
          this.gameHUD.hideProximityPrompt();
        }
      },
      onInteract: (station) => {
        this.handleStationAction(station.id);
      }
    });
    this.playerController.enabled = false; // Enabled only when actively exploring the colony

    // 3. Instantiate 3D Lunar Rover Driving Controller
    this.roverController = new RoverDrivingController(this.rover, this.scene, this.camera, {
      playSFX: (type) => {
        if (this.adventure3D) this.adventure3D.playSFX(type);
      },
      onCollectIce: (collected, total) => {
        if (this.gameHUD) {
          this.gameHUD.updateRoverIce(collected, total);
        }
      },
      onCompleteMission: () => {
        this.completeRoverMission();
      },
      onExitRover: () => {
        this.exitRoverMode();
      },
      onClaimVictory: () => {
        this.startLevel7(false);
      },
      onScoopIce: () => {
        if (this.roverController && this.roverController.active) {
          this.roverController.scoopNextCrystal();
        }
      }
    });

    // 4. Instantiate Child-Friendly 3D Visual Adventure Engine, Touch Overlay & Robot Science Debrief
    this.kidOverlay = new KidActionOverlay();
    this.scienceDebrief = new OrbitScienceDebriefModal();
    this.adventure3D = new Adventure3DEngine(this);

    // 5. In-Game Adventure HUD
    this.gameHUD = new GameHUD({
      onOpenMissionControl: () => {
        this.gameHUD.hide();
        this.missionControl.show();
      },
      onReturnToMenu: () => {
        this.gameHUD.hide();
        this.navigation.switchScreen('welcome');
        this.cameraManager.flyTo({ x: 26, y: 21, z: 30 }, { x: 0, y: 1.5, z: 0 }, 1500);
      },
      onResetCamera: () => {
        this.cameraManager.reset(1000);
      },
      onAdvanceSol: () => {
        const adv = gameState.advanceDay();
        if (adv.completed) {
          this.missionControl.reportModal.show(adv.report);
        } else {
          orbitVoice.speak(`Welcome to Sol ${gameState.currentDay}! Let's check today's mission!`);
          this.startSolMission(gameState.currentDay);
        }
        if (this.gameHUD) this.gameHUD.update(gameState);
      },
      onStartMissionSol: (sol) => {
        this.startSolMission(sol);
      },
      onJoystickMove: (x, y) => {
        if (this.roverController && this.roverController.active) {
          this.roverController.setJoystickInput(x, y);
        } else if (this.playerController) {
          this.playerController.setJoystickInput(x, y);
        }
      },
      onExitRover: () => {
        this.exitRoverMode();
      },
      onClaimVictory: () => {
        this.startSolMission(7);
      },
      onScoopIce: () => {
        if (this.roverController && this.roverController.active) {
          this.roverController.scoopNextCrystal();
        }
      }
    });

    // Sync Game HUD on simulation changes
    gameState.subscribe((state) => {
      if (this.gameHUD) this.gameHUD.update(state);
    });
  }

  prepareForDedicatedLevel() {
    if (this.currentLevel) {
      this.currentLevel.dispose();
      this.currentLevel = null;
    }
    if (this.cameraManager) {
      this.cameraManager.isTransitioning = false;
      if (this.cameraManager.controls) {
        this.cameraManager.controls.enabled = false;
      }
    }
    if (this.gameHUD) this.gameHUD.hide();
    if (this.infoPanel) this.infoPanel.hide();
    if (this.playerController) this.playerController.enabled = false;
    if (this.interaction) this.interaction.enabled = false;
  }

  startLevel1(skipIntro = false) {
    this.prepareForDedicatedLevel();

    // 1. Camera starts zoom toward solar array in colony view
    const bData = BUILDINGS_DATA.solar_array;
    if (bData && bData.cameraView && this.cameraManager) {
      this.cameraManager.flyTo(bData.cameraView.position, bData.cameraView.target, 800);
    }

    // 2. Play smooth circular iris wipe into dedicated Level 1 scene
    LevelTransition.play({
      badge: "SOL 1 • EXPEDITION",
      title: 'DAY 1: <span class="title-accent">POWER UP</span>',
      subtitle: "Lunar dust is blocking the solar panels. Clean them to restore colony power!",
      skipIntro,
      onMidpoint: () => {
        if (this.cameraManager) {
          this.cameraManager.isTransitioning = false;
          if (this.cameraManager.controls) this.cameraManager.controls.enabled = false;
        }
        this.setColonyVisible(false);
        // Instantiate and init dedicated Level 1 scene
        this.currentLevel = new Level1Power(this);
        this.currentLevel.init(skipIntro);
      },
      onComplete: () => {
        console.log("Level 1 (Power Up) stage active and camera framed!");
      }
    });
  }

  startLevel2(skipIntro = false) {
    this.prepareForDedicatedLevel();

    // 1. Camera starts zoom toward rover in colony view
    const bData = BUILDINGS_DATA.rover;
    if (bData && bData.cameraView && this.cameraManager) {
      this.cameraManager.flyTo(bData.cameraView.position, bData.cameraView.target, 800);
    }

    // 2. Play smooth circular iris wipe into dedicated Level 2 scene
    LevelTransition.play({
      badge: "SOL 2 • ROVER EXPEDITION",
      title: 'DAY 2: <span class="title-accent">WATER HUNT</span>',
      subtitle: "Our water is low! Drive the lunar rover to find ice hidden in the dark crater!",
      skipIntro,
      onMidpoint: () => {
        if (this.cameraManager) {
          this.cameraManager.isTransitioning = false;
          if (this.cameraManager.controls) this.cameraManager.controls.enabled = false;
        }
        this.setColonyVisible(false);
        this.currentLevel = new Level2Water(this);
        this.currentLevel.init(skipIntro);
      },
      onComplete: () => {
        console.log("Level 2 (Water Hunt) driving stage active!");
      }
    });
  }

  startLevel3(skipIntro = false) {
    this.prepareForDedicatedLevel();

    // 1. Camera starts zoom toward habitat in colony view
    const bData = BUILDINGS_DATA.habitat;
    if (bData && bData.cameraView && this.cameraManager) {
      this.cameraManager.flyTo(bData.cameraView.position, bData.cameraView.target, 800);
    }

    // 2. Play smooth circular iris wipe into dedicated Level 3 scene
    LevelTransition.play({
      badge: "SOL 3 • SPACE WEATHER ALERT",
      title: 'DAY 3: <span class="title-accent">SOLAR STORM</span>',
      subtitle: "A high-speed solar particle storm is approaching! Get everyone into the shelter!",
      skipIntro,
      onMidpoint: () => {
        if (this.cameraManager) {
          this.cameraManager.isTransitioning = false;
          if (this.cameraManager.controls) this.cameraManager.controls.enabled = false;
        }
        this.setColonyVisible(false);
        this.currentLevel = new Level3Storm(this);
        this.currentLevel.init(skipIntro);
      },
      onComplete: () => {
        console.log("Level 3 (Solar Storm) rescue stage active!");
      }
    });
  }

  startLevel5(skipIntro = false) {
    this.prepareForDedicatedLevel();

    // 1. Camera starts zoom toward habitat in colony view
    const bData = BUILDINGS_DATA.habitat;
    if (bData && bData.cameraView && this.cameraManager) {
      this.cameraManager.flyTo(bData.cameraView.position, bData.cameraView.target, 800);
    }

    // 2. Play smooth circular iris wipe into dedicated Level 5 scene
    LevelTransition.play({
      badge: "SOL 5 • LIFE SUPPORT",
      title: 'DAY 5: <span class="title-accent">HABITAT REPAIR</span>',
      subtitle: "A micro-leak has appeared in the habitat! Find and seal it to restore air pressure!",
      skipIntro,
      onMidpoint: () => {
        if (this.cameraManager) {
          this.cameraManager.isTransitioning = false;
          if (this.cameraManager.controls) this.cameraManager.controls.enabled = false;
        }
        this.setColonyVisible(false);
        this.currentLevel = new Level5Habitat(this);
        this.currentLevel.init(skipIntro);
      },
      onComplete: () => {
        console.log("Level 5 (Habitat Repair) interior stage active!");
      }
    });
  }

  startLevel6(skipIntro = false) {
    this.prepareForDedicatedLevel();

    // 1. Camera starts zoom toward antenna in colony view
    const bData = BUILDINGS_DATA.antenna;
    if (bData && bData.cameraView && this.cameraManager) {
      this.cameraManager.flyTo(bData.cameraView.position, bData.cameraView.target, 800);
    }

    // 2. Play smooth circular iris wipe into dedicated Level 6 scene
    LevelTransition.play({
      badge: "SOL 6 • DEEP SPACE UPLINK",
      title: 'DAY 6: <span class="title-accent">COMMUNICATION</span>',
      subtitle: "Aim the large space radio dish, lock onto the satellite, and transmit our message to Earth!",
      skipIntro,
      onMidpoint: () => {
        if (this.cameraManager) {
          this.cameraManager.isTransitioning = false;
          if (this.cameraManager.controls) this.cameraManager.controls.enabled = false;
        }
        this.setColonyVisible(false);
        this.currentLevel = new Level6Comms(this);
        this.currentLevel.init(skipIntro);
      },
      onComplete: () => {
        console.log("Level 6 (Communication) hilltop stage active!");
      }
    });
  }

  startLevel7(skipIntro = false) {
    this.prepareForDedicatedLevel();

    // 1. Camera starts sweeping view of colony
    if (this.cameraManager) {
      this.cameraManager.flyTo({ x: 0, y: 14, z: 24 }, { x: 0, y: 0, z: 0 }, 1000);
    }

    // 2. Play smooth circular iris wipe into dedicated Level 7 scene
    LevelTransition.play({
      badge: "SOL 7 • MISSION FINALE",
      title: 'DAY 7: <span class="title-accent">FINAL COLONY CHECK</span>',
      subtitle: "Inspect all 5 colony facilities, celebrate with your crew, and earn your Lunar Survival Certificate!",
      skipIntro,
      onMidpoint: () => {
        if (this.cameraManager) {
          this.cameraManager.isTransitioning = false;
          if (this.cameraManager.controls) this.cameraManager.controls.enabled = false;
        }
        this.setColonyVisible(false);
        this.currentLevel = new Level7Final(this);
        this.currentLevel.init(skipIntro);
      },
      onComplete: () => {
        console.log("Level 7 (Final Colony Check) grand finale stage active!");
      }
    });
  }

  exitLevelToMissionControl() {
    LevelTransition.exitToMissionControl(
      () => {
        if (this.currentLevel) {
          this.currentLevel.dispose();
          this.currentLevel = null;
        }
        this.missionControl.show();
      },
      () => {
        console.log("Returned to Mission Control from level.");
      }
    );
  }

  startSolMission(sol) {
    if (!this.adventure3D) return;

    const solNum = Number(sol) || gameState.currentDay || 1;

    // If currently in rover mode and moving to another Sol, safely exit rover
    if (this.roverController && this.roverController.active && solNum !== 6) {
      this.exitRoverMode();
    }

    // Reset any lingering props/actions
    this.adventure3D.clearLevelProps();
    if (this.kidOverlay) {
      this.kidOverlay.hide();
    }

    switch (solNum) {
      case 1: {
        this.startLevel1(false);
        break;
      }
      case 2: {
        this.startLevel2(false);
        break;
      }
      case 3: {
        this.startLevel3(false);
        break;
      }
      case 4: {
        const bData = BUILDINGS_DATA.greenhouse;
        if (bData && bData.cameraView) {
          this.cameraManager.flyTo(bData.cameraView.position, bData.cameraView.target, 1200);
        }
        if (this.interaction) this.interaction.highlightBuilding('greenhouse');
        setTimeout(() => {
          this.adventure3D.startLevel4Greenhouse(() => this.handleMiniGameSuccess(4, 'choice_4_a'));
        }, 500);
        break;
      }
      case 5: {
        this.startLevel5(false);
        break;
      }
      case 6: {
        this.startLevel6(false);
        break;
      }
      case 7: {
        if (this.interaction) this.interaction.highlightBuilding(null);
        this.startLevel7(false);
        break;
      }
      default:
        break;
    }
  }

  handleStationAction(stationId) {
    const currentSol = gameState.currentDay;
    const isTodayDecided = gameState.currentDayDecided;

    // If today's mission is already complete and user interacts with this station,
    // automatically advance them to the next Sol!
    if (isTodayDecided) {
      if (currentSol < 7) {
        gameState.advanceDay();
        if (this.gameHUD) this.gameHUD.update(gameState);
        orbitVoice.speak(`Advancing to Sol ${gameState.currentDay}!`);
        this.startSolMission(gameState.currentDay);
        return;
      }
      this.infoPanel.show(stationId);
      orbitVoice.speak("All systems for this station are running smoothly, Commander!");
      return;
    }

    // On Sol 7: any station interaction triggers Level 7 dedicated finale!
    if (currentSol === 7) {
      this.startLevel7(false);
      return;
    }

    switch (stationId) {
      case 'solar_array':
        if (currentSol === 1) {
          this.startLevel1(false);
        } else {
          this.infoPanel.show('solar_array');
        }
        break;

      case 'rover':
        if (currentSol === 2) {
          this.startLevel2(false);
        } else {
          this.infoPanel.show('rover');
        }
        break;

      case 'habitat':
        if (currentSol === 2) {
          this.startLevel2(false);
        } else if (currentSol === 3) {
          this.startLevel3(false);
        } else if (currentSol === 5) {
          this.startLevel5(false);
        } else {
          this.infoPanel.show('habitat');
        }
        break;

      case 'greenhouse':
        if (currentSol === 4) {
          this.adventure3D.startLevel4Greenhouse(() => this.handleMiniGameSuccess(4, 'choice_4_a'));
        } else {
          this.infoPanel.show('greenhouse');
        }
        break;

      case 'antenna':
        if (currentSol === 6) {
          this.startLevel6(false);
        } else {
          this.infoPanel.show('antenna');
        }
        break;

      case 'research_lab':
        if (currentSol === 7) {
          this.startLevel7(false);
        } else {
          this.infoPanel.show('research_lab');
        }
        break;

      default:
        this.infoPanel.show(stationId);
    }
  }

  handleMiniGameSuccess(sol, decisionId) {
    if (gameState.currentDay === sol && !gameState.currentDayDecided) {
      const result = gameState.applyDecision(decisionId);
      // Auto-advance to next Sol so the child never gets stuck!
      const adv = gameState.advanceDay();
      if (adv.completed) {
        this.missionControl.reportModal.show(adv.report);
      } else {
        orbitVoice.speak(`Super job Commander! Sol ${sol} mission completed! Advancing to Sol ${gameState.currentDay}!`);
        if (this.gameHUD) this.gameHUD.update(gameState);
        setTimeout(() => {
          this.startSolMission(gameState.currentDay);
        }, 1200);
      }
    } else {
      orbitVoice.speak("Awesome maintenance work Commander! Systems running smoothly!");
    }
    if (this.gameHUD) this.gameHUD.update(gameState);
  }

  startRoverMode() {
    this.roverController.start();
    if (this.playerAstronaut) {
      this.playerAstronaut.visible = false;
    }
    if (this.playerController) {
      this.playerController.enabled = false;
    }
    if (this.cameraManager && this.cameraManager.controls) {
      this.cameraManager.controls.enabled = false;
    }
    if (this.gameHUD) {
      this.gameHUD.showRoverMode(0, 3);
    }
    if (this.kidOverlay) {
      this.kidOverlay.showAction({
        icon: '🧲',
        label: 'TRACTOR-BEAM SCOOP 💎',
        sub: 'Tap to vacuum moon stones into rover!',
        color: '#00E5FF',
        onTrigger: () => {
          this.roverController.scoopNextCrystal();
        }
      });
    }
  }

  completeRoverMission() {
    this.exitRoverMode();

    // 1. Ensure Sol 6 decision is applied
    try {
      if (!gameState.currentDayDecided && gameState.currentDay === 6) {
        gameState.applyDecision('choice_6_a');
      }
    } catch (e) {
      console.warn("Decision 6_a applied:", e);
    }

    // 2. Advance to Sol 7
    try {
      gameState.advanceDay();
    } catch (e) {
      gameState.jumpToDay(7);
    }

    // Always ensure we are on Sol 7 now!
    if (gameState.currentDay < 7) {
      gameState.jumpToDay(7);
    }

    if (this.gameHUD) this.gameHUD.update(gameState);

    // 3. Show Level 6 Science Debrief
    this.showScienceDebrief(6, () => {
      // Upon closing Level 6 debrief, smoothly trigger Sol 7 victory celebration!
      orbitVoice.speak("Welcome to Sol 7, Commander! Today is our final victory celebration on the Moon! You did it!");
      setTimeout(() => {
        this.startSolMission(7);
      }, 500);
    });
  }

  showScienceDebrief(sol, onComplete) {
    if (this.scienceDebrief) {
      this.scienceDebrief.show(sol, () => {
        if (onComplete) onComplete();
      });
    } else if (onComplete) {
      onComplete();
    }
  }

  exitRoverMode() {
    this.roverController.stop();
    if (this.kidOverlay) {
      this.kidOverlay.hide();
    }
    if (this.playerAstronaut) {
      this.playerAstronaut.position.set(this.rover.position.x + 1.6, 0.3, this.rover.position.z + 1.2);
      this.playerAstronaut.visible = true;
    }
    if (this.playerController) {
      this.playerController.enabled = true;
    }
    if (this.cameraManager && this.cameraManager.controls) {
      this.cameraManager.controls.enabled = true;
    }
    if (this.gameHUD) {
      this.gameHUD.hideRoverMode();
    }
    this.cameraManager.reset(800);
  }

  handleFinalInspectionSuccess() {
    if (gameState.currentDay === 7 && !gameState.currentDayDecided) {
      gameState.applyDecision('choice_7_a');
      const adv = gameState.advanceDay();
      if (adv.completed) {
        this.missionControl.reportModal.show(adv.report);
      }
    }
    if (this.gameHUD) this.gameHUD.update(gameState);
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  animate() {
    requestAnimationFrame(this.animate);

    const rawDelta = this.clock.getDelta();
    const delta = Math.min(rawDelta, 0.05); // Clamp to prevent jump on tab resume
    const elapsedTime = this.clock.getElapsedTime();

    if (this.qualityManager) {
      this.qualityManager.update(delta);
    }

    // 1. Camera Manager update
    this.cameraManager.update();

    // 2. Interactive 3D Beacon update (glowing arrow above building)
    if (this.interaction) {
      this.interaction.update(elapsedTime);
    }

    // In Welcome screen or Mission Control: gentle panoramic camera drift over low-poly orange Moon
    const isMCActive = this.missionControl?.container?.classList.contains('active');
    if (!this.currentLevel && (this.navigation.currentScreen === 'welcome' || isMCActive) && !this.cameraManager.isTransitioning) {
      const radius = 28;
      const angle = elapsedTime * 0.05;
      this.camera.position.x = Math.sin(angle) * radius;
      this.camera.position.z = Math.cos(angle) * radius;
      this.camera.position.y = 16 + Math.sin(elapsedTime * 0.1) * 2;
      this.camera.lookAt(0, 1.5, 0);
    }

    // 3. 3D Player Walking Controller update & camera tracking (ONLY when exploring colony)
    if (!this.currentLevel && this.playerController && !this.roverController?.active) {
      this.playerController.update(delta);
      if (this.playerController.isMoving && !this.cameraManager.isTransitioning) {
        // Smoothly guide camera lookAt towards player position
        this.cameraManager.controls.target.lerp(
          new THREE.Vector3(this.playerAstronaut.position.x, 1.2, this.playerAstronaut.position.z),
          delta * 2.5
        );
      }
    }

    // 4. 3D Lunar Rover Driving update (smooth third-person arcade chase camera)
    if (!this.currentLevel && this.roverController && this.roverController.active) {
      this.roverController.update(delta, elapsedTime);
      this.cameraManager.controls.target.set(this.rover.position.x, 1.0, this.rover.position.z);
    }

    // 5. Earth, Celestial and Space Station Rotation
    if (this.environment.earthGroup) {
      this.environment.earthGroup.rotation.y = elapsedTime * 0.04;
    }
    if (this.environment.planetGroup) {
      this.environment.planetGroup.rotation.y = elapsedTime * 0.015;
    }
    if (this.environment.spaceStation) {
      this.environment.spaceStation.rotation.y = elapsedTime * 0.06;
      if (this.environment.spaceStation.userData.strobe) {
        this.environment.spaceStation.userData.strobe.visible = (Math.floor(elapsedTime * 2.0) % 2 === 0);
      }
    }

    // 6. Floating Dust Particles (Expanded 38x38 boundaries)
    if (this.environment.dust) {
      const posAttr = this.environment.dust.geometry.attributes.position;
      const vels = this.environment.dustVelocities;
      for (let i = 0; i < vels.length; i++) {
        let x = posAttr.getX(i) + vels[i].x;
        let y = posAttr.getY(i) + vels[i].y;
        let z = posAttr.getZ(i) + vels[i].z;

        // Reset boundaries for expanded terrain
        if (Math.abs(x) > 23) x = -x;
        if (y < 0.2 || y > 10) y = 5.0;
        if (Math.abs(z) > 23) z = -z;

        posAttr.setXYZ(i, x, y, z);
      }
      posAttr.needsUpdate = true;
    }

    // 7. Antenna Rotation & Blinking Beacon
    if (this.antenna.userData.rotatingHead) {
      this.antenna.userData.rotatingHead.rotation.y = Math.sin(elapsedTime * 0.4) * 0.6;
    }
    if (this.antenna.userData.beaconMesh) {
      const blink = (Math.floor(elapsedTime * 2.5) % 2 === 0);
      this.antenna.userData.beaconMesh.visible = blink;
      if (this.lighting.antennaBeacon) {
        this.lighting.antennaBeacon.intensity = blink ? 2.5 : 0;
      }
    }

    // 8. Solar Panels gentle tracking
    if (this.solarArray.userData.animatedPanels) {
      this.solarArray.userData.animatedPanels.forEach((p, idx) => {
        p.rotation.y = (Math.PI * 0.12) + Math.sin(elapsedTime * 0.15 + idx * 0.2) * 0.04;
      });
    }

    // 9. Rover Gentle Idle (when not actively driven)
    if (this.rover && !this.roverController?.active) {
      this.rover.position.y = 0.45 + Math.sin(elapsedTime * 1.5) * 0.02;
    }

    // 10. Astronauts Animations (Idle bob, arm sway; skips player when moving or driving)
    if (this.astronautData.astronauts) {
      this.astronautData.astronauts.forEach((astro, idx) => {
        if (idx === 0 && (this.playerController?.isMoving || this.roverController?.active)) {
          return;
        }

        const u = astro.userData;
        const speed = 2.0;
        const t = elapsedTime * speed + idx * 1.2;

        astro.position.y = u.initialPos.y + Math.sin(t) * 0.03;

        if (u.leftArm && u.rightArm) {
          u.leftArm.rotation.x = Math.sin(t) * 0.2;
          u.rightArm.rotation.x = -Math.sin(t) * 0.2;
        }

        if (u.leftLeg && u.rightLeg) {
          u.leftLeg.rotation.x = -Math.sin(t * 0.5) * 0.08;
          u.rightLeg.rotation.x = Math.sin(t * 0.5) * 0.08;
        }
      });
    }

    // 11. 3D ORBIT Robot Smooth Flight to Current Building
    if (this.orbitRobot) {
      this.orbitRobot.position.x += (this.targetOrbitPos.x - this.orbitRobot.position.x) * delta * 2.5;
      this.orbitRobot.position.z += (this.targetOrbitPos.z - this.orbitRobot.position.z) * delta * 2.5;
      const hoverY = this.targetOrbitPos.y + Math.sin(elapsedTime * 2.5) * 0.22;
      this.orbitRobot.position.y += (hoverY - this.orbitRobot.position.y) * delta * 3.0;
      this.orbitRobot.rotation.y = Math.sin(elapsedTime * 0.8) * 0.4;
    }

    // 12. Surface Decorations Animations (Runway lights, sensor spindle, beacons, flag)
    if (this.decorations) {
      if (this.decorations.animatedLights) {
        this.decorations.animatedLights.forEach((light) => {
          const pulse = Math.sin(elapsedTime * 4.0 + light.phase);
          light.mesh.visible = pulse > -0.2;
        });
      }

      if (this.decorations.animatedBeacons) {
        const beaconOn = (Math.floor(elapsedTime * 2.0) % 2 === 0);
        this.decorations.animatedBeacons.forEach((b) => {
          b.visible = beaconOn;
        });
      }

      if (this.decorations.sensorSpindle) {
        this.decorations.sensorSpindle.rotation.y = elapsedTime * 3.2;
      }

      if (this.decorations.flagMesh) {
        this.decorations.flagMesh.rotation.y = Math.sin(elapsedTime * 1.8) * 0.08;
      }
    }

    // 13. 3D Facility Warning Indicators (Module 3 Survival Engine)
    if (this.facilityAlerts) {
      const activeEv = gameState.currentDayEvent;
      const isPending = (activeEv && !gameState.currentDayDecided);

      this.facilityAlerts.forEach((ring, fId) => {
        if (this.currentLevel) {
          ring.visible = false;
          return;
        }
        const fac = gameState.facilities[fId];
        const isEventTarget = (isPending && activeEv.facilityId === fId);
        const isDegraded = (fac && fac.condition < 70);

        if (isEventTarget || isDegraded) {
          ring.visible = true;
          ring.rotation.z = elapsedTime * 1.8;
          const pulse = (Math.sin(elapsedTime * 4.5) + 1.2) * 0.4;
          ring.scale.set(1 + pulse * 0.15, 1 + pulse * 0.15, 1);
          ring.material.color.setHex(isEventTarget ? 0xFFAA00 : 0xFF3B30);
        } else {
          ring.visible = false;
        }
      });
    }

    // 14. 3D Visual Adventure Engine Update (Continuous water mist, sparks, fireworks, confetti)
    if (this.adventure3D) {
      this.adventure3D.update(delta, elapsedTime);
    }

    // 15. Update Dedicated Level Scene (e.g. Level 1 Power Up)
    if (this.currentLevel && this.currentLevel.update) {
      this.currentLevel.update(delta, elapsedTime);
    }

    // 16. Render Scene
    this.renderer.render(this.scene, this.camera);
  }
}
