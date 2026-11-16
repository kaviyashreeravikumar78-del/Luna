import * as THREE from 'three';
import { level3Audio } from '../audio/Level3Audio.js';
import { Level3HUD } from './Level3HUD.js';
import { LevelTransition } from '../core/LevelTransition.js';
import { orbitVoice } from '../audio/OrbitVoice.js';
import { orbit } from '../components/Orbit.js';
import { ObjectiveBeacon, ClickRippleEffect } from '../core/ObjectiveBeacon.js';
import { disposeThreeObject, clearTimerArray } from '../core/disposeHelper.js';
import { BUILDINGS_DATA } from '../data/buildings.js';
import nasaData from '../data/nasa_sep_events.json';

/**
 * Level 3 (Day 3 - Solar Storm) Dedicated Mini-Game
 * Story: A solar energetic particle storm is incoming from the Sun!
 * Commander must gather all 4 astronauts into the HAB-01 shelter and activate
 * the Outpost Shield Generator before the cosmic radiation wave arrives.
 */
export class Level3Storm {
  constructor(game) {
    this.game = game;
    this.scene = game.scene;
    this.camera = game.camera;
    this.cameraManager = game.cameraManager;

    this.levelGroup = new THREE.Group();
    this.levelGroup.name = "Level3_Storm_Scene";

    // Timing & Game State
    this.isActive = false;
    this.isPaused = false;
    this.phase = 0; // 0: Intro, 1: Gather, 2: Shelter, 3: Shield, 4: Win, 5: Fail
    this.totalTime = 90; // 90 seconds
    this.timeLeft = this.totalTime;
    this.startTime = 0;
    this.lastActionTime = Date.now();

    // Astronauts & Rescues
    this.astronauts = [];
    this.followers = [];
    this.shelteredCount = 0;
    this.commander = null;

    // Movement & Controls
    this.keys = { forward: false, backward: false, left: false, right: false, action: false };
    this.touchMoveX = 0;
    this.touchMoveY = 0;
    this.commanderSpeed = 5.2;
    this.walkCycle = 0;

    // Shield Generator
    this.shieldTower = null;
    this.shieldLever = null;
    this.shieldDome = null;
    this.shieldProgress = 0;
    this.isChargingShield = false;
    this.shieldActive = false;

    // Shelter Door
    this.shelterDoorGroup = null;
    this.shelterDoorMesh = null;
    this.shelterRingMesh = null;

    // Storm Sky & Particle System
    this.stormSkyMesh = null;
    this.stormParticles = null;
    this.particlePositions = null;
    this.particleVelocities = null;
    this.particleCount = 450;
    this.waveLineMesh = null;

    // Navigation marker / beacon
    this.waypointRing = null;

    // HUD
    this.hud = null;

    // Real NASA Event
    this.nasaEvent = nasaData.events[0];
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
   * Initializes the dedicated Level 3 stage
   */
  init(skipIntro = false) {
    this.isActive = true;
    this.scene.add(this.levelGroup);

    // 1. Hide colony structures to isolate dedicated stage
    this.setColonyVisibility(false);

    // 2. Build 3D Terrain & Scene Elements
    this.buildTerrain();
    this.buildHabitatShelter();
    this.buildShieldGenerator();
    this.buildBackgroundColonyProps();
    this.buildStormSkyAndParticles();
    this.setupLighting();

    // 3. Build Player Commander and the 4 Crew Members
    this.buildCommander();
    this.buildFieldAstronauts();
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

    // 8. Start Entry Cinematic
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
   * Builds the flat lunar playground for Level 3
   */
  buildTerrain() {
    // Main terrain disc
    const groundGeo = new THREE.CylinderGeometry(28, 29, 1.2, 48);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x2A3442,
      roughness: 0.9,
      metalness: 0.05,
      flatShading: true,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = -0.6;
    ground.receiveShadow = true;
    this.levelGroup.add(ground);
    this.groundMesh = ground;

    // Perimeter low-poly rocks and ridges
    const rockGeo = new THREE.DodecahedronGeometry(1, 1);
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x1E2734, roughness: 0.95 });

    for (let i = 0; i < 28; i++) {
      const angle = (i / 28) * Math.PI * 2;
      const r = 24 + (Math.sin(i * 3.5) * 3);
      const rock = new THREE.Mesh(rockGeo, rockMat);
      const s = 1.2 + Math.random() * 2.2;
      rock.scale.set(s, s * (0.8 + Math.random() * 0.8), s);
      rock.position.set(Math.cos(angle) * r, s * 0.4, Math.sin(angle) * r);
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      rock.receiveShadow = true;
      rock.castShadow = true;
      this.levelGroup.add(rock);
    }
  }

  /**
   * Builds the HAB-01 shelter module with glowing reinforced airlock door
   */
  buildHabitatShelter() {
    const habGroup = new THREE.Group();
    habGroup.position.set(0, 0, -9.0);

    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xF0F4F8, roughness: 0.35, metalness: 0.1 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x141B26, roughness: 0.2, metalness: 0.8 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xFFB703, roughness: 0.4, metalness: 0.6 });

    // Main reinforced cylinder
    const body = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.4, 6.0, 24), whiteMat);
    body.position.y = 3.0;
    body.castShadow = true;
    body.receiveShadow = true;
    habGroup.add(body);

    // Top dome
    const dome = new THREE.Mesh(new THREE.SphereGeometry(3.0, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5), whiteMat);
    dome.position.y = 6.0;
    dome.castShadow = true;
    habGroup.add(dome);

    // Gold solar foil ring
    const foil = new THREE.Mesh(new THREE.CylinderGeometry(3.3, 3.3, 0.4, 24), goldMat);
    foil.position.y = 4.8;
    habGroup.add(foil);

    // Forward shelter airlock tunnel
    const tunnel = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.6, 2.2), whiteMat);
    tunnel.position.set(0, 1.3, 3.8);
    tunnel.castShadow = true;
    habGroup.add(tunnel);

    // Reinforced titanium airlock blast door
    const doorGeo = new THREE.BoxGeometry(1.5, 2.0, 0.2);
    this.shelterDoorMesh = new THREE.Mesh(doorGeo, darkMat);
    this.shelterDoorMesh.position.set(0, 1.1, 4.85);
    habGroup.add(this.shelterDoorMesh);

    // Status beacon above door (turns green when accepting crew)
    const lampGeo = new THREE.SphereGeometry(0.2, 12, 12);
    this.shelterLampMat = new THREE.MeshBasicMaterial({ color: 0x06D6A0 });
    const lamp = new THREE.Mesh(lampGeo, this.shelterLampMat);
    lamp.position.set(0, 2.4, 4.9);
    habGroup.add(lamp);

    // Ground safe zone ring
    const ringGeo = new THREE.RingGeometry(2.2, 2.5, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x06D6A0,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });
    this.shelterRingMesh = new THREE.Mesh(ringGeo, ringMat);
    this.shelterRingMesh.rotation.x = -Math.PI / 2;
    this.shelterRingMesh.position.set(0, 0.05, 5.2);
    habGroup.add(this.shelterRingMesh);

    this.shelterDoorGroup = habGroup;
    this.levelGroup.add(habGroup);
  }

  /**
   * Builds the High-Energy Shield Generator Tower
   */
  buildShieldGenerator() {
    const towerGroup = new THREE.Group();
    towerGroup.position.set(0, 0, 8.5);

    const metalMat = new THREE.MeshStandardMaterial({ color: 0xD0D7DE, metalness: 0.7, roughness: 0.25 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x1E293B, metalness: 0.5, roughness: 0.5 });
    const cyanMat = new THREE.MeshBasicMaterial({ color: 0x00E5FF });

    // Base plinth
    const base = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.6, 0.8, 16), darkMat);
    base.position.y = 0.4;
    base.receiveShadow = true;
    towerGroup.add(base);

    // Main generator pylon
    const pylon = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.2, 4.5, 12), metalMat);
    pylon.position.y = 2.8;
    pylon.castShadow = true;
    towerGroup.add(pylon);

    // Magnetic induction coils (stacked glowing rings)
    [2.2, 3.2, 4.2].forEach(y => {
      const coil = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.12, 8, 24), cyanMat);
      coil.rotation.x = Math.PI / 2;
      coil.position.y = y;
      towerGroup.add(coil);
    });

    // Top energy emitter sphere
    const emitterGeo = new THREE.SphereGeometry(0.7, 16, 16);
    this.shieldEmitterMat = new THREE.MeshBasicMaterial({ color: 0x00E5FF });
    this.shieldEmitter = new THREE.Mesh(emitterGeo, this.shieldEmitterMat);
    this.shieldEmitter.position.y = 5.4;
    towerGroup.add(this.shieldEmitter);

    // Floating glowing pointer cone above emitter
    const pointerGeo = new THREE.ConeGeometry(0.45, 0.9, 16);
    const pointerMat = new THREE.MeshBasicMaterial({ color: 0xFFD166 });
    this.shieldPointer = new THREE.Mesh(pointerGeo, pointerMat);
    this.shieldPointer.rotation.x = Math.PI; // point down towards emitter
    this.shieldPointer.position.y = 6.8;
    this.shieldPointer.visible = false;
    towerGroup.add(this.shieldPointer);

    // Control Console with Lever Switch
    const consoleGeo = new THREE.BoxGeometry(1.1, 1.0, 0.7);
    const consoleMesh = new THREE.Mesh(consoleGeo, darkMat);
    consoleMesh.position.set(0, 0.9, -1.8);
    towerGroup.add(consoleGeo ? consoleMesh : null);

    // Rotating lever
    const leverGroup = new THREE.Group();
    leverGroup.position.set(0, 1.4, -1.8);

    const leverHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.6, 8), metalMat);
    leverHandle.position.y = 0.3;
    leverGroup.add(leverHandle);

    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), new THREE.MeshBasicMaterial({ color: 0xFF5E57 }));
    knob.position.y = 0.6;
    leverGroup.add(knob);

    leverGroup.rotation.x = 0.5; // Upward / Ready position
    this.shieldLever = leverGroup;
    towerGroup.add(leverGroup);

    // Console trigger interaction ring
    const consoleRingGeo = new THREE.RingGeometry(1.2, 1.45, 24);
    this.consoleRingMat = new THREE.MeshBasicMaterial({
      color: 0x00E5FF,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    });
    const consoleRing = new THREE.Mesh(consoleRingGeo, this.consoleRingMat);
    consoleRing.rotation.x = -Math.PI / 2;
    consoleRing.position.set(0, 0.05, -1.8);
    towerGroup.add(consoleRing);

    // Giant translucent forcefield energy dome (covers whole base when active)
    const domeGeo = new THREE.SphereGeometry(22, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.5);
    this.shieldDomeMat = new THREE.MeshBasicMaterial({
      color: 0x00E5FF,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
      wireframe: true,
    });
    this.shieldDome = new THREE.Mesh(domeGeo, this.shieldDomeMat);
    this.shieldDome.position.set(0, 0, 0);
    this.shieldDome.scale.set(0.1, 0.1, 0.1);
    this.shieldDome.visible = false;
    this.levelGroup.add(this.shieldDome);

    this.shieldTower = towerGroup;
    this.levelGroup.add(towerGroup);
  }

  /**
   * Background scenery: greenhouse, antenna, rover, solar array
   */
  buildBackgroundColonyProps() {
    // 1. Lunar Rover parked at North-East (Marcus's station)
    const roverGroup = new THREE.Group();
    roverGroup.position.set(9.0, 0.4, 3.5);
    roverGroup.rotation.y = -Math.PI * 0.75;
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xD0D7DE, metalness: 0.4, roughness: 0.4 });
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 });

    const rBody = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.8, 1.2), bodyMat);
    rBody.position.y = 0.5;
    roverGroup.add(rBody);

    [[-0.8, -0.6], [-0.8, 0.6], [0, -0.6], [0, 0.6], [0.8, -0.6], [0.8, 0.6]].forEach(pos => {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.22, 12), wheelMat);
      w.rotation.z = Math.PI / 2;
      w.position.set(pos[0], 0.32, pos[1]);
      roverGroup.add(w);
    });
    this.levelGroup.add(roverGroup);

    // 2. Greenhouse Module at East (Aris's station)
    const ghGroup = new THREE.Group();
    ghGroup.position.set(9.5, 0, -6.5);
    const ghBody = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 3.2, 16), new THREE.MeshStandardMaterial({
      color: 0x06D6A0,
      roughness: 0.2,
      metalness: 0.1,
      transparent: true,
      opacity: 0.6
    }));
    ghBody.rotation.z = Math.PI / 2;
    ghBody.position.y = 1.4;
    ghGroup.add(ghBody);
    this.levelGroup.add(ghGroup);

    // 3. Deep Space Radio Dish at West (Maya's station)
    const dishGroup = new THREE.Group();
    dishGroup.position.set(-9.5, 0, 5.5);
    const pylon = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.35, 3.2, 8), bodyMat);
    pylon.position.y = 1.6;
    dishGroup.add(pylon);

    const dish = new THREE.Mesh(new THREE.SphereGeometry(1.8, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.35), bodyMat);
    dish.rotation.x = -Math.PI * 0.65;
    dish.position.set(0, 3.3, 0);
    dishGroup.add(dish);
    this.levelGroup.add(dishGroup);

    // 4. Solar Panels at North-West (Evelyn's rock/survey area)
    const spGroup = new THREE.Group();
    spGroup.position.set(-9.5, 0, -3.5);
    const spPole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 2.2, 8), bodyMat);
    spPole.position.y = 1.1;
    spGroup.add(spPole);
    const spPanel = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.1, 1.4), new THREE.MeshStandardMaterial({ color: 0x0055AA, roughness: 0.2 }));
    spPanel.position.set(0, 2.2, 0);
    spPanel.rotation.x = 0.4;
    spGroup.add(spPanel);
    this.levelGroup.add(spGroup);
  }

  /**
   * Builds the animated dynamic storm sky and fast cosmic particle streaks
   */
  buildStormSkyAndParticles() {
    // Sky Dome with color transition capability
    const skyGeo = new THREE.SphereGeometry(45, 32, 24);
    this.skyMat = new THREE.MeshBasicMaterial({
      color: 0x0B1226,
      side: THREE.BackSide,
    });
    this.stormSkyMesh = new THREE.Mesh(skyGeo, this.skyMat);
    this.levelGroup.add(this.stormSkyMesh);

    // High-Energy Cosmic Particle Rays (streaking diagonally)
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.particleCount * 6); // 2 vertices per line streak
    const colors = new Float32Array(this.particleCount * 6);
    this.particleVelocities = [];

    for (let i = 0; i < this.particleCount; i++) {
      const idx = i * 6;
      const x = (Math.random() - 0.5) * 45;
      const y = 8 + Math.random() * 26;
      const z = (Math.random() - 0.5) * 45;

      const streakLen = 0.8 + Math.random() * 1.4;
      // Head
      positions[idx] = x;
      positions[idx + 1] = y;
      positions[idx + 2] = z;
      // Tail
      positions[idx + 3] = x + 0.3 * streakLen;
      positions[idx + 4] = y + 1.0 * streakLen;
      positions[idx + 5] = z + 0.3 * streakLen;

      // Color: Bright Solar Amber to Electric Cyan
      const isAmber = Math.random() > 0.35;
      const r = isAmber ? 1.0 : 0.0;
      const g = isAmber ? 0.6 : 0.9;
      const b = isAmber ? 0.1 : 1.0;

      colors[idx] = r; colors[idx + 1] = g; colors[idx + 2] = b;
      colors[idx + 3] = r * 0.3; colors[idx + 4] = g * 0.3; colors[idx + 5] = b * 0.3;

      this.particleVelocities.push({
        vx: -2.5 - Math.random() * 3.0,
        vy: -14.0 - Math.random() * 18.0,
        vz: -2.5 - Math.random() * 3.0,
      });
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const lineMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });

    this.stormParticles = new THREE.LineSegments(geo, lineMat);
    this.particlePositions = positions;
    this.levelGroup.add(this.stormParticles);

    // Radiation Wave Front line (visible high above)
    const waveGeo = new THREE.RingGeometry(24, 25, 48);
    const waveMat = new THREE.MeshBasicMaterial({
      color: 0xFF5E57,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.45,
    });
    this.waveLineMesh = new THREE.Mesh(waveGeo, waveMat);
    this.waveLineMesh.rotation.x = Math.PI / 2;
    this.waveLineMesh.position.set(0, 22, 0);
    this.levelGroup.add(this.waveLineMesh);
  }

  setupLighting() {
    this.ambientLight = new THREE.AmbientLight(0x24344D, 0.7);
    this.levelGroup.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xFFE0B2, 1.2);
    this.sunLight.position.set(16, 22, 12);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.levelGroup.add(this.sunLight);

    // Menacing solar storm point light
    this.stormLight = new THREE.PointLight(0xFF4500, 0.8, 60);
    this.stormLight.position.set(0, 25, 0);
    this.levelGroup.add(this.stormLight);
  }

  /**
   * Builds the articulated Commander (player character)
   */
  buildCommander() {
    this.commander = this.createArticulatedAstronaut({
      name: "Commander",
      avatarColor: 0xD95736,
      startPos: new THREE.Vector3(0, 0.3, 0),
      rotY: 0,
      isPlayer: true
    });
    this.levelGroup.add(this.commander.group);
  }

  /**
   * Builds the 4 astronauts stationed at their base tasks
   */
  buildFieldAstronauts() {
    const crewConfig = [
      {
        id: 'evelyn',
        name: "Dr. Evelyn Vance",
        role: "Commander",
        avatarColor: 0xD95736,
        pos: new THREE.Vector3(-7.5, 0.3, -3.2), // Near solar panel / rock
        rotY: 0.8,
        reaction: "run_fast",
        icon: "👩‍🚀"
      },
      {
        id: 'marcus',
        name: "Marcus Diaz",
        role: "Chief Engineer",
        avatarColor: 0x3A86FF,
        pos: new THREE.Vector3(7.2, 0.3, 3.2), // Near lunar rover
        rotY: -2.0,
        reaction: "tools_pack",
        icon: "👨‍🔧"
      },
      {
        id: 'aris',
        name: "Dr. Aris Thorne",
        role: "Astrobiologist",
        avatarColor: 0x06D6A0,
        pos: new THREE.Vector3(7.4, 0.3, -5.8), // Near greenhouse
        rotY: -0.8,
        reaction: "plant_care",
        icon: "🌱"
      },
      {
        id: 'maya',
        name: "Maya Lin",
        role: "Comms Specialist",
        avatarColor: 0xFFD166,
        pos: new THREE.Vector3(-7.5, 0.3, 5.0), // Near radio dish
        rotY: 2.2,
        reaction: "radio_close",
        icon: "📡"
      }
    ];

    crewConfig.forEach((cfg, idx) => {
      const astro = this.createArticulatedAstronaut({
        ...cfg,
        startPos: cfg.pos,
        rotY: cfg.rotY,
        isPlayer: false,
        crewIndex: idx
      });

      // Floating Exclamation / Call beacon above head
      const beaconGroup = new THREE.Group();
      beaconGroup.position.set(0, 2.8, 0);

      const beaconRing = new THREE.Mesh(
        new THREE.RingGeometry(0.35, 0.48, 16),
        new THREE.MeshBasicMaterial({ color: 0xFF5E57, side: THREE.DoubleSide })
      );
      beaconRing.rotation.x = -Math.PI / 2;
      beaconGroup.add(beaconRing);

      astro.group.add(beaconGroup);
      astro.beaconGroup = beaconGroup;

      this.astronauts.push(astro);
      this.levelGroup.add(astro.group);
    });
  }

  /**
   * Helper to create an articulated 3D astronaut with limb pivots
   */
  createArticulatedAstronaut({ name, avatarColor, startPos, rotY, isPlayer, crewIndex = 0 }) {
    const group = new THREE.Group();
    group.position.copy(startPos);
    group.rotation.y = rotY;

    const suitMat = new THREE.MeshStandardMaterial({ color: 0xF0F4F8, roughness: 0.4, metalness: 0.1 });
    const visorMat = new THREE.MeshStandardMaterial({ color: 0x141B2D, roughness: 0.1, metalness: 0.9 });
    const badgeMat = new THREE.MeshStandardMaterial({ color: avatarColor || 0x3A86FF });
    const bootMat = new THREE.MeshStandardMaterial({ color: 0x333F48, roughness: 0.8 });

    const scale = 0.55;
    group.scale.set(scale, scale, scale);

    // Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.85, 0.45), suitMat);
    torso.position.y = 1.35;
    torso.castShadow = true;
    group.add(torso);

    // Mission Badge
    const badge = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.25, 0.08), badgeMat);
    badge.position.set(0, 1.45, 0.26);
    group.add(badge);

    // Helmet & Glossy Visor
    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 16), suitMat);
    helmet.position.y = 2.05;
    helmet.castShadow = true;
    group.add(helmet);

    const visor = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12, 0, Math.PI, 0, Math.PI * 0.7), visorMat);
    visor.rotation.x = -Math.PI * 0.15;
    visor.position.set(0, 2.05, 0.18);
    group.add(visor);

    // Life Support Backpack
    const pack = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.8, 0.3), suitMat);
    pack.position.set(0, 1.35, -0.36);
    pack.castShadow = true;
    group.add(pack);

    // Articulated Arms
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

    // Articulated Legs
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

    return {
      group,
      name,
      crewIndex,
      isPlayer,
      leftArm,
      rightArm,
      leftLeg,
      rightLeg,
      isGathered: false,
      isSheltered: false,
      waveTime: 0,
      isWaving: false,
      walkPhase: Math.random() * Math.PI * 2
    };
  }

  /**
   * Floating guide ring on ground that points to current goal
   */
  buildWaypointMarker() {
    const ringGeo = new THREE.RingGeometry(1.2, 1.5, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00E5FF,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    });
    this.waypointRing = new THREE.Mesh(ringGeo, ringMat);
    this.waypointRing.rotation.x = -Math.PI / 2;
    this.waypointRing.position.set(0, 0.05, 0);
    this.levelGroup.add(this.waypointRing);
  }

  setupCamera() {
    // Wide, clear view framing all 4 stations, habitat shelter, and shield tower
    this.camera.position.set(0, 16.5, 17.5);
    this.camera.lookAt(0, 1.0, 0);
    if (this.cameraManager && this.cameraManager.controls) {
      this.cameraManager.controls.target.set(0, 1.0, 0);
      this.cameraManager.controls.enabled = false;
    }
  }

  initHUD() {
    this.hud = new Level3HUD({
      totalSeconds: this.totalTime,
      onPause: () => this.togglePause(),
      onTouchMove: (nx, ny) => {
        this.touchMoveX = nx;
        this.touchMoveY = ny;
        this.lastActionTime = Date.now();
      },
      onActionDown: () => {
        this.keys.action = true;
        this.handleActionPress();
        this.lastActionTime = Date.now();
      },
      onActionUp: () => {
        this.keys.action = false;
        this.isChargingShield = false;
        if (this.hud) this.hud.hideChargeBar();
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
            this.handleActionPress();
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
          this.isChargingShield = false;
          if (this.hud) this.hud.hideChargeBar();
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
        e.target.closest('.l3-top-bar') ||
        e.target.closest('#l3-touch-dock') ||
        e.target.closest('.l3-modal-backdrop') ||
        e.target.closest('#orbit-companion') ||
        e.target.closest('#luna-orientation-overlay')
      ) {
        return;
      }

      if (this.phase === 0 || this.phase >= 4) return;

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
   * Entry Cinematic with sirens, sky flickering, and ORBIT warning
   */
  playEntryCinematic() {
    this.phase = 0; // Cinematic
    level3Audio.playSiren(2);

    // Initial cinematic camera animation
    this.camera.position.set(0, 9.0, 7.0);
    this.camera.lookAt(0, 1.5, -9.0); // Facing shelter initially

    orbitVoice.speak("Solar storm coming! Get everyone inside!");

    let elapsed = 0;
    const animateCam = () => {
      if (!this.isActive || this.phase !== 0) return;
      elapsed += 0.016;

      // Smoothly zoom out to third-person gameplay framing
      this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, 0, 0.05);
      this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, 16.5, 0.04);
      this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, 17.5, 0.04);
      this.camera.lookAt(0, 1.0, 0);

      // Flickering amber sky warning
      if (this.skyMat && Math.sin(elapsed * 20) > 0.4) {
        this.skyMat.color.setHex(0x281216);
      } else if (this.skyMat) {
        this.skyMat.color.setHex(0x0B1226);
      }

      if (elapsed < 3.2) {
        requestAnimationFrame(animateCam);
      } else {
        this.startGameplay();
      }
    };
    requestAnimationFrame(animateCam);
  }

  startGameplay() {
    this.phase = 1; // Gather phase
    this.startTime = Date.now();
    this.timeLeft = this.totalTime;

    // Reset camera to standard playing position
    this.camera.position.set(0, 16.5, 17.5);
    this.camera.lookAt(0, 1.0, 0);

    if (this.hud) {
      this.hud.showGoPopup();
      this.hud.setObjective('🏃‍♂️', 'Gather the astronauts!');
    }

    level3Audio.playWarningBeep();
  }

  /**
   * Action button handler (Alert astronaut / Charge shield)
   */
  handleActionPress() {
    if (this.phase === 1 || this.phase === 2) {
      // Check if near any ungathered astronaut
      const cPos = this.commander.group.position;
      let alertedAny = false;

      this.astronauts.forEach(astro => {
        if (!astro.isGathered && !astro.isSheltered) {
          const dist = cPos.distanceTo(astro.group.position);
          if (dist < 3.2) {
            // Gather this astronaut!
            astro.isGathered = true;
            astro.isWaving = true;
            astro.waveTime = 0;
            this.followers.push(astro);

            if (astro.beaconGroup) astro.beaconGroup.visible = false;

            level3Audio.playAlertCall();
            if (this.hud) {
              this.hud.updateAstronautStatus(astro.crewIndex, 'gathered');
            }

            alertedAny = true;
            this.currentGuideTarget = null;
            this.hasPromptedAction = false;
            orbitVoice.speak(`${astro.name} is following you!`);
          }
        }
      });

      if (this.followers.length > 0) {
        this.phase = 2; // Shelter phase active
        if (this.hud) {
          this.hud.setObjective('🚪', 'Lead them to shelter!');
        }
      }
    }
  }

  /**
   * Main game loop update
   */
  update(delta, elapsedTime) {
    if (!this.isActive || this.isPaused) return;

    // Update Countdown Timer during gameplay
    if (this.phase >= 1 && this.phase <= 3) {
      this.timeLeft -= delta;
      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this.onFail();
        return;
      }
      if (this.hud) {
        this.hud.updateCountdown(this.timeLeft, this.totalTime);
      }

      // Check inactivity for friendly hint
      if (Date.now() - this.lastActionTime > 8000) {
        this.lastActionTime = Date.now();
        this.giveHint();
      }
    }

    // 1. Update Commander Movement
    this.updateCommander(delta);

    // 2. Update Follower Train
    this.updateFollowers(delta);

    // 3. Check Shelter Entrance
    this.checkShelterEntrance();

    // 4. Update Shield Generator Charging (Phase 3)
    this.updateShieldCharging(delta);

    // 5. Update Storm Sky and Particle Streaks
    this.updateStormAtmosphere(delta, elapsedTime);

    // 6. Update Waypoint Guide Ring
    this.updateWaypointMarker(elapsedTime);

    // 7. Update Objective Guidance & Beacon
    this.updateObjectiveGuidance(delta, elapsedTime);
    if (this.beacon) this.beacon.update(delta, elapsedTime);
    if (this.ripples) this.ripples.update(delta);

    // 8. Render scene
    this.game.renderer.render(this.scene, this.camera);
  }

  updateObjectiveGuidance(delta, elapsedTime) {
    if (this.phase < 1 || this.phase > 3) {
      if (this.beacon) this.beacon.hide();
      return;
    }

    const cPos = this.commander.group.position;

    // Phase 3: Shield Generator activation
    if (this.phase === 3) {
      const towerPos = new THREE.Vector3(0, 0.2, 6.7);
      if (this.shieldPointer) {
        this.shieldPointer.visible = true;
        this.shieldPointer.position.y = 6.8 + Math.sin(elapsedTime * 4.0) * 0.25;
        this.shieldPointer.rotation.y = elapsedTime * 2.5;
      }
      if (this.currentGuideTarget !== 'shield') {
        this.currentGuideTarget = 'shield';
        this.hasPromptedAction = false;
        if (this.beacon) {
          this.beacon.showAt(towerPos.x, towerPos.y, towerPos.z, 0x00E5FF);
        }
        orbit.flyTo3D(new THREE.Vector3(towerPos.x, 3.2, towerPos.z), this.camera);
        orbit.say("All astronauts are sheltered! Walk south to the glowing blue tower and hold SPACE or tap CHARGE!", {
          emotion: 'excited',
          gesture: 'point',
          autoCloseDelay: 3500
        });
      }
      return;
    }

    // Phase 2: Leading followers to shelter door
    if (this.followers.length > 0) {
      const doorPos = new THREE.Vector3(0, 0.2, -3.8);
      if (this.currentGuideTarget !== 'shelter') {
        this.currentGuideTarget = 'shelter';
        this.hasPromptedAction = false;
        if (this.beacon) {
          this.beacon.showAt(doorPos.x, doorPos.y, doorPos.z, 0x06D6A0);
        }
        orbit.flyTo3D(new THREE.Vector3(doorPos.x, 2.2, doorPos.z), this.camera);
        orbit.say("Astronauts are following you! Lead them inside the glowing shelter door!", {
          emotion: 'happy',
          gesture: 'point'
        });
      }
      return;
    }

    // Phase 1: Find nearest ungathered astronaut
    const ungathered = this.astronauts.filter(a => !a.isGathered && !a.isSheltered);
    if (ungathered.length > 0) {
      let targetAstro = ungathered[0];
      let minDist = cPos.distanceTo(targetAstro.group.position);
      for (let i = 1; i < ungathered.length; i++) {
        const d = cPos.distanceTo(ungathered[i].group.position);
        if (d < minDist) {
          minDist = d;
          targetAstro = ungathered[i];
        }
      }

      if (this.currentGuideTarget !== targetAstro) {
        this.currentGuideTarget = targetAstro;
        this.hasPromptedAction = false;
        if (this.beacon) {
          this.beacon.showAt(targetAstro.group.position.x, 0.1, targetAstro.group.position.z, 0xFFD166);
        }
        orbit.flyTo3D(new THREE.Vector3(targetAstro.group.position.x, 2.0, targetAstro.group.position.z), this.camera);
        orbit.say(`Run over to ${targetAstro.name}! Press Space or tap ACTION to alert them!`, {
          emotion: 'worried',
          gesture: 'point'
        });
      }

      if (minDist < 3.2 && !this.hasPromptedAction) {
        this.hasPromptedAction = true;
        orbit.say(`You reached ${targetAstro.name}! Tap ACTION or Space to call them!`, {
          emotion: 'excited',
          gesture: 'wave'
        });
      }
    }
  }

  updateCommander(delta) {
    if (!this.commander || this.phase < 1 || this.phase > 3) return;

    let moveX = 0;
    let moveZ = 0;

    if (this.keys.forward) moveZ -= 1;
    if (this.keys.backward) moveZ += 1;
    if (this.keys.left) moveX -= 1;
    if (this.keys.right) moveX += 1;

    // Touch joystick overlay
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

      const newX = this.commander.group.position.x + dirX * this.commanderSpeed * delta;
      const newZ = this.commander.group.position.z + dirZ * this.commanderSpeed * delta;

      // Keep within arena radius 20m
      if (Math.hypot(newX, newZ) < 20) {
        this.commander.group.position.x = newX;
        this.commander.group.position.z = newZ;
      }

      // Rotate towards moving direction
      const targetAngle = Math.atan2(dirX, dirZ);
      this.commander.group.rotation.y = targetAngle;

      // Walk cycle animation
      this.walkCycle += delta * 12;
      this.animateAstronautLimbs(this.commander, this.walkCycle);
    } else {
      // Idle pose
      this.resetAstronautLimbs(this.commander);
    }
  }

  /**
   * Follow-the-leader chain for gathered astronauts
   */
  updateFollowers(delta) {
    let leaderPos = this.commander.group.position;

    this.followers.forEach((astro, idx) => {
      if (astro.isSheltered) return;

      const myPos = astro.group.position;
      const targetDist = 1.6; // Spacing between astronauts
      const dist = myPos.distanceTo(leaderPos);

      if (dist > targetDist) {
        const dir = new THREE.Vector3().subVectors(leaderPos, myPos).normalize();
        const moveDist = Math.min(dist - targetDist, this.commanderSpeed * 1.1 * delta);

        myPos.addScaledVector(dir, moveDist);

        // Rotate towards leader
        astro.group.rotation.y = Math.atan2(dir.x, dir.z);

        // Walk cycle
        astro.walkPhase += delta * 12;
        this.animateAstronautLimbs(astro, astro.walkPhase);
      } else {
        this.resetAstronautLimbs(astro);
      }

      // Next follower tracks this astronaut
      leaderPos = myPos;
    });
  }

  animateAstronautLimbs(astro, phase) {
    if (astro.leftArm && astro.rightArm) {
      astro.leftArm.rotation.x = Math.sin(phase) * 0.6;
      astro.rightArm.rotation.x = -Math.sin(phase) * 0.6;
    }
    if (astro.leftLeg && astro.rightLeg) {
      astro.leftLeg.rotation.x = -Math.sin(phase) * 0.7;
      astro.rightLeg.rotation.x = Math.sin(phase) * 0.7;
    }
  }

  resetAstronautLimbs(astro) {
    if (astro.leftArm) astro.leftArm.rotation.x = 0;
    if (astro.rightArm) astro.rightArm.rotation.x = 0;
    if (astro.leftLeg) astro.leftLeg.rotation.x = 0;
    if (astro.rightLeg) astro.rightLeg.rotation.x = 0;
  }

  /**
   * Checks if astronauts reached the Habitat shelter door zone
   */
  checkShelterEntrance() {
    if (this.followers.length === 0) return;

    const doorZone = new THREE.Vector3(0, 0.3, -3.8);

    for (let i = this.followers.length - 1; i >= 0; i--) {
      const astro = this.followers[i];
      if (astro.isSheltered) continue;

      const dist = astro.group.position.distanceTo(doorZone);
      if (dist < 2.8) {
        // Astronaut enters shelter!
        astro.isSheltered = true;
        this.followers.splice(i, 1);
        this.shelteredCount++;

        // Fade / shrink into shelter
        astro.group.visible = false;

        level3Audio.playDoorWhoosh();
        level3Audio.playSafeChime(this.shelteredCount);

        if (this.hud) {
          this.hud.updateAstronautStatus(astro.crewIndex, 'sheltered');
          this.hud.updateCrewSafeCount(this.shelteredCount, 4);
        }

        this.currentGuideTarget = null;
        this.hasPromptedAction = false;

        // Pulse shelter light
        if (this.shelterLampMat) {
          this.shelterLampMat.color.setHex(0x00E5FF);
          setTimeout(() => {
            if (this.shelterLampMat) this.shelterLampMat.color.setHex(0x06D6A0);
          }, 300);
        }

        if (this.shelteredCount >= 4) {
          // All 4 safe! Switch to Phase 3: Activate Shield!
          this.phase = 3;
          if (this.hud) {
            this.hud.setObjective('⚡', 'Walk south to glowing blue tower & hold SPACE/ACTION!', true);
            this.hud.setActionIcon('⚡', 'CHARGE');
          }
          orbitVoice.speak("Everyone is safe! Walk to the glowing blue tower and turn on the shield!");
        } else {
          orbitVoice.speak(`${astro.name} is safe in the bunker!`);
        }
      }
    }
  }

  /**
   * Updates Shield Generator charging in Phase 3
   */
  updateShieldCharging(delta) {
    if (this.phase !== 3) return;

    const towerPos = new THREE.Vector3(0, 0.3, 6.7);
    const distToTower = this.commander.group.position.distanceTo(towerPos);

    // Show floating charge button when near the generator tower
    if (this.hud) {
      this.hud.showChargeButton(distToTower < 5.2);
    }

    if (distToTower < 4.5 && !this.hasPromptedShieldAction) {
      this.hasPromptedShieldAction = true;
      if (this.hud) {
        this.hud.setObjective('⚡', 'HOLD SPACE or ACTION to activate shield!', true);
      }
    }

    // Charge when holding action key/button OR walking directly into the console pad (< 1.6m)
    if (distToTower < 3.8 && (this.keys.action || distToTower < 1.6)) {
      this.isChargingShield = true;
      this.shieldProgress += delta / 2.0; // ~2.0 seconds to full charge
      level3Audio.playShieldCharge(this.shieldProgress);

      if (this.hud) {
        this.hud.showChargeBar(this.shieldProgress);
      }

      // Rotate lever downwards
      if (this.shieldLever) {
        this.shieldLever.rotation.x = 0.5 - (this.shieldProgress * 1.4);
      }

      // Emitter glows brighter
      if (this.shieldEmitterMat) {
        this.shieldEmitterMat.color.setHSL(0.5, 1.0, 0.5 + this.shieldProgress * 0.5);
      }

      if (this.shieldProgress >= 1.0) {
        this.activateShieldAndWin();
      }
    } else {
      if (this.isChargingShield) {
        this.isChargingShield = false;
        if (this.hud) this.hud.hideChargeBar();
      }
    }
  }

  /**
   * Activates the giant forcefield dome and completes Level 3
   */
  activateShieldAndWin() {
    this.phase = 4; // Victory sequence
    this.shieldActive = true;
    if (this.hud) {
      this.hud.hideChargeBar();
      this.hud.showChargeButton(false);
    }
    if (this.shieldPointer) {
      this.shieldPointer.visible = false;
    }

    level3Audio.playShieldActivate();

    // Expand forcefield dome
    if (this.shieldDome) {
      this.shieldDome.visible = true;
      this.shieldDomeMat.opacity = 0.85;

      let scale = 0.1;
      const expandDome = () => {
        if (!this.isActive) return;
        scale += 0.05;
        this.shieldDome.scale.set(scale, scale, scale);
        if (scale < 1.0) {
          requestAnimationFrame(expandDome);
        } else {
          // Cosmic Radiation Wave Impact!
          this.triggerWaveImpact();
        }
      };
      expandDome();
    }
  }

  triggerWaveImpact() {
    level3Audio.playWaveImpact();

    // Bright flash on dome & shockwave
    if (this.shieldDomeMat) {
      this.shieldDomeMat.color.setHex(0xFFFFFF);
      setTimeout(() => {
        if (this.shieldDomeMat) this.shieldDomeMat.color.setHex(0x00E5FF);
      }, 250);
    }

    // Sky clears after impact
    setTimeout(() => {
      if (this.skyMat) this.skyMat.color.setHex(0x0B1226);
      if (this.waveLineMesh) this.waveLineMesh.visible = false;

      // Astronauts emerge from shelter to cheer
      this.astronauts.forEach((a, idx) => {
        a.group.visible = true;
        a.group.position.set(-3.0 + idx * 2.0, 0.3, -3.2);
        a.group.rotation.y = 0;
        if (a.leftArm && a.rightArm) {
          a.leftArm.rotation.x = Math.PI; // Cheering arms up!
          a.rightArm.rotation.x = Math.PI;
        }
      });

      this.onWin();
    }, 1200);
  }

  /**
   * Updates the storm atmosphere: streaking particle lines and sky tint
   */
  updateStormAtmosphere(delta, elapsedTime) {
    if (!this.stormParticles || !this.particlePositions) return;

    // Streaking particles moving down-left
    const pos = this.particlePositions;
    for (let i = 0; i < this.particleCount; i++) {
      const idx = i * 6;
      const v = this.particleVelocities[i];

      pos[idx] += v.vx * delta;
      pos[idx + 1] += v.vy * delta;
      pos[idx + 2] += v.vz * delta;

      pos[idx + 3] += v.vx * delta;
      pos[idx + 4] += v.vy * delta;
      pos[idx + 5] += v.vz * delta;

      // Recycle when below ground
      if (pos[idx + 1] < -1.0) {
        const x = (Math.random() - 0.5) * 45;
        const y = 20 + Math.random() * 15;
        const z = (Math.random() - 0.5) * 45;
        pos[idx] = x;
        pos[idx + 1] = y;
        pos[idx + 2] = z;
        pos[idx + 3] = x + 0.3;
        pos[idx + 4] = y + 1.2;
        pos[idx + 5] = z + 0.3;
      }
    }
    this.stormParticles.geometry.attributes.position.needsUpdate = true;

    // Gradually shift sky toward amber-red as countdown progresses
    if (this.skyMat && this.phase >= 1 && this.phase <= 3) {
      const progress = 1 - (this.timeLeft / this.totalTime); // 0 -> 1
      const r = THREE.MathUtils.lerp(0.04, 0.32, progress);
      const g = THREE.MathUtils.lerp(0.07, 0.08, progress);
      const b = THREE.MathUtils.lerp(0.15, 0.06, progress);
      this.skyMat.color.setRGB(r, g, b);
    }

    // Shrinking radiation wave line in sky
    if (this.waveLineMesh && this.phase >= 1 && this.phase <= 3) {
      const prog = this.timeLeft / this.totalTime;
      const scale = 0.5 + prog * 0.7;
      this.waveLineMesh.scale.set(scale, scale, 1);
    }
  }

  /**
   * Updates floating waypoint guide on ground
   */
  updateWaypointMarker(elapsedTime) {
    if (!this.waypointRing) return;

    let target = null;
    if (this.phase === 1) {
      // Find nearest ungathered astronaut
      let minDist = 999;
      this.astronauts.forEach(a => {
        if (!a.isGathered && !a.isSheltered) {
          const d = this.commander.group.position.distanceTo(a.group.position);
          if (d < minDist) {
            minDist = d;
            target = a.group.position;
          }
        }
      });
    } else if (this.phase === 2) {
      // Point to shelter door
      target = new THREE.Vector3(0, 0.05, -3.8);
    } else if (this.phase === 3) {
      // Point to Shield Generator tower
      target = new THREE.Vector3(0, 0.05, 6.7);
    }

    if (target) {
      this.waypointRing.visible = true;
      this.waypointRing.position.set(target.x, 0.06, target.z);
      const pulse = 1.0 + Math.sin(elapsedTime * 5.0) * 0.15;
      this.waypointRing.scale.set(pulse, pulse, pulse);
    } else {
      this.waypointRing.visible = false;
    }
  }

  giveHint() {
    if (this.phase === 1) {
      orbitVoice.speak("Call everyone with Space!");
    } else if (this.phase === 2) {
      orbitVoice.speak("Lead them to the shelter!");
    } else if (this.phase === 3) {
      orbitVoice.speak("Charge the shield, hurry!");
    }
  }

  onWin() {
    this.phase = 4;
    level3Audio.playVictoryFanfare();
    orbitVoice.speak("Super job Commander! Everyone is safe and the base is shielded!");

    // Calculate stars: 3 stars if >= 40s left, 2 stars if >= 15s, 1 star otherwise
    const stars = this.timeLeft >= 40 ? 3 : (this.timeLeft >= 15 ? 2 : 1);

    if (this.hud) {
      this.hud.showWinModal({
        stars,
        onContinue: () => {
          this.game.exitLevelToMissionControl();
          // Apply Sol 3 success
          this.game.handleMiniGameSuccess(3, 'choice_3_a');
        }
      });
    }
  }

  onFail() {
    this.phase = 5;
    level3Audio.playFailTone();
    orbitVoice.speak("The storm arrived too soon! Let's try again!");

    if (this.hud) {
      this.hud.showFailModal(
        () => {
          // Restart immediately without full intro
          this.dispose();
          this.game.startLevel3(true);
        },
        () => {
          // Back to Mission Control
          this.game.exitLevelToMissionControl();
        }
      );
    }
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      if (this.hud) {
        this.hud.showPauseModal(
          () => { this.isPaused = false; },
          () => {
            this.dispose();
            this.game.startLevel3(true);
          },
          () => {
            this.game.exitLevelToMissionControl();
          }
        );
      }
    } else {
      if (this.hud) this.hud.hideModals();
    }
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
