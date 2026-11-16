import * as THREE from 'three';
import { CONFIG } from '../game/config.js';
import { gameState } from '../simulation/GameState.js';
import { orbit } from '../components/Orbit.js';
import { orbitVoice } from '../audio/OrbitVoice.js';
import { level1Audio } from '../audio/Level1Audio.js';
import { LevelTransition } from '../core/LevelTransition.js';
import { Level1HUD } from './Level1HUD.js';
import { disposeThreeObject, clearTimerArray } from '../core/disposeHelper.js';
import { ObjectiveBeacon, ClickRippleEffect } from '../core/ObjectiveBeacon.js';

/**
 * LUNA: Mission Survival - Dedicated Level 1 (Sol 1: Power Up the Moon Base)
 * A complete, playable 3D mini-game with 3 interactive phases:
 * Phase 1: Clean Lunar Dust off 6 Panels (Hold Space / Sweep Animation / Dust Puffs)
 * Phase 2: Aim Panels at the Sun (Color Ring: Red -> Yellow -> Green / Snap & Ding)
 * Phase 3: Reconnect Power Cable (Pick up, Unroll, Plug into Hub / Zap & Colony Lights)
 */
export class Level1Power {
  constructor(game) {
    this.game = game;
    this.scene = game.scene;
    this.camera = game.camera;
    this.cameraManager = game.cameraManager;

    this.levelGroup = new THREE.Group();
    this.levelGroup.name = "Level1_Dedicated_Scene";

    this.panels = [];
    this.powerHub = null;
    this.rocks = [];
    this.cables = [];
    this.particles = [];

    // Camera setup
    this.targetCamPos = new THREE.Vector3(0, 7.5, 12.8);
    this.targetCamLookAt = new THREE.Vector3(0, 1.2, 0);

    // State
    this.isActive = false;
    this.phase = 0; // 0: Intro, 1: Clean, 2: Aim, 3: Cable, 4: Win, 5: Fail
    this.batteryLevel = 28; // Starts low at 28%
    this.batteryDrainSpeed = 0.55; // Gentle drain (~110 seconds buffer)
    this.isActionPressed = false;
    this.activeAimPanel = null;

    // Cable state
    this.hasCable = false;
    this.cablePlugged = false;
    this.cableSegments = [];

    // Player inputs & physics
    this.keys = { forward: false, backward: false, left: false, right: false, action: false, interact: false };
    this.playerSpeed = 4.2;
    this.walkTime = 0;
    this.sweepTime = 0;
    this.isSweeping = false;

    // Statistics for 3-star rating
    this.startTime = Date.now();
    this.reDustedCount = 0;
    this.activeTimers = [];

    // Objective Beacon & Click-to-Move / Tap-to-Walk
    this.beacon = null;
    this.ripples = null;
    this.groundMesh = null;
    this.targetDestination = null;
    this.currentGuideTarget = null;
    this.hasPromptedAction = false;

    // Panel Aim State (Separate from astronaut walking)
    this.isAimingLeft = false;
    this.isAimingRight = false;
    this.hasGivenPhase1Intro = false;
    this.hasGivenPhase2Intro = false;
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
   * Initializes the dedicated Level 1 stage
   */
  init(skipIntro = false) {
    this.isActive = true;
    this.scene.add(this.levelGroup);

    // 1. Hide colony structures to isolate the dedicated stage
    this.setColonyVisibility(false);

    // 2. Build 3D World Stage
    this.buildGroundStage();
    this.buildSolarPanels();
    this.buildPowerHub();
    this.buildBackgroundScenery();
    this.buildPerimeterRocks();
    this.buildCableDropItem();
    this.setupLighting();

    // 3. Build Commander Astronaut for Level 1
    this.buildCommander();

    // 4. Setup Particle Systems (Dust puffs, sparks, sparkles)
    this.initParticleSystems();

    // 5. Build Level 1 Minimal HUD
    this.initHUD();

    // 6. Camera Framing
    this.setupCamera();

    // 7. Bind Keyboard Controls
    this.bindControls();

    // 8. Setup 3D Objective Beacon & Click-to-Move Ripple Effect
    this.beacon = new ObjectiveBeacon(this.levelGroup);
    this.ripples = new ClickRippleEffect(this.levelGroup);
    this.setupClickToMove();

    // 9. Start Entry Cinematic (Commander walk-in, wave, ORBIT dialogue)
    if (skipIntro) {
      this.skipEntryCinematic();
    } else {
      this.playEntryCinematic();
    }
  }

  setColonyVisibility(visible) {
    if (this.game && this.game.setColonyVisible) {
      this.game.setColonyVisible(visible);
    }
  }

  setupCamera() {
    this.camera.position.set(this.targetCamPos.x, this.targetCamPos.y, this.targetCamPos.z);
    this.camera.lookAt(this.targetCamLookAt.x, this.targetCamLookAt.y, this.targetCamLookAt.z);
    if (this.cameraManager) {
      if (this.cameraManager.controls) {
        this.cameraManager.controls.target.set(this.targetCamLookAt.x, this.targetCamLookAt.y, this.targetCamLookAt.z);
        this.cameraManager.controls.enabled = false;
      }
    }
  }

  buildGroundStage() {
    const stageGeo = new THREE.CylinderGeometry(14.5, 15.5, 2.5, 32);
    const stageMat = new THREE.MeshStandardMaterial({
      color: 0xD95736,
      roughness: 0.85,
      metalness: 0.1,
      flatShading: true,
    });
    const stage = new THREE.Mesh(stageGeo, stageMat);
    stage.position.y = -1.25;
    stage.receiveShadow = true;
    this.levelGroup.add(stage);
    this.groundMesh = stage;

    const rimGeo = new THREE.RingGeometry(0.1, 13.2, 32);
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0xB84323,
      roughness: 0.9,
      side: THREE.DoubleSide
    });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.x = -Math.PI / 2;
    rim.position.y = 0.01;
    rim.receiveShadow = true;
    this.levelGroup.add(rim);
  }

  createSolarCellTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#0E223D';
    ctx.fillRect(0, 0, 512, 512);

    const grad = ctx.createLinearGradient(0, 0, 512, 512);
    grad.addColorStop(0, '#103366');
    grad.addColorStop(0.5, '#1B4D8C');
    grad.addColorStop(1, '#0C203B');
    ctx.fillStyle = grad;
    ctx.fillRect(4, 4, 504, 504);

    const rows = 4;
    const cols = 6;
    const cellW = 504 / cols;
    const cellH = 504 / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = 4 + c * cellW;
        const y = 4 + r * cellH;

        ctx.fillStyle = '#184277';
        ctx.fillRect(x + 2, y + 2, cellW - 4, cellH - 4);

        ctx.fillStyle = 'rgba(0, 229, 255, 0.08)';
        ctx.fillRect(x + 4, y + 4, cellW - 8, (cellH - 8) * 0.4);

        ctx.strokeStyle = '#4A88CC';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x + cellW * 0.33, y + 2);
        ctx.lineTo(x + cellW * 0.33, y + cellH - 2);
        ctx.moveTo(x + cellW * 0.66, y + 2);
        ctx.lineTo(x + cellW * 0.66, y + cellH - 2);
        ctx.stroke();
      }
    }

    ctx.strokeStyle = '#8AA3C2';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, 508, 508);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  createDustTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgba(125, 118, 110, 0.9)';
    ctx.fillRect(0, 0, 256, 256);

    for (let i = 0; i < 400; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const r = 1 + Math.random() * 3.5;
      const alpha = 0.15 + Math.random() * 0.4;
      ctx.fillStyle = `rgba(180, 172, 160, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  buildSolarPanels() {
    const cellTex = this.createSolarCellTexture();
    const dustTex = this.createDustTexture();

    const frameMat = new THREE.MeshStandardMaterial({
      color: 0xA0B4C8,
      metalness: 0.7,
      roughness: 0.3
    });

    const standMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      metalness: 0.8,
      roughness: 0.4
    });

    const cellMat = new THREE.MeshStandardMaterial({
      map: cellTex,
      metalness: 0.85,
      roughness: 0.15,
      emissive: 0x00E5FF,
      emissiveIntensity: 0.05
    });

    const panelLayout = [
      { id: 0, x: -4.5, z: -2.2, label: "Panel 1" },
      { id: 1, x:  0.0, z: -2.2, label: "Panel 2" },
      { id: 2, x:  4.5, z: -2.2, label: "Panel 3" },
      { id: 3, x: -4.5, z:  2.0, label: "Panel 4" },
      { id: 4, x:  0.0, z:  2.0, label: "Panel 5" },
      { id: 5, x:  4.5, z:  2.0, label: "Panel 6" },
    ];

    this.panels = [];

    panelLayout.forEach(cfg => {
      const panelGroup = new THREE.Group();
      panelGroup.position.set(cfg.x, 0, cfg.z);

      const postGeo = new THREE.CylinderGeometry(0.12, 0.16, 1.3, 12);
      const post = new THREE.Mesh(postGeo, standMat);
      post.position.y = 0.65;
      post.castShadow = true;
      panelGroup.add(post);

      const plateGeo = new THREE.BoxGeometry(0.7, 0.08, 0.7);
      const plate = new THREE.Mesh(plateGeo, standMat);
      plate.position.y = 0.04;
      panelGroup.add(plate);

      const pivotGeo = new THREE.SphereGeometry(0.2, 12, 12);
      const pivot = new THREE.Mesh(pivotGeo, frameMat);
      pivot.position.y = 1.3;
      panelGroup.add(pivot);

      // Tilting & rotating head
      const headGroup = new THREE.Group();
      headGroup.position.y = 1.3;
      headGroup.rotation.x = -Math.PI * 0.15; // Initial tilt

      const frameGeo = new THREE.BoxGeometry(2.4, 0.08, 1.4);
      const frame = new THREE.Mesh(frameGeo, frameMat);
      frame.castShadow = true;
      headGroup.add(frame);

      const cellGeo = new THREE.PlaneGeometry(2.32, 1.32);
      const cellMesh = new THREE.Mesh(cellGeo, cellMat.clone());
      cellMesh.rotation.x = -Math.PI / 2;
      cellMesh.position.y = 0.045;
      headGroup.add(cellMesh);

      // Dust Layer
      const dustMat = new THREE.MeshStandardMaterial({
        map: dustTex,
        transparent: true,
        opacity: 0.92,
        roughness: 0.95,
        metalness: 0.0
      });
      const dustGeo = new THREE.PlaneGeometry(2.32, 1.32);
      const dustMesh = new THREE.Mesh(dustGeo, dustMat);
      dustMesh.rotation.x = -Math.PI / 2;
      dustMesh.position.y = 0.048;
      headGroup.add(dustMesh);

      // Alignment Color Ring (Phase 2)
      const ringGeo = new THREE.RingGeometry(1.35, 1.5, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xFF3B30,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.0
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.052;
      headGroup.add(ring);

      panelGroup.add(headGroup);
      this.levelGroup.add(panelGroup);

      this.panels.push({
        id: cfg.id,
        label: cfg.label,
        group: panelGroup,
        head: headGroup,
        cellMesh,
        dustMesh,
        dustMat,
        ringMesh: ring,
        ringMat,
        cleanProgress: 0,
        isClean: false,
        angleAlignment: (Math.random() - 0.5) * 1.4, // Random misaligned initial angle
        targetAngle: -0.42, // Target sun angle
        isAligned: false
      });
    });
  }

  buildPowerHub() {
    const hubGroup = new THREE.Group();
    hubGroup.position.set(-8.5, 0, 0);

    const boxGeo = new THREE.BoxGeometry(1.8, 1.8, 1.8);
    const boxMat = new THREE.MeshStandardMaterial({ color: 0xE6EAF0, metalness: 0.6, roughness: 0.3 });
    const box = new THREE.Mesh(boxGeo, boxMat);
    box.position.y = 0.9;
    box.castShadow = true;
    hubGroup.add(box);

    const bezelGeo = new THREE.BoxGeometry(1.2, 0.9, 0.1);
    const bezelMat = new THREE.MeshStandardMaterial({ color: 0x1E293B, roughness: 0.6 });
    const bezel = new THREE.Mesh(bezelGeo, bezelMat);
    bezel.position.set(0.3, 0.9, 0.91);
    hubGroup.add(bezel);

    // Glowing Power Socket (Target for cable plug in Phase 3)
    const socketRingGeo = new THREE.TorusGeometry(0.24, 0.05, 12, 24);
    const socketRingMat = new THREE.MeshBasicMaterial({ color: 0x00E5FF });
    const socketRing = new THREE.Mesh(socketRingGeo, socketRingMat);
    socketRing.position.set(0.3, 0.9, 0.96);
    hubGroup.add(socketRing);

    const socketCoreGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.15, 16);
    const socketCoreMat = new THREE.MeshStandardMaterial({
      color: 0x0B192C,
      emissive: 0x0088CC,
      emissiveIntensity: 0.6
    });
    const socketCore = new THREE.Mesh(socketCoreGeo, socketCoreMat);
    socketCore.rotation.x = Math.PI / 2;
    socketCore.position.set(0.3, 0.9, 0.94);
    hubGroup.add(socketCore);

    this.levelGroup.add(hubGroup);
    this.powerHub = hubGroup;
    this.hubSocket = socketRing;
    this.socketPos = new THREE.Vector3(-8.2, 0.9, 0.96);
  }

  buildBackgroundScenery() {
    const bgGroup = new THREE.Group();
    bgGroup.position.set(0, 0, -26);

    const ridgeGeo = new THREE.ConeGeometry(38, 7, 8);
    const ridgeMat = new THREE.MeshStandardMaterial({ color: 0x822B14, roughness: 0.9, flatShading: true });
    const ridge = new THREE.Mesh(ridgeGeo, ridgeMat);
    ridge.position.set(0, 0, -4);
    ridge.rotation.y = Math.PI * 0.25;
    bgGroup.add(ridge);

    // Silhouette Habitat
    const domeGeo = new THREE.SphereGeometry(3.5, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const domeMat = new THREE.MeshStandardMaterial({ color: 0x2A3B52, roughness: 0.6 });
    const dome = new THREE.Mesh(domeGeo, domeMat);
    dome.position.set(-6, 0.5, 0);
    bgGroup.add(dome);
    this.bgHabitat = dome;

    // Silhouette Greenhouse
    const ghGeo = new THREE.CylinderGeometry(1.8, 1.8, 6, 12);
    const ghMat = new THREE.MeshStandardMaterial({ color: 0x20354A, roughness: 0.5 });
    const gh = new THREE.Mesh(ghGeo, ghMat);
    gh.rotation.z = Math.PI / 2;
    gh.position.set(6, 1.2, 2);
    bgGroup.add(gh);
    this.bgGreenhouse = gh;

    // Silhouette Radio Dish
    const dishGeo = new THREE.SphereGeometry(2.2, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.35);
    const dishMat = new THREE.MeshStandardMaterial({ color: 0x33475E, roughness: 0.7 });
    const dish = new THREE.Mesh(dishGeo, dishMat);
    dish.position.set(12, 5, -3);
    dish.rotation.x = Math.PI * 0.4;
    bgGroup.add(dish);
    this.bgAntenna = dish;

    this.levelGroup.add(bgGroup);
  }

  buildPerimeterRocks() {
    const rockGeo = new THREE.DodecahedronGeometry(0.65, 1);
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x6E2514, roughness: 0.9, flatShading: true });
    const rockPositions = [
      { x: -9.5, z:  4.5, s: 1.1 },
      { x: -8.8, z: -4.2, s: 0.8 },
      { x:  7.5, z:  5.2, s: 1.3 },
      { x:  8.2, z: -3.8, s: 0.9 },
      { x:  2.0, z: -5.8, s: 0.7 },
      { x: -3.2, z: -5.5, s: 1.0 },
    ];
    rockPositions.forEach(p => {
      const rock = new THREE.Mesh(rockGeo, rockMat);
      rock.position.set(p.x, p.s * 0.3, p.z);
      rock.scale.set(p.s, p.s * 0.8, p.s);
      rock.castShadow = true;
      this.levelGroup.add(rock);
    });
  }

  buildCableDropItem() {
    // Broken power cable spool near front panels
    this.cableDropGroup = new THREE.Group();
    this.cableDropGroup.position.set(2.5, 0.25, 4.0);

    const spoolGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.4, 12);
    const spoolMat = new THREE.MeshStandardMaterial({ color: 0x00E5FF, emissive: 0x0088CC });
    const spool = new THREE.Mesh(spoolGeo, spoolMat);
    spool.rotation.z = Math.PI / 2;
    this.cableDropGroup.add(spool);

    // Glowing spark beacon
    const ringGeo = new THREE.RingGeometry(0.3, 0.45, 16);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xFFD166, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -0.22;
    this.cableDropGroup.add(ring);

    this.levelGroup.add(this.cableDropGroup);
    this.cableDropGroup.visible = false; // Becomes visible in Phase 3
  }

  setupLighting() {
    this.ambientLight = new THREE.AmbientLight(0x1B2C44, 0.75);
    this.levelGroup.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xFFE4C4, 1.4);
    this.sunLight.position.set(14, 18, 10);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.levelGroup.add(this.sunLight);

    const sunGlowGeo = new THREE.SphereGeometry(2.5, 16, 16);
    const sunGlowMat = new THREE.MeshBasicMaterial({ color: 0xFFD166, transparent: true, opacity: 0.85 });
    const sunOrb = new THREE.Mesh(sunGlowGeo, sunGlowMat);
    sunOrb.position.set(24, 30, 16);
    this.levelGroup.add(sunOrb);
  }

  buildCommander() {
    // Articulated 3D Commander Astronaut
    const astro = new THREE.Group();
    astro.position.set(0, 0.3, -6.5); // Starts walking in from background
    astro.rotation.y = 0;

    const suitMat = new THREE.MeshStandardMaterial({ color: 0xF0F4F8, roughness: 0.45, metalness: 0.1 });
    const visorMat = new THREE.MeshStandardMaterial({ color: 0x141B2D, roughness: 0.1, metalness: 0.9 });
    const badgeMat = new THREE.MeshStandardMaterial({ color: 0xD95736 });
    const bootMat = new THREE.MeshStandardMaterial({ color: 0x333F48 });

    const scale = 0.55;
    astro.scale.set(scale, scale, scale);

    // Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.85, 0.45), suitMat);
    torso.position.y = 1.35;
    torso.castShadow = true;
    astro.add(torso);

    const badge = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.25, 0.08), badgeMat);
    badge.position.set(0, 1.45, 0.26);
    astro.add(badge);

    // Helmet & Visor
    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 16), suitMat);
    helmet.position.y = 2.05;
    helmet.castShadow = true;
    astro.add(helmet);

    const visor = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12, 0, Math.PI, 0, Math.PI * 0.7), visorMat);
    visor.rotation.x = -Math.PI * 0.15;
    visor.position.set(0, 2.05, 0.18);
    astro.add(visor);

    // Backpack
    const pack = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.8, 0.3), suitMat);
    pack.position.set(0, 1.35, -0.36);
    pack.castShadow = true;
    astro.add(pack);

    // Articulated Arms
    const leftArmPivot = new THREE.Group();
    leftArmPivot.position.set(-0.48, 1.65, 0);
    const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.11, 0.6, 8), suitMat);
    leftArm.position.y = -0.3;
    leftArmPivot.add(leftArm);
    astro.add(leftArmPivot);

    const rightArmPivot = new THREE.Group();
    rightArmPivot.position.set(0.48, 1.65, 0);
    const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.11, 0.6, 8), suitMat);
    rightArm.position.y = -0.3;
    rightArmPivot.add(rightArm);
    astro.add(rightArmPivot);

    // Articulated Legs
    const leftLegPivot = new THREE.Group();
    leftLegPivot.position.set(-0.22, 0.95, 0);
    const leftLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.13, 0.7, 8), suitMat);
    leftLeg.position.y = -0.35;
    leftLegPivot.add(leftLeg);
    const leftBoot = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.2, 0.38), bootMat);
    leftBoot.position.set(0, -0.68, 0.06);
    leftLegPivot.add(leftBoot);
    astro.add(leftLegPivot);

    const rightLegPivot = new THREE.Group();
    rightLegPivot.position.set(0.22, 0.95, 0);
    const rightLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.13, 0.7, 8), suitMat);
    rightLeg.position.y = -0.35;
    rightLegPivot.add(rightLeg);
    const rightBoot = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.2, 0.38), bootMat);
    rightBoot.position.set(0, -0.68, 0.06);
    rightLegPivot.add(rightBoot);
    astro.add(rightLegPivot);

    // Space cleaning brush tool (attached to right arm)
    const brushGroup = new THREE.Group();
    brushGroup.position.set(0, -0.6, 0.1);
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.6, 8), bootMat);
    brushGroup.add(handle);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.12), badgeMat);
    head.position.y = -0.3;
    brushGroup.add(head);
    rightArmPivot.add(brushGroup);
    brushGroup.visible = false;

    this.commander = astro;
    this.commander.userData = {
      leftArm: leftArmPivot,
      rightArm: rightArmPivot,
      leftLeg: leftLegPivot,
      rightLeg: rightLegPivot,
      brush: brushGroup
    };

    this.levelGroup.add(this.commander);
  }

  initParticleSystems() {
    // 1. Dust Puffs Pool
    this.dustParticles = [];
    const dustGeo = new THREE.DodecahedronGeometry(0.08, 0);
    const dustMat = new THREE.MeshBasicMaterial({ color: 0x94A3B8, transparent: true, opacity: 0.8 });
    for (let i = 0; i < 40; i++) {
      const p = new THREE.Mesh(dustGeo, dustMat);
      p.visible = false;
      this.levelGroup.add(p);
      this.dustParticles.push({ mesh: p, life: 0, vel: new THREE.Vector3() });
    }

    // 2. Electric Spark Particles Pool
    this.sparkParticles = [];
    const sparkGeo = new THREE.BoxGeometry(0.05, 0.05, 0.05);
    const sparkMat = new THREE.MeshBasicMaterial({ color: 0x00E5FF });
    for (let i = 0; i < 30; i++) {
      const s = new THREE.Mesh(sparkGeo, sparkMat);
      s.visible = false;
      this.levelGroup.add(s);
      this.sparkParticles.push({ mesh: s, life: 0, vel: new THREE.Vector3() });
    }
  }

  emitDustPuff(pos) {
    level1Audio.playBrush();
    for (let i = 0; i < 8; i++) {
      const p = this.dustParticles.find(dp => !dp.mesh.visible);
      if (p) {
        p.mesh.position.copy(pos);
        p.mesh.position.x += (Math.random() - 0.5) * 0.8;
        p.mesh.position.z += (Math.random() - 0.5) * 0.8;
        p.vel.set((Math.random() - 0.5) * 1.5, 1.2 + Math.random() * 1.5, (Math.random() - 0.5) * 1.5);
        p.life = 1.0;
        p.mesh.visible = true;
      }
    }
  }

  emitElectricSparks(pos) {
    level1Audio.playZap();
    for (let i = 0; i < 15; i++) {
      const s = this.sparkParticles.find(sp => !sp.mesh.visible);
      if (s) {
        s.mesh.position.copy(pos);
        s.vel.set((Math.random() - 0.5) * 3.5, 1.5 + Math.random() * 3.0, (Math.random() - 0.5) * 3.5);
        s.life = 0.8;
        s.mesh.visible = true;
      }
    }
  }

  initHUD() {
    this.hud = new Level1HUD({
      onPause: () => {
        this.isPaused = true;
      },
      onResume: () => {
        this.isPaused = false;
      },
      onRestart: () => {
        this.dispose();
        this.game.startLevel1(true);
      },
      onReturnToMissionControl: () => {
        this.game.exitLevelToMissionControl();
      },
      onWinContinue: () => {
        this.onWin();
      },
      onActionPress: () => {
        this.isActionPressed = true;
      },
      onActionRelease: () => {
        this.isActionPressed = false;
      },
      onAimLeftPress: () => {
        this.isAimingLeft = true;
      },
      onAimLeftRelease: () => {
        this.isAimingLeft = false;
      },
      onAimRightPress: () => {
        this.isAimingRight = true;
      },
      onAimRightRelease: () => {
        this.isAimingRight = false;
      },
      onJoystickMove: (dx, dz) => {
        this.touchMoveX = dx;
        this.touchMoveZ = dz;
      }
    });

    this.hud.setBattery(this.batteryLevel);
  }

  bindControls() {
    this.onKeyDown = (e) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': this.keys.forward = true; e.preventDefault(); break;
        case 'KeyS': case 'ArrowDown': this.keys.backward = true; e.preventDefault(); break;
        case 'KeyA': case 'ArrowLeft': this.keys.left = true; e.preventDefault(); break;
        case 'KeyD': case 'ArrowRight': this.keys.right = true; e.preventDefault(); break;
        case 'Space': this.keys.action = true; this.isActionPressed = true; e.preventDefault(); break;
        case 'KeyQ': this.isAimingLeft = true; e.preventDefault(); break;
        case 'KeyE': this.isAimingRight = true; this.keys.interact = true; this.handleInteract(); e.preventDefault(); break;
      }
    };

    this.onKeyUp = (e) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': this.keys.forward = false; break;
        case 'KeyS': case 'ArrowDown': this.keys.backward = false; break;
        case 'KeyA': case 'ArrowLeft': this.keys.left = false; break;
        case 'KeyD': case 'ArrowRight': this.keys.right = false; break;
        case 'Space': this.keys.action = false; this.isActionPressed = false; break;
        case 'KeyQ': this.isAimingLeft = false; break;
        case 'KeyE': this.isAimingRight = false; this.keys.interact = false; break;
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
        e.target.closest('.l1-top-bar') ||
        e.target.closest('#l1-touch-dock') ||
        e.target.closest('#l1-panel-aim-dock') ||
        e.target.closest('.l1-modal-backdrop') ||
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
            this.ripples.spawn(pt.x, 0, pt.z);
          }
        }
      }
    };

    const dom = this.game.renderer.domElement;
    dom.addEventListener('pointerdown', this.onCanvasPointerDown);
  }

  skipEntryCinematic() {
    this.phase = 1;
    this.commander.position.z = 3.6;
    this.commander.position.y = 0.3;
    const u = this.commander.userData;
    if (u.rightArm) u.rightArm.rotation.set(0, 0, 0);
    if (u.leftArm) u.leftArm.rotation.set(0, 0, 0);
    if (u.brush) u.brush.visible = true;

    orbit.flyTo(window.innerWidth - 180, 100);
    orbit.say("Hold Space or tap Action to sweep dust off the panels!", {
      emotion: 'worried',
      gesture: 'point'
    });

    if (this.hud) {
      this.hud.setObjective("Clean the panels (0/6)", "🧹");
    }
  }

  /**
   * Entry Cinematic (Walk-in, wave, ORBIT voice, and "GO!" popup)
   */
  playEntryCinematic() {
    this.phase = 0; // Cutscene lock
    const startZ = -6.5;
    const endZ = 3.6;
    let progress = 0;

    const walkInterval = setInterval(() => {
      if (!this.isActive) {
        clearInterval(walkInterval);
        return;
      }

      progress += 0.025;
      this.commander.position.z = THREE.MathUtils.lerp(startZ, endZ, progress);

      // Walk bob
      this.walkTime += 0.18;
      this.commander.position.y = 0.3 + Math.abs(Math.sin(this.walkTime)) * 0.12;

      const u = this.commander.userData;
      if (u.leftArm && u.rightArm) {
        u.leftArm.rotation.x = Math.sin(this.walkTime) * 0.6;
        u.rightArm.rotation.x = -Math.sin(this.walkTime) * 0.6;
      }
      if (u.leftLeg && u.rightLeg) {
        u.leftLeg.rotation.x = -Math.sin(this.walkTime) * 0.55;
        u.rightLeg.rotation.x = Math.sin(this.walkTime) * 0.55;
      }

      if (progress >= 1.0) {
        clearInterval(walkInterval);
        this.commander.position.z = endZ;
        this.commander.position.y = 0.3;

        // Commander waves hello
        if (u.rightArm) {
          u.rightArm.rotation.x = -2.2;
          u.rightArm.rotation.z = 0.4;
        }

        // ORBIT flies in with voice
        orbit.flyTo(window.innerWidth - 180, 100);
        orbit.say("Dust is blocking our solar panels! Hold Space to brush them clean!", {
          emotion: 'worried',
          gesture: 'point'
        });

        // Show "GO!" banner with safe timeout
        this.safeTimeout(() => {
          if (!this.isActive || !this.hud) return;
          if (u.rightArm) {
            u.rightArm.rotation.set(0, 0, 0);
          }
          if (u.brush) u.brush.visible = true; // Show cleaning brush tool

          this.hud.showGoBanner(() => {
            if (!this.isActive || !this.hud) return;
            this.phase = 1; // Phase 1 Active!
            this.hud.setObjective("Clean the panels (0/6)", "🧹");
          });
        }, 1200);
      }
    }, 30);
    this.activeTimers.push(walkInterval);
  }

  /**
   * Main game loop update
   */
  update(delta, elapsedTime) {
    if (!this.isActive || this.isPaused) return;

    // 1. Update Player Movement (when gameplay is active)
    if (this.phase >= 1 && this.phase <= 3) {
      this.updatePlayerMovement(delta);
      this.updateBatteryDrain(delta);
    }

    // 2. Update Interactive Phases
    if (this.phase === 1) {
      this.updatePhase1Clean(delta);
    } else if (this.phase === 2) {
      this.updatePhase2Aim(delta);
    } else if (this.phase === 3) {
      this.updatePhase3Cable(delta);
    }

    // 3. Update Particles
    this.updateParticles(delta);

    // 4. Update Cable Visual Path (if carried)
    if (this.hasCable && !this.cablePlugged) {
      this.updateCarriedCable();
    }

    // 5. Update 3D Objective Beacon & Click-to-Move Ripples
    if (this.beacon) this.beacon.update(delta, elapsedTime);
    if (this.ripples) this.ripples.update(delta);
  }

  updatePlayerMovement(delta) {
    // If actively tilting/aiming a solar panel, keep astronaut planted in place!
    if (this.phase === 2 && (this.isAimingLeft || this.isAimingRight)) {
      this.targetDestination = null;
      return;
    }

    let moveX = 0;
    let moveZ = 0;

    if (this.keys.forward) moveZ -= 1;
    if (this.keys.backward) moveZ += 1;
    if (this.keys.left) moveX -= 1;
    if (this.keys.right) moveX += 1;

    // Touch joystick support
    if (this.touchMoveX || this.touchMoveZ) {
      moveX += this.touchMoveX;
      moveZ += this.touchMoveZ;
    }

    // Click-to-move pathing (overridden if keyboard or joystick is touched)
    if (moveX !== 0 || moveZ !== 0) {
      this.targetDestination = null;
    } else if (this.targetDestination) {
      const dx = this.targetDestination.x - this.commander.position.x;
      const dz = this.targetDestination.z - this.commander.position.z;
      const distToDest = Math.hypot(dx, dz);
      if (distToDest > 0.35) {
        moveX = dx / distToDest;
        moveZ = dz / distToDest;
      } else {
        this.targetDestination = null;
      }
    }

    const isMoving = Math.abs(moveX) > 0.05 || Math.abs(moveZ) > 0.05;

    if (isMoving && !this.isSweeping) {
      const len = Math.hypot(moveX, moveZ);
      moveX /= len;
      moveZ /= len;

      this.commander.position.x += moveX * this.playerSpeed * delta;
      this.commander.position.z += moveZ * this.playerSpeed * delta;

      // Stage boundary clamp (Radius = 12m)
      const dist = Math.hypot(this.commander.position.x, this.commander.position.z);
      if (dist > 11.5) {
        this.commander.position.x = (this.commander.position.x / dist) * 11.5;
        this.commander.position.z = (this.commander.position.z / dist) * 11.5;
      }

      // Smooth rotation towards movement direction
      const targetAngle = Math.atan2(moveX, moveZ);
      this.commander.rotation.y = THREE.MathUtils.lerp(this.commander.rotation.y, targetAngle, delta * 12);

      // Walk cycle
      this.walkTime += delta * 7.5;
      this.commander.position.y = 0.3 + Math.abs(Math.sin(this.walkTime)) * 0.12;

      const u = this.commander.userData;
      if (u.leftLeg && u.rightLeg) {
        u.leftLeg.rotation.x = -Math.sin(this.walkTime) * 0.55;
        u.rightLeg.rotation.x = Math.sin(this.walkTime) * 0.55;
      }

      if (!this.hasCable && u.leftArm && u.rightArm) {
        u.leftArm.rotation.x = Math.sin(this.walkTime) * 0.6;
        u.rightArm.rotation.x = -Math.sin(this.walkTime) * 0.6;
      }
    } else if (!this.isSweeping) {
      // Idle breathing
      const u = this.commander.userData;
      this.commander.position.y = 0.3 + Math.sin(performance.now() * 0.003) * 0.02;
      if (u.leftLeg && u.rightLeg) {
        u.leftLeg.rotation.x = THREE.MathUtils.lerp(u.leftLeg.rotation.x, 0, delta * 10);
        u.rightLeg.rotation.x = THREE.MathUtils.lerp(u.rightLeg.rotation.x, 0, delta * 10);
      }
    }
  }

  updateBatteryDrain(delta) {
    this.batteryLevel -= this.batteryDrainSpeed * delta;
    this.hud.setBattery(this.batteryLevel);

    if (this.batteryLevel < 15 && Math.floor(performance.now() / 1000) % 2 === 0) {
      level1Audio.playLowPowerBeep();
    }

    if (this.batteryLevel <= 0) {
      this.phase = 5; // Fail
      this.hud.showFail();
      orbit.say("Our battery ran out! Don't worry, tap retry and let's clean them faster!", {
        emotion: 'sad',
        gesture: 'wave'
      });
    }
  }

  /**
   * Phase 1: Clean Panels (Hold Action / Sweep Animation / Dust Puffs)
   */
  updatePhase1Clean(delta) {
    const pPos = this.commander.position;
    let nearPanel = null;

    // Check proximity to any dusty panel (2.4m radius)
    for (const panel of this.panels) {
      if (!panel.isClean) {
        const d = pPos.distanceTo(panel.group.position);
        if (d < 2.4) {
          nearPanel = panel;
          break;
        }
      }
    }

    // Dynamic guide beacon & ORBIT flight to the next dusty panel
    const uncleaned = this.panels.filter(p => !p.isClean);
    if (uncleaned.length > 0) {
      let targetPanel = uncleaned[0];
      let minD = pPos.distanceTo(targetPanel.group.position);
      for (let i = 1; i < uncleaned.length; i++) {
        const d = pPos.distanceTo(uncleaned[i].group.position);
        if (d < minD) {
          minD = d;
          targetPanel = uncleaned[i];
        }
      }

      if (this.currentGuideTarget !== targetPanel) {
        this.currentGuideTarget = targetPanel;
        if (this.beacon) {
          this.beacon.showAt(targetPanel.group.position.x, 0, targetPanel.group.position.z, 0x00E5FF);
        }
        orbit.flyTo3D(new THREE.Vector3(targetPanel.group.position.x, 1.2, targetPanel.group.position.z), this.camera);
        
        // ONLY speak on the FIRST panel!
        const cleanedCount = this.panels.filter(p => p.isClean).length;
        if (cleanedCount === 0 && !this.hasGivenPhase1Intro) {
          this.hasGivenPhase1Intro = true;
          orbit.say("Commander, walk over here to clean this dusty panel!", {
            emotion: 'worried',
            gesture: 'point'
          });
        }
      }

      if (minD < 2.4 && !this.isActionPressed && !nearPanel?.isClean) {
        if (!this.hasPromptedAction) {
          this.hasPromptedAction = true;
          // ONLY prompt action on the FIRST panel!
          const cleanedCount = this.panels.filter(p => p.isClean).length;
          if (cleanedCount === 0) {
            orbit.say("Great! Now hold SPACE (or tap ACTION) to sweep off the dust!", {
              emotion: 'happy',
              gesture: 'point'
            });
          }
        }
      } else if (minD >= 2.4) {
        this.hasPromptedAction = false;
      }
    }

    if (nearPanel && this.isActionPressed) {
      this.isSweeping = true;
      this.sweepTime += delta * 6;

      // Sweeping animation: Commander sweeps brush back and forth
      const u = this.commander.userData;
      if (u.rightArm) {
        u.rightArm.rotation.x = -1.2 + Math.sin(this.sweepTime) * 0.5;
        u.rightArm.rotation.z = Math.cos(this.sweepTime) * 0.4;
      }
      if (u.leftArm) {
        u.leftArm.rotation.x = -0.8 + Math.cos(this.sweepTime) * 0.3;
      }

      // Progressively remove dust
      nearPanel.cleanProgress += delta * 0.75; // Takes ~1.3s to clean
      nearPanel.dustMat.opacity = Math.max(0, 0.92 * (1 - nearPanel.cleanProgress));

      // Emit dust particles
      if (Math.random() < 0.35) {
        this.emitDustPuff(nearPanel.group.position);
      }

      if (nearPanel.cleanProgress >= 1.0) {
        nearPanel.isClean = true;
        nearPanel.cleanProgress = 1.0;
        nearPanel.dustMesh.visible = false;
        nearPanel.cellMesh.material.emissiveIntensity = 0.35; // Panel glows brightly!

        // Reset guide target so beacon flies to next panel
        this.currentGuideTarget = null;
        this.hasPromptedAction = false;

        // Battery boost + pop-up
        this.batteryLevel = Math.min(100, this.batteryLevel + 10);
        this.hud.setBattery(this.batteryLevel);
        this.hud.showPowerPopup(window.innerWidth / 2, window.innerHeight * 0.4, "+10% Power! ⚡");
        level1Audio.playDing();

        const cleanedCount = this.panels.filter(p => p.isClean).length;
        this.hud.setObjective(`Clean the panels (${cleanedCount}/6)`, "🧹");

        // When all 6 are clean: Transition to Phase 2!
        if (cleanedCount === 6) {
          this.isSweeping = false;
          if (u.brush) u.brush.visible = false; // Hide brush tool
          this.phase = 2;
          this.currentGuideTarget = null;
          if (this.beacon) this.beacon.hide();

          orbit.say("All 6 panels are shiny clean! Now let's aim them at the sun!", {
            emotion: 'excited',
            gesture: 'point'
          });

          this.hud.setObjective("Aim at the sun (0/6)", "☀️");
          this.hud.setStars(1);
        }
      }
    } else {
      this.isSweeping = false;
    }
  }

  /**
   * Phase 2: Aim Panels at the Sun
   */
  updatePhase2Aim(delta) {
    const pPos = this.commander.position;

    // Guide beacon to unaligned panel
    const unaligned = this.panels.filter(p => p.isClean && !p.isAligned);
    if (unaligned.length > 0) {
      let targetPanel = unaligned[0];
      let minD = pPos.distanceTo(targetPanel.group.position);
      for (let i = 1; i < unaligned.length; i++) {
        const d = pPos.distanceTo(unaligned[i].group.position);
        if (d < minD) {
          minD = d;
          targetPanel = unaligned[i];
        }
      }

      if (this.currentGuideTarget !== targetPanel) {
        this.currentGuideTarget = targetPanel;
        if (this.beacon) {
          this.beacon.showAt(targetPanel.group.position.x, 0, targetPanel.group.position.z, 0xFFD166);
        }
        orbit.flyTo3D(new THREE.Vector3(targetPanel.group.position.x, 1.2, targetPanel.group.position.z), this.camera);

        // ONLY speak on the FIRST panel!
        const alignedCount = this.panels.filter(p => p.isAligned).length;
        if (alignedCount === 0 && !this.hasGivenPhase2Intro) {
          this.hasGivenPhase2Intro = true;
          orbit.say("Tap the on-screen Tilt buttons or press Q / E to aim this panel at the sun!", {
            emotion: 'happy',
            gesture: 'point'
          });
        }
      }
    }

    // Check proximity to clean unaligned panels
    let nearUnalignedPanel = null;
    let nearestDist = Infinity;
    for (const panel of this.panels) {
      if (panel.isClean && !panel.isAligned) {
        const d = pPos.distanceTo(panel.group.position);
        if (d < 2.8 && d < nearestDist) {
          nearestDist = d;
          nearUnalignedPanel = panel;
        }
      }
    }

    if (nearUnalignedPanel) {
      nearUnalignedPanel.ringMesh.visible = true;
      nearUnalignedPanel.ringMat.opacity = 0.85;

      // Interactive angle adjustment using dedicated Q/E or on-screen buttons
      if (this.isAimingLeft) {
        nearUnalignedPanel.angleAlignment -= delta * 1.5;
      } else if (this.isAimingRight) {
        nearUnalignedPanel.angleAlignment += delta * 1.5;
      }

      nearUnalignedPanel.head.rotation.x = nearUnalignedPanel.angleAlignment;

      // Color Ring Feedback: Red -> Yellow -> Green
      const angleDiff = Math.abs(nearUnalignedPanel.angleAlignment - nearUnalignedPanel.targetAngle);
      const alignProgress = Math.max(0, Math.min(1, 1 - (angleDiff / 0.75)));

      let statusText = "Tilt to Align!";
      if (alignProgress > 0.8) statusText = "Almost there! 🎯";
      if (angleDiff < 0.12) statusText = "PERFECT! ☀️";

      if (this.hud) {
        this.hud.showAimDock(true, alignProgress, statusText);
      }

      if (angleDiff < 0.12) {
        // Snaps into alignment!
        nearUnalignedPanel.isAligned = true;
        nearUnalignedPanel.angleAlignment = nearUnalignedPanel.targetAngle;
        nearUnalignedPanel.head.rotation.x = nearUnalignedPanel.targetAngle;
        nearUnalignedPanel.ringMat.color.setHex(0x06D6A0); // Bright green!

        this.currentGuideTarget = null;
        this.isAimingLeft = false;
        this.isAimingRight = false;
        if (this.hud) this.hud.showAimDock(false);

        level1Audio.playDing();
        this.batteryLevel = Math.min(100, this.batteryLevel + 6);
        this.hud.setBattery(this.batteryLevel);
        this.hud.showPowerPopup(window.innerWidth / 2, window.innerHeight * 0.45, "☀️ Aligned! +6% ⚡");

        setTimeout(() => {
          nearUnalignedPanel.ringMesh.visible = false;
        }, 600);

        const alignedCount = this.panels.filter(p => p.isAligned).length;
        this.hud.setObjective(`Aim at the sun (${alignedCount}/6)`, "☀️");

        // When all 6 are aligned: Transition to Phase 3!
        if (alignedCount === 6) {
          this.phase = 3;
          this.currentGuideTarget = null;
          this.cableDropGroup.visible = true; // Drop cable on the ground
          this.hud.setStars(2);

          if (this.beacon) {
            this.beacon.showAt(2.5, 0, 4.0, 0xFFD166);
          }
          orbit.flyTo3D(new THREE.Vector3(2.5, 1.2, 4.0), this.camera);
          orbit.say("Perfect sun alignment! Walk over and pick up the yellow power cable!", {
            emotion: 'happy',
            gesture: 'point'
          });

          this.hud.setObjective("Plug in the power cable!", "🔌");
        }
      } else if (angleDiff < 0.35) {
        nearUnalignedPanel.ringMat.color.setHex(0xFFB703); // Yellow (getting close)
      } else {
        nearUnalignedPanel.ringMat.color.setHex(0xFF3B30); // Red (misaligned)
      }
    } else {
      if (this.hud) this.hud.showAimDock(false);
      this.isAimingLeft = false;
      this.isAimingRight = false;
      for (const panel of this.panels) {
        if (!panel.isAligned && panel.ringMesh) {
          panel.ringMesh.visible = false;
        }
      }
    }
  }

  handleInteract() {
    if (this.phase === 3 && !this.hasCable) {
      // Pick up cable if near
      const d = this.commander.position.distanceTo(this.cableDropGroup.position);
      if (d < 2.5) {
        this.pickUpCable();
      }
    }
  }

  /**
   * Phase 3: Cable Pickup, Carrying, and Hub Connection
   */
  pickUpCable() {
    this.hasCable = true;
    this.cableDropGroup.visible = false;
    level1Audio.playZap();

    // Carrying pose for Commander: Both arms outstretched holding cable
    const u = this.commander.userData;
    if (u.leftArm && u.rightArm) {
      u.leftArm.rotation.set(-1.25, 0.2, 0.15);
      u.rightArm.rotation.set(-1.25, -0.2, -0.15);
    }

    if (this.beacon) {
      this.beacon.showAt(-8.2, 0, 0.96, 0x00E5FF);
    }
    orbit.flyTo3D(new THREE.Vector3(-8.2, 1.3, 0.96), this.camera);
    orbit.say("Carry the cable to the glowing socket on the Power Hub!", {
      emotion: 'excited',
      gesture: 'point'
    });
  }

  updateCarriedCable() {
    // Dynamically draw cable line unrolling behind Commander to the cable origin
    const start = new THREE.Vector3(2.5, 0.1, 4.0);
    const end = this.commander.position.clone();
    end.y = 0.8;

    if (!this.cableLineMesh) {
      const lineGeo = new THREE.BufferGeometry().setFromPoints([start, end]);
      const lineMat = new THREE.LineBasicMaterial({ color: 0x00E5FF, linewidth: 4 });
      this.cableLineMesh = new THREE.Line(lineGeo, lineMat);
      this.levelGroup.add(this.cableLineMesh);
    } else {
      this.cableLineMesh.geometry.setFromPoints([start, end]);
    }
  }

  updatePhase3Cable(delta) {
    const pPos = this.commander.position;

    if (!this.hasCable) {
      const d = pPos.distanceTo(this.cableDropGroup.position);
      if (d < 2.4) {
        this.pickUpCable();
      }
    } else if (!this.cablePlugged) {
      // Near power hub socket (X = -8.2, Z = 0.96)
      const d = pPos.distanceTo(this.socketPos);
      if (d < 2.4) {
        this.plugCableIn();
      }
    }
  }

  plugCableIn() {
    this.cablePlugged = true;
    this.phase = 4; // Victory!

    // Electric sparks + zap audio
    this.emitElectricSparks(this.socketPos);
    level1Audio.playZap();
    level1Audio.playSuccessJingle();

    // Connect cable to socket permanently
    if (this.cableLineMesh) {
      this.cableLineMesh.geometry.setFromPoints([
        new THREE.Vector3(2.5, 0.1, 4.0),
        new THREE.Vector3(-8.2, 0.9, 0.96)
      ]);
    }

    // Battery jumps to 100%!
    this.batteryLevel = 100;
    this.hud.setBattery(100);
    this.hud.setStars(3);

    // Turn on background colony lights!
    if (this.bgHabitat) this.bgHabitat.material.color.setHex(0x00E5FF);
    if (this.bgGreenhouse) this.bgGreenhouse.material.color.setHex(0x06D6A0);
    if (this.bgAntenna) this.bgAntenna.material.color.setHex(0xFFD166);

    // Commander celebrates!
    const u = this.commander.userData;
    if (u.leftArm && u.rightArm) {
      u.leftArm.rotation.set(-2.8, 0, -0.4);
      u.rightArm.rotation.set(-2.8, 0, 0.4);
    }

    // ORBIT Confetti & Victory Cheer
    orbit.celebrate();
    orbit.say("Hooray! 100% clean solar power is flowing to the entire Moon base!", {
      emotion: 'excited',
      gesture: 'wave'
    });

    // Show Victory Screen after 1.5s
    setTimeout(() => {
      this.hud.showWin(3);
    }, 1500);
  }

  updateParticles(delta) {
    this.dustParticles.forEach(dp => {
      if (dp.mesh.visible) {
        dp.life -= delta * 1.5;
        dp.mesh.position.addScaledVector(dp.vel, delta);
        dp.vel.y -= delta * 2.0; // Lunar gravity
        dp.mesh.scale.setScalar(dp.life);
        if (dp.life <= 0) dp.mesh.visible = false;
      }
    });

    this.sparkParticles.forEach(sp => {
      if (sp.mesh.visible) {
        sp.life -= delta * 2.2;
        sp.mesh.position.addScaledVector(sp.vel, delta);
        sp.vel.y -= delta * 3.5;
        sp.mesh.scale.setScalar(sp.life);
        if (sp.life <= 0) sp.mesh.visible = false;
      }
    });
  }

  /**
   * On Win: Updates GameState (applies decision, advances day to Sol 2, saves progress),
   * and triggers reverse iris transition back to Mission Control!
   */
  onWin() {
    // 1. Apply Sol 1 decision & advance to Sol 2 in GameState
    if (gameState.currentDay === 1 && !gameState.currentDayDecided) {
      gameState.applyDecision('choice_1_a');
      gameState.advanceDay();
    }

    // 2. Play reverse iris transition back to Mission Control
    this.game.exitLevelToMissionControl();
  }

  onFail() {
    this.dispose();
    this.game.startLevel1(true);
  }

  /**
   * Cleans up all Level 1 assets, geometries, materials, event listeners, and HUD
   */
  dispose() {
    this.isActive = false;

    // Clear all pending timeouts and intervals
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

    // Dispose HUD
    if (this.hud) {
      this.hud.showAimDock(false);
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
