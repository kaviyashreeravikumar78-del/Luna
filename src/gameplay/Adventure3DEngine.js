import * as THREE from 'three';
import { orbitVoice } from '../audio/OrbitVoice.js';
import { gameState } from '../simulation/GameState.js';

/**
 * LUNA: Mission Survival - Child-Friendly 3D Physical Action Engine
 * Empowers players to control the Commander astronaut directly in 3D:
 * physically picking up items, carrying them across the Moon base in their hands,
 * plugging cables, welding pipes with sparks, rounding up astronauts in single file,
 * driving the rover, and growing space crops.
 */
export class Adventure3DEngine {
  constructor(game) {
    this.game = game;
    this.scene = game.scene;
    this.camera = game.camera;
    this.cameraManager = game.cameraManager;
    this.astronautData = game.astronautData;
    this.playerController = game.playerController;
    this.buildings = {
      habitat: game.habitat,
      solarArray: game.solarArray,
      greenhouse: game.greenhouse,
      antenna: game.antenna,
      researchLab: game.researchLab,
      rover: game.rover,
    };

    this.activeAction = null;
    this.levelStep = 0;
    this.particles = [];
    this.levelProps = [];

    // Synthesized Sound Effects
    this.audioCtx = null;
    this.initAudio();

    // Scene Level Assets
    this.initBaseLevelProps();
  }

  initAudio() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    } catch (e) {}
  }

  playSFX(type) {
    if (!this.audioCtx) return;
    try {
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      if (type === 'spark') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(900, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.18);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.18);
      } else if (type === 'clang') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(360, now);
        osc.frequency.exponentialRampToValueAtTime(75, now + 0.35);
        gain.gain.setValueAtTime(0.45, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'pickup') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(330, now);
        osc.frequency.exponentialRampToValueAtTime(660, now + 0.15);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'success') {
        // High ascending melodic chime
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
        osc.frequency.setValueAtTime(1046.50, now + 0.3); // C6
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.65);
        osc.start(now);
        osc.stop(now + 0.65);
      } else if (type === 'water') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.linearRampToValueAtTime(280, now + 0.25);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'beam') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.linearRampToValueAtTime(880, now + 0.5);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.6);
      }
    } catch (e) {}
  }

  initBaseLevelProps() {
    // Greenhouse Garden Planters for Level 4
    this.initGreenhouseGardenFX();
  }

  /* =========================================================================
     UTILITY: 3D FLOATING BEACON & GROUND TARGET RING
     ========================================================================= */
  create3DTargetBeacon(pos, color = 0xFFD166, label = 'TARGET') {
    const group = new THREE.Group();
    group.position.set(pos.x, pos.y, pos.z);

    // Floating Animated Arrow
    const coneGeo = new THREE.ConeGeometry(0.35, 0.7, 8);
    const coneMat = new THREE.MeshBasicMaterial({ color });
    const arrow = new THREE.Mesh(coneGeo, coneMat);
    arrow.position.y = 2.4;
    arrow.rotation.x = Math.PI; // Point down
    group.add(arrow);

    // Pulsing Ground Ring
    const ringGeo = new THREE.TorusGeometry(1.2, 0.08, 6, 24);
    const ringMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.05;
    group.add(ring);

    this.scene.add(group);
    this.levelProps.push(group);

    return { group, arrow, ring, pos: new THREE.Vector3(pos.x, pos.y, pos.z) };
  }

  clearLevelProps() {
    this.levelProps.forEach(p => {
      if (p.parent) p.parent.remove(p);
    });
    this.levelProps = [];
    if (this.currentBeacon) {
      if (this.currentBeacon.group.parent) this.currentBeacon.group.parent.remove(this.currentBeacon.group);
      this.currentBeacon = null;
    }
    if (this.pathLine && this.pathLine.parent) {
      this.pathLine.parent.remove(this.pathLine);
      this.pathLine = null;
    }
  }

  showPathGuide(fromPos, toPos, color = 0x00E5FF) {
    if (this.pathLine && this.pathLine.parent) {
      this.pathLine.parent.remove(this.pathLine);
    }
    const points = [];
    const count = 16;
    for (let i = 0; i <= count; i++) {
      const t = i / count;
      points.push(new THREE.Vector3(
        THREE.MathUtils.lerp(fromPos.x, toPos.x, t),
        0.15 + Math.sin(t * Math.PI) * 0.4,
        THREE.MathUtils.lerp(fromPos.z, toPos.z, t)
      ));
    }
    const curve = new THREE.CatmullRomCurve3(points);
    const tubeGeo = new THREE.TubeGeometry(curve, 20, 0.06, 6, false);
    const tubeMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.75 });
    this.pathLine = new THREE.Mesh(tubeGeo, tubeMat);
    this.scene.add(this.pathLine);
  }

  /* =========================================================================
     LEVEL 4: PHYSICAL SEED CARRY & GREENHOUSE CROP BLOOM
     ========================================================================= */
  initGreenhouseGardenFX() {
    const gardenGroup = new THREE.Group();
    gardenGroup.position.set(6.8, 0.4, -0.6);

    this.plantModels = [];
    const planterGeo = new THREE.BoxGeometry(0.8, 0.2, 0.6);
    const dirtMat = new THREE.MeshStandardMaterial({ color: 0x3E2723, roughness: 0.9 });
    const cropColors = [0xFF3B30, 0xFF7A00, 0xFFD166]; // Strawberry, Carrot, Wheat
    const cropOffsets = [-0.7, 0, 0.7];

    cropOffsets.forEach((xOff, idx) => {
      const bed = new THREE.Group();
      bed.position.set(xOff, 0, 0);

      const dirt = new THREE.Mesh(planterGeo, dirtMat);
      bed.add(dirt);

      const plant = new THREE.Group();
      plant.position.set(0, 0.1, 0);
      plant.scale.set(0.01, 0.01, 0.01);

      const stemGeo = new THREE.CylinderGeometry(0.03, 0.05, 0.4, 6);
      const stemMat = new THREE.MeshStandardMaterial({ color: 0x06D6A0, roughness: 0.4 });
      const stem = new THREE.Mesh(stemGeo, stemMat);
      stem.position.y = 0.2;
      plant.add(stem);

      const fruitGeo = new THREE.SphereGeometry(0.18, 8, 8);
      const fruitMat = new THREE.MeshStandardMaterial({ color: cropColors[idx], roughness: 0.3 });
      const fruit = new THREE.Mesh(fruitGeo, fruitMat);
      fruit.position.y = 0.45;
      plant.add(fruit);

      bed.add(plant);
      gardenGroup.add(bed);
      this.plantModels.push(plant);
    });

    this.scene.add(gardenGroup);
    this.gardenGroup = gardenGroup;
  }

  startLevel4Greenhouse(onComplete) {
    this.activeAction = 'level4';
    this.levelStep = 1;
    this.currentOnComplete = onComplete;
    this.clearLevelProps();
    this.plantModels.forEach(p => p.scale.set(0.01, 0.01, 0.01));

    const depotPos = new THREE.Vector3(5.0, 0.4, 0.8);
    const gardenPos = new THREE.Vector3(6.8, 0.4, -0.6);

    // Spawn 3D Seed Sack at depot
    const sackGeo = new THREE.CylinderGeometry(0.25, 0.3, 0.5, 10);
    const sackMat = new THREE.MeshStandardMaterial({ color: 0xE8B76B, roughness: 0.8 });
    const sackMesh = new THREE.Mesh(sackGeo, sackMat);
    sackMesh.position.copy(depotPos);
    this.scene.add(sackMesh);
    this.level4Sack = sackMesh;
    this.levelProps.push(sackMesh);

    this.currentBeacon = this.create3DTargetBeacon(depotPos, 0x06D6A0, 'SEED SACK');
    this.showPathGuide(this.game.playerAstronaut.position, depotPos, 0x06D6A0);
    orbitVoice.speak("Commander! Follow the green path to pick up the space seeds and plant them in the greenhouse!");

    this.game.kidOverlay.showAction({
      icon: '🌱',
      label: 'PICK UP SEED SACK! 🌾',
      sub: 'Follow the light path or tap to grab seeds',
      color: '#06D6A0',
      onTrigger: () => {
        this.game.playerAstronaut.position.set(depotPos.x + 0.8, 0.3, depotPos.z + 0.4);
        this.triggerLevel4PickupSeeds();
      }
    });

    this.stepChecker = () => {
      if (this.activeAction !== 'level4') return;
      const pPos = this.game.playerAstronaut.position;

      if (this.levelStep === 1) {
        if (pPos.distanceTo(depotPos) < 4.0) {
          this.triggerLevel4PickupSeeds();
        }
      } else if (this.levelStep === 2) {
        if (pPos.distanceTo(gardenPos) < 4.0) {
          this.triggerLevel4GrowGarden(this.currentOnComplete);
        }
      }
    };
  }

  triggerLevel4PickupSeeds() {
    if (this.levelStep !== 1) return;
    this.levelStep = 2;

    this.playSFX('pickup');
    if (this.level4Sack && this.level4Sack.parent) {
      this.level4Sack.parent.remove(this.level4Sack);
    }

    // Attach carried sack to Commander
    const carrySack = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.28, 0.45, 10),
      new THREE.MeshStandardMaterial({ color: 0xE8B76B, roughness: 0.8 })
    );
    this.game.playerController.attachCarriedItem(carrySack, 'seed_sack');

    const gardenPos = new THREE.Vector3(6.8, 0.4, -0.6);
    this.clearLevelProps();
    this.currentBeacon = this.create3DTargetBeacon(gardenPos, 0x00E5FF, 'SOIL BEDS');
    this.showPathGuide(this.game.playerAstronaut.position, gardenPos, 0x06D6A0);

    orbitVoice.speak("Now follow the light path inside the greenhouse to plant the crops!");
    this.game.kidOverlay.showAction({
      icon: '🍓',
      label: 'PLANT & GROW CROPS! 🌱',
      sub: 'Follow the light path or tap to grow',
      color: '#00E5FF',
      onTrigger: () => {
        this.game.playerAstronaut.position.set(gardenPos.x + 0.8, 0.3, gardenPos.z + 0.4);
        this.triggerLevel4GrowGarden(this.currentOnComplete);
      }
    });
  }

  triggerLevel4GrowGarden(onComplete) {
    if (this.levelStep !== 2) return;
    this.levelStep = 3;
    this.activeAction = null;

    this.game.playerController.detachCarriedItem();
    this.clearLevelProps();

    this.playSFX('water');

    // Animate Plants Blooming into full size
    let growT = 0;
    const growInt = setInterval(() => {
      growT += 0.06;
      const s = THREE.MathUtils.lerp(0.01, 1.25, growT);
      this.plantModels.forEach(p => p.scale.set(s, s, s));

      if (growT >= 1) {
        clearInterval(growInt);
        this.playSFX('spark');
        this.spawnSparks(new THREE.Vector3(6.8, 0.8, -0.6), 40, 0x06D6A0);
        this.animateAstronautVictory();

        orbitVoice.speak("Mmm! Fresh space strawberries, carrots and wheat! Delicious crunchy food for the whole colony!");
        this.game.kidOverlay.showSuccess('🥗 FRESH HARVEST READY! ⭐', () => {
          if (this.game.showScienceDebrief) {
            this.game.showScienceDebrief(4, onComplete);
          } else if (onComplete) {
            onComplete();
          }
        });
      }
    }, 30);
  }




  spawnSparks(pos, count = 30, color = 0x00E5FF) {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = [];

    for (let i = 0; i < count; i++) {
      positions[i * 3] = pos.x;
      positions[i * 3 + 1] = pos.y;
      positions[i * 3 + 2] = pos.z;
      velocities.push({
        x: (Math.random() - 0.5) * 0.18,
        y: 0.05 + Math.random() * 0.18,
        z: (Math.random() - 0.5) * 0.18,
        life: 1.0,
      });
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ color, size: 0.2, transparent: true, opacity: 1.0 });
    const points = new THREE.Points(geo, mat);
    this.scene.add(points);
    this.particles.push({ points, velocities, count });
  }

  update(delta, elapsedTime) {
    // 1. Active Beacon Floating Pulse
    if (this.currentBeacon) {
      this.currentBeacon.arrow.position.y = 2.4 + Math.sin(elapsedTime * 4.5) * 0.25;
      this.currentBeacon.arrow.rotation.y = elapsedTime * 2.0;
      this.currentBeacon.ring.scale.setScalar(1 + Math.sin(elapsedTime * 4.0) * 0.15);
    }

    // 2. Proximity Checker for in-progress tasks
    if (this.stepChecker) {
      this.stepChecker();
    }

    // 3. Spark Particle Systems
    for (let pIdx = this.particles.length - 1; pIdx >= 0; pIdx--) {
      const p = this.particles[pIdx];
      const posAttr = p.points.geometry.attributes.position;
      let alive = false;

      for (let i = 0; i < p.count; i++) {
        const v = p.velocities[i];
        if (v.life > 0) {
          alive = true;
          v.life -= delta * 2.2;
          v.y -= 0.004;

          posAttr.setXYZ(
            i,
            posAttr.getX(i) + v.x,
            posAttr.getY(i) + v.y,
            posAttr.getZ(i) + v.z
          );
        }
      }

      posAttr.needsUpdate = true;
      p.points.material.opacity = Math.max(0, p.points.material.opacity - delta * 1.5);

      if (!alive) {
        this.scene.remove(p.points);
        this.particles.splice(pIdx, 1);
      }
    }
  }
}
