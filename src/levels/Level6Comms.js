import * as THREE from 'three';
import { level6Audio } from '../audio/Level6Audio.js';
import { Level6HUD } from './Level6HUD.js';
import { LevelTransition } from '../core/LevelTransition.js';
import { orbitVoice } from '../audio/OrbitVoice.js';
import { disposeThreeObject, clearTimerArray } from '../core/disposeHelper.js';
import { BUILDINGS_DATA } from '../data/buildings.js';

/**
 * Level 6 (Day 6 - Communication) Dedicated 3D Mini-Game
 * Story: The Commander must align the Deep Space Communication Antenna with an orbiting
 * NASA communications satellite and beam a high-speed telemetry message all the way to Earth.
 */
export class Level6Comms {
  constructor(game) {
    this.game = game;
    this.scene = game.scene;
    this.camera = game.camera;
    this.cameraManager = game.cameraManager;

    this.levelGroup = new THREE.Group();
    this.levelGroup.name = "Level6_Comms_Scene";

    // Timing & Game State
    this.isActive = false;
    this.isPaused = false;
    this.phase = 0; // 0: Intro, 1: Aim, 2: Lock, 3: Rhythm Transmit, 4: Win, 5: Fail
    this.totalTime = 120; // Generous 2-minute buffer
    this.timeLeft = this.totalTime;
    this.startTime = 0;
    this.lastActionTime = Date.now();

    // Antenna & Steer State
    this.antennaGroup = null;
    this.turretGroup = null; // Yaw / Azimuth (left/right)
    this.headGroup = null;   // Pitch / Elevation (up/down)
    this.beamMesh = null;
    this.beamPulseMesh = null;

    this.azimuthAngle = 0;     // radians (-0.95 to 0.95)
    this.elevationAngle = 0.65; // radians (0.35 to 1.25)
    this.turnSpeed = 1.1;

    // Orbiting Satellite Target
    this.satelliteGroup = null;
    this.satelliteOrbitT = 0;
    this.satellitePos = new THREE.Vector3();
    this.aimReticleRing = null;
    this.aimReticleMat = null;

    // Planet Earth in Sky
    this.earthGroup = null;
    this.earthAtmosphere = null;
    this.earthGlowMat = null;

    // Targeting & Lock Calculation
    this.signalStrength = 0; // 0 to 1
    this.lockProgress = 0;   // 0 to 1
    this.isLocked = false;

    // Phase 3: Rhythm Transmission Data
    this.rhythmNotes = [];
    this.currentNoteIndex = 0;
    this.notesHitCount = 0;
    this.comboCount = 0;
    this.rhythmStartTime = 0;
    this.noteSpeed = 0.55; // fraction of track per second

    // Laser Pulse FX
    this.pulseActive = false;
    this.pulseT = 0;
    this.pulseMesh = null;
    this.earthPulseMesh = null;

    // Controls
    this.keys = { forward: false, backward: false, left: false, right: false, action: false };
    this.touchSteerX = 0;
    this.touchSteerY = 0;

    // Commander Astronaut at Console
    this.commander = null;

    // HUD
    this.hud = null;
    this.activeTimers = [];
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
   * Initializes the dedicated Level 6 stage
   */
  init(skipIntro = false) {
    this.isActive = true;
    this.scene.add(this.levelGroup);

    // 1. Hide colony structures to isolate dedicated hilltop antenna stage
    this.setColonyVisibility(false);

    // 2. Build 3D Hilltop Ridge, Deep Space Antenna, Planet Earth, & Satellite
    this.buildHilltopStage();
    this.buildAntennaDish();
    this.buildEarthInSky();
    this.buildOrbitingSatellite();
    this.buildCommanderAndConsole();
    this.setupLighting();

    // 3. Setup HUD
    this.initHUD();

    // 4. Setup Camera
    this.setupCamera();

    // 5. Bind Controls
    this.bindControls();

    // 6. Start Entry Flow
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
   * Builds the elevated lunar hilltop terrace
   */
  buildHilltopStage() {
    // Rocky summit mound
    const summitGeo = new THREE.CylinderGeometry(18, 22, 2.8, 36);
    const summitMat = new THREE.MeshStandardMaterial({
      color: 0x1E2633,
      roughness: 0.95,
      metalness: 0.05,
      flatShading: true,
    });
    const summit = new THREE.Mesh(summitGeo, summitMat);
    summit.position.y = -1.4;
    summit.receiveShadow = true;
    this.levelGroup.add(summit);

    // Rugged edge boulders
    const rockGeo = new THREE.DodecahedronGeometry(1.2, 1);
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x141B26, roughness: 0.9 });

    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const r = 16.5 + Math.sin(i * 3) * 1.5;
      const rock = new THREE.Mesh(rockGeo, rockMat);
      const s = 1.0 + Math.random() * 1.6;
      rock.scale.set(s, s * 0.7, s);
      rock.position.set(Math.cos(angle) * r, s * 0.35, Math.sin(angle) * r);
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      rock.receiveShadow = true;
      this.levelGroup.add(rock);
    }
  }

  /**
   * Builds the massive Deep Space Uplink Antenna Dish with yaw turret & pitch head
   */
  buildAntennaDish() {
    const baseGroup = new THREE.Group();
    baseGroup.position.set(0, 0, 0);

    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xF0F4F8, roughness: 0.35, metalness: 0.2 });
    const silverMat = new THREE.MeshStandardMaterial({ color: 0xD0D7DE, metalness: 0.8, roughness: 0.25 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x1E293B, metalness: 0.5, roughness: 0.6 });

    // 1. Concrete Hexagonal Pedestal
    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.8, 1.4, 6), darkMat);
    pedestal.position.y = 0.7;
    pedestal.receiveShadow = true;
    baseGroup.add(pedestal);

    // Foundation support feet
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 1.2), silverMat);
      foot.position.set(Math.cos(angle) * 2.5, 0.2, Math.sin(angle) * 2.5);
      foot.rotation.y = angle;
      baseGroup.add(foot);
    }

    // 2. Rotating Azimuth Turret (Yaw Left / Right)
    this.turretGroup = new THREE.Group();
    this.turretGroup.position.y = 1.4;

    const turretPylon = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 1.8, 16), whiteMat);
    turretPylon.position.y = 0.9;
    turretPylon.castShadow = true;
    this.turretGroup.add(turretPylon);

    // Motor gearbox ring
    const gearRing = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.12, 10, 24), silverMat);
    gearRing.rotation.x = Math.PI / 2;
    gearRing.position.y = 0.3;
    this.turretGroup.add(gearRing);

    // 3. Tilting Elevation Head (Pitch Up / Down)
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 1.8, 0);

    // Parabolic Dish Bowl (Curved reflector)
    const dishGeo = new THREE.SphereGeometry(3.6, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.42);
    const dishMesh = new THREE.Mesh(dishGeo, silverMat);
    dishMesh.rotation.x = -Math.PI / 2; // Pointing forward/up
    dishMesh.castShadow = true;
    dishMesh.receiveShadow = true;
    this.headGroup.add(dishMesh);

    // Back reinforcing truss ring
    const truss = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.1, 8, 24), darkMat);
    truss.position.z = -0.3;
    this.headGroup.add(truss);

    // Central Feed Horn & Quadripod Support Struts
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.8, 12), silverMat);
    horn.rotation.x = Math.PI / 2;
    horn.position.z = 2.2;
    this.headGroup.add(horn);

    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.6, 6), darkMat);
      strut.position.set(Math.cos(angle) * 1.4, Math.sin(angle) * 1.4, 1.1);
      strut.rotation.z = angle + Math.PI / 2;
      strut.rotation.x = 0.35;
      this.headGroup.add(strut);
    }

    // Volumetric Targeting Laser Beam extending into space
    const beamGeo = new THREE.CylinderGeometry(0.08, 0.3, 40, 12);
    this.beamMat = new THREE.MeshBasicMaterial({
      color: 0x00E5FF,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
    });
    this.beamMesh = new THREE.Mesh(beamGeo, this.beamMat);
    this.beamMesh.rotation.x = Math.PI / 2;
    this.beamMesh.position.z = 22;
    this.headGroup.add(this.beamMesh);

    this.turretGroup.add(this.headGroup);
    baseGroup.add(this.turretGroup);

    this.antennaGroup = baseGroup;
    this.levelGroup.add(baseGroup);
  }

  /**
   * Builds Planet Earth in the deep space skybox
   */
  buildEarthInSky() {
    this.earthGroup = new THREE.Group();
    // Positioned low on the horizon in the starry background
    this.earthGroup.position.set(16, 14, -36);

    // Earth Sphere
    const earthGeo = new THREE.SphereGeometry(4.8, 32, 24);
    const earthMat = new THREE.MeshStandardMaterial({
      color: 0x1A56DB, // Ocean Blue
      roughness: 0.6,
      metalness: 0.1,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    this.earthGroup.add(earthMesh);

    // Continent patches (Green/Tan land masses)
    const landMat = new THREE.MeshBasicMaterial({ color: 0x2E8B57, transparent: true, opacity: 0.85 });
    [
      { r: 4.83, theta: 1.2, phi: 1.4, s: 1.8 },
      { r: 4.83, theta: 2.4, phi: 1.8, s: 2.2 },
      { r: 4.83, theta: 0.4, phi: 2.1, s: 1.5 },
    ].forEach(c => {
      const land = new THREE.Mesh(new THREE.SphereGeometry(c.s, 12, 12), landMat);
      land.position.setFromSphericalCoords(c.r, c.theta, c.phi);
      this.earthGroup.add(land);
    });

    // Swirling Cloud Shell
    const cloudGeo = new THREE.SphereGeometry(4.92, 24, 18);
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      transparent: true,
      opacity: 0.4,
      roughness: 0.9,
    });
    this.earthClouds = new THREE.Mesh(cloudGeo, cloudMat);
    this.earthGroup.add(this.earthClouds);

    // Glowing Atmospheric Rim Halo
    const haloGeo = new THREE.RingGeometry(4.95, 6.2, 36);
    this.earthGlowMat = new THREE.MeshBasicMaterial({
      color: 0x00E5FF,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
    });
    this.earthHalo = new THREE.Mesh(haloGeo, this.earthGlowMat);
    this.earthHalo.position.z = 0.5;
    this.earthGroup.add(this.earthHalo);

    this.levelGroup.add(this.earthGroup);
  }

  /**
   * Builds the orbiting NASA Communications Satellite and Aim Reticle
   */
  buildOrbitingSatellite() {
    this.satelliteGroup = new THREE.Group();

    const goldMat = new THREE.MeshStandardMaterial({ color: 0xFFD166, metalness: 0.9, roughness: 0.2 });
    const blueMat = new THREE.MeshStandardMaterial({ color: 0x0044AA, roughness: 0.3 });
    const silverMat = new THREE.MeshStandardMaterial({ color: 0xE2E8F0, metalness: 0.8 });

    // Satellite Core Body
    const core = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.1, 0.8), goldMat);
    this.satelliteGroup.add(core);

    // Solar Wings (Left & Right)
    [-1.6, 1.6].forEach(x => {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.7, 0.06), blueMat);
      wing.position.set(x, 0, 0);
      this.satelliteGroup.add(wing);

      const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 8), silverMat);
      hinge.rotation.z = Math.PI / 2;
      hinge.position.set(x * 0.45, 0, 0);
      this.satelliteGroup.add(hinge);
    });

    // High-Gain Dish on Satellite
    const satDish = new THREE.Mesh(new THREE.SphereGeometry(0.4, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.4), silverMat);
    satDish.rotation.x = Math.PI / 2;
    satDish.position.set(0, 0, 0.6);
    this.satelliteGroup.add(satDish);

    // Blinking Red Beacon
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), new THREE.MeshBasicMaterial({ color: 0xFF3B30 }));
    beacon.position.set(0, 0.65, 0);
    this.satelliteGroup.add(beacon);

    // Targeting Reticle Ring around Satellite
    const reticleGeo = new THREE.RingGeometry(1.4, 1.6, 32);
    this.aimReticleMat = new THREE.MeshBasicMaterial({
      color: 0xFF5E57, // Starts Red
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    this.aimReticleRing = new THREE.Mesh(reticleGeo, this.aimReticleMat);
    this.aimReticleRing.position.set(0, 0, 0);
    this.satelliteGroup.add(this.aimReticleRing);

    this.levelGroup.add(this.satelliteGroup);

    // Laser Pulse FX projectile (Phase 3)
    const pGeo = new THREE.SphereGeometry(0.35, 12, 12);
    const pMat = new THREE.MeshBasicMaterial({ color: 0x00E5FF, transparent: true, opacity: 0.0 });
    this.pulseMesh = new THREE.Mesh(pGeo, pMat);
    this.levelGroup.add(this.pulseMesh);
  }

  /**
   * Builds the Commander Astronaut at the Control Terminal Desk
   */
  buildCommanderAndConsole() {
    // Control Console Desk
    const consoleGroup = new THREE.Group();
    consoleGroup.position.set(0, 0.5, 3.6);

    const deskMat = new THREE.MeshStandardMaterial({ color: 0x1E293B, roughness: 0.5 });
    const desk = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.0, 0.8), deskMat);
    consoleGroup.add(desk);

    // Interactive screen
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.6), new THREE.MeshBasicMaterial({ color: 0x00E5FF }));
    screen.rotation.x = -0.4;
    screen.position.set(0, 0.65, 0.1);
    consoleGroup.add(screen);

    this.levelGroup.add(consoleGroup);

    // Commander standing at desk facing the antenna
    const astro = new THREE.Group();
    astro.position.set(0, 0.3, 4.8);
    astro.rotation.y = Math.PI; // Facing North toward dish & console

    const suitMat = new THREE.MeshStandardMaterial({ color: 0xF0F4F8, roughness: 0.4, metalness: 0.1 });
    const visorMat = new THREE.MeshStandardMaterial({ color: 0x141B2D, roughness: 0.1, metalness: 0.9 });
    const badgeMat = new THREE.MeshStandardMaterial({ color: 0xD95736 });

    const scale = 0.55;
    astro.scale.set(scale, scale, scale);

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.85, 0.45), suitMat);
    torso.position.y = 1.35;
    astro.add(torso);

    const badge = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.25, 0.08), badgeMat);
    badge.position.set(0, 1.45, 0.26);
    astro.add(badge);

    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 16), suitMat);
    helmet.position.y = 2.05;
    astro.add(helmet);

    const visor = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12, 0, Math.PI, 0, Math.PI * 0.7), visorMat);
    visor.rotation.x = -Math.PI * 0.15;
    visor.position.set(0, 2.05, 0.18);
    astro.add(visor);

    // Hands resting on console controls
    const armGeo = new THREE.CylinderGeometry(0.12, 0.11, 0.6, 8);
    [-0.48, 0.48].forEach(x => {
      const arm = new THREE.Mesh(armGeo, suitMat);
      arm.position.set(x, 1.35, 0.3);
      arm.rotation.x = -0.7;
      astro.add(arm);
    });

    this.commander = astro;
    this.levelGroup.add(astro);
  }

  setupLighting() {
    this.ambientLight = new THREE.AmbientLight(0x1B263B, 0.65);
    this.levelGroup.add(this.ambientLight);

    // Key light illuminating the dish face
    this.dishLight = new THREE.DirectionalLight(0xE2E8F0, 1.2);
    this.dishLight.position.set(-14, 18, 16);
    this.levelGroup.add(this.dishLight);

    // Cyan control terminal light
    const termLight = new THREE.PointLight(0x00E5FF, 1.2, 8);
    termLight.position.set(0, 1.6, 3.8);
    this.levelGroup.add(termLight);
  }

  setupCamera() {
    // Clear cinematic third-person framing: Commander in foreground, giant Dish in midground,
    // Earth and Satellite in upper starry sky.
    this.camera.position.set(0, 4.2, 8.8);
    this.camera.lookAt(0, 4.5, -15);

    if (this.cameraManager && this.cameraManager.controls) {
      this.cameraManager.controls.target.set(0, 4.5, -15);
      this.cameraManager.controls.enabled = false;
    }
  }

  initHUD() {
    this.hud = new Level6HUD({
      onPause: () => this.togglePause(),
      onTouchMove: (nx, ny) => {
        this.touchSteerX = nx;
        this.touchSteerY = ny;
        this.lastActionTime = Date.now();
      },
      onActionDown: () => {
        this.keys.action = true;
        this.handleActionTrigger();
        this.lastActionTime = Date.now();
      },
      onActionUp: () => {
        this.keys.action = false;
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
            this.handleActionTrigger();
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
          break;
      }
    };

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  /**
   * Entry Cinematic with zoom and ORBIT voice line
   */
  playEntryCinematic() {
    this.phase = 0;
    orbitVoice.speak("Let's call Earth! Aim the dish!");

    // Smooth introductory camera fly-up
    this.camera.position.set(0, 1.8, 6.2);
    this.camera.lookAt(0, 3.2, 0);

    let elapsed = 0;
    const animateCam = () => {
      if (!this.isActive || this.phase !== 0) return;
      elapsed += 0.016;

      this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, 4.2, 0.04);
      this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, 8.8, 0.04);
      this.camera.lookAt(0, 4.5, -15);

      if (elapsed < 2.8) {
        requestAnimationFrame(animateCam);
      } else {
        this.startGameplay();
      }
    };
    requestAnimationFrame(animateCam);
  }

  startGameplay() {
    this.phase = 1; // Aim Phase
    this.startTime = Date.now();
    this.timeLeft = this.totalTime;

    level6Audio.startCarrierTone();

    if (this.hud) {
      this.hud.showGoPopup();
      this.hud.setObjective('📡', 'Aim dish at satellite!');
    }
  }

  /**
   * Action trigger (Space / Action button)
   */
  handleActionTrigger() {
    if (this.phase === 3) {
      // Check rhythm note strike
      this.checkRhythmHit();
    }
  }

  /**
   * Main game loop update
   */
  update(delta, elapsedTime) {
    if (!this.isActive || this.isPaused) return;

    // Countdown Timer
    if (this.phase >= 1 && this.phase <= 3) {
      this.timeLeft -= delta;
      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this.onFail();
        return;
      }

      if (Date.now() - this.lastActionTime > 8000) {
        this.lastActionTime = Date.now();
        this.giveHint();
      }
    }

    // 1. Move Orbiting Satellite along orbital arc
    this.updateSatelliteOrbit(delta, elapsedTime);

    // 2. Rotate Antenna Dish (Azimuth & Elevation)
    this.updateAntennaSteering(delta);

    // 3. Compute Beam Alignment & Lock Progress (Phases 1 & 2)
    if (this.phase === 1 || this.phase === 2) {
      this.updateSignalAndLock(delta);
    }

    // 4. Update Phase 3 Rhythm Transmission
    if (this.phase === 3) {
      this.updateRhythmSequence(delta, elapsedTime);
    }

    // 5. Update Laser Pulse FX
    this.updatePulseFX(delta);

    // 6. Slowly rotate Earth clouds
    if (this.earthClouds) {
      this.earthClouds.rotation.y += delta * 0.05;
    }

    // 7. Render
    this.game.renderer.render(this.scene, this.camera);
  }

  /**
   * Smooth orbital glide for the satellite across the sky
   */
  updateSatelliteOrbit(delta, elapsedTime) {
    // Satellite travels slowly across sky: x from -22 to +20, y around 16, z around -28
    this.satelliteOrbitT += delta * 0.045;
    const t = this.satelliteOrbitT;

    const satX = -20 + (Math.sin(t) + 1) * 19; // -20 to 18
    const satY = 15.5 + Math.cos(t * 1.5) * 2.2;
    const satZ = -28 + Math.sin(t * 0.8) * 3.5;

    this.satellitePos.set(satX, satY, satZ);
    if (this.satelliteGroup) {
      this.satelliteGroup.position.copy(this.satellitePos);
      this.satelliteGroup.rotation.y = t * 0.5;
      this.satelliteGroup.rotation.z = Math.sin(t * 2) * 0.15;
    }
  }

  /**
   * Steer antenna azimuth and elevation
   */
  updateAntennaSteering(delta) {
    let steerX = 0;
    let steerY = 0;

    if (this.keys.left) steerX -= 1;
    if (this.keys.right) steerX += 1;
    if (this.keys.forward) steerY += 1; // Up
    if (this.keys.backward) steerY -= 1; // Down

    if (Math.abs(this.touchSteerX) > 0.05) steerX += this.touchSteerX;
    if (Math.abs(this.touchSteerY) > 0.05) steerY -= this.touchSteerY;

    const isMoving = Math.abs(steerX) > 0.05 || Math.abs(steerY) > 0.05;
    level6Audio.setMotorSound(isMoving);

    if (isMoving) {
      // Steer Azimuth (Left/Right)
      this.azimuthAngle += steerX * this.turnSpeed * delta;
      this.azimuthAngle = Math.max(-0.95, Math.min(0.95, this.azimuthAngle));

      // Steer Elevation (Up/Down)
      this.elevationAngle += steerY * this.turnSpeed * delta;
      this.elevationAngle = Math.max(0.32, Math.min(1.22, this.elevationAngle));
    }

    // Apply rotation to Three.js groups
    if (this.turretGroup) {
      this.turretGroup.rotation.y = -this.azimuthAngle;
    }
    if (this.headGroup) {
      this.headGroup.rotation.x = this.elevationAngle;
    }
  }

  /**
   * Computes angular alignment between dish beam and satellite
   */
  updateSignalAndLock(delta) {
    // 1. Calculate Beam World Vector
    const beamDir = new THREE.Vector3(0, 0, 1);
    this.headGroup.getWorldDirection(beamDir);
    beamDir.normalize();

    // 2. Vector from Dish to Satellite
    const dishWorldPos = new THREE.Vector3();
    this.headGroup.getWorldPosition(dishWorldPos);

    const targetDir = new THREE.Vector3().subVectors(this.satellitePos, dishWorldPos).normalize();

    // 3. Angular Distance
    const angleDiff = beamDir.angleTo(targetDir); // radians

    // Max detection cone ~0.35 rad (20 degrees)
    const maxAngle = 0.35;
    const strength = Math.max(0, Math.min(1, 1 - (angleDiff / maxAngle)));
    this.signalStrength = strength;

    level6Audio.updateSignalStrength(strength);

    // Reticle Color: Red -> Yellow -> Green
    if (this.aimReticleMat) {
      if (strength >= 0.85) {
        this.aimReticleMat.color.setHex(0x06D6A0); // Emerald Green
        this.aimReticleRing.scale.set(1.15, 1.15, 1);
      } else if (strength >= 0.45) {
        this.aimReticleMat.color.setHex(0xFFB703); // Solar Yellow
        this.aimReticleRing.scale.set(1.0, 1.0, 1);
      } else {
        this.aimReticleMat.color.setHex(0xFF5E57); // Red
        this.aimReticleRing.scale.set(1.0, 1.0, 1);
      }
    }

    // Phase 2: Lock Progression
    if (strength >= 0.85) {
      this.phase = 2;
      this.lockProgress += delta / 3.0; // 3 seconds to lock
      if (this.hud) {
        this.hud.setObjective('🔒', 'Hold aim to lock on!');
      }

      if (this.lockProgress >= 1.0) {
        this.lockProgress = 1.0;
        this.onLockAchieved();
      }
    } else {
      // Gently drain lock if aim drifts
      if (this.lockProgress > 0) {
        this.lockProgress = Math.max(0, this.lockProgress - delta * 0.45);
      }
    }

    if (this.hud) {
      this.hud.updateSignal(this.signalStrength, this.lockProgress);
    }
  }

  onLockAchieved() {
    this.isLocked = true;
    level6Audio.stopCarrierTone();
    level6Audio.playLockChime();

    // Beam turns solid luminous cyan
    if (this.beamMat) {
      this.beamMat.opacity = 0.9;
      this.beamMat.color.setHex(0x06D6A0);
    }

    orbitVoice.speak("Target locked! Transmit message to Earth!");

    if (this.hud) {
      this.hud.setObjective('⚡', 'Transmit message to Earth!', true);
      this.hud.updateSignal(1.0, 1.0);
    }

    setTimeout(() => {
      this.startRhythmTransmission();
    }, 1000);
  }

  /**
   * Phase 3: Setup and start the 8-packet rhythm sequence
   */
  startRhythmTransmission() {
    this.phase = 3;
    this.rhythmStartTime = Date.now();
    this.currentNoteIndex = 0;
    this.notesHitCount = 0;
    this.comboCount = 0;

    // 8 Notes spaced across time
    this.rhythmNotes = [];
    for (let i = 0; i < 8; i++) {
      this.rhythmNotes.push({
        id: i,
        spawnTime: i * 1.5 + 0.8, // seconds from rhythm start
        hit: false,
        missed: false,
        element: null,
      });
    }

    if (this.hud) {
      this.hud.showRhythmHighway();
    }

    // Spawn DOM notes in HUD track
    const track = document.getElementById('l6-rhythm-track');
    if (track) {
      this.rhythmNotes.forEach((n, idx) => {
        const noteEl = document.createElement('div');
        noteEl.className = 'l6-rhythm-note';
        noteEl.textContent = `${idx + 1}`;
        noteEl.style.left = '-40px';
        track.appendChild(noteEl);
        n.element = noteEl;
      });
    }
  }

  /**
   * Updates scrolling rhythm notes
   */
  updateRhythmSequence(delta, elapsedTime) {
    const elapsed = (Date.now() - this.rhythmStartTime) / 1000;
    const trackWidth = 520; // approximate pixel width of track
    const strikeTargetX = trackWidth - 54;

    let allCompleted = true;

    this.rhythmNotes.forEach(note => {
      if (note.hit || note.missed) return;
      allCompleted = false;

      const noteAge = elapsed - note.spawnTime;
      if (noteAge >= 0) {
        // Scrolling from left (0) to strike zone (~460px) in 2.2 seconds
        const travelDuration = 2.2;
        const progress = noteAge / travelDuration;
        const currentX = progress * strikeTargetX;

        if (note.element) {
          note.element.style.left = `${currentX}px`;
        }

        // Missed condition if scrolled past strike zone
        if (progress > 1.25) {
          note.missed = true;
          if (note.element) note.element.style.opacity = '0';
          this.comboCount = 0;
          level6Audio.playRhythmMiss();
          if (this.hud) {
            this.hud.updateCombo(0);
            this.hud.showHitFeedback('MISSED', false);
          }
        }
      }
    });

    if (allCompleted && this.rhythmNotes.length > 0 && this.phase === 3) {
      this.completeMission();
    }
  }

  /**
   * Player taps / presses Space during rhythm sequence
   */
  checkRhythmHit() {
    const elapsed = (Date.now() - this.rhythmStartTime) / 1000;

    for (let i = 0; i < this.rhythmNotes.length; i++) {
      const note = this.rhythmNotes[i];
      if (note.hit || note.missed) continue;

      const noteAge = elapsed - note.spawnTime;
      const travelDuration = 2.2;
      const progress = noteAge / travelDuration;

      // Generous hit window: progress between 0.85 and 1.15
      if (progress >= 0.82 && progress <= 1.18) {
        note.hit = true;
        this.notesHitCount++;
        this.comboCount++;

        if (note.element) note.element.style.opacity = '0';

        const isPerfect = Math.abs(progress - 1.0) < 0.08;
        level6Audio.playRhythmHit(this.notesHitCount);

        if (this.hud) {
          this.hud.updateCombo(this.comboCount);
          this.hud.showHitFeedback(isPerfect ? 'PERFECT! ✨' : 'GOOD! ⭐', isPerfect);
        }

        // Fire laser pulse up to satellite and bounce to Earth!
        this.fireDataPulse();
        break;
      }
    }
  }

  fireDataPulse() {
    this.pulseActive = true;
    this.pulseT = 0;
    level6Audio.playPulseToEarth();

    // Pulse beam flash
    if (this.beamMat) {
      this.beamMat.opacity = 1.0;
      setTimeout(() => {
        if (this.beamMat) this.beamMat.opacity = 0.7;
      }, 150);
    }

    // Earth halo intensifies
    if (this.earthGlowMat) {
      this.earthGlowMat.opacity = Math.min(0.9, 0.35 + this.notesHitCount * 0.08);
    }
  }

  updatePulseFX(delta) {
    if (!this.pulseActive || !this.pulseMesh) return;

    this.pulseT += delta * 3.5;
    if (this.pulseT < 1.0) {
      // Dish to satellite
      const dishPos = new THREE.Vector3();
      this.headGroup.getWorldPosition(dishPos);
      this.pulseMesh.position.lerpVectors(dishPos, this.satellitePos, this.pulseT);
      this.pulseMesh.material.opacity = 0.9;
    } else if (this.pulseT < 2.0) {
      // Satellite to Earth
      const earthPos = new THREE.Vector3(16, 14, -36);
      this.pulseMesh.position.lerpVectors(this.satellitePos, earthPos, this.pulseT - 1.0);
      this.pulseMesh.material.opacity = 0.9;
    } else {
      this.pulseActive = false;
      this.pulseMesh.material.opacity = 0.0;
    }
  }

  completeMission() {
    this.phase = 4; // Victory

    if (this.hud) {
      this.hud.hideRhythmHighway();
    }

    level6Audio.playEarthGlow();
    level6Audio.playVictoryFanfare();

    // Earth lights up with radiant golden glow
    if (this.earthGlowMat) {
      this.earthGlowMat.color.setHex(0xFFD166);
      this.earthGlowMat.opacity = 0.95;
    }

    orbitVoice.speak("Message received on Earth! Loud and clear Commander!");

    // Stars: 3 = 7+ notes hit, 2 = 4+ notes hit, 1 = completed
    const stars = this.notesHitCount >= 7 ? 3 : (this.notesHitCount >= 4 ? 2 : 1);

    setTimeout(() => {
      this.onWin(stars);
    }, 1400);
  }

  giveHint() {
    if (this.phase === 1) {
      orbitVoice.speak("Use arrows or joystick to aim the dish!");
    } else if (this.phase === 2) {
      orbitVoice.speak("Keep the beam on the satellite!");
    } else if (this.phase === 3) {
      orbitVoice.speak("Tap Space on time to send data!");
    }
  }

  onWin(stars = 3) {
    if (this.hud) {
      this.hud.showWinModal({
        stars,
        onContinue: () => {
          this.game.exitLevelToMissionControl();
          // Apply Sol 6 success
          this.game.handleMiniGameSuccess(6, 'choice_6_a');
        }
      });
    }
  }

  onFail() {
    this.phase = 5;
    level6Audio.stopCarrierTone();
    level6Audio.playFailTone();
    orbitVoice.speak("Signal lost! Let's aim the dish and try again!");

    if (this.hud) {
      this.hud.showFailModal(
        () => {
          this.dispose();
          this.game.startLevel6(true);
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
      level6Audio.stopCarrierTone();
      if (this.hud) {
        this.hud.showPauseModal(
          () => {
            this.isPaused = false;
            if (this.phase === 1) level6Audio.startCarrierTone();
          },
          () => {
            this.dispose();
            this.game.startLevel6(true);
          },
          () => {},
          () => {
            this.game.exitLevelToMissionControl();
          }
        );
      }
    } else {
      if (this.phase === 1) level6Audio.startCarrierTone();
      if (this.hud) this.hud.hideModals();
    }
  }

  dispose() {
    this.isActive = false;
    clearTimerArray(this.activeTimers);
    level6Audio.stopCarrierTone();
    level6Audio.setMotorSound(false);

    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);

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
