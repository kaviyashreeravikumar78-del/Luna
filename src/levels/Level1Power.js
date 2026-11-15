import * as THREE from 'three';
import { CONFIG } from '../game/config.js';
import { gameState } from '../simulation/GameState.js';
import { orbit } from '../components/Orbit.js';
import { orbitVoice } from '../audio/OrbitVoice.js';
import { LevelTransition } from '../core/LevelTransition.js';

/**
 * LUNA: Mission Survival - Dedicated Level 1 (Sol 1: Power Up the Moon Base)
 * Features a dedicated, uncluttered 3D solar array stage with 6 solar panels,
 * a power hub substation, background colony scenery, and custom third-person camera framing.
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
    this.lights = [];

    // Camera target framing for Level 1
    this.targetCamPos = new THREE.Vector3(0, 7.5, 12.5);
    this.targetCamLookAt = new THREE.Vector3(0, 1.2, 0);

    // Level state
    this.isActive = false;
    this.phase = 0; // 0: Cinematic/Intro, 1: Clean, 2: Aim, 3: Cable
    this.batteryLevel = 25; // Starts drained at 25%
    this.maxBattery = 100;
  }

  /**
   * Initializes the dedicated Level 1 Three.js stage
   */
  init() {
    this.isActive = true;
    this.scene.add(this.levelGroup);

    // 1. Dim & hide main colony items to keep Level 1 completely clean & uncluttered
    this.setColonyVisibility(false);

    // 2. Build dedicated flat Moon ground stage
    this.buildGroundStage();

    // 3. Build 6 High-Detail Solar Panels with procedural blue cells & dust layer
    this.buildSolarPanels();

    // 4. Build Power Hub Substation with glowing socket
    this.buildPowerHub();

    // 5. Build Background Colony Scenery (reusing iconic silhouette models)
    this.buildBackgroundScenery();

    // 6. Build Decorative Lunar Boulders
    this.buildPerimeterRocks();

    // 7. Setup Dedicated Level Lighting (Starts moody/low power)
    this.setupLighting();

    // 8. Position the Camera to frame all 6 panels & the hub
    this.setupCamera();
  }

  /**
   * Sets up smooth lerped camera framing all 6 panels and power hub
   */
  setupCamera() {
    if (this.cameraManager) {
      if (this.cameraManager.controls) {
        this.cameraManager.controls.enabled = false; // Lock free orbit during level
      }
      this.cameraManager.flyTo(
        { x: this.targetCamPos.x, y: this.targetCamPos.y, z: this.targetCamPos.z },
        { x: this.targetCamLookAt.x, y: this.targetCamLookAt.y, z: this.targetCamLookAt.z },
        1200
      );
    } else {
      this.camera.position.copy(this.targetCamPos);
      this.camera.lookAt(this.targetCamLookAt);
    }
  }

  /**
   * Hides or shows main colony structures to isolate the dedicated mini-game stage
   */
  setColonyVisibility(visible) {
    const g = this.game;
    if (g.habitat) g.habitat.visible = visible;
    if (g.greenhouse) g.greenhouse.visible = visible;
    if (g.solarArray) g.solarArray.visible = visible;
    if (g.researchLab) g.researchLab.visible = visible;
    if (g.antenna) g.antenna.visible = visible;
    if (g.rover) g.rover.visible = visible;
    if (g.decorations) g.decorations.visible = visible;
    if (g.terrain) g.terrain.visible = visible;
    if (g.astronautData?.group) g.astronautData.group.visible = visible;
  }

  /**
   * Creates the dedicated flat Moon stage for the solar farm
   */
  buildGroundStage() {
    const stageGeo = new THREE.CylinderGeometry(14, 15, 2.5, 32);
    const stageMat = new THREE.MeshStandardMaterial({
      color: 0xD95736, // Warm rust-orange moon soil
      roughness: 0.85,
      metalness: 0.1,
      flatShading: true,
    });
    const stage = new THREE.Mesh(stageGeo, stageMat);
    stage.position.y = -1.25;
    stage.receiveShadow = true;
    this.levelGroup.add(stage);

    // Inner dusty rim decal (darker lunar regolith)
    const rimGeo = new THREE.RingGeometry(0.1, 12.8, 32);
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

  /**
   * Procedural canvas texture generator for shiny blue photovoltaic cells
   */
  createSolarCellTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Deep space navy-blue base
    ctx.fillStyle = '#0E223D';
    ctx.fillRect(0, 0, 512, 512);

    // Silicon crystal gradient
    const grad = ctx.createLinearGradient(0, 0, 512, 512);
    grad.addColorStop(0, '#103366');
    grad.addColorStop(0.5, '#1B4D8C');
    grad.addColorStop(1, '#0C203B');
    ctx.fillStyle = grad;
    ctx.fillRect(4, 4, 504, 504);

    // Grid of solar wafer cells (4 rows x 6 cols)
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

        // Anti-reflective coating gleam
        ctx.fillStyle = 'rgba(0, 229, 255, 0.08)';
        ctx.fillRect(x + 4, y + 4, cellW - 8, (cellH - 8) * 0.4);

        // Fine silver busbar wires
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

    // Outer border
    ctx.strokeStyle = '#8AA3C2';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, 508, 508);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }

  /**
   * Procedural canvas texture generator for lunar dust layer
   */
  createDustTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Semi-translucent grey-brown regolith dust base
    ctx.fillStyle = 'rgba(125, 118, 110, 0.9)';
    ctx.fillRect(0, 0, 256, 256);

    // Random fine dust grains & micro-craters
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

  /**
   * Builds the 6 Solar Panels in a neat 2x3 grid
   */
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
      emissiveIntensity: 0.05 // Starts low; pulses bright on clean
    });

    // 6 Panel Grid Positions: 2 rows of 3
    const panelLayout = [
      // Back row (Z = -2.2)
      { id: 0, x: -4.5, z: -2.2, label: "Panel 1" },
      { id: 1, x:  0.0, z: -2.2, label: "Panel 2" },
      { id: 2, x:  4.5, z: -2.2, label: "Panel 3" },
      // Front row (Z = 2.0)
      { id: 3, x: -4.5, z:  2.0, label: "Panel 4" },
      { id: 4, x:  0.0, z:  2.0, label: "Panel 5" },
      { id: 5, x:  4.5, z:  2.0, label: "Panel 6" },
    ];

    this.panels = [];

    panelLayout.forEach(cfg => {
      const panelGroup = new THREE.Group();
      panelGroup.position.set(cfg.x, 0, cfg.z);

      // 1. Support Column
      const postGeo = new THREE.CylinderGeometry(0.12, 0.16, 1.3, 12);
      const post = new THREE.Mesh(postGeo, standMat);
      post.position.y = 0.65;
      post.castShadow = true;
      panelGroup.add(post);

      // Base mounting plate with bolts
      const plateGeo = new THREE.BoxGeometry(0.7, 0.08, 0.7);
      const plate = new THREE.Mesh(plateGeo, standMat);
      plate.position.y = 0.04;
      panelGroup.add(plate);

      // 2. Swivel Hub / Pivot Sphere
      const pivotGeo = new THREE.SphereGeometry(0.2, 12, 12);
      const pivot = new THREE.Mesh(pivotGeo, frameMat);
      pivot.position.y = 1.3;
      panelGroup.add(pivot);

      // 3. Tilting & Rotating Head Assembly
      const headGroup = new THREE.Group();
      headGroup.position.y = 1.3;
      headGroup.rotation.x = -Math.PI * 0.22; // Initial slight tilt

      // Metallic frame tray (2.4m wide x 1.4m long)
      const frameGeo = new THREE.BoxGeometry(2.4, 0.08, 1.4);
      const frame = new THREE.Mesh(frameGeo, frameMat);
      frame.castShadow = true;
      headGroup.add(frame);

      // Blue Photovoltaic surface
      const cellGeo = new THREE.PlaneGeometry(2.32, 1.32);
      const cellMesh = new THREE.Mesh(cellGeo, cellMat.clone());
      cellMesh.rotation.x = -Math.PI / 2;
      cellMesh.position.y = 0.045;
      headGroup.add(cellMesh);

      // 4. Grey Lunar Dust Layer (Semi-transparent mesh covering the panel)
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
      dustMesh.position.y = 0.048; // Sits just above solar cells
      headGroup.add(dustMesh);

      // 5. Interactive Alignment Target Ring (Hidden initially, for Phase 2)
      const ringGeo = new THREE.RingGeometry(1.4, 1.55, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xFF3B30,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.0
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.05;
      headGroup.add(ring);

      panelGroup.add(headGroup);
      this.levelGroup.add(panelGroup);

      // Store panel metadata
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
        cleanProgress: 0,   // 0: Full dust, 1: 100% clean
        isClean: false,
        angleAlignment: 0,  // Target sun angle alignment
        isAligned: false
      });
    });
  }

  /**
   * Builds the Power Hub Substation with a glowing socket
   */
  buildPowerHub() {
    const hubGroup = new THREE.Group();
    hubGroup.position.set(-8.5, 0, 0);

    // Main transformer / accumulator housing
    const boxGeo = new THREE.BoxGeometry(1.8, 1.8, 1.8);
    const boxMat = new THREE.MeshStandardMaterial({
      color: 0xE6EAF0,
      metalness: 0.6,
      roughness: 0.3
    });
    const box = new THREE.Mesh(boxGeo, boxMat);
    box.position.y = 0.9;
    box.castShadow = true;
    hubGroup.add(box);

    // Dark technical recessed bezel
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

    // Socket interior core
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

    // LED Battery Bar array on side of hub
    for (let i = 0; i < 5; i++) {
      const ledGeo = new THREE.BoxGeometry(0.18, 0.08, 0.04);
      const ledMat = new THREE.MeshBasicMaterial({ color: i === 0 ? 0xFFB703 : 0x334155 });
      const led = new THREE.Mesh(ledGeo, ledMat);
      led.position.set(0.91, 0.5 + i * 0.2, 0.2);
      hubGroup.add(led);
    }

    // High Voltage Warning Label
    const tagGeo = new THREE.BoxGeometry(0.5, 0.18, 0.02);
    const tagMat = new THREE.MeshBasicMaterial({ color: 0xFFD166 });
    const tag = new THREE.Mesh(tagGeo, tagMat);
    tag.position.set(0.3, 1.5, 0.91);
    hubGroup.add(tag);

    this.levelGroup.add(hubGroup);
    this.powerHub = hubGroup;
    this.hubSocketPos = new THREE.Vector3(-8.2, 0.9, 0.96);
  }

  /**
   * Builds Background Colony Scenery to maintain spatial continuity
   */
  buildBackgroundScenery() {
    const bgGroup = new THREE.Group();
    bgGroup.position.set(0, 0, -26);

    // Distant ridge
    const ridgeGeo = new THREE.ConeGeometry(38, 7, 8);
    const ridgeMat = new THREE.MeshStandardMaterial({
      color: 0x822B14,
      roughness: 0.9,
      flatShading: true
    });
    const ridge = new THREE.Mesh(ridgeGeo, ridgeMat);
    ridge.position.set(0, 0, -4);
    ridge.rotation.y = Math.PI * 0.25;
    bgGroup.add(ridge);

    // Silhouette Habitat Dome
    const domeGeo = new THREE.SphereGeometry(3.5, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const domeMat = new THREE.MeshStandardMaterial({ color: 0x2A3B52, roughness: 0.6 });
    const dome = new THREE.Mesh(domeGeo, domeMat);
    dome.position.set(-6, 0.5, 0);
    bgGroup.add(dome);

    // Silhouette Greenhouse Tunnel
    const ghGeo = new THREE.CylinderGeometry(1.8, 1.8, 6, 12);
    const ghMat = new THREE.MeshStandardMaterial({ color: 0x20354A, roughness: 0.5 });
    const gh = new THREE.Mesh(ghGeo, ghMat);
    gh.rotation.z = Math.PI / 2;
    gh.position.set(6, 1.2, 2);
    bgGroup.add(gh);

    // Silhouette Radio Dish
    const dishGeo = new THREE.SphereGeometry(2.2, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.35);
    const dishMat = new THREE.MeshStandardMaterial({ color: 0x33475E, roughness: 0.7 });
    const dish = new THREE.Mesh(dishGeo, dishMat);
    dish.position.set(12, 5, -3);
    dish.rotation.x = Math.PI * 0.4;
    bgGroup.add(dish);

    this.levelGroup.add(bgGroup);
    this.bgColony = bgGroup;
  }

  /**
   * Builds decorative perimeter rocks around the solar field
   */
  buildPerimeterRocks() {
    const rockGeo = new THREE.DodecahedronGeometry(0.65, 1);
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x6E2514,
      roughness: 0.9,
      flatShading: true
    });

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
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      rock.castShadow = true;
      rock.receiveShadow = true;
      this.levelGroup.add(rock);
      this.rocks.push(rock);
    });
  }

  /**
   * Sets up lighting for Level 1 (Starts moody/low power)
   */
  setupLighting() {
    // Ambient fill
    this.ambientLight = new THREE.AmbientLight(0x1B2C44, 0.75);
    this.levelGroup.add(this.ambientLight);

    // Warm Directional Sun Light
    this.sunLight = new THREE.DirectionalLight(0xFFE4C4, 1.4);
    this.sunLight.position.set(14, 18, 10);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.sunLight.shadow.bias = -0.001;
    this.levelGroup.add(this.sunLight);

    // Sun sprite / flare in the sky
    const sunGlowGeo = new THREE.SphereGeometry(2.5, 16, 16);
    const sunGlowMat = new THREE.MeshBasicMaterial({
      color: 0xFFD166,
      transparent: true,
      opacity: 0.85
    });
    this.sunOrb = new THREE.Mesh(sunGlowGeo, sunGlowMat);
    this.sunOrb.position.set(24, 30, 16);
    this.levelGroup.add(this.sunOrb);
  }

  /**
   * Animation update tick called from main render loop
   */
  update(delta) {
    if (!this.isActive) return;

    // Gentle socket glow pulsation
    const time = performance.now() * 0.003;
    if (this.powerHub) {
      const socket = this.powerHub.children.find(c => c.material && c.material.color && c.material.color.getHex() === 0x00E5FF);
      if (socket) {
        socket.scale.setScalar(1.0 + Math.sin(time) * 0.08);
      }
    }
  }

  /**
   * Disposes of Level 1 resources and restores main colony visibility
   */
  dispose() {
    this.isActive = false;

    // Restore colony visibility
    this.setColonyVisibility(true);

    // Remove Level 1 objects
    if (this.levelGroup && this.levelGroup.parent) {
      this.levelGroup.parent.remove(this.levelGroup);
    }

    // Traverse and dispose geometries and materials
    this.levelGroup.traverse(child => {
      if (child.isMesh) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      }
    });

    this.panels = [];
    this.rocks = [];
    this.cables = [];

    // Re-enable camera controls if available
    if (this.cameraManager && this.cameraManager.controls) {
      this.cameraManager.controls.enabled = true;
    }
  }

  onWin() {
    console.log("Level 1 Completed Successfully!");
  }

  onFail() {
    console.log("Level 1 Battery Depleted!");
  }
}
