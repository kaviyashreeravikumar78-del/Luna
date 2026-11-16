import * as THREE from 'three';
import { CONFIG } from '../game/config.js';
import { gameState } from '../simulation/GameState.js';
import { orbit } from '../components/Orbit.js';
import { orbitVoice } from '../audio/OrbitVoice.js';
import { level2Audio } from '../audio/Level2Audio.js';
import { LevelTransition } from '../core/LevelTransition.js';
import { Level2HUD } from './Level2HUD.js';
import { disposeThreeObject, clearTimerArray } from '../core/disposeHelper.js';
import { ObjectiveBeacon, ClickRippleEffect } from '../core/ObjectiveBeacon.js';

/**
 * LUNA: Mission Survival - Dedicated Level 2 (Sol 2: Water Hunt Driving Mini-game)
 * Features:
 * - 120m x 120m rolling low-poly Moon driving terrain with craters, boulders, and dark shadowed crater
 * - Arcade-style 6-wheel rover with steerable wheels, suspension bounce, headlights, drill arm, and visible ice tank
 * - Third-person chase camera with speed-based zoom and bump shake
 * - Phase 1: Drive, steer, wheel dust trails, battery crystals
 * - Phase 2: Radar sonar ping with Hot/Cold audio & visual proximity meter to uncover 3 ice deposits
 * - Phase 3: Drill ice deposits, fill tank, follow return beacon back to base, and melt into colony water!
 */
export class Level2Water {
  constructor(game) {
    this.game = game;
    this.scene = game.scene;
    this.camera = game.camera;
    this.cameraManager = game.cameraManager;

    this.levelGroup = new THREE.Group();
    this.levelGroup.name = "Level2_Driving_Scene";

    // Driving physics state
    this.rover = null;
    this.wheels = [];
    this.frontWheelPivots = [];
    this.drillArm = null;
    this.iceBlocksInTank = [];

    this.roverPos = new THREE.Vector3(0, 0.45, 32); // Starting position near base
    this.roverHeading = Math.PI; // Facing North toward shadowed crater
    this.speed = 0;
    this.maxSpeed = 14.0;
    this.maxReverseSpeed = -7.0;
    this.acceleration = 24.0;
    this.deceleration = 18.0;
    this.steerAngle = 0;
    this.maxSteer = 0.65;

    // Keys & touch
    this.keys = { forward: false, backward: false, left: false, right: false, action: false };
    this.touchSteerX = 0;
    this.touchThrottleZ = 0;
    this.dpadSteer = 0;
    this.dpadThrottle = 0;
    this.nearDeposit = null;

    // Level state
    this.isActive = false;
    this.isPaused = false;
    this.phase = 0; // 0: Intro, 1: Drive, 2: Radar Ping, 3: Drill/Return, 4: Win, 5: Fail
    this.battery = 100;
    this.batteryDrainSpeed = 0.08; // Generous battery buffer (~800s driving)
    this.tankCount = 0;
    this.maxTank = 3;

    // Chase Camera
    this.camOffset = new THREE.Vector3(0, 3.8, 7.5);
    this.camLookAtOffset = new THREE.Vector3(0, 1.2, -3.5);

    // Radar Ping Wave
    this.pingPulse = { active: false, radius: 0, maxRadius: 55, speed: 28, opacity: 1 };
    this.pingRingMesh = null;

    // Ice deposits & battery crystals
    this.iceDeposits = [];
    this.batteryCrystals = [];
    this.craters = [];
    this.boulders = [];

    // Water Station at Base
    this.basePos = new THREE.Vector3(0, 0.2, 34);
    this.isDrilling = false;
    this.drillProgress = 0;
    this.activeDrillSite = null;

    // Particles
    this.wheelDustParticles = [];
    this.drillChipParticles = [];
    this.activeTimers = [];

    // Objective Beacon & Click-to-Move / Tap-to-Drive
    this.beacon = null;
    this.ripples = null;
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
   * Initializes the dedicated Level 2 3D scene
   */
  init() {
    this.isActive = true;
    this.scene.add(this.levelGroup);

    // 1. Hide colony structures to isolate the dedicated driving stage
    this.setColonyVisibility(false);

    // 2. Setup Atmospheric Deep Navy Lunar Fog
    this.originalFog = this.scene.fog;
    this.scene.fog = new THREE.FogExp2(0x06101E, 0.012);

    // 3. Build Vast Rolling Moon Driving Terrain (120m x 120m)
    this.buildDrivingTerrain();

    // 4. Build Starting Base Camp Landmark (Habitat, Antenna, Water Station Pad)
    this.buildBaseStationLandmark();

    // 5. Build High-Detail Pathfinder Rover with animated wheels, headlights, drill, and tank
    this.buildRover();

    // 6. Spawn 3 Hidden Ice Deposits in Shadowed Crater
    this.spawnIceDeposits();

    // 7. Spawn Recharge Battery Crystals & Obstacles
    this.spawnBatteryCrystals();
    this.spawnObstacles();

    // 8. Build 3D Radar Wave Mesh
    this.buildRadarWaveMesh();

    // 9. Setup Lighting (Dramatic low-angle sun with dark shadowed northern zone)
    this.setupLighting();

    // 10. Particle Systems (Wheel dust & drill chips)
    this.initParticleSystems();

    // 11. Minimal Driving HUD
    this.initHUD();

    // 12. Bind Keyboard Controls
    this.bindControls();

    // 13. Setup 3D Objective Beacon & Click-to-Move
    this.beacon = new ObjectiveBeacon(this.levelGroup);
    this.ripples = new ClickRippleEffect(this.levelGroup);
    this.setupClickToMove();

    // 14. Play Entry Cinematic
    this.playEntryCinematic();
  }

  setColonyVisibility(visible) {
    if (this.game && this.game.setColonyVisible) {
      this.game.setColonyVisible(visible);
    }
  }

  /**
   * Builds 120m x 120m procedural rolling Moon terrain with hills, valleys, and dark crater
   */
  buildDrivingTerrain() {
    const size = 120;
    const segments = 64;
    const geo = new THREE.PlaneGeometry(size, size, segments, segments);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);

      // Rolling undulating hills
      let y = Math.sin(x * 0.08) * Math.cos(z * 0.08) * 1.8;
      y += Math.sin(x * 0.03 + 1.2) * 2.2;

      // Dark Permanently Shadowed Crater Zone (North: Z < -15 to -50)
      const craterDist = Math.hypot(x, z - (-28));
      if (craterDist < 26) {
        // Deep crater depression
        const craterDepth = (1 - craterDist / 26) * 5.5;
        y -= craterDepth;
      }

      // Flat parking area near base camp
      const baseDist = Math.hypot(x, z - 34);
      if (baseDist < 12) {
        y *= (baseDist / 12);
      }

      pos.setY(i, y);
    }
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      color: 0xD95736,
      roughness: 0.9,
      metalness: 0.1,
      flatShading: true,
    });

    const terrainMesh = new THREE.Mesh(geo, mat);
    terrainMesh.receiveShadow = true;
    this.levelGroup.add(terrainMesh);
    this.terrainMesh = terrainMesh;
  }

  /**
   * Samples terrain elevation Y at given (x, z)
   */
  getTerrainHeight(x, z) {
    let y = Math.sin(x * 0.08) * Math.cos(z * 0.08) * 1.8;
    y += Math.sin(x * 0.03 + 1.2) * 2.2;

    const craterDist = Math.hypot(x, z - (-28));
    if (craterDist < 26) {
      y -= (1 - craterDist / 26) * 5.5;
    }

    const baseDist = Math.hypot(x, z - 34);
    if (baseDist < 12) {
      y *= (baseDist / 12);
    }

    return y;
  }

  buildBaseStationLandmark() {
    const baseGroup = new THREE.Group();
    baseGroup.position.copy(this.basePos);

    // Habitat Dome silhouette
    const domeGeo = new THREE.SphereGeometry(3.5, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const domeMat = new THREE.MeshStandardMaterial({ color: 0xE6EAF0, roughness: 0.4 });
    const dome = new THREE.Mesh(domeGeo, domeMat);
    dome.position.set(-6, 0, 0);
    dome.castShadow = true;
    baseGroup.add(dome);

    // Space Radio Dish
    const dish = new THREE.Mesh(
      new THREE.SphereGeometry(2.0, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.35),
      new THREE.MeshStandardMaterial({ color: 0xD0D7DE, metalness: 0.7 })
    );
    dish.position.set(7, 3, 2);
    dish.rotation.x = Math.PI * 0.4;
    baseGroup.add(dish);

    // Glowing Circular Water Station Return Pad (where player unloads ice)
    const padGeo = new THREE.CylinderGeometry(3.5, 3.8, 0.25, 24);
    const padMat = new THREE.MeshStandardMaterial({ color: 0x1E293B, metalness: 0.8 });
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.position.set(0, 0.1, 0);
    baseGroup.add(pad);

    const padRingGeo = new THREE.RingGeometry(3.0, 3.4, 32);
    const padRingMat = new THREE.MeshBasicMaterial({ color: 0x00E5FF, side: THREE.DoubleSide });
    const padRing = new THREE.Mesh(padRingGeo, padRingMat);
    padRing.rotation.x = -Math.PI / 2;
    padRing.position.y = 0.24;
    baseGroup.add(padRing);

    // Floating water beacon icon above pad
    const beaconGeo = new THREE.TorusGeometry(0.8, 0.12, 8, 16);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0x00E5FF });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.set(0, 2.5, 0);
    baseGroup.add(beacon);
    this.waterBeacon = beacon;

    this.levelGroup.add(baseGroup);
  }

  buildRover() {
    const roverGroup = new THREE.Group();
    roverGroup.position.copy(this.roverPos);
    roverGroup.rotation.y = this.roverHeading;

    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xF2F5F8, roughness: 0.35, metalness: 0.2 });
    const chassisMat = new THREE.MeshStandardMaterial({ color: 0x2A323D, roughness: 0.7, metalness: 0.5 });
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x1E242B, roughness: 0.9 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0x00E5FF, metalness: 0.8, roughness: 0.2 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x0B192C, roughness: 0.1, metalness: 0.9 });

    // 1. Chassis
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.25, 2.4), chassisMat);
    chassis.position.y = 0.35;
    chassis.castShadow = true;
    roverGroup.add(chassis);

    // 2. Cabin Shell with Front Windshield
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.85, 1.4), bodyMat);
    cabin.position.set(0, 0.85, 0.1);
    cabin.castShadow = true;
    roverGroup.add(cabin);

    const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5, 0.08), glassMat);
    windshield.position.set(0, 0.95, -0.62);
    windshield.rotation.x = Math.PI * 0.12;
    roverGroup.add(windshield);

    // 3. Commander Astronaut sitting in cabin
    const astroHead = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 12), bodyMat);
    astroHead.position.set(0, 1.05, 0.1);
    const visor = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8, 0, Math.PI, 0, Math.PI * 0.7), glassMat);
    visor.rotation.x = Math.PI * 0.85;
    visor.position.set(0, 1.05, -0.05);
    roverGroup.add(astroHead);
    roverGroup.add(visor);

    // 4. Wheels (6 In-Hub Drive Wheels)
    const wheelRadius = 0.32;
    const wheelWidth = 0.24;
    const wheelGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 16);
    const rimGeo = new THREE.CylinderGeometry(wheelRadius * 0.55, wheelRadius * 0.55, wheelWidth + 0.02, 12);

    const wheelConfigs = [
      { x: -0.95, z: -0.85, isFront: true },
      { x:  0.95, z: -0.85, isFront: true },
      { x: -0.95, z:  0.0,  isFront: false },
      { x:  0.95, z:  0.0,  isFront: false },
      { x: -0.95, z:  0.85, isFront: false },
      { x:  0.95, z:  0.85, isFront: false },
    ];

    this.wheels = [];
    this.frontWheelPivots = [];

    wheelConfigs.forEach(cfg => {
      const pivot = new THREE.Group();
      pivot.position.set(cfg.x, wheelRadius, cfg.z);

      const tire = new THREE.Mesh(wheelGeo, tireMat);
      tire.rotation.z = Math.PI / 2;
      tire.castShadow = true;
      pivot.add(tire);

      const rim = new THREE.Mesh(rimGeo, rimMat);
      rim.rotation.z = Math.PI / 2;
      pivot.add(rim);

      roverGroup.add(pivot);
      this.wheels.push(tire);

      if (cfg.isFront) {
        this.frontWheelPivots.push(pivot);
      }
    });

    // 5. Dual Headlights with dynamic illumination
    [-0.5, 0.5].forEach(x => {
      const lightMesh = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), new THREE.MeshBasicMaterial({ color: 0xFFF5E6 }));
      lightMesh.position.set(x, 0.65, -1.22);
      roverGroup.add(lightMesh);

      const spot = new THREE.SpotLight(0xFFF5E6, 3.5, 28, Math.PI * 0.22, 0.4);
      spot.position.set(x, 0.65, -1.25);
      spot.target.position.set(x, -0.2, -12);
      roverGroup.add(spot);
      roverGroup.add(spot.target);
    });

    // 6. Drill Arm (on rear side)
    const drillArmGroup = new THREE.Group();
    drillArmGroup.position.set(0.65, 0.7, 1.1);
    const armBoom = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.8, 8), chassisMat);
    armBoom.position.y = -0.3;
    drillArmGroup.add(armBoom);
    const drillHead = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.4, 8), rimMat);
    drillHead.rotation.x = Math.PI;
    drillHead.position.y = -0.7;
    drillArmGroup.add(drillHead);
    roverGroup.add(drillArmGroup);
    this.drillArm = drillArmGroup;

    // 7. Water/Ice Collection Tank (on rear deck)
    const tankCasing = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.6, 0.7),
      new THREE.MeshStandardMaterial({ color: 0x00E5FF, transparent: true, opacity: 0.35, roughness: 0.1 })
    );
    tankCasing.position.set(0, 0.75, 0.9);
    roverGroup.add(tankCasing);

    // 3 Visual Ice Blocks inside the tank
    this.iceBlocksInTank = [];
    [-0.22, 0, 0.22].forEach((x, idx) => {
      const iceBlock = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.35, 0.4),
        new THREE.MeshStandardMaterial({ color: 0x00E5FF, emissive: 0x0099FF, emissiveIntensity: 0.6 })
      );
      iceBlock.position.set(x, 0.72, 0.9);
      iceBlock.visible = false; // Becomes visible as collected
      roverGroup.add(iceBlock);
      this.iceBlocksInTank.push(iceBlock);
    });

    this.levelGroup.add(roverGroup);
    this.rover = roverGroup;
  }

  spawnIceDeposits() {
    // 3 Highly Visible Lunar Diamond Deposits
    const sites = [
      { id: 1, pos: new THREE.Vector3(-14, 0, -22), label: "Crater Rim Diamond" },
      { id: 2, pos: new THREE.Vector3(  6, 0, -32), label: "Deep Shadow Diamond" },
      { id: 3, pos: new THREE.Vector3(-6,  0, -42), label: "Glaze Pocket Diamond" },
    ];

    this.iceDeposits = [];

    sites.forEach(s => {
      s.pos.y = this.getTerrainHeight(s.pos.x, s.pos.z) + 0.05;

      const group = new THREE.Group();
      group.position.copy(s.pos);

      // 1. Sparkling Ice Patch on the ground (Always Visible!)
      const patchGeo = new THREE.CircleGeometry(2.6, 24);
      const patchMat = new THREE.MeshStandardMaterial({
        color: 0x00E5FF,
        emissive: 0x0088CC,
        emissiveIntensity: 0.85,
        roughness: 0.15,
        transparent: true,
        opacity: 0.85
      });
      const patch = new THREE.Mesh(patchGeo, patchMat);
      patch.rotation.x = -Math.PI / 2;
      group.add(patch);

      // 2. Glowing Ground Ring
      const ringGeo = new THREE.RingGeometry(2.2, 2.65, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x00FFFF,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.04;
      group.add(ring);

      // 3. Sky-High Vertical Light Beam (Reaches 38m into lunar sky so player sees it from everywhere!)
      const beamGeo = new THREE.CylinderGeometry(0.2, 0.45, 38, 16);
      const beamMat = new THREE.MeshBasicMaterial({
        color: 0x00E5FF,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide
      });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.y = 19;
      group.add(beam);

      // 4. Large Sparkling 3D Diamond
      const crystalGeo = new THREE.OctahedronGeometry(0.9, 0);
      const crystalMat = new THREE.MeshStandardMaterial({
        color: 0x00FFFF,
        emissive: 0x0099FF,
        emissiveIntensity: 0.9,
        roughness: 0.1,
        metalness: 0.85
      });
      const crystal = new THREE.Mesh(crystalGeo, crystalMat);
      crystal.position.y = 2.0;
      crystal.visible = true; // Always visible!
      group.add(crystal);

      // 5. Outer Holographic Diamond Cage
      const cageGeo = new THREE.OctahedronGeometry(1.2, 0);
      const cageMat = new THREE.MeshBasicMaterial({
        color: 0xFFFFFF,
        wireframe: true,
        transparent: true,
        opacity: 0.6
      });
      const cage = new THREE.Mesh(cageGeo, cageMat);
      cage.position.y = 2.0;
      group.add(cage);

      this.levelGroup.add(group);

      this.iceDeposits.push({
        id: s.id,
        label: s.label,
        pos: s.pos,
        group,
        patch,
        ring,
        beam,
        crystal,
        cage,
        revealed: true, // Always revealed!
        collected: false
      });
    });
  }

  spawnBatteryCrystals() {
    // Floating blue battery recharge crystals
    const crystalPositions = [
      { x: -5, z: 18 },
      { x: 12, z: 12 },
      { x: -18, z: 4 },
      { x: 8, z: -8 },
      { x: -2, z: -16 },
      { x: 16, z: -25 },
    ];

    this.batteryCrystals = [];
    const geo = new THREE.OctahedronGeometry(0.35, 0);
    const mat = new THREE.MeshBasicMaterial({ color: 0xFFB703 });

    crystalPositions.forEach(p => {
      const y = this.getTerrainHeight(p.x, p.z) + 0.8;
      const crystal = new THREE.Mesh(geo, mat);
      crystal.position.set(p.x, y, p.z);
      this.levelGroup.add(crystal);
      this.batteryCrystals.push({ mesh: crystal, collected: false });
    });
  }

  spawnObstacles() {
    // Scattered Boulders
    const rockGeo = new THREE.DodecahedronGeometry(0.9, 1);
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x6E2514, roughness: 0.9, flatShading: true });

    const rockCoords = [
      { x: 5, z: 22 }, { x: -8, z: 14 }, { x: 14, z: 2 }, { x: -16, z: -6 },
      { x: 2, z: -8 }, { x: -10, z: -18 }, { x: 18, z: -16 }, { x: -20, z: -30 }
    ];

    this.boulders = [];
    rockCoords.forEach(c => {
      const y = this.getTerrainHeight(c.x, c.z) + 0.4;
      const rock = new THREE.Mesh(rockGeo, rockMat);
      rock.position.set(c.x, y, c.z);
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      rock.castShadow = true;
      this.levelGroup.add(rock);
      this.boulders.push({ pos: new THREE.Vector3(c.x, y, c.z), radius: 1.1 });
    });
  }

  buildRadarWaveMesh() {
    // Expanding circular wave ring for radar sonar ping
    const ringGeo = new THREE.RingGeometry(0.1, 0.6, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00E5FF,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.0
    });
    this.pingRingMesh = new THREE.Mesh(ringGeo, ringMat);
    this.pingRingMesh.rotation.x = -Math.PI / 2;
    this.pingRingMesh.position.y = 0.05;
    this.levelGroup.add(this.pingRingMesh);
  }

  setupLighting() {
    // Low-angle directional sun
    this.sunLight = new THREE.DirectionalLight(0xFFE4C4, 1.2);
    this.sunLight.position.set(30, 15, 45);
    this.sunLight.castShadow = true;
    this.levelGroup.add(this.sunLight);

    this.ambientLight = new THREE.AmbientLight(0x0C192E, 0.6);
    this.levelGroup.add(this.ambientLight);
  }

  initParticleSystems() {
    // 1. Wheel Dust Particles
    this.wheelDustParticles = [];
    const dustGeo = new THREE.DodecahedronGeometry(0.06, 0);
    const dustMat = new THREE.MeshBasicMaterial({ color: 0xD95736, transparent: true, opacity: 0.7 });
    for (let i = 0; i < 40; i++) {
      const p = new THREE.Mesh(dustGeo, dustMat);
      p.visible = false;
      this.levelGroup.add(p);
      this.wheelDustParticles.push({ mesh: p, life: 0, vel: new THREE.Vector3() });
    }

    // 2. Drill Chips Particles
    this.drillChipParticles = [];
    const chipGeo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
    const chipMat = new THREE.MeshBasicMaterial({ color: 0x00E5FF });
    for (let i = 0; i < 30; i++) {
      const c = new THREE.Mesh(chipGeo, chipMat);
      c.visible = false;
      this.levelGroup.add(c);
      this.drillChipParticles.push({ mesh: c, life: 0, vel: new THREE.Vector3() });
    }
  }

  emitWheelDust() {
    for (let i = 0; i < 3; i++) {
      const p = this.wheelDustParticles.find(dp => !dp.mesh.visible);
      if (p) {
        p.mesh.position.copy(this.roverPos);
        p.mesh.position.y = this.roverPos.y - 0.2;
        p.vel.set((Math.random() - 0.5) * 1.2, 0.8 + Math.random() * 1.0, (Math.random() - 0.5) * 1.2);
        p.life = 0.6;
        p.mesh.visible = true;
      }
    }
  }

  emitDrillChips(pos) {
    level2Audio.playDrill();
    for (let i = 0; i < 6; i++) {
      const c = this.drillChipParticles.find(cp => !cp.mesh.visible);
      if (c) {
        c.mesh.position.copy(pos);
        c.vel.set((Math.random() - 0.5) * 2.5, 1.5 + Math.random() * 2.0, (Math.random() - 0.5) * 2.5);
        c.life = 0.7;
        c.mesh.visible = true;
      }
    }
  }

  initHUD() {
    this.hud = new Level2HUD({
      onPause: () => {
        this.isPaused = true;
        level2Audio.stopEngine();
      },
      onResume: () => {
        this.isPaused = false;
        level2Audio.startEngine();
      },
      onRestart: () => {
        this.dispose();
        this.game.startLevel2(true);
      },
      onReturnToMissionControl: () => {
        this.game.exitLevelToMissionControl();
      },
      onWinContinue: () => {
        this.onWin();
      },
      onRadarPing: () => {
        this.triggerRadarPing();
      },
      onBreakDiamond: () => {
        if (this.nearDeposit && !this.nearDeposit.collected) {
          this.breakDiamondDeposit(this.nearDeposit);
        }
      },
      onSelectTargetDiamond: (siteId) => {
        const dep = this.iceDeposits.find(d => d.id === siteId);
        if (dep && !dep.collected) {
          this.targetDestination = { x: dep.pos.x, z: dep.pos.z };
          if (this.beacon) {
            this.beacon.showAt(dep.pos.x, dep.pos.y + 0.1, dep.pos.z, 0x00E5FF);
          }
        }
      },
      onThrottleChange: (val) => {
        this.dpadThrottle = val;
      },
      onSteerChange: (val) => {
        this.dpadSteer = val;
      },
      onJoystickMove: (dx, dz) => {
        this.touchSteerX = dx;
        this.touchThrottleZ = dz;
      }
    });

    this.hud.setBattery(this.battery);
    this.hud.setTank(0, this.maxTank);
  }

  bindControls() {
    this.onKeyDown = (e) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': this.keys.forward = true; break;
        case 'KeyS': case 'ArrowDown': this.keys.backward = true; break;
        case 'KeyA': case 'ArrowLeft': this.keys.left = true; break;
        case 'KeyD': case 'ArrowRight': this.keys.right = true; break;
        case 'Space':
          if (this.nearDeposit && !this.nearDeposit.collected) {
            this.breakDiamondDeposit(this.nearDeposit);
          } else {
            this.triggerRadarPing();
          }
          break;
      }
    };

    this.onKeyUp = (e) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': this.keys.forward = false; break;
        case 'KeyS': case 'ArrowDown': this.keys.backward = false; break;
        case 'KeyA': case 'ArrowLeft': this.keys.left = false; break;
        case 'KeyD': case 'ArrowRight': this.keys.right = false; break;
        case 'Space': this.isDrilling = false; break;
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
        e.target.closest('.l2-top-bar') ||
        e.target.closest('#l2-touch-dock') ||
        e.target.closest('.l2-modal-backdrop') ||
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
      if (this.terrainMesh) {
        const hits = this.raycaster.intersectObject(this.terrainMesh);
        if (hits.length > 0) {
          const pt = hits[0].point;
          this.targetDestination = { x: pt.x, z: pt.z };
          if (this.ripples) {
            this.ripples.spawn(pt.x, pt.y + 0.15, pt.z);
          }
        }
      }
    };

    const dom = this.game.renderer.domElement;
    dom.addEventListener('pointerdown', this.onCanvasPointerDown);
  }

  playEntryCinematic() {
    this.phase = 0; // Cutscene lock

    // Wait until the circular iris transition completes (1.8s) before starting engine and speaking
    this.safeTimeout(() => {
      if (!this.isActive || !this.hud) return;
      level2Audio.startEngine();

      // Camera positioned behind rover, ORBIT flies in and speaks ONCE
      orbit.flyTo(window.innerWidth - 180, 100);
      orbit.say("Our colony water is low! Follow the 3 sky beacons to find and break the diamond ice!", {
        emotion: 'worried',
        gesture: 'point'
      });

      this.safeTimeout(() => {
        if (!this.isActive || !this.hud) return;
        this.hud.showGoBanner(() => {
          if (!this.isActive || !this.hud) return;
          this.phase = 1;
          this.hud.setObjective("Break the 3 diamonds (0/3)!", "💎");
        });
      }, 1400);
    }, 1800);
  }

  /**
   * Main game loop update
   */
  update(delta, elapsedTime) {
    if (!this.isActive || this.isPaused) return;

    // 1. Update Rover Kinematics & Driving Controls
    if (this.phase >= 1 && this.phase <= 3) {
      this.updateRoverDriving(delta);
      this.updateBatteryDrain(delta);
      this.checkCrystalCollisions();
      this.checkObstacleCollisions();
      this.checkDrillProximity();
    }

    // 2. Update Drilling (Phase 3)
    if (this.isDrilling && this.activeDrillSite) {
      this.updateDrilling(delta);
    }

    // 3. Update Radar Ping Wave Expansion
    if (this.pingPulse.active) {
      this.updateRadarPingWave(delta);
    }

    // 4. Update Chase Camera
    this.updateChaseCamera(delta);

    // 5. Update Minimap & Particles
    this.hud.updateMinimap(this.roverPos, this.basePos, this.pingPulse, this.iceDeposits);
    this.updateParticles(delta);

    // 6. Pulse Water Station Beacon
    if (this.waterBeacon) {
      this.waterBeacon.rotation.z = elapsedTime * 2.0;
    }

    // 7. Animate 3D Diamond Crystals & Light Beacons
    this.iceDeposits.forEach((dep, idx) => {
      if (!dep.collected) {
        if (dep.crystal) dep.crystal.rotation.y += delta * 1.5;
        if (dep.cage) dep.cage.rotation.y -= delta * 1.2;
        if (dep.ring) {
          const s = 1 + Math.sin(elapsedTime * 3 + idx) * 0.12;
          dep.ring.scale.set(s, s, 1);
        }
        if (dep.beam) {
          dep.beam.material.opacity = 0.28 + Math.sin(elapsedTime * 2.5 + idx) * 0.12;
        }
      }
    });

    // 8. Update HUD Diamond Compass & Tracker
    if (this.hud) {
      this.hud.updateDiamondTracker(this.iceDeposits, this.roverPos, this.roverHeading);
    }

    // 9. Update Objective Guidance & Beacon
    this.updateObjectiveGuidance(delta, elapsedTime);
    if (this.beacon) this.beacon.update(delta, elapsedTime);
    if (this.ripples) this.ripples.update(delta);
  }

  updateObjectiveGuidance(delta, elapsedTime) {
    if (this.phase < 1 || this.phase > 3) {
      if (this.beacon) this.beacon.hide();
      return;
    }

    // Check if tank is full (3/3 ice collected)
    if (this.tankCount >= this.maxTank) {
      if (this.currentGuideTarget !== 'base') {
        this.currentGuideTarget = 'base';
        this.hasPromptedAction = false;
        if (this.beacon) {
          this.beacon.showAt(this.basePos.x, this.basePos.y + 0.25, this.basePos.z, 0x06D6A0);
        }
        orbit.flyTo3D(new THREE.Vector3(this.basePos.x, this.basePos.y + 2.5, this.basePos.z), this.camera);
        orbit.say("Tank is full! Drive back to base and tap UNLOAD to melt the ice into clean water!", {
          emotion: 'excited',
          gesture: 'point'
        });
      }

      const distToBase = this.roverPos.distanceTo(this.basePos);
      if (distToBase < 5.0 && !this.hasPromptedAction) {
        this.hasPromptedAction = true;
        orbit.say("You reached base! Hold SPACE or tap UNLOAD to fill our colony water tanks!", {
          emotion: 'happy',
          gesture: 'point'
        });
      }
      return;
    }

    // Find nearest uncollected ice deposit
    let closestDep = null;
    let closestDist = Infinity;
    this.iceDeposits.forEach(dep => {
      if (!dep.collected) {
        const d = this.roverPos.distanceTo(dep.pos);
        if (d < closestDist) {
          closestDist = d;
          closestDep = dep;
        }
      }
    });

    if (closestDep) {
      if (this.currentGuideTarget !== closestDep) {
        this.currentGuideTarget = closestDep;
        this.hasPromptedAction = false;
        if (this.beacon) {
          this.beacon.showAt(closestDep.pos.x, closestDep.pos.y + 0.1, closestDep.pos.z, 0x00E5FF);
        }
        orbit.flyTo3D(new THREE.Vector3(closestDep.pos.x, closestDep.pos.y + 2.0, closestDep.pos.z), this.camera);
      }
    }
  }

  updateRoverDriving(delta) {
    let clickThrottle = 0;

    const manualActive = (this.keys.forward || this.keys.backward || this.keys.left || this.keys.right ||
      Math.abs(this.touchSteerX) > 0.05 || Math.abs(this.touchThrottleZ) > 0.1 ||
      this.dpadThrottle !== 0 || this.dpadSteer !== 0);

    // Tap-to-drive on terrain (smooth navigation)
    if (manualActive) {
      this.targetDestination = null;
    } else if (this.targetDestination) {
      const dx = this.targetDestination.x - this.roverPos.x;
      const dz = this.targetDestination.z - this.roverPos.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 1.2) {
        const targetHeading = Math.atan2(-dx, -dz);
        let diff = targetHeading - this.roverHeading;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        this.roverHeading += Math.sign(diff) * Math.min(Math.abs(diff), 3.8 * delta);
        clickThrottle = Math.cos(diff) > 0.1 ? Math.min(1.0, dist * 0.4) : 0.35;
      } else {
        this.targetDestination = null;
      }
    }

    // Steering input (Keyboard, D-Pad, or Touch Joystick)
    let steerInput = 0;
    if (this.keys.left) steerInput += 1;
    if (this.keys.right) steerInput -= 1;
    if (this.touchSteerX) steerInput -= this.touchSteerX;
    if (this.dpadSteer) steerInput += this.dpadSteer;

    // DIRECT RESPONSIVE STEERING: Allows 360° turning in-place at standstill or rolling!
    if (Math.abs(steerInput) > 0.05) {
      this.roverHeading += steerInput * 3.0 * delta;
      this.steerAngle = THREE.MathUtils.lerp(this.steerAngle, steerInput * this.maxSteer, delta * 15);
    } else {
      this.steerAngle = THREE.MathUtils.lerp(this.steerAngle, 0, delta * 10);
    }

    // Turn front wheels visually
    this.frontWheelPivots.forEach(p => {
      p.rotation.y = this.steerAngle;
    });

    // Throttle input
    let throttle = 0;
    if (this.keys.forward) throttle += 1;
    if (this.keys.backward) throttle -= 1;
    if (this.touchThrottleZ < -0.2) throttle += 1;
    if (this.touchThrottleZ > 0.2) throttle -= 1;
    if (this.dpadThrottle) throttle += this.dpadThrottle;
    if (clickThrottle) throttle += clickThrottle;

    // Acceleration & Braking
    if (throttle > 0) {
      this.speed = Math.min(this.maxSpeed, this.speed + this.acceleration * delta);
    } else if (throttle < 0) {
      this.speed = Math.max(this.maxReverseSpeed, this.speed - this.deceleration * delta);
    } else {
      // Smooth natural deceleration
      if (this.speed > 0) {
        this.speed = Math.max(0, this.speed - this.deceleration * delta);
      } else if (this.speed < 0) {
        this.speed = Math.min(0, this.speed + this.deceleration * delta);
      }
    }

    // Move Rover forward
    const forwardX = -Math.sin(this.roverHeading);
    const forwardZ = -Math.cos(this.roverHeading);

    this.roverPos.x += forwardX * this.speed * delta;
    this.roverPos.z += forwardZ * this.speed * delta;

    // Soft Boulder Deflection: Gently pushes the rover outward so it NEVER gets stuck!
    this.boulders.forEach(b => {
      const dx = this.roverPos.x - b.pos.x;
      const dz = this.roverPos.z - b.pos.z;
      const dist = Math.hypot(dx, dz);
      const minDist = b.radius + 1.25;
      if (dist < minDist && dist > 0.001) {
        const push = minDist - dist;
        this.roverPos.x += (dx / dist) * push;
        this.roverPos.z += (dz / dist) * push;
        this.speed *= 0.88; // Smoothly slows down instead of halting
      }
    });

    // Boundary clamp (within 55m radius)
    const distFromOrigin = Math.hypot(this.roverPos.x, this.roverPos.z);
    if (distFromOrigin > 54) {
      this.roverPos.x = (this.roverPos.x / distFromOrigin) * 54;
      this.roverPos.z = (this.roverPos.z / distFromOrigin) * 54;
      this.speed = 0;
    }

    // Sample Terrain Height
    const groundY = this.getTerrainHeight(this.roverPos.x, this.roverPos.z);
    this.roverPos.y = groundY + 0.38;

    // Apply to 3D Rover
    this.rover.position.copy(this.roverPos);
    this.rover.rotation.y = this.roverHeading;

    // Suspension bounce
    if (Math.abs(this.speed) > 0.5) {
      this.rover.position.y += Math.sin(performance.now() * 0.02) * 0.04;
      if (Math.random() < 0.25) {
        this.emitWheelDust();
      }
    }

    // Spin wheels
    const wheelRotSpeed = (this.speed / 0.32) * delta;
    this.wheels.forEach(w => {
      w.rotation.x += wheelRotSpeed;
    });

    // Audio Engine Hum
    const speedRatio = Math.abs(this.speed) / this.maxSpeed;
    level2Audio.updateEngineSpeed(speedRatio);
  }

  updateBatteryDrain(delta) {
    // Battery drains faster while driving fast
    const speedFactor = 1.0 + (Math.abs(this.speed) / this.maxSpeed) * 0.8;
    this.battery -= this.batteryDrainSpeed * speedFactor * delta;
    this.hud.setBattery(this.battery);

    if (this.battery <= 0) {
      this.phase = 5; // Fail
      this.speed = 0;
      level2Audio.stopEngine();
      this.hud.showFail();
      orbit.say("Our rover ran out of battery! Tap retry to charge up and drive again!", {
        emotion: 'sad',
        gesture: 'wave'
      });
    }
  }

  checkCrystalCollisions() {
    this.batteryCrystals.forEach(c => {
      if (!c.collected) {
        const d = this.roverPos.distanceTo(c.mesh.position);
        if (d < 2.0) {
          c.collected = true;
          c.mesh.visible = false;
          this.battery = Math.min(100, this.battery + 18);
          this.hud.setBattery(this.battery);
          this.hud.showPopup(window.innerWidth / 2, window.innerHeight * 0.4, "+18% Battery! 🔋", "#FFB703");
          level2Audio.playIceCollect();
        }
      }
    });
  }

  checkObstacleCollisions() {
    this.boulders.forEach(b => {
      const d = Math.hypot(this.roverPos.x - b.pos.x, this.roverPos.z - b.pos.z);
      if (d < b.radius + 0.8) {
        // Bump!
        level2Audio.playBump();
        this.speed *= -0.3; // Gentle bounce back
        this.battery = Math.max(0, this.battery - 2.5);
        this.hud.setBattery(this.battery);
      }
    });
  }

  /**
   * Phase 2: Radar Sonar Ping
   */
  triggerRadarPing() {
    this.pingPulse.active = true;
    this.pingPulse.radius = 1;
    this.pingPulse.opacity = 1;

    this.pingRingMesh.position.set(this.roverPos.x, this.roverPos.y - 0.25, this.roverPos.z);
    this.pingRingMesh.visible = true;

    // Find nearest uncollected ice deposit
    let closestDist = Infinity;
    let closestDeposit = null;

    this.iceDeposits.forEach(dep => {
      if (!dep.collected) {
        const d = this.roverPos.distanceTo(dep.pos);
        if (d < closestDist) {
          closestDist = d;
          closestDeposit = dep;
        }
      }
    });

    if (closestDeposit) {
      if (closestDist > 35) {
        level2Audio.playRadarPing('cold');
        this.hud.showRadarMeter("RADAR: COLD ❄️ (Keep Driving North)", 'cold');
      } else if (closestDist > 16) {
        level2Audio.playRadarPing('warm');
        this.hud.showRadarMeter("RADAR: WARMER 📡 (Getting Closer!)", 'warm');
      } else {
        level2Audio.playRadarPing('hot');
        this.hud.showRadarMeter("RADAR: VERY CLOSE! 🎯 (Ice Near!)", 'hot');

        // Uncover the ice deposit!
        if (!closestDeposit.revealed) {
          closestDeposit.revealed = true;
          closestDeposit.patch.material.opacity = 0.9;
          closestDeposit.crystal.visible = true;

          orbit.say("Ice detected! Stop on the blue patch and hold Drill!", {
            emotion: 'happy',
            gesture: 'point'
          });
        }
      }
    }
  }

  updateRadarPingWave(delta) {
    this.pingPulse.radius += this.pingPulse.speed * delta;
    this.pingPulse.opacity = Math.max(0, 1 - (this.pingPulse.radius / this.pingPulse.maxRadius));

    this.pingRingMesh.scale.setScalar(this.pingPulse.radius);
    this.pingRingMesh.material.opacity = this.pingPulse.opacity;

    if (this.pingPulse.radius >= this.pingPulse.maxRadius) {
      this.pingPulse.active = false;
      this.pingRingMesh.visible = false;
    }
  }

  checkDrillProximity() {
    let nearSite = null;

    for (const dep of this.iceDeposits) {
      if (!dep.collected) {
        const d = Math.hypot(this.roverPos.x - dep.pos.x, this.roverPos.z - dep.pos.z);
        if (d < 5.0) {
          nearSite = dep;
          // Drive straight into the diamond ice to break it!
          if (d < 2.4) {
            this.breakDiamondDeposit(dep);
            return;
          }
          break;
        }
      }
    }

    this.nearDeposit = nearSite;
    this.activeDrillSite = nearSite;
    this.hud.showBreakButton(!!nearSite);

    // Check return to base water station pad
    if (this.tankCount >= this.maxTank) {
      const distToBase = Math.hypot(this.roverPos.x - this.basePos.x, this.roverPos.z - this.basePos.z);
      if (distToBase < 4.5) {
        this.completeLevelVictory();
      }
    }
  }

  breakDiamondDeposit(deposit) {
    const dep = deposit || this.nearDeposit || this.activeDrillSite;
    if (!dep || dep.collected) return;
    dep.collected = true;

    if (dep.crystal) dep.crystal.visible = false;
    if (dep.cage) dep.cage.visible = false;
    if (dep.beam) dep.beam.visible = false;
    if (dep.ring) dep.ring.visible = false;
    if (dep.patch) dep.patch.visible = false;

    this.tankCount = Math.min(this.maxTank, this.tankCount + 1);
    this.hud.setTank(this.tankCount, this.maxTank);
    this.hud.setStars(this.tankCount);

    // Make ice cube visible inside the rover's tank!
    if (this.iceBlocksInTank[this.tankCount - 1]) {
      this.iceBlocksInTank[this.tankCount - 1].visible = true;
    }

    level2Audio.playBump();
    level2Audio.playIceCollect();
    level2Audio.playSplash();
    this.hud.showPopup(window.innerWidth / 2, window.innerHeight * 0.45, `+1 Diamond Ice! (${this.tankCount}/3) 💎🧊`);

    this.nearDeposit = null;
    this.activeDrillSite = null;
    this.isDrilling = false;
    this.hud.showBreakButton(false);

    if (this.tankCount < this.maxTank) {
      this.hud.setObjective(`Find diamonds (${this.tankCount}/3)`, "💎");
      orbit.say(`Ice collected (${this.tankCount}/3)! Follow the sky beacons for the next one!`, {
        emotion: 'excited',
        gesture: 'nod',
        autoCloseDelay: 2500
      });
    } else {
      // All 3 collected!
      this.phase = 3;
      this.hud.setObjective("Return ice to Base Camp! 🚀", "🏠");
      if (this.beacon) {
        this.beacon.showAt(this.basePos.x, this.basePos.y + 0.25, this.basePos.z, 0x06D6A0);
      }
      orbit.flyTo3D(new THREE.Vector3(this.basePos.x, this.basePos.y + 2.5, this.basePos.z), this.camera);
      orbit.say("Tank is full! Drive back to base camp to unload the ice!", {
        emotion: 'excited',
        gesture: 'wave',
        autoCloseDelay: 3200
      });
    }
  }

  completeDepositExtraction(dep) {
    this.breakDiamondDeposit(dep);
  }

  openExtractionPuzzle(deposit) {
    this.breakDiamondDeposit(deposit);
  }

  updateDrilling(delta) {
    if (!this.activeDrillSite) return;
    this.breakDiamondDeposit(this.activeDrillSite);
    this.isDrilling = false;
  }

  completeLevelVictory() {
    this.phase = 4;
    this.speed = 0;
    level2Audio.stopEngine();

    // Splashing animation & success jingle
    level2Audio.playSplash();
    level2Audio.playSuccessJingle();

    orbit.celebrate();
    orbit.say("Hooray! Ice melted into fresh drinking water for the colony!", {
      emotion: 'excited',
      gesture: 'wave'
    });

    setTimeout(() => {
      const stars = (this.battery > 45) ? 3 : (this.battery > 20 ? 2 : 1);
      this.hud.showWin(stars);
    }, 1500);
  }

  updateChaseCamera(delta) {
    if (!this.camera || !this.rover) return;

    // Follow smoothly behind rover
    const targetCamX = this.roverPos.x + Math.sin(this.roverHeading) * this.camOffset.z;
    const targetCamZ = this.roverPos.z + Math.cos(this.roverHeading) * this.camOffset.z;
    const targetCamY = this.roverPos.y + this.camOffset.y;

    this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, targetCamX, delta * 4.5);
    this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, targetCamY, delta * 4.5);
    this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, targetCamZ, delta * 4.5);

    const lookTarget = new THREE.Vector3(
      this.roverPos.x - Math.sin(this.roverHeading) * 3,
      this.roverPos.y + 1.0,
      this.roverPos.z - Math.cos(this.roverHeading) * 3
    );

    this.camera.lookAt(lookTarget);
  }

  updateParticles(delta) {
    this.wheelDustParticles.forEach(dp => {
      if (dp.mesh.visible) {
        dp.life -= delta * 1.5;
        dp.mesh.position.addScaledVector(dp.vel, delta);
        dp.mesh.scale.setScalar(dp.life);
        if (dp.life <= 0) dp.mesh.visible = false;
      }
    });

    this.drillChipParticles.forEach(cp => {
      if (cp.mesh.visible) {
        cp.life -= delta * 1.8;
        cp.mesh.position.addScaledVector(cp.vel, delta);
        cp.mesh.scale.setScalar(cp.life);
        if (cp.life <= 0) cp.mesh.visible = false;
      }
    });
  }

  /**
   * On Win: Updates GameState (applies decision, advances day to Sol 3, saves progress),
   * and triggers reverse iris transition back to Mission Control!
   */
  onWin() {
    // Apply Sol 2 decision & advance to Sol 3
    if (gameState.currentDay === 2 && !gameState.currentDayDecided) {
      gameState.applyDecision('choice_2_a');
      gameState.advanceDay();
    }

    // Play reverse iris wipe back to Mission Control
    this.game.exitLevelToMissionControl();
  }

  dispose() {
    this.isActive = false;
    clearTimerArray(this.activeTimers);
    level2Audio.stopEngine();

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

    // Restore fog
    this.scene.fog = this.originalFog;

    // Dispose HUD
    if (this.hud) {
      this.hud.dispose();
      this.hud = null;
    }

    // Restore colony visibility
    this.setColonyVisibility(true);

    // Universal Three.js Resource Disposal
    disposeThreeObject(this.levelGroup);

    if (this.cameraManager && this.cameraManager.controls) {
      this.cameraManager.controls.enabled = true;
    }
  }
}
