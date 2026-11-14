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
import { SolarPowerGame } from '../minigames/SolarPowerGame.js';
import { SolarStormGame } from '../minigames/SolarStormGame.js';
import { GreenhouseGame } from '../minigames/GreenhouseGame.js';
import { HabitatPatchGame } from '../minigames/HabitatPatchGame.js';
import { AntennaAlignmentGame } from '../minigames/AntennaAlignmentGame.js';
import { FinalInspectionGame } from '../minigames/FinalInspectionGame.js';
import { Adventure3DEngine } from '../gameplay/Adventure3DEngine.js';
import { KidActionOverlay } from '../ui/KidActionOverlay.js';
import { OrbitScienceDebriefModal } from '../ui/OrbitScienceDebriefModal.js';
import { GameHUD } from '../ui/GameHUD.js';
import { orbitVoice } from '../audio/OrbitVoice.js';

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

    this.initThree();
    this.buildWorld();
    this.setupInteractions();
    this.setupUI();
    this.setupGameplay();

    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);

    window.addEventListener('resize', () => this.onWindowResize());
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
        this.cameraManager.reset(1000);
      },
      onViewInColony: (facilityId) => {
        this.missionControl.hide();
        this.navigation.switchScreen('colony');
        if (this.gameHUD) this.gameHUD.show();

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
        if (this.gameHUD) this.gameHUD.show();

        const bData = BUILDINGS_DATA[event.facilityId];
        if (bData && bData.cameraView) {
          this.cameraManager.flyTo(bData.cameraView.position, bData.cameraView.target, 1000, () => {
            this.handleStationAction(event.facilityId);
          });
        } else {
          this.handleStationAction(event.facilityId);
        }
      }
    });
    document.body.appendChild(this.missionControl.element);

    this.navigation = new Navigation({
      onStartMission: () => {
        // Slow cinematic camera pan to welcome the commander
        this.cameraManager.flyTo({ x: 26, y: 21, z: 30 }, { x: 0, y: 1.5, z: 0 }, 1500);
      },
      onEnterColony: () => {
        this.cameraManager.reset(1200);
        if (this.gameHUD) this.gameHUD.show();
        // Start tutorial if first time
        setTimeout(() => {
          this.tutorial.start(false);
        }, 1200);
      },
      onResetCamera: () => {
        this.cameraManager.reset(1000);
      },
      onReplayOrbit: () => {
        this.tutorial.replay();
      },
      onOpenMissionControl: () => {
        if (this.gameHUD) this.gameHUD.hide();
        this.missionControl.show();
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

    // Fallback/reference mini-games
    this.solarPowerGame = new SolarPowerGame({
      onComplete: () => this.handleMiniGameSuccess(1, 'choice_1_a')
    });

    this.habitatPatchGame = new HabitatPatchGame({
      onComplete: () => this.handleMiniGameSuccess(2, 'choice_2_a')
    });

    this.solarStormGame = new SolarStormGame({
      onComplete: () => this.handleMiniGameSuccess(3, 'choice_3_a')
    });

    this.greenhouseGame = new GreenhouseGame({
      onComplete: () => this.handleMiniGameSuccess(4, 'choice_4_a')
    });

    this.antennaAlignmentGame = new AntennaAlignmentGame({
      onComplete: () => this.handleMiniGameSuccess(5, 'choice_5_a')
    });

    this.finalInspectionGame = new FinalInspectionGame({
      onComplete: () => this.handleFinalInspectionSuccess()
    });

    // 5. In-Game Adventure HUD
    this.gameHUD = new GameHUD({
      onOpenMissionControl: () => {
        this.gameHUD.hide();
        this.missionControl.show();
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
        }
        if (this.gameHUD) this.gameHUD.update(gameState);
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

  handleStationAction(stationId) {
    const currentSol = gameState.currentDay;
    const isTodayDecided = gameState.currentDayDecided;

    // If today's mission is already complete and user interacts with this station,
    // don't restart the emergency crisis! Show info panel and notify user!
    if (isTodayDecided && stationId !== 'rover') {
      this.infoPanel.show(stationId);
      orbitVoice.speak("All systems for this station are running smoothly, Commander! Click 'Advance to Sol' in the top bar to continue our mission!");
      return;
    }

    switch (stationId) {
      case 'solar_array':
        if (currentSol === 1) {
          this.adventure3D.startLevel1Solar(() => this.handleMiniGameSuccess(1, 'choice_1_a'));
        } else {
          this.infoPanel.show('solar_array');
        }
        break;

      case 'rover':
        this.adventure3D.startLevel6Rover();
        break;

      case 'habitat':
        if (currentSol === 2) {
          this.adventure3D.startLevel2WaterPipe(() => this.handleMiniGameSuccess(2, 'choice_2_a'));
        } else if (currentSol === 3) {
          this.adventure3D.startLevel3SolarStorm(() => this.handleMiniGameSuccess(3, 'choice_3_a'));
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
        if (currentSol === 5) {
          this.adventure3D.startLevel5Antenna(() => this.handleMiniGameSuccess(5, 'choice_5_a'));
        } else {
          this.infoPanel.show('antenna');
        }
        break;

      case 'research_lab':
        if (currentSol === 6) {
          this.adventure3D.startLevel6Rover();
        } else if (currentSol === 7) {
          this.adventure3D.startLevel7Victory(() => this.handleFinalInspectionSuccess());
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
      this.missionControl.resultModal.show(result);
      orbitVoice.speak(`Super job Commander! Sol ${sol} mission completed! Check out your rewards!`);
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
    if (gameState.currentDay === 6 && !gameState.currentDayDecided) {
      this.showScienceDebrief(6, () => {
        this.handleMiniGameSuccess(6, 'choice_6_a');
      });
    } else if (gameState.currentDay === 2 && !gameState.currentDayDecided) {
      this.showScienceDebrief(2, () => {
        this.handleMiniGameSuccess(2, 'choice_2_a');
      });
    } else {
      orbitVoice.speak("Rover ice scouting mission successful! Water tanks topped off!");
    }
    if (this.gameHUD) this.gameHUD.update(gameState);
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
      this.kidOverlay.hideAction();
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

    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    // 1. Camera Manager update
    this.cameraManager.update();

    // 2. Interactive 3D Beacon update (glowing arrow above building)
    if (this.interaction) {
      this.interaction.update(elapsedTime);
    }

    // In Welcome screen: gentle panoramic camera drift
    if (this.navigation.currentScreen === 'welcome' && !this.cameraManager.isTransitioning) {
      const radius = 28;
      const angle = elapsedTime * 0.05;
      this.camera.position.x = Math.sin(angle) * radius;
      this.camera.position.z = Math.cos(angle) * radius;
      this.camera.position.y = 16 + Math.sin(elapsedTime * 0.1) * 2;
      this.camera.lookAt(0, 1.5, 0);
    }

    // 3. 3D Player Walking Controller update & camera tracking
    if (this.playerController && !this.roverController?.active) {
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
    if (this.roverController && this.roverController.active) {
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

    // 15. Render Scene
    this.renderer.render(this.scene, this.camera);
  }
}
