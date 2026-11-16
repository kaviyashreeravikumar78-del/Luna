import * as THREE from 'three';
import { level4Audio } from '../audio/Level4Audio.js';
import { Level4HUD } from './Level4HUD.js';
import { LevelTransition } from '../core/LevelTransition.js';
import { orbitVoice } from '../audio/OrbitVoice.js';
import { orbit } from '../components/Orbit.js';
import { ObjectiveBeacon, ClickRippleEffect } from '../core/ObjectiveBeacon.js';
import { disposeThreeObject, clearTimerArray } from '../core/disposeHelper.js';
import { BUILDINGS_DATA } from '../data/buildings.js';

/**
 * Level 4 (Day 4 - Hydroponics & Food Production) Dedicated 3D Mini-Game
 * Story: Deep crater shadows threaten to freeze the Bio-Domes!
 * The Commander must plant and mist 3 crop beds (Strawberries, Carrots, Wheat),
 * turn on the infrared thermal heating lamps to maintain 22°C, and harvest fresh food for the crew.
 */
export class Level4Greenhouse {
  constructor(game) {
    this.game = game;
    this.scene = game.scene;
    this.camera = game.camera;
    this.cameraManager = game.cameraManager;

    this.levelGroup = new THREE.Group();
    this.levelGroup.name = "Level4_Greenhouse_Scene";

    // Timing & Phase
    this.isActive = false;
    this.isPaused = false;
    this.phase = 0; // 0: Intro, 1: Plant & Mist, 2: Thermal Heaters, 3: Harvest, 4: Win, 5: Fail
    this.totalTime = 120;
    this.timeLeft = this.totalTime;

    // Movement & Controls
    this.keys = { forward: false, backward: false, left: false, right: false, action: false };
    this.touchSteerX = 0;
    this.touchSteerY = 0;
    this.targetDestination = null;
    this.walkSpeed = 5.8;

    // 3D Objects
    this.commander = null;
    this.beds = [];
    this.heaterConsole = null;
    this.heaterCoilMat = null;
    this.growLightsMat = null;
    this.beacon = null;
    this.ripples = null;

    // State Tracking
    this.plantedCount = 0;
    this.harvestedCount = 0;
    this.temperature = 11;
    this.isHeaterActive = false;
    this.nearTarget = null;
    this.activeTimers = [];

    // Camera follow parameters
    this.camOffset = new THREE.Vector3(0, 7.5, 9.5);
  }

  safeTimeout(fn, ms) {
    const id = setTimeout(() => {
      if (!this.isActive || !this.hud) return;
      fn();
    }, ms);
    this.activeTimers.push(id);
    return id;
  }

  init(skipIntro = false, autoStartCinematic = true) {
    this.isActive = true;
    this.scene.add(this.levelGroup);

    // 1. Hide general colony objects
    this.setColonyVisibility(false);

    // 2. Build 3D Greenhouse Stage
    this.buildTerrainAndBioDomes();
    this.buildPlanterBeds();
    this.buildThermalHeaterConsole();
    this.buildCommander();
    this.setupLighting();

    // 3. Navigation Beacon & Click Ripples
    this.beacon = new ObjectiveBeacon(this.levelGroup);
    this.ripples = new ClickRippleEffect(this.levelGroup);

    // 4. Setup HUD & Controls
    this.initHUD();
    this.bindControls();
    this.setupClickToMove();

    // 5. Entry Cinematic
    if (skipIntro) {
      this.phase = 1;
      this.updateObjectiveGuidance();
    } else if (autoStartCinematic) {
      this.playEntryCinematic();
    }
  }

  setColonyVisibility(visible) {
    if (this.game.setColonyVisible) {
      this.game.setColonyVisible(visible);
    }
  }

  setupLighting() {
    const ambientLight = new THREE.AmbientLight(0x0A1628, 1.2);
    this.levelGroup.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xE0FBFC, 1.8);
    dirLight.position.set(10, 20, 10);
    this.levelGroup.add(dirLight);

    // Warm Magenta & Violet LED Grow Light Strip
    const growLight = new THREE.PointLight(0xFF007F, 3.5, 18);
    growLight.position.set(0, 4.2, 0);
    this.levelGroup.add(growLight);

    const plantWarmLight = new THREE.PointLight(0x06D6A0, 2.5, 14);
    plantWarmLight.position.set(0, 2.8, 1.0);
    this.levelGroup.add(plantWarmLight);
  }

  buildTerrainAndBioDomes() {
    // 1. Lunar Terrain Base
    const groundGeo = new THREE.CircleGeometry(26, 32);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x4A5568,
      roughness: 0.95,
      metalness: 0.05
    });
    this.groundMesh = new THREE.Mesh(groundGeo, groundMat);
    this.groundMesh.rotation.x = -Math.PI / 2;
    this.groundMesh.receiveShadow = true;
    this.levelGroup.add(this.groundMesh);

    // 2. Twin Hydroponic Bio-Domes (Curved Glass & Aluminum Arches)
    [-3.5, 3.5].forEach(x => {
      const domeGroup = new THREE.Group();
      domeGroup.position.set(x, 0, 0);

      // Glass Dome
      const domeGeo = new THREE.SphereGeometry(4.8, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
      const domeMat = new THREE.MeshStandardMaterial({
        color: 0x00E5FF,
        transparent: true,
        opacity: 0.22,
        roughness: 0.1,
        metalness: 0.8,
        side: THREE.DoubleSide
      });
      const domeMesh = new THREE.Mesh(domeGeo, domeMat);
      domeGroup.add(domeMesh);

      // Aluminum Support Arches
      const ribMat = new THREE.MeshStandardMaterial({ color: 0xD0D7DE, metalness: 0.8, roughness: 0.2 });
      for (let i = 0; i < 4; i++) {
        const arch = new THREE.Mesh(new THREE.TorusGeometry(4.8, 0.1, 8, 24, Math.PI), ribMat);
        arch.rotation.y = (i * Math.PI) / 4;
        domeGroup.add(arch);
      }

      // Base Foundation Ring
      const ring = new THREE.Mesh(new THREE.CylinderGeometry(4.85, 4.95, 0.4, 24), ribMat);
      ring.position.y = 0.2;
      domeGroup.add(ring);

      this.levelGroup.add(domeGroup);
    });

    // 3. Central Walkway connecting both domes
    const walkwayGeo = new THREE.BoxGeometry(11, 0.08, 3.2);
    const walkwayMat = new THREE.MeshStandardMaterial({ color: 0x1E293B, roughness: 0.6 });
    const walkway = new THREE.Mesh(walkwayGeo, walkwayMat);
    walkway.position.set(0, 0.04, 0);
    this.levelGroup.add(walkway);
  }

  buildPlanterBeds() {
    this.beds = [
      {
        id: 'strawberry',
        name: 'Space Strawberries 🍓',
        type: 'strawberry',
        icon: '🍓',
        pos: new THREE.Vector3(-3.2, 0, 0),
        planted: false,
        harvested: false,
        cropColor: 0xFF3B30
      },
      {
        id: 'carrot',
        name: 'Lunar Carrots 🥕',
        type: 'carrot',
        icon: '🥕',
        pos: new THREE.Vector3(0, 0, 0),
        planted: false,
        harvested: false,
        cropColor: 0xFF7A00
      },
      {
        id: 'wheat',
        name: 'Dwarf Wheat 🌾',
        type: 'wheat',
        icon: '🌾',
        pos: new THREE.Vector3(3.2, 0, 0),
        planted: false,
        harvested: false,
        cropColor: 0xFFD166
      }
    ];

    const planterGeo = new THREE.BoxGeometry(1.8, 0.35, 1.2);
    const planterMat = new THREE.MeshStandardMaterial({ color: 0x1E293B, metalness: 0.6, roughness: 0.4 });
    const soilMat = new THREE.MeshStandardMaterial({ color: 0x3E2723, roughness: 0.95 });

    this.beds.forEach(bed => {
      const bedGroup = new THREE.Group();
      bedGroup.position.copy(bed.pos);

      // Hydroponic Planter Box
      const box = new THREE.Mesh(planterGeo, planterMat);
      box.position.y = 0.18;
      bedGroup.add(box);

      // Substrate / Nutrient Soil
      const soil = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.08, 1.05), soilMat);
      soil.position.y = 0.36;
      bedGroup.add(soil);

      // Sprout Seedlings (Scale up when planted)
      const sproutGroup = new THREE.Group();
      sproutGroup.position.set(0, 0.38, 0);
      sproutGroup.scale.set(0.01, 0.01, 0.01);

      // 3 Plant Stems with leaves
      [-0.45, 0, 0.45].forEach(xOff => {
        const stem = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.05, 0.45, 8),
          new THREE.MeshStandardMaterial({ color: 0x06D6A0, roughness: 0.4 })
        );
        stem.position.set(xOff, 0.22, 0);
        sproutGroup.add(stem);

        // Leaves
        const leafMat = new THREE.MeshStandardMaterial({ color: 0x2EC4B6, side: THREE.DoubleSide });
        const leafL = new THREE.Mesh(new THREE.CircleGeometry(0.12, 6), leafMat);
        leafL.rotation.x = -Math.PI / 4;
        leafL.position.set(xOff - 0.08, 0.38, 0);
        sproutGroup.add(leafL);

        const leafR = new THREE.Mesh(new THREE.CircleGeometry(0.12, 6), leafMat);
        leafR.rotation.x = Math.PI / 4;
        leafR.position.set(xOff + 0.08, 0.38, 0);
        sproutGroup.add(leafR);

        // Fruit / Grain Head
        const fruitMat = new THREE.MeshStandardMaterial({
          color: bed.cropColor,
          roughness: 0.3,
          metalness: 0.2
        });
        const fruit = new THREE.Mesh(
          bed.type === 'wheat' ? new THREE.ConeGeometry(0.09, 0.32, 8) : new THREE.SphereGeometry(0.12, 10, 10),
          fruitMat
        );
        fruit.position.set(xOff, 0.5, 0);
        sproutGroup.add(fruit);
      });

      bedGroup.add(sproutGroup);
      bed.sproutGroup = sproutGroup;

      // Interaction Target Ring on ground
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(1.2, 1.4, 24),
        new THREE.MeshBasicMaterial({ color: 0x06D6A0, side: THREE.DoubleSide, transparent: true, opacity: 0.6 })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.05;
      bedGroup.add(ring);
      bed.targetRing = ring;

      this.levelGroup.add(bedGroup);
      bed.group = bedGroup;
    });
  }

  buildThermalHeaterConsole() {
    const consoleGroup = new THREE.Group();
    consoleGroup.position.set(0, 0, 4.2);

    const metalMat = new THREE.MeshStandardMaterial({ color: 0xD0D7DE, metalness: 0.8, roughness: 0.2 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x1E293B, metalness: 0.6, roughness: 0.5 });

    // Stand Pedestal
    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, 0.5, 16), darkMat);
    base.position.y = 0.25;
    consoleGroup.add(base);

    // Console Table
    const desk = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.9, 0.8), metalMat);
    desk.position.y = 0.9;
    consoleGroup.add(desk);

    // Infrared Heating Coils (Stacked glowing tubes behind console)
    this.heaterCoilMat = new THREE.MeshBasicMaterial({ color: 0x4A5568 });
    for (let y = 1.6; y <= 3.2; y += 0.5) {
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.2, 12), this.heaterCoilMat);
      tube.rotation.z = Math.PI / 2;
      tube.position.set(0, y, 0.5);
      consoleGroup.add(tube);
    }

    // Switch Lever
    const leverGroup = new THREE.Group();
    leverGroup.position.set(0, 1.4, 0);
    const leverHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.5, 8), metalMat);
    leverHandle.position.y = 0.25;
    leverGroup.add(leverHandle);

    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), new THREE.MeshBasicMaterial({ color: 0xFF5E57 }));
    knob.position.y = 0.5;
    leverGroup.add(knob);
    leverGroup.rotation.x = 0.5; // Upward
    this.heaterLever = leverGroup;
    consoleGroup.add(leverGroup);

    // Glowing interaction ground ring
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(1.1, 1.35, 24),
      new THREE.MeshBasicMaterial({ color: 0xFF9E00, side: THREE.DoubleSide, transparent: true, opacity: 0.7 })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.05;
    consoleGroup.add(ring);

    this.levelGroup.add(consoleGroup);
    this.heaterConsole = consoleGroup;
  }

  buildCommander() {
    const commanderGroup = new THREE.Group();
    commanderGroup.position.set(0, 0, -4.5);

    const suitMat = new THREE.MeshStandardMaterial({ color: 0xFAFAFA, roughness: 0.35, metalness: 0.1 });
    const visorMat = new THREE.MeshStandardMaterial({ color: 0x00E5FF, roughness: 0.1, metalness: 0.9 });
    const jointMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 });

    // Torso
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.24, 0.65, 12), suitMat);
    torso.position.y = 0.95;
    commanderGroup.add(torso);

    // Helmet with glowing visor
    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 16), suitMat);
    helmet.position.y = 1.45;
    commanderGroup.add(helmet);

    const visor = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), visorMat);
    visor.position.set(0, 1.45, 0.14);
    visor.scale.set(1, 0.8, 0.6);
    commanderGroup.add(visor);

    // Backpack / Life Support
    const pack = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.45, 0.2), jointMat);
    pack.position.set(0, 0.98, -0.22);
    commanderGroup.add(pack);

    // Legs
    const leftLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.65, 8), suitMat);
    leftLeg.position.set(-0.14, 0.35, 0);
    commanderGroup.add(leftLeg);

    const rightLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.65, 8), suitMat);
    rightLeg.position.set(0.14, 0.35, 0);
    commanderGroup.add(rightLeg);

    this.levelGroup.add(commanderGroup);
    this.commander = {
      group: commanderGroup,
      leftLeg,
      rightLeg,
      walkCycle: 0
    };
  }

  initHUD() {
    this.hud = new Level4HUD({
      onPause: () => this.togglePause(),
      onActionPress: () => this.handleActionTrigger(),
      onTouchMove: (nx, ny) => {
        this.touchSteerX = nx;
        this.touchSteerY = ny;
      }
    });

    this.hud.setTemperature(this.temperature, false);
  }

  bindControls() {
    this.onKeyDown = (e) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': this.keys.forward = true; break;
        case 'KeyS': case 'ArrowDown': this.keys.backward = true; break;
        case 'KeyA': case 'ArrowLeft': this.keys.left = true; break;
        case 'KeyD': case 'ArrowRight': this.keys.right = true; break;
        case 'Space': case 'KeyE':
          this.handleActionTrigger();
          break;
      }
    };

    this.onKeyUp = (e) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': this.keys.forward = false; break;
        case 'KeyS': case 'ArrowDown': this.keys.backward = false; break;
        case 'KeyA': case 'ArrowLeft': this.keys.left = false; break;
        case 'KeyD': case 'ArrowRight': this.keys.right = false; break;
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
        e.target.closest('.l4-top-bar') ||
        e.target.closest('.l4-action-dock') ||
        e.target.closest('.l4-touch-controls') ||
        e.target.closest('.l4-modal-backdrop') ||
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

      // Check click on planter beds or heater console first
      const interactables = [];
      this.beds.forEach(b => {
        if (b.group) interactables.push(b.group);
      });
      if (this.heaterConsole) interactables.push(this.heaterConsole);

      if (interactables.length > 0) {
        const objHits = this.raycaster.intersectObjects(interactables, true);
        if (objHits.length > 0) {
          const pt = objHits[0].point;
          this.targetDestination = { x: pt.x, z: pt.z };
          if (this.ripples) {
            this.ripples.spawn(pt.x, 0.05, pt.z);
          }
          return;
        }
      }

      // Ground plane click-to-move
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
    this.phase = 1; // Enable player controls immediately
    this.camera.position.set(0, 10.5, 12.0);
    this.camera.lookAt(0, 1.2, 0);

    this.updateObjectiveGuidance();

    this.safeTimeout(() => {
      orbit.flyTo(window.innerWidth - 180, 75);
      orbit.say("Commander! The crater shadow is chilling our greenhouse! Plant the seeds and turn on the heat!", {
        emotion: 'happy',
        gesture: 'wave',
        autoCloseDelay: 3500
      });
    }, 450);
  }

  updateObjectiveGuidance() {
    if (!this.isActive || !this.hud) return;

    if (this.phase === 1) {
      const nextBed = this.beds.find(b => !b.planted);
      if (nextBed) {
        this.hud.setObjective('🌱', `Plant seeds in ${nextBed.name} (${this.plantedCount}/3)`);
        if (this.beacon) {
          this.beacon.showAt(nextBed.pos.x, 0.1, nextBed.pos.z, 0x06D6A0);
        }
      } else {
        // All 3 planted! Switch to Phase 2: Heaters!
        this.phase = 2;
        this.updateObjectiveGuidance();
      }
    } else if (this.phase === 2) {
      this.hud.setObjective('🔥', 'Walk to Console & Turn on Heat Lamps!', true);
      if (this.beacon) {
        this.beacon.showAt(0, 0.1, 4.2, 0xFF9E00);
      }
      orbit.say("Plants need warmth! Walk to the console and turn on the infrared heat lamps!", {
        emotion: 'worried',
        gesture: 'point',
        autoCloseDelay: 3000
      });
    } else if (this.phase === 3) {
      const nextBed = this.beds.find(b => !b.harvested);
      if (nextBed) {
        this.hud.setObjective('🧺', `Harvest fresh ${nextBed.name} (${this.harvestedCount}/3)`);
        if (this.beacon) {
          this.beacon.showAt(nextBed.pos.x, 0.1, nextBed.pos.z, 0xFFD166);
        }
      } else {
        // All 3 harvested! Victory!
        this.completeVictory();
      }
    }
  }

  handleActionTrigger() {
    const cPos = this.commander.group.position;
    if (this.phase === 1) {
      // Find nearest unplanted bed
      const unplanted = this.beds.filter(b => !b.planted);
      if (unplanted.length === 0) return;

      let nearestBed = unplanted[0];
      let minDist = cPos.distanceTo(nearestBed.pos);
      for (let i = 1; i < unplanted.length; i++) {
        const d = cPos.distanceTo(unplanted[i].pos);
        if (d < minDist) {
          minDist = d;
          nearestBed = unplanted[i];
        }
      }

      if (minDist <= 3.4) {
        this.plantBed(nearestBed);
      } else {
        // Auto-navigate to bed so player never feels stuck!
        this.targetDestination = { x: nearestBed.pos.x, z: nearestBed.pos.z + 1.2 };
        if (this.ripples) this.ripples.spawn(nearestBed.pos.x, 0.05, nearestBed.pos.z + 1.2);
      }
    } else if (this.phase === 2) {
      // Turn on heat lamps
      const consolePos = new THREE.Vector3(0, 0, 4.2);
      if (cPos.distanceTo(consolePos) <= 3.5) {
        this.activateThermalHeaters();
      } else {
        // Auto-navigate to console
        this.targetDestination = { x: consolePos.x, z: consolePos.z + 0.8 };
        if (this.ripples) this.ripples.spawn(consolePos.x, 0.05, consolePos.z + 0.8);
      }
    } else if (this.phase === 3) {
      // Harvest nearest ripe bed
      const harvestable = this.beds.filter(b => b.planted && !b.harvested);
      if (harvestable.length === 0) return;

      let nearestBed = harvestable[0];
      let minDist = cPos.distanceTo(nearestBed.pos);
      for (let i = 1; i < harvestable.length; i++) {
        const d = cPos.distanceTo(harvestable[i].pos);
        if (d < minDist) {
          minDist = d;
          nearestBed = harvestable[i];
        }
      }

      if (minDist <= 3.4) {
        this.harvestBed(nearestBed);
      } else {
        this.targetDestination = { x: nearestBed.pos.x, z: nearestBed.pos.z + 1.2 };
        if (this.ripples) this.ripples.spawn(nearestBed.pos.x, 0.05, nearestBed.pos.z + 1.2);
      }
    }
  }

  plantBed(bed) {
    if (bed.planted) return;
    bed.planted = true;
    this.plantedCount++;

    level4Audio.playPlantSeed();
    level4Audio.playWaterMist();

    // Sprout initial green seedlings
    bed.sproutGroup.scale.set(0.4, 0.4, 0.4);
    if (bed.targetRing) bed.targetRing.visible = false;

    if (this.plantedCount < 3) {
      this.updateObjectiveGuidance();
    } else {
      // All 3 planted -> Phase 2
      this.phase = 2;
      this.updateObjectiveGuidance();
    }
  }

  activateThermalHeaters() {
    if (this.isHeaterActive) return;
    this.isHeaterActive = true;

    level4Audio.startHeaterHum();
    level4Audio.playClick();

    // Rotate lever downward
    if (this.heaterLever) {
      this.heaterLever.rotation.x = -0.5;
    }

    // Glow infrared heating coils
    if (this.heaterCoilMat) {
      this.heaterCoilMat.color.setHex(0xFF4500); // Glowing fiery red/orange
    }

    // Raise temperature to optimal 22°C
    this.temperature = 22;
    this.hud.setTemperature(22, true);

    orbit.celebrate();
    orbit.say("Heaters active! 22°C restored! Look at the crops blooming under rainbow grow lights!", {
      emotion: 'excited',
      gesture: 'celebrate',
      autoCloseDelay: 3200
    });

    // Rapid crop bloom
    level4Audio.playCropBloom();
    let bloomT = 0.4;
    const bloomInt = setInterval(() => {
      if (!this.isActive) {
        clearInterval(bloomInt);
        return;
      }
      bloomT += 0.08;
      this.beds.forEach(b => {
        b.sproutGroup.scale.set(bloomT, bloomT, bloomT);
      });
      if (bloomT >= 1.25) {
        clearInterval(bloomInt);
        this.phase = 3; // Ready to harvest!
        this.updateObjectiveGuidance();
      }
    }, 45);
    this.activeTimers.push(bloomInt);
  }

  harvestBed(bed) {
    if (bed.harvested) return;
    bed.harvested = true;
    this.harvestedCount++;

    level4Audio.playHarvest();

    // Shrink harvested plant
    bed.sproutGroup.scale.set(0.2, 0.2, 0.2);

    if (this.harvestedCount < 3) {
      this.updateObjectiveGuidance();
    } else {
      this.completeVictory();
    }
  }

  completeVictory() {
    this.phase = 4;
    level4Audio.stopHeaterHum();
    level4Audio.playVictoryFanfare();

    orbit.celebrate();
    orbit.say("Hooray! Fresh strawberries, carrots and wheat ready for our dinner! Outstanding harvest, Commander!", {
      emotion: 'excited',
      gesture: 'celebrate',
      autoCloseDelay: 3500
    });

    if (this.beacon) this.beacon.hide();

    this.safeTimeout(() => {
      this.hud.showWinModal({
        stars: 3,
        onContinue: () => {
          this.game.exitLevelToMissionControl();
          // Apply Sol 4 success and advance gameState
          this.game.handleMiniGameSuccess(4, 'choice_4_a');
        }
      });
    }, 1800);
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      if (this.hud) {
        this.hud.showPauseModal(
          () => { this.isPaused = false; },
          () => {
            this.dispose();
            this.game.startLevel4(true);
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

  update(delta, elapsedTime) {
    if (!this.isActive || this.isPaused) return;

    // 1. Update Player Movement
    this.updatePlayerMovement(delta);

    // 2. Proximity Checking & Prompts
    this.checkProximity();

    // 3. Update Beacon & Ripples
    if (this.beacon) this.beacon.update(delta, elapsedTime);
    if (this.ripples) this.ripples.update(delta);

    // 4. Smooth Chase Camera
    this.updateCameraFollow(delta);
  }

  updatePlayerMovement(delta) {
    if (this.phase === 0 || this.phase >= 4) return;

    let moveX = 0;
    let moveZ = 0;

    if (this.keys.forward) moveZ -= 1;
    if (this.keys.backward) moveZ += 1;
    if (this.keys.left) moveX -= 1;
    if (this.keys.right) moveX += 1;

    // Mobile touch joystick
    if (Math.hypot(this.touchSteerX, this.touchSteerY) > 0.15) {
      moveX = this.touchSteerX;
      moveZ = this.touchSteerY;
      this.targetDestination = null;
    }

    // Click to move
    if (this.targetDestination) {
      const cPos = this.commander.group.position;
      const dx = this.targetDestination.x - cPos.x;
      const dz = this.targetDestination.z - cPos.z;
      const dist = Math.hypot(dx, dz);

      if (dist > 0.25) {
        moveX = dx / dist;
        moveZ = dz / dist;
      } else {
        this.targetDestination = null;
      }
    }

    const cPos = this.commander.group.position;
    if (Math.hypot(moveX, moveZ) > 0.05) {
      const len = Math.hypot(moveX, moveZ);
      const nx = (moveX / len) * this.walkSpeed * delta;
      const nz = (moveZ / len) * this.walkSpeed * delta;

      cPos.x = THREE.MathUtils.clamp(cPos.x + nx, -12, 12);
      cPos.z = THREE.MathUtils.clamp(cPos.z + nz, -8, 8);

      // Rotate character to face movement
      this.commander.group.rotation.y = Math.atan2(moveX, moveZ);

      // Walking leg swing animation
      this.commander.walkCycle += delta * 12;
      this.commander.leftLeg.rotation.x = Math.sin(this.commander.walkCycle) * 0.55;
      this.commander.rightLeg.rotation.x = -Math.sin(this.commander.walkCycle) * 0.55;
    } else {
      this.commander.leftLeg.rotation.x = 0;
      this.commander.rightLeg.rotation.x = 0;
    }
  }

  checkProximity() {
    const cPos = this.commander.group.position;

    if (this.phase === 1) {
      const nearBed = this.beds.find(b => !b.planted && cPos.distanceTo(b.pos) < 3.2);
      if (nearBed) {
        this.hud.showActionButton(true, `PLANT & MIST ${nearBed.name.toUpperCase()}`, '🌱');
      } else {
        this.hud.showActionButton(false);
      }
    } else if (this.phase === 2) {
      const distToConsole = cPos.distanceTo(new THREE.Vector3(0, 0, 4.2));
      if (distToConsole < 3.5) {
        this.hud.showActionButton(true, 'ACTIVATE INFRARED HEATERS', '🔥');
      } else {
        this.hud.showActionButton(false);
      }
    } else if (this.phase === 3) {
      const nearBed = this.beds.find(b => b.planted && !b.harvested && cPos.distanceTo(b.pos) < 3.2);
      if (nearBed) {
        this.hud.showActionButton(true, `HARVEST ${nearBed.name.toUpperCase()}`, '🧺');
      } else {
        this.hud.showActionButton(false);
      }
    } else {
      this.hud.showActionButton(false);
    }
  }

  updateCameraFollow(delta) {
    if (!this.commander || !this.camera) return;
    const cPos = this.commander.group.position;
    const targetX = cPos.x * 0.65;
    const targetZ = cPos.z + this.camOffset.z;
    const targetY = this.camOffset.y;

    this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, targetX, delta * 3.5);
    this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, targetY, delta * 3.5);
    this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, targetZ, delta * 3.5);

    this.camera.lookAt(cPos.x * 0.5, 1.2, cPos.z * 0.5);
  }

  dispose() {
    this.isActive = false;
    clearTimerArray(this.activeTimers);
    level4Audio.stopHeaterHum();

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

    disposeThreeObject(this.levelGroup);
    this.setColonyVisibility(true);

    if (this.cameraManager && this.cameraManager.controls) {
      this.cameraManager.controls.enabled = true;
    }
  }
}
