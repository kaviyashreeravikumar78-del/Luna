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
    // 1. Water Mist Spray for Level 2
    this.initWaterLeakFX();

    // 2. Titanium Blast Door & Energy Shield for Level 3
    this.initBunkerShieldFX();

    // 3. Greenhouse Garden Planters for Level 4
    this.initGreenhouseGardenFX();

    // 4. Antenna Laser Beam for Level 5
    this.initAntennaBeamFX();

    // 5. Golden Victory Trophy for Level 7
    this.initVictoryCeremonyFX();
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
     LEVEL 1: PHYSICAL CABLE PICKUP, CARRY & SOLAR PLUG-IN
     ========================================================================= */
  startLevel1Solar(onComplete) {
    this.activeAction = 'level1';
    this.levelStep = 1;
    this.clearLevelProps();

    const player = this.game.playerAstronaut;
    const playerCtrl = this.game.playerController;

    // Cable Reel Location at Battery Storage Pad
    const cablePos = new THREE.Vector3(-6.5, 0.4, 2.2);
    // Solar Array Power Socket Location
    const socketPos = new THREE.Vector3(-2.8, 1.4, 3.8);

    // Build 3D Cable Reel Mesh
    const reelGroup = new THREE.Group();
    reelGroup.position.copy(cablePos);

    // Cable spool drum
    const drumGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.5, 12);
    const drumMat = new THREE.MeshStandardMaterial({ color: 0x00E5FF, emissive: 0x0088CC, metalness: 0.5 });
    const drum = new THREE.Mesh(drumGeo, drumMat);
    drum.rotation.z = Math.PI / 2;
    reelGroup.add(drum);

    // Heavy coil rim flanges
    [-0.28, 0.28].forEach(x => {
      const rimGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.06, 12);
      const rimMat = new THREE.MeshStandardMaterial({ color: 0x2A323D, metalness: 0.8 });
      const rim = new THREE.Mesh(rimGeo, rimMat);
      rim.rotation.z = Math.PI / 2;
      rim.position.x = x;
      reelGroup.add(rim);
    });

    // Glowing electrical coil
    const coilGeo = new THREE.TorusGeometry(0.4, 0.08, 8, 16);
    const coilMat = new THREE.MeshBasicMaterial({ color: 0xFFD166 });
    const coil = new THREE.Mesh(coilGeo, coilMat);
    coil.rotation.y = Math.PI / 2;
    reelGroup.add(coil);

    this.scene.add(reelGroup);
    this.level1Reel = reelGroup;
    this.levelProps.push(reelGroup);

    // Build Solar Array Socket
    const socketGeo = new THREE.CylinderGeometry(0.35, 0.4, 0.3, 16);
    const socketMat = new THREE.MeshStandardMaterial({ color: 0x1A202C, metalness: 0.9, roughness: 0.2 });
    const socketMesh = new THREE.Mesh(socketGeo, socketMat);
    socketMesh.position.copy(socketPos);
    socketMesh.rotation.x = Math.PI / 2;
    this.scene.add(socketMesh);
    this.levelProps.push(socketMesh);

    // Step 1: Guide Commander to pick up Cable Reel
    this.currentBeacon = this.create3DTargetBeacon(cablePos, 0x00E5FF, 'CABLE REEL');
    orbitVoice.speak("Commander! Walk over to the glowing cable reel and pick it up in your hands!");

    this.game.kidOverlay.showAction({
      icon: '🎒',
      label: 'PICK UP CABLE REEL! ⚡',
      sub: 'Walk to the glowing reel',
      color: '#00E5FF',
      onTrigger: () => {
        // Teleport near or trigger immediately
        this.triggerLevel1Pickup();
      }
    });

    // Proximity poller for natural 3D walking
    this.stepChecker = () => {
      if (this.activeAction !== 'level1') return;

      const pPos = player.position;

      if (this.levelStep === 1) {
        const d = pPos.distanceTo(cablePos);
        if (d < 2.0) {
          this.triggerLevel1Pickup();
        }
      } else if (this.levelStep === 2) {
        const d = pPos.distanceTo(socketPos);
        if (d < 2.2) {
          this.triggerLevel1PlugIn(socketPos, onComplete);
        }
      }
    };
  }

  triggerLevel1Pickup() {
    if (this.levelStep !== 1) return;
    this.levelStep = 2;

    this.playSFX('pickup');
    if (this.level1Reel && this.level1Reel.parent) {
      this.level1Reel.parent.remove(this.level1Reel);
    }

    // Attach carried cable reel to Commander's hands!
    const carryReel = new THREE.Group();
    const drumGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.4, 12);
    const drumMat = new THREE.MeshStandardMaterial({ color: 0x00E5FF, emissive: 0x0088CC });
    const drum = new THREE.Mesh(drumGeo, drumMat);
    drum.rotation.z = Math.PI / 2;
    carryReel.add(drum);

    [-0.22, 0.22].forEach(x => {
      const rimGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.05, 12);
      const rimMat = new THREE.MeshStandardMaterial({ color: 0x2A323D, metalness: 0.8 });
      const rim = new THREE.Mesh(rimGeo, rimMat);
      rim.rotation.z = Math.PI / 2;
      rim.position.x = x;
      carryReel.add(rim);
    });

    this.game.playerController.attachCarriedItem(carryReel, 'power_cable');

    // Update target beacon to Solar Array Socket
    const socketPos = new THREE.Vector3(-2.8, 1.4, 3.8);
    this.clearLevelProps();
    this.currentBeacon = this.create3DTargetBeacon(socketPos, 0xFFD166, 'PLUG HERE');
    this.showPathGuide(this.game.playerAstronaut.position, socketPos, 0x00E5FF);

    orbitVoice.speak("Awesome! You've got the cable! Now carry it across to the solar array socket!");
    this.game.kidOverlay.showAction({
      icon: '🚶',
      label: 'CARRY TO SOLAR SOCKET! 🔌',
      sub: 'Walk across the base to plug it in',
      color: '#FFB703',
      onTrigger: () => {
        this.triggerLevel1PlugIn(socketPos, this.currentOnComplete);
      }
    });
  }

  triggerLevel1PlugIn(socketPos, onComplete) {
    if (this.levelStep !== 2) return;
    this.levelStep = 3;
    this.activeAction = null;

    // Detach carried item
    this.game.playerController.detachCarriedItem();
    this.clearLevelProps();

    // Plug mesh connected into socket
    const plugged = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.22, 0.45, 12),
      new THREE.MeshStandardMaterial({ color: 0x00E5FF, emissive: 0x0099FF })
    );
    plugged.position.copy(socketPos);
    plugged.rotation.x = Math.PI / 2;
    this.scene.add(plugged);
    this.levelProps.push(plugged);

    // Audio & 3D Sparks
    this.playSFX('spark');
    this.spawnSparks(socketPos, 45, 0x00E5FF);

    setTimeout(() => {
      this.playSFX('success');
      // Tilt solar panels to face the sun
      if (this.buildings.solarArray?.userData?.animatedPanels) {
        this.buildings.solarArray.userData.animatedPanels.forEach(p => {
          p.rotation.x = -Math.PI * 0.35;
        });
      }

      this.animateAstronautVictory();
      orbitVoice.speak("YAY! High voltage flowing! Colony is fully energized!");

      this.game.kidOverlay.showSuccess('⚡ POWER RESTORED 100%! ⭐', () => {
        if (this.game.showScienceDebrief) {
          this.game.showScienceDebrief(1, onComplete);
        } else if (onComplete) {
          onComplete();
        }
      });
    }, 400);
  }

  /* =========================================================================
     LEVEL 2: PHYSICAL TOOL PICKUP, CARRY & WATER PIPE SEAL
     ========================================================================= */
  initWaterLeakFX() {
    // 3D Conduit Pipe next to Habitat
    const pipeGroup = new THREE.Group();
    pipeGroup.position.set(-1.2, 0.9, -0.6);

    const pipeGeo = new THREE.CylinderGeometry(0.12, 0.12, 2.2, 12);
    const pipeMat = new THREE.MeshStandardMaterial({ color: 0x4A5568, metalness: 0.8, roughness: 0.3 });
    const pipe = new THREE.Mesh(pipeGeo, pipeMat);
    pipe.rotation.z = Math.PI / 2;
    pipeGroup.add(pipe);

    // Magnetic Clamp
    const clampGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.5, 12);
    const clampMat = new THREE.MeshStandardMaterial({ color: 0xFFB703, metalness: 0.6, roughness: 0.3 });
    const clamp = new THREE.Mesh(clampGeo, clampMat);
    clamp.rotation.z = Math.PI / 2;
    clamp.visible = false;
    pipeGroup.add(clamp);
    this.level2Clamp = clamp;

    // 3D Valve Wheel
    const valveGeo = new THREE.TorusGeometry(0.22, 0.04, 6, 16);
    const valveMat = new THREE.MeshStandardMaterial({ color: 0xFF3B30, metalness: 0.5, roughness: 0.4 });
    const valve = new THREE.Mesh(valveGeo, valveMat);
    valve.position.set(0.6, 0.18, 0);
    valve.rotation.x = Math.PI / 2;
    pipeGroup.add(valve);
    this.level2Valve = valve;

    // Water Mist Particles
    const mistCount = 70;
    const mistGeo = new THREE.BufferGeometry();
    const mistPos = new Float32Array(mistCount * 3);
    const mistVel = [];

    for (let i = 0; i < mistCount; i++) {
      mistPos[i * 3] = 0;
      mistPos[i * 3 + 1] = 0;
      mistPos[i * 3 + 2] = 0;
      mistVel.push({
        x: (Math.random() - 0.5) * 0.05,
        y: 0.06 + Math.random() * 0.08,
        z: (Math.random() - 0.5) * 0.05,
        life: Math.random()
      });
    }

    mistGeo.setAttribute('position', new THREE.BufferAttribute(mistPos, 3));
    const mistMat = new THREE.PointsMaterial({
      color: 0x00E5FF,
      size: 0.24,
      transparent: true,
      opacity: 0.85,
    });
    const mistPoints = new THREE.Points(mistGeo, mistMat);
    mistPoints.visible = false;
    pipeGroup.add(mistPoints);

    this.scene.add(pipeGroup);
    this.level2PipeGroup = pipeGroup;
    this.level2Mist = { points: mistPoints, vel: mistVel, count: mistCount, active: false };
  }

  startLevel2WaterPipe(onComplete) {
    this.activeAction = 'level2';
    this.levelStep = 1;
    this.clearLevelProps();

    // Turn on water mist spray
    this.level2Mist.active = true;
    this.level2Mist.points.visible = true;
    this.level2Clamp.visible = false;

    const player = this.game.playerAstronaut;
    const toolPos = new THREE.Vector3(2.5, 0.4, -2.0); // Workbench location
    const pipePos = new THREE.Vector3(-1.2, 0.9, -0.6); // Leaking pipe location

    // Spawn 3D Magnetic Repair Clamp Kit at workbench
    const toolGroup = new THREE.Group();
    toolGroup.position.copy(toolPos);

    const boxGeo = new THREE.BoxGeometry(0.6, 0.35, 0.45);
    const boxMat = new THREE.MeshStandardMaterial({ color: 0xFFB703, metalness: 0.7, roughness: 0.3 });
    const toolBox = new THREE.Mesh(boxGeo, boxMat);
    toolGroup.add(toolBox);

    // Glowing welder torch handle
    const torchGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.5, 8);
    const torchMat = new THREE.MeshStandardMaterial({ color: 0xFF3B30, emissive: 0xFF3B30 });
    const torch = new THREE.Mesh(torchGeo, torchMat);
    torch.position.set(0, 0.25, 0);
    toolGroup.add(torch);

    this.scene.add(toolGroup);
    this.level2ToolKit = toolGroup;
    this.levelProps.push(toolGroup);

    // Step 1: Guide Commander to Workbench
    this.currentBeacon = this.create3DTargetBeacon(toolPos, 0xFFB703, 'REPAIR CLAMP');
    orbitVoice.speak("Commander! Water pipe is spraying into space! Walk to the workbench and grab the magnetic clamp!");

    this.game.kidOverlay.showAction({
      icon: '🎒',
      label: 'PICK UP REPAIR CLAMP! 💧',
      sub: 'Walk to workbench to grab tool',
      color: '#FFB703',
      onTrigger: () => {
        this.triggerLevel2Pickup();
      }
    });

    this.stepChecker = () => {
      if (this.activeAction !== 'level2') return;
      const pPos = player.position;

      if (this.levelStep === 1) {
        if (pPos.distanceTo(toolPos) < 2.0) {
          this.triggerLevel2Pickup();
        }
      } else if (this.levelStep === 2) {
        if (pPos.distanceTo(pipePos) < 2.2) {
          this.triggerLevel2Seal(pipePos, onComplete);
        }
      }
    };
  }

  triggerLevel2Pickup() {
    if (this.levelStep !== 1) return;
    this.levelStep = 2;

    this.playSFX('pickup');
    if (this.level2ToolKit && this.level2ToolKit.parent) {
      this.level2ToolKit.parent.remove(this.level2ToolKit);
    }

    // Attach carried magnetic clamp to Commander's hands!
    const carryClamp = new THREE.Group();
    const cMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.2, 0.45, 12),
      new THREE.MeshStandardMaterial({ color: 0xFFB703, metalness: 0.7 })
    );
    cMesh.rotation.z = Math.PI / 2;
    carryClamp.add(cMesh);

    this.game.playerController.attachCarriedItem(carryClamp, 'repair_clamp');

    // Guide Commander across to Leaking Pipe
    const pipePos = new THREE.Vector3(-1.2, 0.9, -0.6);
    this.clearLevelProps();
    this.currentBeacon = this.create3DTargetBeacon(pipePos, 0x00E5FF, 'LEAKING PIPE');
    this.showPathGuide(this.game.playerAstronaut.position, pipePos, 0x00E5FF);

    orbitVoice.speak("Got the clamp! Now carry it across to the spraying pipe to seal the leak!");
    this.game.kidOverlay.showAction({
      icon: '🚶',
      label: 'CARRY CLAMP TO PIPE! 🩹',
      sub: 'Walk to leaking pipe to repair it',
      color: '#00E5FF',
      onTrigger: () => {
        this.triggerLevel2Seal(pipePos, this.currentOnComplete);
      }
    });
  }

  triggerLevel2Seal(pipePos, onComplete) {
    if (this.levelStep !== 2) return;
    this.levelStep = 3;
    this.activeAction = null;

    this.game.playerController.detachCarriedItem();
    this.clearLevelProps();

    // Snap clamp onto pipe
    this.playSFX('clang');
    this.level2Clamp.visible = true;
    this.level2Clamp.scale.set(1.4, 1.4, 1.4);
    setTimeout(() => this.level2Clamp.scale.set(1, 1, 1), 120);

    // Laser welding sparks
    setTimeout(() => {
      this.playSFX('spark');
      this.spawnSparks(pipePos, 45, 0xFFA500);

      // Spin valve wheel tight
      let rot = 0;
      const spinInt = setInterval(() => {
        rot += 0.35;
        this.level2Valve.rotation.z += 0.35;
        if (rot >= Math.PI * 4) {
          clearInterval(spinInt);
          this.level2Mist.active = false;
          this.level2Mist.points.visible = false;
          this.level2Clamp.material.color.setHex(0x06D6A0); // Turned green (SEALED)

          this.playSFX('success');
          this.animateAstronautVictory();

          orbitVoice.speak("Fantastic work! Pipe is sealed tight! Water supplies are 100 percent safe!");
          this.game.kidOverlay.showSuccess('💧 WATER LEAK SEALED! ⭐', () => {
            if (this.game.showScienceDebrief) {
              this.game.showScienceDebrief(2, onComplete);
            } else if (onComplete) {
              onComplete();
            }
          });
        }
      }, 30);
    }, 300);
  }

  /* =========================================================================
     LEVEL 3: PHYSICAL BUNKER RUSH - GATHER CREW TRAIN & SHIELD UP
     ========================================================================= */
  initBunkerShieldFX() {
    // 1. Titanium Blast Door
    const doorGeo = new THREE.BoxGeometry(1.6, 2.2, 0.2);
    const doorMat = new THREE.MeshStandardMaterial({
      color: 0x2A323D,
      metalness: 0.9,
      roughness: 0.2,
      flatShading: true
    });
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(0, 4.0, -1.2);
    door.visible = false;
    this.scene.add(door);
    this.level3BlastDoor = door;

    // 2. Translucent Gold Radiation Energy Shield Dome
    const shieldGeo = new THREE.SphereGeometry(14.5, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const shieldMat = new THREE.MeshStandardMaterial({
      color: 0xFFD166,
      emissive: 0xFFB703,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
      wireframe: true
    });
    const shield = new THREE.Mesh(shieldGeo, shieldMat);
    shield.position.set(0, 0, 0);
    this.scene.add(shield);
    this.level3Shield = shield;
  }

  startLevel3SolarStorm(onComplete) {
    this.activeAction = 'level3';
    this.levelStep = 1;
    this.clearLevelProps();
    this.game.playerController.clearFollowers();

    // Red alert fog
    if (this.scene.fog) {
      this.scene.fog.color.setHex(0x551515);
    }
    this.playSFX('beam');
    orbitVoice.speak("NASA ALERT! Real Solar Particle Storm from May 10, 2024 incoming! Run and gather all three astronauts, then lead them into the bunker!");

    // Astronauts to rescue
    const astros = this.astronautData?.astronauts;
    const targets = [
      { astro: astros[1], name: 'Dr. Marcus', pos: new THREE.Vector3(-5.0, 0.3, 5.5), rescued: false },
      { astro: astros[2], name: 'Elena', pos: new THREE.Vector3(1.5, 0.3, 8.0), rescued: false },
      { astro: astros[3], name: 'Chen', pos: new THREE.Vector3(4.8, 0.3, -4.0), rescued: false }
    ];
    this.crewTargets = targets;

    // Reposition other 3 astronauts out in the yard
    targets.forEach((t, i) => {
      if (t.astro) {
        t.astro.position.copy(t.pos);
        t.astro.visible = true;
      }
    });

    // Create 3D markers above each astronaut
    this.crewBeacons = targets.map(t => this.create3DTargetBeacon(t.pos, 0xFF3B30, 'EVA ASTRONAUT'));

    const bunkerPos = new THREE.Vector3(0.0, 0.3, -1.2);

    this.game.kidOverlay.showAction({
      icon: '🚨',
      label: 'RUN & GATHER CREW! (0/3)',
      sub: 'Run to each astronaut to form a line',
      color: '#FF3B30',
      onTrigger: () => {
        // Quick trigger: auto-gather all
        targets.forEach(t => {
          if (!t.rescued) {
            t.rescued = true;
            this.game.playerController.addFollower(t.astro);
          }
        });
        this.triggerLevel3BunkerLock(bunkerPos, onComplete);
      }
    });

    this.stepChecker = () => {
      if (this.activeAction !== 'level3') return;
      const pPos = this.game.playerAstronaut.position;

      // Check proximity to unrescued crew
      let allRescued = true;
      let count = 0;
      targets.forEach((t, idx) => {
        if (!t.rescued) {
          const d = pPos.distanceTo(t.astro.position);
          if (d < 2.5) {
            t.rescued = true;
            this.playSFX('pickup');
            this.game.playerController.addFollower(t.astro);

            // Remove beacon
            if (this.crewBeacons[idx]?.group?.parent) {
              this.crewBeacons[idx].group.parent.remove(this.crewBeacons[idx].group);
            }
          } else {
            allRescued = false;
          }
        } else {
          count++;
        }
      });

      if (count < 3) {
        this.game.kidOverlay.updateLabel(`RUN & GATHER CREW! (${count}/3)`);
      } else if (count === 3 && this.levelStep === 1) {
        this.levelStep = 2;
        this.clearLevelProps();
        this.currentBeacon = this.create3DTargetBeacon(bunkerPos, 0x06D6A0, 'HABITAT BUNKER');
        this.showPathGuide(pPos, bunkerPos, 0x06D6A0);

        orbitVoice.speak("Great job Commander! You've got the whole team! Lead everyone into the habitat airlock!");
        this.game.kidOverlay.showAction({
          icon: '🏃',
          label: 'LEAD CREW INTO BUNKER! 🏠',
          sub: 'Run inside habitat airlock',
          color: '#06D6A0',
          onTrigger: () => {
            this.triggerLevel3BunkerLock(bunkerPos, onComplete);
          }
        });
      } else if (this.levelStep === 2) {
        if (pPos.distanceTo(bunkerPos) < 2.4) {
          this.triggerLevel3BunkerLock(bunkerPos, onComplete);
        }
      }
    };
  }

  triggerLevel3BunkerLock(bunkerPos, onComplete) {
    this.levelStep = 3;
    this.activeAction = null;
    this.clearLevelProps();

    // 1. Crew walks inside
    const astros = this.astronautData?.astronauts;
    if (astros) {
      astros.forEach((a, idx) => {
        if (idx > 0) a.visible = false;
      });
    }
    this.game.playerController.clearFollowers();

    // 2. Drop Titanium Blast Door
    this.level3BlastDoor.visible = true;
    let doorT = 0;
    const doorInt = setInterval(() => {
      doorT += 0.08;
      this.level3BlastDoor.position.y = THREE.MathUtils.lerp(4.0, 1.1, doorT);

      if (doorT >= 1) {
        clearInterval(doorInt);
        this.playSFX('clang');

        // 3. Expand Golden Radiation Shield Dome
        let shieldT = 0;
        const shieldInt = setInterval(() => {
          shieldT += 0.06;
          this.level3Shield.material.opacity = THREE.MathUtils.lerp(0.0, 0.45, shieldT);
          this.level3Shield.scale.setScalar(THREE.MathUtils.lerp(0.3, 1.0, shieldT));

          if (shieldT >= 1) {
            clearInterval(shieldInt);
            this.playSFX('success');

            // Restore sky
            if (this.scene.fog) {
              this.scene.fog.color.setHex(0x102C49);
            }

            orbitVoice.speak("Bunker sealed! Radiation shield locked! All four astronauts are 100 percent safe!");
            this.game.kidOverlay.showSuccess('☀️ SHIELD ACTIVE! ALL SAFE! ⭐', () => {
              if (astros) astros.forEach(a => a.visible = true);
              this.level3BlastDoor.visible = false;
              this.level3Shield.material.opacity = 0;
              if (this.game.showScienceDebrief) {
                this.game.showScienceDebrief(3, onComplete);
              } else if (onComplete) {
                onComplete();
              }
            });
          }
        }, 30);
      }
    }, 25);
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
    orbitVoice.speak("Commander! Pick up the sack of space seeds and carry it into the bio-domes!");

    this.game.kidOverlay.showAction({
      icon: '🌱',
      label: 'PICK UP SEED SACK! 🌾',
      sub: 'Walk to supply depot to grab seeds',
      color: '#06D6A0',
      onTrigger: () => {
        this.triggerLevel4PickupSeeds();
      }
    });

    this.stepChecker = () => {
      if (this.activeAction !== 'level4') return;
      const pPos = this.game.playerAstronaut.position;

      if (this.levelStep === 1) {
        if (pPos.distanceTo(depotPos) < 2.0) {
          this.triggerLevel4PickupSeeds();
        }
      } else if (this.levelStep === 2) {
        if (pPos.distanceTo(gardenPos) < 2.2) {
          this.triggerLevel4GrowGarden(onComplete);
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

    orbitVoice.speak("Now carry the seeds over to the garden soil beds!");
    this.game.kidOverlay.showAction({
      icon: '🚶',
      label: 'CARRY SEEDS TO SOIL BEDS! 🍓',
      sub: 'Walk inside greenhouse to plant',
      color: '#00E5FF',
      onTrigger: () => {
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

  /* =========================================================================
     LEVEL 5: PHYSICAL CRANK & ANTENNA EARTH BEAM
     ========================================================================= */
  initAntennaBeamFX() {
    const beamGeo = new THREE.CylinderGeometry(0.12, 0.4, 45, 12, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x00E5FF,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.set(5.2, 18, -12);
    beam.rotation.x = -Math.PI * 0.35;
    this.scene.add(beam);
    this.level5Beam = beam;
  }

  startLevel5Antenna(onComplete) {
    this.activeAction = 'level5';
    this.clearLevelProps();

    const consolePos = new THREE.Vector3(4.6, 0.4, -4.2);
    this.currentBeacon = this.create3DTargetBeacon(consolePos, 0x00E5FF, 'ANTENNA WHEEL');

    orbitVoice.speak("Commander! Walk up to the space radio console and swivel the giant dish to lock onto Earth!");
    this.game.kidOverlay.showAction({
      icon: '📡',
      label: 'SWIVEL DISH TO EARTH! 🌍',
      sub: 'Walk to antenna console to align beam',
      color: '#00E5FF',
      onTrigger: () => {
        this.triggerLevel5Beam(onComplete);
      }
    });

    this.stepChecker = () => {
      if (this.activeAction !== 'level5') return;
      const d = this.game.playerAstronaut.position.distanceTo(consolePos);
      if (d < 2.2) {
        this.triggerLevel5Beam(onComplete);
      }
    };
  }

  triggerLevel5Beam(onComplete) {
    this.activeAction = null;
    this.clearLevelProps();

    const dishHead = this.buildings.antenna?.userData?.rotatingHead;
    let rotT = 0;
    const rotInt = setInterval(() => {
      rotT += 0.04;
      if (dishHead) {
        dishHead.rotation.x = THREE.MathUtils.lerp(0.4, -0.65, rotT);
        dishHead.rotation.y = THREE.MathUtils.lerp(0, Math.PI * 0.15, rotT);
      }

      if (rotT >= 1) {
        clearInterval(rotInt);
        this.playSFX('beam');

        let beamT = 0;
        const beamInt = setInterval(() => {
          beamT += 0.1;
          this.level5Beam.material.opacity = THREE.MathUtils.lerp(0, 0.85, beamT);

          if (beamT >= 1) {
            clearInterval(beamInt);
            this.playSFX('success');
            this.animateAstronautVictory();

            orbitVoice.speak("Loud and clear! Earth Mission Control reads us five bars! We are fully connected to planet Earth!");
            this.game.kidOverlay.showSuccess('📡 EARTH SIGNAL 100%! ⭐', () => {
              this.level5Beam.material.opacity = 0;
              if (this.game.showScienceDebrief) {
                this.game.showScienceDebrief(5, onComplete);
              } else if (onComplete) {
                onComplete();
              }
            });
          }
        }, 30);
      }
    }, 25);
  }

  /* =========================================================================
     LEVEL 6: ROVER DRIVING ICE/ROCK EXPEDITION
     ========================================================================= */
  startLevel6Rover(onComplete) {
    orbitVoice.speak("Hop in the Lunar Rover, Commander! Drive across the craters and run over 5 glowing blue ice crystals!");
    this.game.startRoverMode();
  }

  /* =========================================================================
     LEVEL 7: GRAND COLONY VICTORY CEREMONY
     ========================================================================= */
  initVictoryCeremonyFX() {
    const trophyGroup = new THREE.Group();
    trophyGroup.position.set(0, 0.4, 2.5);

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xFFD166,
      emissive: 0xF5BA42,
      emissiveIntensity: 0.4,
      metalness: 0.95,
      roughness: 0.15,
      flatShading: true
    });

    const baseGeo = new THREE.CylinderGeometry(0.7, 0.85, 0.5, 12);
    const base = new THREE.Mesh(baseGeo, goldMat);
    trophyGroup.add(base);

    const cupGeo = new THREE.CylinderGeometry(0.6, 0.25, 0.9, 12);
    const cup = new THREE.Mesh(cupGeo, goldMat);
    cup.position.y = 0.7;
    trophyGroup.add(cup);

    const starGeo = new THREE.OctahedronGeometry(0.32, 0);
    const star = new THREE.Mesh(starGeo, new THREE.MeshBasicMaterial({ color: 0xFFFFFF }));
    star.position.y = 1.35;
    trophyGroup.add(star);

    trophyGroup.scale.set(0.01, 0.01, 0.01);
    this.scene.add(trophyGroup);
    this.trophy = trophyGroup;

    // Confetti
    const confettiCount = 180;
    const cGeo = new THREE.BufferGeometry();
    const cPos = new Float32Array(confettiCount * 3);
    const cCol = new Float32Array(confettiCount * 3);
    this.confettiVels = [];

    const palette = [
      new THREE.Color(0x00E5FF),
      new THREE.Color(0xFFD166),
      new THREE.Color(0xFF3B30),
      new THREE.Color(0x06D6A0),
      new THREE.Color(0xFFFFFF)
    ];

    for (let i = 0; i < confettiCount; i++) {
      cPos[i * 3] = (Math.random() - 0.5) * 20;
      cPos[i * 3 + 1] = 10 + Math.random() * 8;
      cPos[i * 3 + 2] = (Math.random() - 0.5) * 20;

      const col = palette[Math.floor(Math.random() * palette.length)];
      cCol[i * 3] = col.r;
      cCol[i * 3 + 1] = col.g;
      cCol[i * 3 + 2] = col.b;

      this.confettiVels.push({
        x: (Math.random() - 0.5) * 0.04,
        y: -0.04 - Math.random() * 0.04,
        z: (Math.random() - 0.5) * 0.04,
        spin: (Math.random() - 0.5) * 0.1
      });
    }

    cGeo.setAttribute('position', new THREE.BufferAttribute(cPos, 3));
    cGeo.setAttribute('color', new THREE.BufferAttribute(cCol, 3));
    const cMat = new THREE.PointsMaterial({ size: 0.35, vertexColors: true, transparent: true, opacity: 0 });
    this.confettiPoints = new THREE.Points(cGeo, cMat);
    this.scene.add(this.confettiPoints);
  }

  startLevel7Victory(onComplete) {
    this.activeAction = 'level7';
    orbitVoice.speak("MISSION SUCCESS! Commander, you kept our lunar colony safe for seven entire days! You are a Moon Hero!");

    this.cameraManager.flyTo(
      { x: 0, y: 5.5, z: 9.5 },
      { x: 0, y: 1.2, z: 2.5 },
      1500
    );

    let trophyT = 0;
    const trophyInt = setInterval(() => {
      trophyT += 0.04;
      const s = THREE.MathUtils.lerp(0.01, 1.4, trophyT);
      this.trophy.scale.set(s, s, s);
      this.trophy.rotation.y += 0.05;

      if (trophyT >= 1) {
        clearInterval(trophyInt);
        this.confettiPoints.material.opacity = 1.0;
        this.confettiActive = true;
        this.playSFX('success');

        this.animateAstronautVictory();
        this.game.kidOverlay.showSuccess('🏆 7-DAY EXPEDITION SURVIVED! 🚀', () => {
          if (this.game.showScienceDebrief) {
            this.game.showScienceDebrief(7, onComplete);
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

  animateAstronautVictory() {
    const player = this.game.playerAstronaut;
    if (!player) return;
    let jumpT = 0;
    const jumpInt = setInterval(() => {
      jumpT += 0.1;
      player.position.y = 0.3 + Math.sin(jumpT * Math.PI) * 1.5;
      if (player.userData.leftArm) player.userData.leftArm.rotation.x = -Math.PI * 0.85;
      if (player.userData.rightArm) player.userData.rightArm.rotation.x = -Math.PI * 0.85;

      if (jumpT >= 2) {
        clearInterval(jumpInt);
        player.position.y = 0.3;
        if (player.userData.leftArm) player.userData.leftArm.rotation.x = 0;
        if (player.userData.rightArm) player.userData.rightArm.rotation.x = 0;
      }
    }, 30);
  }

  update(delta, elapsedTime) {
    // 1. Water Mist Spray (Level 2)
    if (this.level2Mist?.active) {
      const posAttr = this.level2Mist.points.geometry.attributes.position;
      const vels = this.level2Mist.vel;
      for (let i = 0; i < this.level2Mist.count; i++) {
        let x = posAttr.getX(i) + vels[i].x;
        let y = posAttr.getY(i) + vels[i].y;
        let z = posAttr.getZ(i) + vels[i].z;

        vels[i].y -= 0.003; // Low gravity downward curve

        if (y < 0 || y > 1.8) {
          x = 0; y = 0; z = 0;
          vels[i].y = 0.06 + Math.random() * 0.08;
        }
        posAttr.setXYZ(i, x, y, z);
      }
      posAttr.needsUpdate = true;
    }

    // 2. Active Beacon Floating Pulse
    if (this.currentBeacon) {
      this.currentBeacon.arrow.position.y = 2.4 + Math.sin(elapsedTime * 4.5) * 0.25;
      this.currentBeacon.arrow.rotation.y = elapsedTime * 2.0;
      this.currentBeacon.ring.scale.setScalar(1 + Math.sin(elapsedTime * 4.0) * 0.15);
    }

    // 3. Proximity Checker for in-progress tasks
    if (this.stepChecker) {
      this.stepChecker();
    }

    // 4. Spark Particle Systems
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

    // 5. Confetti Falling (Level 7)
    if (this.confettiActive && this.confettiPoints) {
      const posAttr = this.confettiPoints.geometry.attributes.position;
      for (let i = 0; i < this.confettiVels.length; i++) {
        let y = posAttr.getY(i) + this.confettiVels[i].y;
        if (y < 0.2) y = 14;
        posAttr.setY(i, y);
      }
      posAttr.needsUpdate = true;
    }
  }
}
