import * as THREE from 'three';
import { level7Audio } from '../audio/Level7Audio.js';
import { Level7HUD } from './Level7HUD.js';
import { LevelTransition } from '../core/LevelTransition.js';
import { orbitVoice } from '../audio/OrbitVoice.js';
import { orbit } from '../components/Orbit.js';
import { ObjectiveBeacon, ClickRippleEffect } from '../core/ObjectiveBeacon.js';
import { gameState } from '../simulation/GameState.js';
import { disposeThreeObject, clearTimerArray } from '../core/disposeHelper.js';
import { createHabitat } from '../objects/Habitat.js';
import { createGreenhouse } from '../objects/Greenhouse.js';
import { createSolarArray } from '../objects/SolarArray.js';
import { createResearchLab } from '../objects/ResearchLab.js';
import { createAntenna } from '../objects/Antenna.js';
import { createLunarRover } from '../objects/LunarRover.js';

/**
 * Level 7 (Day 7 - Final Colony Check & Grand Finale) Dedicated 3D Mini-Game
 * Story: It's the final day of the 7-day lunar expedition! Commander must conduct
 * a final inspection across all 5 colony facilities, solve one quick task at each,
 * and celebrate with fireworks and the LUNA-01 Mission Complete Certificate!
 */
export class Level7Final {
  constructor(game) {
    this.game = game;
    this.scene = game.scene;
    this.camera = game.camera;
    this.cameraManager = game.cameraManager;

    this.levelGroup = new THREE.Group();
    this.levelGroup.name = "Level7_Final_Scene";

    // Timing & State
    this.isActive = false;
    this.isPaused = false;
    this.phase = 0; // 0: Intro, 1: Roaming/Checking, 2: Finale Celebration, 3: Certificate
    this.startTime = 0;
    this.lastActionTime = Date.now();

    // Player & Rover
    this.commander = null;
    this.rover = null;
    this.isDrivingRover = false;
    this.playerPos = new THREE.Vector3(0, 0.3, 2.5);
    this.playerHeading = 0;
    this.touchSteerX = 0;
    this.touchSteerY = 0;
    this.speed = 0;
    this.keys = { forward: false, backward: false, left: false, right: false, action: false };
    this.walkCycle = 0;

    // 5 Facilities
    this.facilities = [
      {
        id: 'solar',
        name: 'Solar Array',
        icon: '☀️',
        pos: new THREE.Vector3(-7.5, 0.05, 0),
        checked: false,
        ringMesh: null,
        beaconGroup: null,
        chal: {
          icon: '☀️🧹',
          title: 'Wipe Solar Panel Dust',
          instruction: 'Dust accumulated overnight on Panel Alpha! Give it a Commander wipe to ensure 100% solar capture.',
          actionLabel: 'WIPE CLEAN ✨',
        }
      },
      {
        id: 'greenhouse',
        name: 'Hydroponic Greenhouses',
        icon: '🌱',
        pos: new THREE.Vector3(7.5, 0.05, -4.5),
        checked: false,
        ringMesh: null,
        beaconGroup: null,
        chal: {
          icon: '🌱💧',
          title: 'Water Thirsty Seedlings',
          instruction: 'The dwarf wheat and lunar strawberries are ready for their morning nutrient shower!',
          actionLabel: 'POUR WATER 🚿',
        }
      },
      {
        id: 'habitat',
        name: 'Main Habitat Hub',
        icon: '🏠',
        pos: new THREE.Vector3(0, 0.05, -4.2),
        checked: false,
        ringMesh: null,
        beaconGroup: null,
        chal: {
          icon: '🏠🔧',
          title: 'Verify Airlock Seal',
          instruction: 'Check the titanium airlock pressure gasket and apply a fresh bead of protective sealant.',
          actionLabel: 'APPLY SEALANT 🧴',
        }
      },
      {
        id: 'antenna',
        name: 'Deep Space Dish',
        icon: '📡',
        pos: new THREE.Vector3(6.5, 0.05, 5.5),
        checked: false,
        ringMesh: null,
        beaconGroup: null,
        chal: {
          icon: '📡📶',
          title: 'Earth Telemetry Calibration',
          instruction: 'Ping the NASA Deep Space Network to transmit our final expedition mission log!',
          actionLabel: 'SEND TELEMETRY ⚡',
        }
      },
      {
        id: 'lab',
        name: 'Research Laboratory',
        icon: '🔬',
        pos: new THREE.Vector3(-6.5, 0.05, 5.5),
        checked: false,
        ringMesh: null,
        beaconGroup: null,
        chal: {
          icon: '🔬⚡',
          title: 'Sample Spectrometer Lock',
          instruction: 'Snap the auxiliary power cable into the rock scanner to preserve the lunar ice specimens.',
          actionLabel: 'CONNECT CABLE 🔌',
        }
      }
    ];

    this.checkedCount = 0;
    this.activeFacility = null;

    // 4 Crew Members
    this.crewAstronauts = [];

    // Grand Finale Fireworks & Celebration Orbit
    this.fireworks = [];
    this.fireworkCount = 200;
    this.celebrationOrbitT = 0;
    this.isCelebration = false;

    // HUD
    this.hud = null;
    this.activeTimers = [];

    // Objective Beacon & Click-to-Move
    this.beacon = null;
    this.ripples = null;
    this.groundMesh = null;
    this.targetDestination = null;
    this.currentGuideTarget = null;
    this.hasPromptedAction = false;
  }

  safeTimeout(fn, ms) {
    const id = setTimeout(() => {
      if (!this.isActive || !this.hud) return;
      fn();
    }, ms);
    this.activeTimers.push(id);
    return id;
  }

  /**
   * Initializes the dedicated Level 7 stage
   */
  init(skipIntro = false, autoStartCinematic = true) {
    this.isActive = true;
    this.scene.add(this.levelGroup);

    // 1. Hide colony structures to isolate dedicated final stage
    this.setColonyVisibility(false);

    // 2. Build 3D Colony with Golden Sunrise Lighting
    this.buildSunriseColony();
    this.buildFacilityBeacons();
    this.buildCrewAstronauts();
    this.buildPlayerAndRover();
    this.buildFireworksParticles();
    this.setupLighting();

    // 3. Setup HUD
    this.initHUD();

    // 4. Setup Camera
    this.setupCamera();

    // 5. Bind Controls
    this.bindControls();

    // 6. Setup 3D Objective Beacon & Click-to-Move
    this.beacon = new ObjectiveBeacon(this.levelGroup);
    this.ripples = new ClickRippleEffect(this.levelGroup);
    this.setupClickToMove();

    // 7. Start Entry Flow
    if (skipIntro) {
      this.startGameplay();
    } else if (autoStartCinematic) {
      this.playEntryCinematic();
    }
  }

  setColonyVisibility(visible) {
    if (this.game.setColonyVisible) {
      this.game.setColonyVisible(visible);
    }
  }

  /**
   * Builds the full colony using existing models with golden sunrise theme
   */
  buildSunriseColony() {
    // 1. Lunar Terrain Platform
    const groundGeo = new THREE.CylinderGeometry(28, 29, 1.4, 48);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x2A3442,
      roughness: 0.9,
      metalness: 0.05,
      flatShading: true,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = -0.7;
    ground.receiveShadow = true;
    this.levelGroup.add(ground);
    this.groundMesh = ground;

    // 2. Add Existing Colony Buildings
    // Habitat
    const habitat = createHabitat();
    habitat.position.set(0, 0, -6.5);
    this.levelGroup.add(habitat);

    // Greenhouses
    const greenhouse = createGreenhouse();
    greenhouse.position.set(7.5, 0, -4.5);
    this.levelGroup.add(greenhouse);

    // Solar Array
    const solar = createSolarArray();
    solar.position.set(-7.5, 0, 0);
    this.levelGroup.add(solar);

    // Antenna
    const antenna = createAntenna();
    antenna.position.set(6.5, 0, 5.5);
    this.levelGroup.add(antenna);

    // Research Lab
    const lab = createResearchLab();
    lab.position.set(-6.5, 0, 5.5);
    this.levelGroup.add(lab);
  }

  /**
   * Builds glowing ground rings and floating beacons for all 5 facilities
   */
  buildFacilityBeacons() {
    this.facilities.forEach(fac => {
      // 1. Glowing ground ring
      const ringGeo = new THREE.RingGeometry(2.0, 2.3, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xFFD166,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(fac.pos.x, 0.05, fac.pos.z);
      this.levelGroup.add(ring);
      fac.ringMesh = ring;

      // 2. Floating beacon marker overhead
      const beaconGroup = new THREE.Group();
      beaconGroup.position.set(fac.pos.x, 3.2, fac.pos.z);

      const beaconRing = new THREE.Mesh(
        new THREE.RingGeometry(0.35, 0.5, 16),
        new THREE.MeshBasicMaterial({ color: 0xFFD166, side: THREE.DoubleSide })
      );
      beaconRing.rotation.x = -Math.PI / 2;
      beaconGroup.add(beaconRing);

      this.levelGroup.add(beaconGroup);
      fac.beaconGroup = beaconGroup;
    });
  }

  /**
   * Builds the 4 astronauts waving and cheering at their stations
   */
  buildCrewAstronauts() {
    const crewConfig = [
      { name: "Dr. Evelyn", color: 0xD95736, pos: [-4.5, 0.3, -4.5] },
      { name: "Marcus", color: 0x3A86FF, pos: [-4.5, 0.3, 0.5] },
      { name: "Dr. Aris", color: 0x06D6A0, pos: [4.5, 0.3, -3.5] },
      { name: "Maya", color: 0xFFD166, pos: [4.5, 0.3, 3.5] },
    ];

    crewConfig.forEach(c => {
      const astro = this.createCheeringAstronaut(c.color, new THREE.Vector3(...c.pos));
      this.crewAstronauts.push(astro);
      this.levelGroup.add(astro.group);
    });
  }

  createCheeringAstronaut(avatarColor, pos) {
    const group = new THREE.Group();
    group.position.copy(pos);

    const suitMat = new THREE.MeshStandardMaterial({ color: 0xF0F4F8, roughness: 0.4 });
    const visorMat = new THREE.MeshStandardMaterial({ color: 0x141B2D, roughness: 0.1, metalness: 0.9 });
    const badgeMat = new THREE.MeshStandardMaterial({ color: avatarColor });

    const scale = 0.55;
    group.scale.set(scale, scale, scale);

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.85, 0.45), suitMat);
    torso.position.y = 1.35;
    group.add(torso);

    const badge = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.25, 0.08), badgeMat);
    badge.position.set(0, 1.45, 0.26);
    group.add(badge);

    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 16), suitMat);
    helmet.position.y = 2.05;
    group.add(helmet);

    const visor = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12, 0, Math.PI, 0, Math.PI * 0.7), visorMat);
    visor.rotation.x = -Math.PI * 0.15;
    visor.position.set(0, 2.05, 0.18);
    group.add(visor);

    // Arms in cheerful wave
    const armGeo = new THREE.CylinderGeometry(0.12, 0.11, 0.6, 8);
    const leftArm = new THREE.Group();
    leftArm.position.set(-0.48, 1.65, 0);
    const lMesh = new THREE.Mesh(armGeo, suitMat);
    lMesh.position.y = -0.3;
    leftArm.add(lMesh);
    group.add(leftArm);

    const rightArm = new THREE.Group();
    rightArm.position.set(0.48, 1.65, 0);
    const rMesh = new THREE.Mesh(armGeo, suitMat);
    rMesh.position.y = -0.3;
    rightArm.add(rMesh);
    group.add(rightArm);

    return { group, leftArm, rightArm };
  }

  buildPlayerAndRover() {
    // 1. Commander on foot
    const cGroup = new THREE.Group();
    cGroup.position.copy(this.playerPos);

    const suitMat = new THREE.MeshStandardMaterial({ color: 0xF0F4F8, roughness: 0.4 });
    const visorMat = new THREE.MeshStandardMaterial({ color: 0x141B2D, roughness: 0.1, metalness: 0.9 });
    const badgeMat = new THREE.MeshStandardMaterial({ color: 0xD95736 });

    const scale = 0.55;
    cGroup.scale.set(scale, scale, scale);

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.85, 0.45), suitMat);
    torso.position.y = 1.35;
    cGroup.add(torso);

    const badge = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.25, 0.08), badgeMat);
    badge.position.set(0, 1.45, 0.26);
    cGroup.add(badge);

    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 16), suitMat);
    helmet.position.y = 2.05;
    cGroup.add(helmet);

    const visor = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12, 0, Math.PI, 0, Math.PI * 0.7), visorMat);
    visor.rotation.x = -Math.PI * 0.15;
    visor.position.set(0, 2.05, 0.18);
    cGroup.add(visor);

    // Limbs
    const armGeo = new THREE.CylinderGeometry(0.12, 0.11, 0.6, 8);
    const leftArm = new THREE.Group();
    leftArm.position.set(-0.48, 1.65, 0);
    const lMesh = new THREE.Mesh(armGeo, suitMat);
    lMesh.position.y = -0.3;
    leftArm.add(lMesh);
    cGroup.add(leftArm);

    const rightArm = new THREE.Group();
    rightArm.position.set(0.48, 1.65, 0);
    const rMesh = new THREE.Mesh(armGeo, suitMat);
    rMesh.position.y = -0.3;
    rightArm.add(rMesh);
    cGroup.add(rightArm);

    const legGeo = new THREE.CylinderGeometry(0.14, 0.13, 0.7, 8);
    const leftLeg = new THREE.Group();
    leftLeg.position.set(-0.22, 0.95, 0);
    const lLegMesh = new THREE.Mesh(legGeo, suitMat);
    lLegMesh.position.y = -0.35;
    leftLeg.add(lLegMesh);
    cGroup.add(leftLeg);

    const rightLeg = new THREE.Group();
    rightLeg.position.set(0.22, 0.95, 0);
    const rLegMesh = new THREE.Mesh(legGeo, suitMat);
    rLegMesh.position.y = -0.35;
    rightLeg.add(rLegMesh);
    cGroup.add(rightLeg);

    this.commander = { group: cGroup, leftArm, rightArm, leftLeg, rightLeg };
    this.levelGroup.add(cGroup);

    // 2. Lunar Rover
    const rGroup = createLunarRover();
    rGroup.position.set(0, 0, 0);
    this.rover = rGroup;
    this.levelGroup.add(rGroup);
  }

  buildFireworksParticles() {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(this.fireworkCount * 3);
    const cols = new Float32Array(this.fireworkCount * 3);
    this.fireworks = [];

    const colors = [
      new THREE.Color(0xFFD166),
      new THREE.Color(0x00E5FF),
      new THREE.Color(0x06D6A0),
      new THREE.Color(0xFF5E57),
      new THREE.Color(0xFFFFFF),
    ];

    for (let i = 0; i < this.fireworkCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 25;
      pos[i * 3 + 1] = 14 + Math.random() * 12;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 25;

      const c = colors[i % colors.length];
      cols[i * 3] = c.r;
      cols[i * 3 + 1] = c.g;
      cols[i * 3 + 2] = c.b;

      this.fireworks.push({
        vx: (Math.random() - 0.5) * 6,
        vy: 2 + Math.random() * 5,
        vz: (Math.random() - 0.5) * 6,
        life: Math.random(),
      });
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));

    const pMat = new THREE.PointsMaterial({
      size: 0.45,
      vertexColors: true,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
    });
    this.fireworksPoints = new THREE.Points(geo, pMat);
    this.levelGroup.add(this.fireworksPoints);
  }

  setupLighting() {
    // Soft Blue Ambient
    this.ambientLight = new THREE.AmbientLight(0x203048, 0.7);
    this.levelGroup.add(this.ambientLight);

    // Low-Angle Golden Sunrise Sun Light
    this.sunLight = new THREE.DirectionalLight(0xFFE8B2, 1.4);
    this.sunLight.position.set(-20, 10, 18);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.levelGroup.add(this.sunLight);
  }

  setupCamera() {
    this.camera.position.set(0, 8.5, 12.0);
    this.camera.lookAt(0, 1.2, 0);

    if (this.cameraManager && this.cameraManager.controls) {
      this.cameraManager.controls.target.set(0, 1.2, 0);
      this.cameraManager.controls.enabled = false;
    }
  }

  initHUD() {
    this.hud = new Level7HUD({
      onPause: () => this.togglePause(),
      onToggleRover: () => this.toggleRoverVehicle(),
      onActionTrigger: () => this.handleActionTrigger(),
      onTouchMove: (x, y) => {
        this.touchSteerX = x;
        this.touchSteerY = y;
      }
    });
  }

  toggleRoverVehicle() {
    this.isDrivingRover = !this.isDrivingRover;
    if (this.hud) this.hud.setRoverButtonState(this.isDrivingRover);

    if (this.isDrivingRover) {
      // Commander hops onto rover
      this.commander.group.visible = false;
      this.rover.position.copy(this.playerPos);
      orbitVoice.speak("Rover ready! Full speed ahead Commander!");
    } else {
      // On foot
      this.commander.group.visible = true;
      this.playerPos.copy(this.rover.position);
      this.commander.group.position.copy(this.playerPos);
      orbitVoice.speak("Exploring on foot!");
    }
  }

  bindControls() {
    this.onKeyDown = (e) => {
      this.lastActionTime = Date.now();
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.keys.forward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.keys.backward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.keys.left = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.keys.right = true;
          break;
        case 'Space':
        case 'KeyE':
          if (!this.keys.action) {
            this.keys.action = true;
            this.handleActionTrigger();
          }
          break;
        case 'KeyR':
          this.toggleRoverVehicle();
          break;
      }
    };

    this.onKeyUp = (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.keys.forward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.keys.backward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.keys.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.keys.right = false;
          break;
        case 'Space':
        case 'KeyE':
          this.keys.action = false;
          break;
      }
    };

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  setupClickToMove() {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.onCanvasPointerDown = (e) => {
      if (
        e.target.closest('.l7-top-bar') ||
        e.target.closest('#l7-touch-dock') ||
        e.target.closest('.l7-modal-backdrop') ||
        e.target.closest('#orbit-companion') ||
        e.target.closest('#luna-orientation-overlay')
      ) {
        return;
      }

      if (this.phase === 0 || this.phase >= 2) return;

      const dom = this.game.renderer.domElement;
      const rect = dom.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      if (this.groundMesh) {
        const hits = this.raycaster.intersectObject(this.groundMesh);
        if (hits.length > 0) {
          const pt = hits[0].point;
          this.targetDestination = { x: pt.x, z: pt.z };
          if (this.ripples) {
            this.ripples.spawn(pt.x, 0.05, pt.z);
          }
        }
      }
    };

    const dom = this.game.renderer.domElement;
    dom.addEventListener('pointerdown', this.onCanvasPointerDown);
  }

  playEntryCinematic() {
    this.phase = 0;
    orbitVoice.speak("Final check, Commander! Visit every glowing building!");

    // Smooth introductory fly-in
    this.camera.position.set(0, 16.0, 20.0);
    this.camera.lookAt(0, 1.0, 0);

    let elapsed = 0;
    const animateCam = () => {
      if (!this.isActive || this.phase !== 0) return;
      elapsed += 0.016;

      this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, 8.5, 0.04);
      this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, 12.0, 0.04);
      this.camera.lookAt(0, 1.2, 0);

      if (elapsed < 2.5) {
        requestAnimationFrame(animateCam);
      } else {
        this.startGameplay();
      }
    };
    requestAnimationFrame(animateCam);
  }

  startGameplay() {
    this.phase = 1; // Roaming & Checking
    this.startTime = Date.now();

    if (this.hud) {
      this.hud.showGoPopup();
      this.hud.setObjective('🏆', 'Visit all 5 facilities!');
    }
  }

  handleActionTrigger() {
    if (this.phase === 1 && this.activeFacility && !this.activeFacility.checked) {
      this.openFacilityChallenge(this.activeFacility);
    }
  }

  openFacilityChallenge(fac) {
    if (this.hud) {
      this.hud.showFacilityChallenge(fac.chal, () => {
        this.completeFacilityCheck(fac);
      });
    }
  }

  completeFacilityCheck(fac) {
    fac.checked = true;
    this.checkedCount++;

    // Turn ground ring green
    if (fac.ringMesh) {
      fac.ringMesh.material.color.setHex(0x06D6A0);
    }
    if (fac.beaconGroup) {
      fac.beaconGroup.visible = false;
    }

    level7Audio.playFacilityCheck(this.checkedCount);
    this.currentGuideTarget = null;
    this.hasPromptedAction = false;

    if (this.hud) {
      this.hud.updateFacilityStatus(fac.id, true);
      this.hud.updateChecklistCount(this.checkedCount, 5);
      this.hud.setObjective('⭐', `${fac.name} Nominal!`);
    }

    orbitVoice.speak(`${fac.name} verified and ready!`);

    if (this.checkedCount >= 5) {
      // Grand Finale Celebration!
      setTimeout(() => {
        this.triggerGrandFinale();
      }, 1000);
    }
  }

  triggerGrandFinale() {
    this.phase = 2; // Celebration Orbit
    this.isCelebration = true;

    level7Audio.playGrandCelebration();
    level7Audio.playFireworks();
    orbitVoice.speak("MISSION SUCCESS! Commander, all systems are 100% verified!");

    if (this.hud) {
      this.hud.setObjective('🎉', 'LUNA-01 Mission Complete!', true);
    }

    // Turn fireworks particles on
    if (this.fireworksPoints) {
      this.fireworksPoints.material.opacity = 1.0;
    }

    // Wait ~4.5 seconds of celebratory fireworks orbit before opening certificate
    setTimeout(() => {
      this.openCertificate();
    }, 4500);
  }

  openCertificate() {
    this.phase = 3;

    // Calculate total stars across all 7 days from GameState
    const totalStars = 21; // Full completion
    const resources = {
      oxygen: Math.round(gameState.resources?.oxygen || 96),
      water: Math.round(gameState.resources?.water || 94),
      food: Math.round(gameState.resources?.food || 95),
      power: Math.round(gameState.resources?.power || 92),
    };

    if (this.hud) {
      this.hud.showCertificate({
        totalStars,
        resources,
        onPlayAgain: () => {
          gameState.reset();
          this.game.exitLevelToMissionControl();
        },
        onExit: () => {
          this.game.exitLevelToMissionControl();
          this.game.handleFinalInspectionSuccess();
        }
      });
    }
  }

  /**
   * Main game loop update
   */
  update(delta, elapsedTime) {
    if (!this.isActive || this.isPaused) return;

    // 1. Move Player or Drive Rover
    if (this.phase === 1) {
      this.updateMovement(delta);
      this.checkFacilityProximity();
    }

    // 2. Animate Waving Crew
    this.updateCrewAnimations(elapsedTime);

    // 3. Update Mini-Map
    if (this.hud) {
      this.hud.updateMinimap(this.playerPos, this.facilities);
    }

    // 4. Update Celebration Fireworks & Orbit (Phase 2)
    if (this.isCelebration) {
      this.updateCelebration(delta, elapsedTime);
    } else {
      this.updateCameraFollow();
    }

    // 5. Update Objective Guidance & Beacon
    this.updateObjectiveGuidance(delta, elapsedTime);
    if (this.beacon) this.beacon.update(delta, elapsedTime);
    if (this.ripples) this.ripples.update(delta);
  }

  updateObjectiveGuidance(delta, elapsedTime) {
    if (this.phase !== 1) {
      if (this.beacon) this.beacon.hide();
      return;
    }

    const unchecked = this.facilities.filter(f => !f.checked);
    if (unchecked.length > 0) {
      let nextFac = unchecked[0];
      let minDist = this.playerPos.distanceTo(nextFac.pos);
      for (let i = 1; i < unchecked.length; i++) {
        const d = this.playerPos.distanceTo(unchecked[i].pos);
        if (d < minDist) {
          minDist = d;
          nextFac = unchecked[i];
        }
      }

      if (this.currentGuideTarget !== nextFac) {
        this.currentGuideTarget = nextFac;
        this.hasPromptedAction = false;
        if (this.beacon) {
          this.beacon.showAt(nextFac.pos.x, 0.1, nextFac.pos.z, 0x00E5FF);
        }
        orbit.flyTo(window.innerWidth - 130, 80);
        orbit.say(`Head over to the ${nextFac.name}! Walk onto the glowing ring and tap INSPECT!`, {
          emotion: 'happy',
          gesture: 'point',
          autoCloseDelay: 3800
        });
      }

      if (minDist < 3.2 && !this.hasPromptedAction) {
        this.hasPromptedAction = true;
        orbit.say(`You're at the ${nextFac.name}! Tap INSPECT or Space to check it!`, {
          emotion: 'happy',
          gesture: 'point',
          autoCloseDelay: 3000
        });
      }
    } else {
      if (this.beacon) this.beacon.hide();
    }
  }

  updateMovement(delta) {
    const moveSpeed = this.isDrivingRover ? 9.5 : 5.0;

    let moveX = 0;
    let moveZ = 0;

    if (this.keys.forward) moveZ -= 1;
    if (this.keys.backward) moveZ += 1;
    if (this.keys.left) moveX -= 1;
    if (this.keys.right) moveX += 1;

    // Mobile touch joystick
    if (Math.abs(this.touchSteerX) > 0.05 || Math.abs(this.touchSteerY) > 0.05) {
      moveX += this.touchSteerX;
      moveZ += this.touchSteerY;
    }

    if (moveX !== 0 || moveZ !== 0) {
      this.targetDestination = null;
    } else if (this.targetDestination) {
      const dx = this.targetDestination.x - this.playerPos.x;
      const dz = this.targetDestination.z - this.playerPos.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 0.4) {
        moveX = dx / dist;
        moveZ = dz / dist;
      } else {
        this.targetDestination = null;
      }
    }

    const len = Math.hypot(moveX, moveZ);
    if (len > 0.05) {
      const dirX = moveX / len;
      const dirZ = moveZ / len;

      let nextX = this.playerPos.x + dirX * moveSpeed * delta;
      let nextZ = this.playerPos.z + dirZ * moveSpeed * delta;

      // Keep within platform radius 24m
      if (Math.hypot(nextX, nextZ) < 24) {
        this.playerPos.x = nextX;
        this.playerPos.z = nextZ;
      }

      this.playerHeading = Math.atan2(dirX, dirZ);

      if (this.isDrivingRover) {
        this.rover.position.copy(this.playerPos);
        this.rover.rotation.y = this.playerHeading;
      } else {
        this.commander.group.position.copy(this.playerPos);
        this.commander.group.rotation.y = this.playerHeading;
        this.walkCycle += delta * 12;
        this.animateLimbs(this.commander, this.walkCycle);
      }
    } else {
      if (!this.isDrivingRover) {
        this.resetLimbs(this.commander);
      }
    }
  }

  checkFacilityProximity() {
    let nearest = null;
    let minDist = 3.2;

    this.facilities.forEach(fac => {
      const d = this.playerPos.distanceTo(fac.pos);
      if (d < minDist) {
        nearest = fac;
      }
    });

    this.activeFacility = nearest;

    if (nearest && !nearest.checked) {
      if (this.hud) {
        this.hud.setObjective(nearest.icon, `Check ${nearest.name}!`);
      }
    } else if (!nearest && this.checkedCount < 5) {
      if (this.hud) {
        this.hud.setObjective('🏆', 'Visit all 5 facilities!');
      }
    }
  }

  animateLimbs(astro, phase) {
    if (astro.leftArm && astro.rightArm) {
      astro.leftArm.rotation.x = Math.sin(phase) * 0.6;
      astro.rightArm.rotation.x = -Math.sin(phase) * 0.6;
    }
    if (astro.leftLeg && astro.rightLeg) {
      astro.leftLeg.rotation.x = -Math.sin(phase) * 0.7;
      astro.rightLeg.rotation.x = Math.sin(phase) * 0.7;
    }
  }

  resetLimbs(astro) {
    if (astro.leftArm) astro.leftArm.rotation.x = 0;
    if (astro.rightArm) astro.rightArm.rotation.x = 0;
    if (astro.leftLeg) astro.leftLeg.rotation.x = 0;
    if (astro.rightLeg) astro.rightLeg.rotation.x = 0;
  }

  updateCrewAnimations(elapsedTime) {
    this.crewAstronauts.forEach((astro, idx) => {
      const wave = Math.sin(elapsedTime * 6 + idx) * 0.6;
      astro.rightArm.rotation.x = -2.2 + wave;
    });
  }

  updateCelebration(delta, elapsedTime) {
    // Slow 360-degree camera orbit around the colony
    this.celebrationOrbitT += delta * 0.35;
    const r = 22;
    this.camera.position.x = Math.sin(this.celebrationOrbitT) * r;
    this.camera.position.z = Math.cos(this.celebrationOrbitT) * r;
    this.camera.position.y = 12 + Math.sin(this.celebrationOrbitT * 2) * 2;
    this.camera.lookAt(0, 1.5, 0);

    // Animate Fireworks particles
    if (this.fireworksPoints) {
      const pos = this.fireworksPoints.geometry.attributes.position.array;
      for (let i = 0; i < this.fireworkCount; i++) {
        const idx = i * 3;
        const fw = this.fireworks[i];

        pos[idx] += fw.vx * delta;
        pos[idx + 1] += fw.vy * delta;
        pos[idx + 2] += fw.vz * delta;

        fw.vy -= delta * 5.0; // Gravity

        if (pos[idx + 1] < 1.0) {
          pos[idx] = (Math.random() - 0.5) * 24;
          pos[idx + 1] = 12 + Math.random() * 10;
          pos[idx + 2] = (Math.random() - 0.5) * 24;
          fw.vy = 2 + Math.random() * 5;
        }
      }
      this.fireworksPoints.geometry.attributes.position.needsUpdate = true;
    }
  }

  updateCameraFollow() {
    // Third-person camera tracking player
    const targetX = this.playerPos.x;
    const targetZ = this.playerPos.z + 9.5;

    this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, targetX, 0.06);
    this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, targetZ, 0.06);
    this.camera.lookAt(this.playerPos.x, 1.2, this.playerPos.z);
  }

  togglePause() {
    this.isPaused = !this.isPaused;
  }

  dispose() {
    this.isActive = false;
    clearTimerArray(this.activeTimers);

    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);

    if (this.onCanvasPointerDown && this.game.renderer) {
      this.game.renderer.domElement.removeEventListener('pointerdown', this.onCanvasPointerDown);
    }

    if (this.beacon) {
      this.beacon.dispose();
      this.beacon = null;
    }
    if (this.ripples) {
      this.ripples.dispose();
      this.ripples = null;
    }

    if (this.hud) {
      this.hud.dispose();
      this.hud = null;
    }

    // Universal Three.js Resource Disposal
    disposeThreeObject(this.levelGroup);
    this.setColonyVisibility(true);

    if (this.cameraManager && this.cameraManager.controls) {
      this.cameraManager.controls.enabled = true;
    }
  }
}
