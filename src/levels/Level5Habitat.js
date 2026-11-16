import * as THREE from 'three';
import { level5Audio } from '../audio/Level5Audio.js';
import { Level5HUD } from './Level5HUD.js';
import { LevelTransition } from '../core/LevelTransition.js';
import { orbitVoice } from '../audio/OrbitVoice.js';
import { orbit } from '../components/Orbit.js';
import { ObjectiveBeacon, ClickRippleEffect } from '../core/ObjectiveBeacon.js';
import { disposeThreeObject, clearTimerArray } from '../core/disposeHelper.js';
import { BUILDINGS_DATA } from '../data/buildings.js';

/**
 * Level 5 (Day 5 - Habitat Repair) Dedicated 3D Mini-Game
 * Story: A micro-meteorite impact or seal fatigue has caused an air leak inside the habitat.
 * Commander must explore the 4 connected habitat rooms, locate both leaks,
 * apply airtight foam sealant, and turn the pressure valve to re-pressurize the base.
 */
export class Level5Habitat {
  constructor(game) {
    this.game = game;
    this.scene = game.scene;
    this.camera = game.camera;
    this.cameraManager = game.cameraManager;

    this.levelGroup = new THREE.Group();
    this.levelGroup.name = "Level5_Habitat_Scene";

    // Timing & Pressure State
    this.isActive = false;
    this.isPaused = false;
    this.phase = 0; // 0: Intro, 1: Find/Seal, 2: Restore Pressure, 3: Win, 4: Fail
    this.pressure = 100; // Starts at 100%
    this.pressureDrainSpeed = 0.48; // ~130 seconds total buffer
    this.startTime = 0;
    this.lastActionTime = Date.now();

    // Player Commander
    this.commander = null;
    this.commanderSpeed = 4.8;
    this.keys = { forward: false, backward: false, left: false, right: false, action: false };
    this.touchMoveX = 0;
    this.touchMoveY = 0;
    this.walkCycle = 0;

    // Leaks
    this.leaks = [];
    this.activeLeak = null;
    this.leaksSealedCount = 0;

    // Pressure Valve Wheel
    this.valveWheel = null;
    this.valveProgress = 0;
    this.isTurningValve = false;
    this.valvePosition = new THREE.Vector3(5.5, 1.2, -4.0);

    // Sonar Leak Detector Ping Wave
    this.sonarRing = null;
    this.sonarActive = false;
    this.sonarRadius = 0;

    // Lighting & Emergency Alert
    this.emergencyLights = [];
    this.isEmergency = true;

    // Waypoint Guide
    this.waypointRing = null;

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
   * Initializes the dedicated Level 5 stage
   */
  init(skipIntro = false) {
    this.isActive = true;
    this.scene.add(this.levelGroup);

    // 1. Hide colony structures to isolate dedicated interior stage
    this.setColonyVisibility(false);

    // 2. Build 3D Interior Habitat Architecture (4 Connected Rooms)
    this.buildHabitatInterior();
    this.buildAirLeaks();
    this.buildPressureValveStation();
    this.buildSonarRing();
    this.setupLighting();

    // 3. Build Player Commander
    this.buildCommander();
    this.buildWaypointMarker();

    // 4. Setup HUD
    this.initHUD();

    // 5. Setup Camera
    this.setupCamera();

    // 6. Bind Keyboard Controls
    this.bindControls();

    // 7. Setup 3D Objective Beacon & Click-to-Move
    this.beacon = new ObjectiveBeacon(this.levelGroup);
    this.ripples = new ClickRippleEffect(this.levelGroup);
    this.setupClickToMove();

    // 8. Start Entry Flow
    if (skipIntro) {
      this.startGameplay();
    } else {
      this.playEntryCinematic();
    }
  }

  setColonyVisibility(visible) {
    if (this.game.setColonyVisible) {
      this.game.setColonyVisible(visible);
    }
  }

  /**
   * Builds the 4 connected interior rooms of Habitat HAB-01:
   * 1. Airlock & Crew Quarters (South)
   * 2. Central Corridor & Pipe Junction (Center)
   * 3. Life Support Storage (West)
   * 4. Pressure Control Bay & Science Terminal (East)
   */
  buildHabitatInterior() {
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0xF0F4F8,
      roughness: 0.35,
      metalness: 0.1,
      flatShading: true,
    });
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x222C38,
      roughness: 0.8,
      metalness: 0.2,
      flatShading: true,
    });
    const trimMat = new THREE.MeshStandardMaterial({
      color: 0x1E293B,
      roughness: 0.5,
      metalness: 0.6,
    });
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x00E5FF,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.45,
    });

    // 1. Flooring
    const floorGeo = new THREE.PlaneGeometry(24, 20);
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0.0;
    floor.receiveShadow = true;
    this.levelGroup.add(floor);
    this.groundMesh = floor;

    // Grid Floor Seams / Grates
    const gridHelper = new THREE.GridHelper(24, 24, 0x00E5FF, 0x334155);
    gridHelper.position.y = 0.02;
    this.levelGroup.add(gridHelper);

    // 2. Outer Perimeter Enclosure Walls (Height: 3.2m)
    const wallH = 3.2;
    const outerWalls = [
      // South Wall (Airlock entrance)
      { size: [24, wallH, 0.5], pos: [0, wallH / 2, 9.8] },
      // North Wall
      { size: [24, wallH, 0.5], pos: [0, wallH / 2, -9.8] },
      // West Wall
      { size: [0.5, wallH, 20], pos: [-11.8, wallH / 2, 0] },
      // East Wall
      { size: [0.5, wallH, 20], pos: [11.8, wallH / 2, 0] },
    ];

    outerWalls.forEach(w => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(...w.size), wallMat);
      mesh.position.set(...w.pos);
      mesh.receiveShadow = true;
      mesh.castShadow = true;
      this.levelGroup.add(mesh);
    });

    // 3. Interior Partition Walls & Doorways
    const partitions = [
      // Wall separating Corridor from Storage (West wall of corridor with 2m door opening)
      { size: [0.4, wallH, 6.0], pos: [-3.5, wallH / 2, -6.5] },
      { size: [0.4, wallH, 4.0], pos: [-3.5, wallH / 2, 4.5] },

      // Wall separating Corridor from Science Bay (East wall of corridor with door opening)
      { size: [0.4, wallH, 6.0], pos: [3.5, wallH / 2, -6.5] },
      { size: [0.4, wallH, 4.0], pos: [3.5, wallH / 2, 4.5] },

      // Horizontal Wall separating Quarters (South) from Corridor (Center) with open doorway
      { size: [7.0, wallH, 0.4], pos: [-7.5, wallH / 2, 2.5] },
      { size: [7.0, wallH, 0.4], pos: [7.5, wallH / 2, 2.5] },
    ];

    partitions.forEach(p => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(...p.size), wallMat);
      mesh.position.set(...p.pos);
      mesh.receiveShadow = true;
      mesh.castShadow = true;
      this.levelGroup.add(mesh);

      // Dark metallic baseboard trim
      const trimMesh = new THREE.Mesh(new THREE.BoxGeometry(p.size[0] * 1.02, 0.25, p.size[2] * 1.02), trimMat);
      trimMesh.position.set(p.pos[0], 0.12, p.pos[2]);
      this.levelGroup.add(trimMesh);
    });

    // 4. Room Decor & Furniture
    // Room 1 (South): Bunks & Observation Cupola Window
    const windowMesh = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.3, 24), glassMat);
    windowMesh.rotation.x = Math.PI / 2;
    windowMesh.position.set(0, 1.8, 9.6);
    this.levelGroup.add(windowMesh);

    // Astronaut Bunks
    [-5.5, 5.5].forEach(x => {
      const bunk = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.2, 3.2), wallMat);
      bunk.position.set(x, 0.6, 6.5);
      this.levelGroup.add(bunk);
    });

    // Room 3 (West - Storage): Oxygen Tanks & Crates
    [[-6.5, -4.5], [-8.5, -5.5], [-9.5, -3.5]].forEach((pos, idx) => {
      const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 2.2, 12), trimMat);
      tank.position.set(pos[0], 1.1, pos[1]);
      this.levelGroup.add(tank);
    });

    // Room 4 (East - Science & Control): Computer Consoles
    const consoleGeo = new THREE.BoxGeometry(3.5, 1.1, 1.2);
    const consoleMesh = new THREE.Mesh(consoleGeo, trimMat);
    consoleMesh.position.set(8.5, 0.55, -4.0);
    this.levelGroup.add(consoleMesh);

    // Glowing screen panels
    const screenGeo = new THREE.PlaneGeometry(1.2, 0.6);
    const screenMat = new THREE.MeshBasicMaterial({ color: 0x00E5FF });
    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.set(8.5, 1.3, -3.5);
    screen.rotation.y = -Math.PI / 2;
    this.levelGroup.add(screen);

    // Overhead life support pipes along corridor ceiling
    const pipeMat = new THREE.MeshStandardMaterial({ color: 0xD0D7DE, metalness: 0.7, roughness: 0.3 });
    const pipeGeo = new THREE.CylinderGeometry(0.12, 0.12, 18, 12);
    const mainPipe = new THREE.Mesh(pipeGeo, pipeMat);
    mainPipe.rotation.x = Math.PI / 2;
    mainPipe.position.set(1.5, 2.8, 0);
    this.levelGroup.add(mainPipe);
  }

  /**
   * Builds the 2 Air Leaks with glowing crack geometry and hissing particle streams
   */
  buildAirLeaks() {
    // Leak 1: Small crack on wall pipe in Corridor
    // Leak 2: Large crack on storage manifold tank in Room 3
    const leakConfigs = [
      {
        id: 'leak_1',
        name: 'Corridor Micro-Fracture',
        size: 'small',
        pos: new THREE.Vector3(2.8, 1.2, 1.2),
        crackScale: [0.6, 0.12, 0.1],
        particleCount: 60,
        sprayDir: new THREE.Vector3(-1.0, 0.2, 0.0),
        spraySpeed: 2.2,
      },
      {
        id: 'leak_2',
        name: 'Storage Manifold Breach',
        size: 'big',
        pos: new THREE.Vector3(-7.5, 0.9, -2.5),
        crackScale: [1.1, 0.22, 0.15],
        particleCount: 110,
        sprayDir: new THREE.Vector3(0.5, 0.4, 0.8),
        spraySpeed: 3.5,
      }
    ];

    leakConfigs.forEach(cfg => {
      const leakGroup = new THREE.Group();
      leakGroup.position.copy(cfg.pos);

      // 1. Glowing fissure / crack
      const crackGeo = new THREE.BoxGeometry(...cfg.crackScale);
      const crackMat = new THREE.MeshBasicMaterial({ color: 0x00E5FF });
      const crackMesh = new THREE.Mesh(crackGeo, crackMat);
      leakGroup.add(crackMesh);

      // 2. Foam seal mesh (expands as player seals it)
      const foamGeo = new THREE.BoxGeometry(cfg.crackScale[0] * 1.2, cfg.crackScale[1] * 1.5, 0.3);
      const foamMat = new THREE.MeshStandardMaterial({
        color: 0xFFFFFF,
        roughness: 0.9,
        metalness: 0.0,
        transparent: true,
        opacity: 0.0,
      });
      const foamMesh = new THREE.Mesh(foamGeo, foamMat);
      foamMesh.position.z = 0.08;
      leakGroup.add(foamMesh);

      // 3. Overhead pulsing call ring
      const callRing = new THREE.Mesh(
        new THREE.RingGeometry(0.3, 0.45, 16),
        new THREE.MeshBasicMaterial({ color: 0xFFB703, side: THREE.DoubleSide })
      );
      callRing.rotation.x = -Math.PI / 2;
      callRing.position.y = 1.0;
      leakGroup.add(callRing);

      // 4. Air particle stream
      const pGeo = new THREE.BufferGeometry();
      const pPos = new Float32Array(cfg.particleCount * 3);
      const pVels = [];

      for (let i = 0; i < cfg.particleCount; i++) {
        pPos[i * 3] = (Math.random() - 0.5) * 0.1;
        pPos[i * 3 + 1] = (Math.random() - 0.5) * 0.1;
        pPos[i * 3 + 2] = (Math.random() - 0.5) * 0.1;

        pVels.push({
          x: cfg.sprayDir.x * cfg.spraySpeed + (Math.random() - 0.5) * 0.8,
          y: cfg.sprayDir.y * cfg.spraySpeed + (Math.random() - 0.5) * 0.8,
          z: cfg.sprayDir.z * cfg.spraySpeed + (Math.random() - 0.5) * 0.8,
          life: Math.random(),
        });
      }

      pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
      const pMat = new THREE.PointsMaterial({
        size: 0.18,
        color: 0x00E5FF,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
      });
      const particles = new THREE.Points(pGeo, pMat);
      leakGroup.add(particles);

      this.levelGroup.add(leakGroup);

      this.leaks.push({
        ...cfg,
        group: leakGroup,
        crackMesh,
        foamMesh,
        foamMat,
        callRing,
        particles,
        particlePositions: pPos,
        particleVelocities: pVels,
        sealProgress: 0,
        isSealed: false,
      });
    });
  }

  /**
   * Builds the Big Pressure Valve Wheel Station in Room 4
   */
  buildPressureValveStation() {
    const valveGroup = new THREE.Group();
    valveGroup.position.copy(this.valvePosition);

    const metalMat = new THREE.MeshStandardMaterial({ color: 0xD0D7DE, metalness: 0.8, roughness: 0.2 });
    const redMat = new THREE.MeshStandardMaterial({ color: 0xFF5E57, roughness: 0.4 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x1E293B, roughness: 0.5 });

    // Mounting pylon pipe
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 1.4, 16), darkMat);
    stand.position.y = -0.5;
    valveGroup.add(stand);

    // Center hub spindle
    const spindle = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.5, 12), metalMat);
    spindle.rotation.x = Math.PI / 2;
    valveGroup.add(spindle);

    // Rotating Wheel (Torus + Spokes)
    const wheelGroup = new THREE.Group();
    wheelGroup.position.z = 0.25;

    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.08, 12, 24), redMat);
    wheelGroup.add(rim);

    // 4 Cross spokes
    for (let i = 0; i < 4; i++) {
      const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.05, 8), metalMat);
      spoke.rotation.z = (i * Math.PI) / 4;
      wheelGroup.add(spoke);
    }

    valveGroup.add(wheelGroup);
    this.valveWheel = wheelGroup;

    // Glowing ground ring around valve
    const valveRingGeo = new THREE.RingGeometry(1.2, 1.45, 24);
    this.valveRingMat = new THREE.MeshBasicMaterial({
      color: 0x00E5FF,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.0, // Invisible until leaks are sealed
    });
    const valveRing = new THREE.Mesh(valveRingGeo, this.valveRingMat);
    valveRing.rotation.x = -Math.PI / 2;
    valveRing.position.set(0, -1.15, 0);
    valveGroup.add(valveRing);
    this.valveRingMesh = valveRing;

    this.levelGroup.add(valveGroup);
  }

  /**
   * Handheld Leak Detector Sonar Ring (expanding circle around Commander)
   */
  buildSonarRing() {
    const ringGeo = new THREE.RingGeometry(0.1, 0.25, 32);
    this.sonarRingMat = new THREE.MeshBasicMaterial({
      color: 0x00E5FF,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.0,
    });
    this.sonarRing = new THREE.Mesh(ringGeo, this.sonarRingMat);
    this.sonarRing.rotation.x = -Math.PI / 2;
    this.sonarRing.position.y = 0.08;
    this.levelGroup.add(this.sonarRing);
  }

  setupLighting() {
    // Ambient light
    this.ambientLight = new THREE.AmbientLight(0x1B263B, 0.65);
    this.levelGroup.add(this.ambientLight);

    // Directional light from observation window
    const windowLight = new THREE.DirectionalLight(0xE2E8F0, 0.9);
    windowLight.position.set(0, 8, 14);
    this.levelGroup.add(windowLight);

    // Amber Emergency Warning Point Lights
    const lightPositions = [
      [0, 2.8, 6.0],   // Room 1 (Airlock)
      [0, 2.8, 0.0],   // Room 2 (Corridor)
      [-6.5, 2.8, -3.0], // Room 3 (Storage)
      [6.5, 2.8, -3.0],  // Room 4 (Control Bay)
    ];

    this.emergencyLights = [];
    lightPositions.forEach(pos => {
      const pLight = new THREE.PointLight(0xFFB703, 1.2, 10);
      pLight.position.set(...pos);
      this.levelGroup.add(pLight);
      this.emergencyLights.push(pLight);
    });
  }

  buildCommander() {
    const group = new THREE.Group();
    group.position.set(0, 0.3, 6.5); // Starts walking out from airlock

    const suitMat = new THREE.MeshStandardMaterial({ color: 0xF0F4F8, roughness: 0.4, metalness: 0.1 });
    const visorMat = new THREE.MeshStandardMaterial({ color: 0x141B2D, roughness: 0.1, metalness: 0.9 });
    const badgeMat = new THREE.MeshStandardMaterial({ color: 0xD95736 });
    const bootMat = new THREE.MeshStandardMaterial({ color: 0x333F48, roughness: 0.8 });

    const scale = 0.55;
    group.scale.set(scale, scale, scale);

    // Torso & Badge
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.85, 0.45), suitMat);
    torso.position.y = 1.35;
    torso.castShadow = true;
    group.add(torso);

    const badge = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.25, 0.08), badgeMat);
    badge.position.set(0, 1.45, 0.26);
    group.add(badge);

    // Helmet & Visor
    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 16), suitMat);
    helmet.position.y = 2.05;
    helmet.castShadow = true;
    group.add(helmet);

    const visor = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12, 0, Math.PI, 0, Math.PI * 0.7), visorMat);
    visor.rotation.x = -Math.PI * 0.15;
    visor.position.set(0, 2.05, 0.18);
    group.add(visor);

    // Backpack
    const pack = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.8, 0.3), suitMat);
    pack.position.set(0, 1.35, -0.36);
    group.add(pack);

    // Limbs
    const armGeo = new THREE.CylinderGeometry(0.12, 0.11, 0.6, 8);
    const leftArm = new THREE.Group();
    leftArm.position.set(-0.48, 1.65, 0);
    const lArmMesh = new THREE.Mesh(armGeo, suitMat);
    lArmMesh.position.y = -0.3;
    leftArm.add(lArmMesh);
    group.add(leftArm);

    const rightArm = new THREE.Group();
    rightArm.position.set(0.48, 1.65, 0);
    const rArmMesh = new THREE.Mesh(armGeo, suitMat);
    rArmMesh.position.y = -0.3;
    rightArm.add(rArmMesh);
    group.add(rightArm);

    const legGeo = new THREE.CylinderGeometry(0.14, 0.13, 0.7, 8);
    const bootGeo = new THREE.BoxGeometry(0.26, 0.2, 0.38);

    const leftLeg = new THREE.Group();
    leftLeg.position.set(-0.22, 0.95, 0);
    const lLegMesh = new THREE.Mesh(legGeo, suitMat);
    lLegMesh.position.y = -0.35;
    leftLeg.add(lLegMesh);
    const lBoot = new THREE.Mesh(bootGeo, bootMat);
    lBoot.position.set(0, -0.68, 0.06);
    leftLeg.add(lBoot);
    group.add(leftLeg);

    const rightLeg = new THREE.Group();
    rightLeg.position.set(0.22, 0.95, 0);
    const rLegMesh = new THREE.Mesh(legGeo, suitMat);
    rLegMesh.position.y = -0.35;
    rightLeg.add(rLegMesh);
    const rBoot = new THREE.Mesh(bootGeo, bootMat);
    rBoot.position.set(0, -0.68, 0.06);
    rightLeg.add(rBoot);
    group.add(rightLeg);

    this.commander = {
      group,
      leftArm,
      rightArm,
      leftLeg,
      rightLeg,
    };

    this.levelGroup.add(group);
  }

  buildWaypointMarker() {
    const ringGeo = new THREE.RingGeometry(0.9, 1.15, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00E5FF,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });
    this.waypointRing = new THREE.Mesh(ringGeo, ringMat);
    this.waypointRing.rotation.x = -Math.PI / 2;
    this.waypointRing.position.set(0, 0.04, 0);
    this.levelGroup.add(this.waypointRing);
  }

  setupCamera() {
    // High isometric angle framing the entire interior habitat layout
    this.camera.position.set(0, 14.8, 12.5);
    this.camera.lookAt(0, 1.0, 0);

    if (this.cameraManager && this.cameraManager.controls) {
      this.cameraManager.controls.target.set(0, 1.0, 0);
      this.cameraManager.controls.enabled = false;
    }
  }

  initHUD() {
    this.hud = new Level5HUD({
      onPause: () => this.togglePause(),
      onTouchMove: (nx, ny) => {
        this.touchMoveX = nx;
        this.touchMoveY = ny;
        this.lastActionTime = Date.now();
      },
      onActionDown: () => {
        this.keys.action = true;
        this.handleActionDown();
        this.lastActionTime = Date.now();
      },
      onActionUp: () => {
        this.keys.action = false;
        if (this.hud) this.hud.hideActionProgress();
      }
    });
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
            this.handleActionDown();
          }
          break;
        case 'Escape':
          this.togglePause();
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
          if (this.hud) this.hud.hideActionProgress();
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
        e.target.closest('.l5-top-bar') ||
        e.target.closest('#l5-touch-dock') ||
        e.target.closest('.l5-modal-backdrop') ||
        e.target.closest('#orbit-companion') ||
        e.target.closest('#luna-orientation-overlay')
      ) {
        return;
      }

      if (this.phase === 0 || this.phase >= 3) return;

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

  /**
   * Entry Cinematic with pulsing soft alarm and ORBIT introduction
   */
  playEntryCinematic() {
    this.phase = 0;
    level5Audio.playSoftAlarm();
    orbitVoice.speak("Air is leaking! Let's find it!");

    // Smooth entry camera glide
    this.camera.position.set(0, 7.5, 9.8);
    this.camera.lookAt(0, 1.2, 5.0);

    let elapsed = 0;
    const animateCam = () => {
      if (!this.isActive || this.phase !== 0) return;
      elapsed += 0.016;

      this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, 0, 0.05);
      this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, 14.8, 0.04);
      this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, 12.5, 0.04);
      this.camera.lookAt(0, 1.0, 0);

      // Walk commander into room
      if (this.commander && this.commander.group.position.z > 4.5) {
        this.commander.group.position.z -= 0.04;
        this.walkCycle += 0.2;
        this.animateLimbs(this.commander, this.walkCycle);
      }

      if (elapsed < 3.0) {
        requestAnimationFrame(animateCam);
      } else {
        this.startGameplay();
      }
    };
    requestAnimationFrame(animateCam);
  }

  startGameplay() {
    this.phase = 1; // Find the leaks
    this.startTime = Date.now();
    this.pressure = 100;

    level5Audio.startHiss();

    if (this.hud) {
      this.hud.showGoPopup();
      this.hud.setObjective('🔍', 'Find the air leak!');
    }
  }

  /**
   * Action trigger (Sonar ping or immediate check)
   */
  handleActionDown() {
    if (this.phase === 1) {
      // Trigger handheld sonar ping
      this.triggerSonarPing();
    }
  }

  triggerSonarPing() {
    this.sonarActive = true;
    this.sonarRadius = 0.5;
    if (this.sonarRing) {
      this.sonarRing.position.set(
        this.commander.group.position.x,
        0.05,
        this.commander.group.position.z
      );
      this.sonarRingMat.opacity = 0.85;
    }

    // Measure proximity to nearest unsealed leak
    const prox = this.getNearestLeakProximity();
    level5Audio.playDetectorPing(prox);

    if (this.hud) {
      this.hud.updateDetectorProximity(prox);
    }
  }

  getNearestLeakProximity() {
    const cPos = this.commander.group.position;
    let minDistance = 999;

    this.leaks.forEach(leak => {
      if (!leak.isSealed) {
        const d = cPos.distanceTo(leak.pos);
        if (d < minDistance) minDistance = d;
      }
    });

    // Proximity 0 to 1 (max detection range: 12 meters)
    return Math.max(0, Math.min(1, 1 - (minDistance / 12)));
  }

  /**
   * Main game loop update
   */
  update(delta, elapsedTime) {
    if (!this.isActive || this.isPaused) return;

    // 1. Drain Pressure gradually during leak phases
    if (this.phase === 1) {
      this.pressure -= delta * this.pressureDrainSpeed;
      if (this.pressure <= 15) {
        this.pressure = 15;
        this.onFail();
        return;
      }
      if (this.hud) {
        this.hud.updatePressure(this.pressure);
      }

      // Check inactivity hint
      if (Date.now() - this.lastActionTime > 8000) {
        this.lastActionTime = Date.now();
        this.giveHint();
      }
    }

    // 2. Update Commander Movement
    this.updateCommander(delta);

    // 3. Update Leak Sealing (Phase 1 & 2)
    this.updateLeakSealing(delta);

    // 4. Update Pressure Valve Turning (Phase 3)
    this.updatePressureValve(delta);

    // 5. Update Leak Particles & Hiss Sound
    this.updateAirLeakEffects(delta, elapsedTime);

    // 6. Update Emergency Amber Light Pulsing
    this.updateEmergencyLighting(elapsedTime);

    // 7. Update Sonar Ping Ring
    this.updateSonarWave(delta);

    // 8. Update Waypoint Guide Ring
    this.updateWaypointMarker(elapsedTime);

    // 9. Camera gentle follow
    this.updateCameraFollow();

    // 10. Update Objective Guidance & Beacon
    this.updateObjectiveGuidance(delta, elapsedTime);
    if (this.beacon) this.beacon.update(delta, elapsedTime);
    if (this.ripples) this.ripples.update(delta);
  }

  updateObjectiveGuidance(delta, elapsedTime) {
    if (this.phase < 1 || this.phase > 2) {
      if (this.beacon) this.beacon.hide();
      return;
    }

    const cPos = this.commander.group.position;

    // Phase 2: Pressure Valve
    if (this.phase === 2) {
      if (this.currentGuideTarget !== 'valve') {
        this.currentGuideTarget = 'valve';
        this.hasPromptedAction = false;
        if (this.beacon) {
          this.beacon.showAt(this.valvePosition.x, 0.1, this.valvePosition.z, 0x06D6A0);
        }
        orbit.flyTo3D(new THREE.Vector3(this.valvePosition.x, 1.8, this.valvePosition.z), this.camera);
        orbit.say("Both leaks sealed! Walk over to the pressure valve to restore oxygen!", {
          emotion: 'happy',
          gesture: 'point'
        });
      }

      const dist = cPos.distanceTo(this.valvePosition);
      if (dist < 2.8 && !this.hasPromptedAction) {
        this.hasPromptedAction = true;
        orbit.say("Hold SPACE or tap TURN to restore oxygen to the habitat!", {
          emotion: 'excited',
          gesture: 'cheer'
        });
      }
      return;
    }

    // Phase 1: Nearest unsealed leak
    const unsealed = this.leaks.filter(l => !l.isSealed);
    if (unsealed.length > 0) {
      let targetLeak = unsealed[0];
      let minDist = cPos.distanceTo(targetLeak.pos);
      for (let i = 1; i < unsealed.length; i++) {
        const d = cPos.distanceTo(unsealed[i].pos);
        if (d < minDist) {
          minDist = d;
          targetLeak = unsealed[i];
        }
      }

      if (this.currentGuideTarget !== targetLeak) {
        this.currentGuideTarget = targetLeak;
        this.hasPromptedAction = false;
        if (this.beacon) {
          this.beacon.showAt(targetLeak.pos.x, 0.1, targetLeak.pos.z, 0xFF5E57);
        }
        orbit.flyTo3D(new THREE.Vector3(targetLeak.pos.x, 1.8, targetLeak.pos.z), this.camera);
        orbit.say(`Air leak detected at ${targetLeak.name}! Walk over and hold SPACE or tap SEAL to spray foam!`, {
          emotion: 'worried',
          gesture: 'point'
        });
      }

      if (minDist < 2.5 && !this.hasPromptedAction) {
        this.hasPromptedAction = true;
        orbit.say(`Hold SPACE or tap SEAL to spray airtight foam on this leak!`, {
          emotion: 'excited',
          gesture: 'point'
        });
      }
    }
  }

  updateCommander(delta) {
    if (!this.commander || this.phase < 1 || this.phase > 2) return;

    let moveX = 0;
    let moveZ = 0;

    if (this.keys.forward) moveZ -= 1;
    if (this.keys.backward) moveZ += 1;
    if (this.keys.left) moveX -= 1;
    if (this.keys.right) moveX += 1;

    if (Math.abs(this.touchMoveX) > 0.05 || Math.abs(this.touchMoveY) > 0.05) {
      moveX += this.touchMoveX;
      moveZ += this.touchMoveY;
    }

    if (moveX !== 0 || moveZ !== 0) {
      this.targetDestination = null;
    } else if (this.targetDestination) {
      const dx = this.targetDestination.x - this.commander.group.position.x;
      const dz = this.targetDestination.z - this.commander.group.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 0.35) {
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

      let nextX = this.commander.group.position.x + dirX * this.commanderSpeed * delta;
      let nextZ = this.commander.group.position.z + dirZ * this.commanderSpeed * delta;

      // Interior room collision boundaries
      nextX = Math.max(-10.5, Math.min(10.5, nextX));
      nextZ = Math.max(-8.5, Math.min(8.5, nextZ));

      this.commander.group.position.x = nextX;
      this.commander.group.position.z = nextZ;

      // Rotation towards movement
      this.commander.group.rotation.y = Math.atan2(dirX, dirZ);

      // Walk cycle
      this.walkCycle += delta * 12;
      this.animateLimbs(this.commander, this.walkCycle);
    } else {
      this.resetLimbs(this.commander);
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

  /**
   * Phase 2: Spraying foam sealant onto leaks
   */
  updateLeakSealing(delta) {
    if (this.phase !== 1) return;

    const cPos = this.commander.group.position;
    let nearAnyLeak = false;

    this.leaks.forEach(leak => {
      if (leak.isSealed) return;

      const dist = cPos.distanceTo(leak.pos);
      if (dist < 2.4) {
        nearAnyLeak = true;

        if (this.keys.action) {
          // Spraying foam sealant!
          leak.sealProgress += delta / 2.2; // ~2.2 seconds to completely seal
          level5Audio.playFoamSpray();

          // Expand foam material visually
          leak.foamMat.opacity = Math.min(0.95, leak.sealProgress);
          leak.foamMesh.scale.set(
            1.0 + leak.sealProgress * 0.3,
            1.0 + leak.sealProgress * 0.4,
            1.0 + leak.sealProgress * 0.5
          );

          if (this.hud) {
            this.hud.showActionProgress(`SEALING ${leak.name.toUpperCase()}`, leak.sealProgress);
            this.hud.setObjective('🧴', 'Hold to spray foam!');
          }

          if (leak.sealProgress >= 1.0) {
            // Leak fully sealed!
            leak.isSealed = true;
            leak.callRing.visible = false;
            leak.particles.visible = false;
            this.leaksSealedCount++;
            this.currentGuideTarget = null;
            this.hasPromptedAction = false;

            level5Audio.playLeakSealed();

            if (this.hud) {
              this.hud.hideActionProgress();
              this.hud.updateLeaksSealed(this.leaksSealedCount, 2);
            }

            if (this.leaksSealedCount >= 2) {
              // All leaks sealed! Transition to Phase 3: Pressure Valve!
              this.phase = 2;
              level5Audio.stopHiss();
              if (this.valveRingMat) this.valveRingMat.opacity = 0.85;

              if (this.hud) {
                this.hud.setObjective('⚙️', 'Turn pressure valve!', true);
              }
              orbitVoice.speak("Both leaks sealed! Turn the big pressure valve!");
            } else {
              orbitVoice.speak("Great patch! One more leak to find!");
              if (this.hud) {
                this.hud.setObjective('🔍', 'Find the next leak!');
              }
            }
          }
        }
      }
    });

    if (!nearAnyLeak && this.keys.action && this.hud) {
      this.hud.hideActionProgress();
    }
  }

  /**
   * Phase 3: Turning the pressure valve wheel
   */
  updatePressureValve(delta) {
    if (this.phase !== 2) return;

    const cPos = this.commander.group.position;
    const distToValve = cPos.distanceTo(this.valvePosition);

    if (distToValve < 2.8 && this.keys.action) {
      this.isTurningValve = true;
      this.valveProgress += delta / 2.0; // 2 seconds to turn

      // Rotate wheel
      if (this.valveWheel) {
        this.valveWheel.rotation.z += delta * 6;
      }
      level5Audio.playValveClick();

      // Refill pressure meter smoothly
      this.pressure = Math.min(100, this.pressure + delta * 35);
      if (this.hud) {
        this.hud.updatePressure(this.pressure);
        this.hud.showActionProgress('RE-PRESSURIZING BASE...', this.valveProgress);
      }

      if (this.valveProgress >= 1.0) {
        this.completeMission();
      }
    } else {
      if (this.isTurningValve) {
        this.isTurningValve = false;
        if (this.hud) this.hud.hideActionProgress();
      }
    }
  }

  completeMission() {
    this.phase = 3;
    this.pressure = 100;

    level5Audio.playPressureRestore();

    // Turn emergency amber lights to bright green
    this.emergencyLights.forEach(light => {
      light.color.setHex(0x06D6A0);
      light.intensity = 1.6;
    });

    if (this.hud) {
      this.hud.hideActionProgress();
      this.hud.updatePressure(100);
      this.hud.setObjective('✅', 'Habitat Pressure Nominal!');
    }

    setTimeout(() => {
      this.onWin();
    }, 1200);
  }

  updateAirLeakEffects(delta, elapsedTime) {
    // Proximity modulation for hissing
    const prox = this.getNearestLeakProximity();
    level5Audio.setHissProximity(prox);

    // Particle streams
    this.leaks.forEach(leak => {
      if (leak.isSealed) return;

      const pos = leak.particlePositions;
      for (let i = 0; i < leak.particleCount; i++) {
        const idx = i * 3;
        const v = leak.particleVelocities[i];

        pos[idx] += v.x * delta;
        pos[idx + 1] += v.y * delta;
        pos[idx + 2] += v.z * delta;

        v.life += delta * 1.5;
        if (v.life > 1.0) {
          v.life = 0;
          pos[idx] = (Math.random() - 0.5) * 0.1;
          pos[idx + 1] = (Math.random() - 0.5) * 0.1;
          pos[idx + 2] = (Math.random() - 0.5) * 0.1;
        }
      }
      leak.particles.geometry.attributes.position.needsUpdate = true;

      // Pulse call ring
      if (leak.callRing) {
        const pulse = 1.0 + Math.sin(elapsedTime * 6) * 0.18;
        leak.callRing.scale.set(pulse, pulse, pulse);
      }
    });
  }

  updateEmergencyLighting(elapsedTime) {
    if (this.phase === 3) return; // Restored

    // Pulse amber warning lights
    const intensity = 0.8 + Math.sin(elapsedTime * 4) * 0.45;
    this.emergencyLights.forEach(light => {
      light.intensity = intensity;
    });
  }

  updateSonarWave(delta) {
    if (!this.sonarActive || !this.sonarRing) return;

    this.sonarRadius += delta * 14;
    this.sonarRing.scale.set(this.sonarRadius, this.sonarRadius, 1);
    this.sonarRingMat.opacity = Math.max(0, 0.85 - this.sonarRadius * 0.08);

    if (this.sonarRadius > 10) {
      this.sonarActive = false;
      this.sonarRingMat.opacity = 0;
    }
  }

  updateWaypointMarker(elapsedTime) {
    if (!this.waypointRing) return;

    let target = null;
    if (this.phase === 1) {
      // Point to nearest unsealed leak
      let minDist = 999;
      this.leaks.forEach(l => {
        if (!l.isSealed) {
          const d = this.commander.group.position.distanceTo(l.pos);
          if (d < minDist) {
            minDist = d;
            target = l.pos;
          }
        }
      });
    } else if (this.phase === 2) {
      target = this.valvePosition;
    }

    if (target) {
      this.waypointRing.visible = true;
      this.waypointRing.position.set(target.x, 0.04, target.z);
      const pulse = 1.0 + Math.sin(elapsedTime * 5.0) * 0.15;
      this.waypointRing.scale.set(pulse, pulse, pulse);
    } else {
      this.waypointRing.visible = false;
    }
  }

  updateCameraFollow() {
    if (!this.commander) return;
    const cPos = this.commander.group.position;
    // Gentle camera tracking to keep commander centered
    this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, cPos.x * 0.35, 0.05);
    this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, 12.5 + cPos.z * 0.3, 0.05);
    this.camera.lookAt(cPos.x * 0.35, 1.0, cPos.z * 0.2);
  }

  giveHint() {
    if (this.phase === 1) {
      orbitVoice.speak("Tap Space for the leak detector!");
    } else if (this.phase === 2) {
      orbitVoice.speak("Turn the pressure valve wheel!");
    }
  }

  onWin() {
    this.phase = 3;
    level5Audio.playVictoryFanfare();
    orbitVoice.speak("Awesome job Commander! Habitat sealed and full pressure restored!");

    // Stars: 3 = pressure >= 60%, 2 = pressure >= 35%, 1 = otherwise
    const stars = this.pressure >= 60 ? 3 : (this.pressure >= 35 ? 2 : 1);

    if (this.hud) {
      this.hud.showWinModal({
        stars,
        onContinue: () => {
          this.game.exitLevelToMissionControl();
          // Apply Sol 5 success
          this.game.handleMiniGameSuccess(5, 'choice_5_a');
        }
      });
    }
  }

  onFail() {
    this.phase = 4;
    level5Audio.stopHiss();
    level5Audio.playFailTone();
    orbitVoice.speak("Pressure dropped low! Let's patch the leaks faster!");

    if (this.hud) {
      this.hud.showFailModal(
        () => {
          this.dispose();
          this.game.startLevel5(true);
        },
        () => {
          this.game.exitLevelToMissionControl();
        }
      );
    }
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      level5Audio.stopHiss();
      if (this.hud) {
        this.hud.showPauseModal(
          () => {
            this.isPaused = false;
            level5Audio.startHiss();
          },
          () => {
            this.dispose();
            this.game.startLevel5(true);
          },
          () => {},
          () => {
            this.game.exitLevelToMissionControl();
          }
        );
      }
    } else {
      level5Audio.startHiss();
      if (this.hud) this.hud.hideModals();
    }
  }

  dispose() {
    this.isActive = false;
    clearTimerArray(this.activeTimers);
    level5Audio.stopHiss();

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
