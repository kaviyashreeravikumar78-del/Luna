import * as THREE from 'three';

/**
 * LUNA: Mission Survival - 3D Rover Driving & Lunar Ice Collection Controller
 * Snappy arcade-style 6-wheel rover dynamics with keyboard, touch, and on-screen button controls.
 */
export class RoverDrivingController {
  constructor(roverMesh, scene, camera, options = {}) {
    this.rover = roverMesh;
    this.scene = scene;
    this.camera = camera;
    this.options = options; // { onCollectIce, onCompleteMission, onExitRover }

    this.active = false;
    this.speed = 0;
    this.maxSpeed = 9.0;
    this.acceleration = 14.0;
    this.deceleration = 10.0;
    this.heading = -Math.PI * 0.15;

    // Direct movement controls
    this.keys = { forward: false, backward: false, left: false, right: false };
    this.touchSteer = { throttle: 0, steer: 0 };

    this.iceCrystals = [];
    this.collectedCount = 0;
    this.targetCount = 5;
    this.isReturning = false;

    this.bindControls();
    this.createDrivingHUD();
  }

  bindControls() {
    window.addEventListener('keydown', (e) => {
      if (!this.active) return;
      const code = e.code;
      const key = e.key ? e.key.toLowerCase() : '';

      if (code === 'KeyW' || code === 'ArrowUp' || key === 'w') {
        this.keys.forward = true;
      }
      if (code === 'KeyS' || code === 'ArrowDown' || key === 's') {
        this.keys.backward = true;
      }
      if (code === 'KeyA' || code === 'ArrowLeft' || key === 'a') {
        this.keys.left = true;
      }
      if (code === 'KeyD' || code === 'ArrowRight' || key === 'd') {
        this.keys.right = true;
      }
      if (code === 'Escape') {
        this.stop();
        if (this.options.onExitRover) this.options.onExitRover();
      }
    });

    window.addEventListener('keyup', (e) => {
      const code = e.code;
      const key = e.key ? e.key.toLowerCase() : '';

      if (code === 'KeyW' || code === 'ArrowUp' || key === 'w') {
        this.keys.forward = false;
      }
      if (code === 'KeyS' || code === 'ArrowDown' || key === 's') {
        this.keys.backward = false;
      }
      if (code === 'KeyA' || code === 'ArrowLeft' || key === 'a') {
        this.keys.left = false;
      }
      if (code === 'KeyD' || code === 'ArrowRight' || key === 'd') {
        this.keys.right = false;
      }
    });
  }

  createDrivingHUD() {
    // Big on-screen click/touch buttons for driving
    const hud = document.createElement('div');
    hud.id = 'rover-touch-controls';
    hud.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      display: none;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      z-index: 6500;
      pointer-events: auto;
      user-select: none;
      -webkit-user-select: none;
    `;

    hud.innerHTML = `
      <div style="font-size:0.85rem; font-weight:900; color:#00E5FF; text-shadow:0 0 10px #00E5FF; text-transform:uppercase; margin-bottom:4px;">
        🎮 ROVER CONTROLS
      </div>
      <div style="display:flex; justify-content:center;">
        <button id="btn-rover-up" class="rover-drive-btn" style="width:72px; height:64px; border-radius:18px; background:#06D6A0; color:#06101E; border:3px solid #FFF; font-size:2rem; cursor:pointer; box-shadow:0 6px 20px rgba(6,214,160,0.6); display:flex; align-items:center; justify-content:center;">⬆️</button>
      </div>
      <div style="display:flex; gap:14px; align-items:center;">
        <button id="btn-rover-left" class="rover-drive-btn" style="width:72px; height:64px; border-radius:18px; background:#00E5FF; color:#06101E; border:3px solid #FFF; font-size:2rem; cursor:pointer; box-shadow:0 6px 20px rgba(0,229,255,0.6); display:flex; align-items:center; justify-content:center;">⬅️</button>
        <button id="btn-rover-down" class="rover-drive-btn" style="width:72px; height:64px; border-radius:18px; background:#FFB703; color:#06101E; border:3px solid #FFF; font-size:2rem; cursor:pointer; box-shadow:0 6px 20px rgba(255,183,3,0.6); display:flex; align-items:center; justify-content:center;">⬇️</button>
        <button id="btn-rover-right" class="rover-drive-btn" style="width:72px; height:64px; border-radius:18px; background:#00E5FF; color:#06101E; border:3px solid #FFF; font-size:2rem; cursor:pointer; box-shadow:0 6px 20px rgba(0,229,255,0.6); display:flex; align-items:center; justify-content:center;">➡️</button>
      </div>
    `;

    document.body.appendChild(hud);
    this.drivingHUD = hud;

    const setupBtn = (id, onStart, onEnd) => {
      const btn = hud.querySelector(`#${id}`);
      if (!btn) return;
      const start = (e) => { e.preventDefault(); onStart(); };
      const end = (e) => { e.preventDefault(); onEnd(); };

      btn.addEventListener('mousedown', start);
      btn.addEventListener('mouseup', end);
      btn.addEventListener('mouseleave', end);
      btn.addEventListener('touchstart', start, { passive: false });
      btn.addEventListener('touchend', end, { passive: false });
    };

    setupBtn('btn-rover-up', () => { this.touchSteer.throttle = 1; }, () => { this.touchSteer.throttle = 0; });
    setupBtn('btn-rover-down', () => { this.touchSteer.throttle = -1; }, () => { this.touchSteer.throttle = 0; });
    setupBtn('btn-rover-left', () => { this.touchSteer.steer = 1; }, () => { this.touchSteer.steer = 0; });
    setupBtn('btn-rover-right', () => { this.touchSteer.steer = -1; }, () => { this.touchSteer.steer = 0; });
  }

  setJoystickInput(x, y) {
    this.touchSteer.steer = -x;
    this.touchSteer.throttle = y;
  }

  start() {
    this.active = true;
    this.speed = 0;
    this.collectedCount = 0;
    this.isReturning = false;
    this.spawnIceCrystals();

    if (this.drivingHUD) {
      this.drivingHUD.style.display = 'flex';
    }
  }

  stop() {
    this.active = false;
    this.speed = 0;
    this.keys = { forward: false, backward: false, left: false, right: false };
    this.touchSteer = { throttle: 0, steer: 0 };
    this.clearIceCrystals();

    if (this.drivingHUD) {
      this.drivingHUD.style.display = 'none';
    }
  }

  spawnIceCrystals() {
    this.clearIceCrystals();

    // 5 crater locations across the 38x38 terrain
    const spawnPoints = [
      { x: -7.5, z: 9.5 },
      { x: 10.5, z: 7.8 },
      { x: -14.2, z: -9.5 },
      { x: 14.5, z: 12.2 },
      { x: -12.5, z: -2.8 },
    ];

    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0x00FFFF,
      emissive: 0x00B4D8,
      emissiveIntensity: 0.6,
      roughness: 0.1,
      metalness: 0.4,
      transparent: true,
      opacity: 0.95,
      flatShading: true,
    });

    const pillarMat = new THREE.MeshBasicMaterial({
      color: 0x00E5FF,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide
    });

    spawnPoints.forEach((pt, idx) => {
      const group = new THREE.Group();
      group.position.set(pt.x, 0.7, pt.z);

      // Large Glowing Octahedron Ice Crystal
      const geo = new THREE.OctahedronGeometry(0.85, 0);
      const mesh = new THREE.Mesh(geo, crystalMat);
      mesh.castShadow = true;
      group.add(mesh);

      // Sky Beacon Light Pillar (Visible from anywhere on the Moon!)
      const pillarGeo = new THREE.CylinderGeometry(0.15, 0.15, 30, 8);
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.y = 15;
      group.add(pillar);

      // Glowing Pulse Halo Ring on Ground
      const ringGeo = new THREE.TorusGeometry(1.2, 0.08, 6, 24);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x00FFFF });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      group.add(ring);

      this.scene.add(group);
      this.iceCrystals.push({
        id: idx,
        group,
        mesh,
        ring,
        collected: false,
        pos: new THREE.Vector3(pt.x, 0.7, pt.z),
      });
    });
  }

  clearIceCrystals() {
    this.iceCrystals.forEach(c => {
      if (c.group && c.group.parent) {
        c.group.parent.remove(c.group);
      }
    });
    this.iceCrystals = [];
  }

  update(delta, elapsedTime) {
    if (!this.active || !this.rover) return;

    // Gather Inputs
    let throttle = 0;
    let steer = 0;

    if (this.keys.forward) throttle += 1;
    if (this.keys.backward) throttle -= 1;
    if (this.keys.left) steer += 1;
    if (this.keys.right) steer -= 1;

    // Add touch/button inputs
    if (Math.abs(this.touchSteer.throttle) > 0.05) {
      throttle = this.touchSteer.throttle;
    }
    if (Math.abs(this.touchSteer.steer) > 0.05) {
      steer = this.touchSteer.steer;
    }

    // 1. Snappy Steer (Can turn even when standing still!)
    if (Math.abs(steer) > 0.05) {
      this.heading += steer * 3.4 * delta;
    }
    this.rover.rotation.y = this.heading;

    // 2. Responsive Acceleration / Braking
    if (throttle > 0) {
      this.speed = Math.min(this.maxSpeed, this.speed + this.acceleration * delta);
    } else if (throttle < 0) {
      this.speed = Math.max(-this.maxSpeed * 0.6, this.speed - this.acceleration * delta);
    } else {
      // Natural deceleration to stop
      if (this.speed > 0) {
        this.speed = Math.max(0, this.speed - this.deceleration * delta);
      } else if (this.speed < 0) {
        this.speed = Math.min(0, this.speed + this.deceleration * delta);
      }
    }

    // 3. Move Rover in facing direction (+Z of rotated mesh)
    const forwardVec = new THREE.Vector3(Math.sin(this.heading), 0, Math.cos(this.heading));
    this.rover.position.addScaledVector(forwardVec, this.speed * delta);

    // Platform clamping (38x38 terrain)
    this.rover.position.x = Math.max(-17.5, Math.min(17.5, this.rover.position.x));
    this.rover.position.z = Math.max(-17.5, Math.min(17.5, this.rover.position.z));

    // Suspension bounce
    this.rover.position.y = 0.45 + Math.sin(elapsedTime * 14) * Math.abs(this.speed * 0.015);

    // 4. Rotate 6 Wheels
    if (this.rover.userData && this.rover.userData.wheels) {
      const wheelRot = (this.speed / 0.3) * delta;
      this.rover.userData.wheels.forEach(w => {
        w.rotation.x += wheelRot;
      });
    }

    // 5. Spin and check ice crystal pickups
    this.iceCrystals.forEach(crystal => {
      if (crystal.collected) return;

      // Animate hovering spin
      crystal.mesh.rotation.y = elapsedTime * 2.5;
      crystal.mesh.rotation.x = Math.sin(elapsedTime * 3) * 0.2;
      crystal.ring.scale.setScalar(1 + Math.sin(elapsedTime * 5) * 0.2);

      // Check distance to rover
      const dx = this.rover.position.x - crystal.pos.x;
      const dz = this.rover.position.z - crystal.pos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      // Generous 3.2m pickup radius
      if (dist < 3.2) {
        crystal.collected = true;
        crystal.group.visible = false;
        this.collectedCount += 1;

        if (this.options.onCollectIce) {
          this.options.onCollectIce(this.collectedCount, this.targetCount);
        }

        if (this.collectedCount >= this.targetCount) {
          this.isReturning = true;
        }
      }
    });

    // 6. Return to Base detection
    if (this.isReturning) {
      const baseDist = Math.sqrt(
        Math.pow(this.rover.position.x - 0.2, 2) +
        Math.pow(this.rover.position.z - 6.2, 2)
      );

      if (baseDist < 3.6) {
        this.isReturning = false;
        this.stop();
        if (this.options.onCompleteMission) {
          this.options.onCompleteMission();
        }
      }
    }
  }
}
