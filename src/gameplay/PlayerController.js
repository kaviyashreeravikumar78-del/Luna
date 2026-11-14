import * as THREE from 'three';
import { gameState } from '../simulation/GameState.js';

/**
 * LUNA: Mission Survival - 3D Astronaut Player Controller
 * Enables children to explore the Moon base using WASD/Arrows or touch joystick,
 * with low-gravity bouncy walking, 3D character carrying mechanics, follower trains,
 * and context-sensitive object interaction.
 */
export class PlayerController {
  constructor(astronautMesh, camera, options = {}) {
    this.player = astronautMesh;
    this.camera = camera;
    this.options = options; // { onNearStation, onLeaveStation, onInteract }

    this.enabled = true;
    this.speed = 4.5; // Smooth responsive walking speed
    this.walkTime = 0;
    this.isMoving = false;

    // Movement vectors
    this.inputVector = new THREE.Vector2();
    this.moveDirection = new THREE.Vector3();

    // Interaction trigger radius
    this.interactionRadius = 3.6;
    this.currentNearStation = null;

    // Physical 3D Object Carrying System
    this.carriedItem = null;
    this.carriedItemType = null;

    // Astronaut Follower Train System (for Sol 3 Solar Storm Bunker Rush)
    this.followers = [];
    this.trailHistory = []; // Breadcrumbs of player positions for smooth following

    // Defined colony stations with coordinates
    this.stations = [
      { id: 'solar_array', name: 'Photovoltaic Solar Farm', pos: new THREE.Vector3(-2.8, 0, 3.8), prompt: '⚡ Connect Solar Power' },
      { id: 'rover', name: 'Lunar Rover Pathfinder', pos: new THREE.Vector3(0.2, 0, 6.2), prompt: '🚜 Drive Rover & Hunt Ice' },
      { id: 'habitat', name: 'Main Habitat Hub', pos: new THREE.Vector3(0.0, 0, -1.2), prompt: '🏠 Habitat Life-Support / Shelter' },
      { id: 'greenhouse', name: 'Hydroponic Bio-Domes', pos: new THREE.Vector3(6.8, 0, -0.6), prompt: '🌱 Plant Seeds & Farm' },
      { id: 'antenna', name: 'Space Radio Dish', pos: new THREE.Vector3(5.2, 0, -5.2), prompt: '📡 Align Earth Signal' },
      { id: 'research_lab', name: 'Lunar Science Lab', pos: new THREE.Vector3(5.5, 0, 2.2), prompt: '🔬 Inspect Moon Rocks' },
    ];

    // Key states
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      interact: false,
    };

    this.bindKeyboard();
  }

  bindKeyboard() {
    window.addEventListener('keydown', (e) => {
      if (!this.enabled) return;
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
        case 'KeyE':
        case 'Space':
        case 'Enter':
          this.triggerInteraction();
          break;
      }
    });

    window.addEventListener('keyup', (e) => {
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
      }
    });
  }

  /**
   * Physically attaches a 3D item to the Commander's hands
   */
  attachCarriedItem(mesh, type) {
    this.detachCarriedItem();
    this.carriedItem = mesh;
    this.carriedItemType = type;

    // Position mesh in front of chest between hands
    mesh.position.set(0, 1.35, 0.45);
    mesh.scale.set(0.65, 0.65, 0.65);
    this.player.add(mesh);
  }

  /**
   * Releases or drops the carried item
   */
  detachCarriedItem() {
    if (this.carriedItem && this.carriedItem.parent) {
      this.carriedItem.parent.remove(this.carriedItem);
    }
    this.carriedItem = null;
    this.carriedItemType = null;
  }

  /**
   * Adds an astronaut to follow Commander in single file
   */
  addFollower(astro) {
    if (!this.followers.includes(astro)) {
      this.followers.push(astro);
    }
  }

  /**
   * Clears all followers
   */
  clearFollowers() {
    this.followers = [];
    this.trailHistory = [];
  }

  /**
   * Sets joystick / touch input vector (-1 to 1)
   */
  setJoystickInput(x, y) {
    this.inputVector.set(x, y);
  }

  triggerInteraction() {
    if (this.currentNearStation && this.options.onInteract) {
      this.options.onInteract(this.currentNearStation);
    }
  }

  update(delta) {
    if (!this.enabled || !this.player) return;

    // Calculate keyboard movement
    let moveX = 0;
    let moveZ = 0;

    if (this.keys.forward) moveZ -= 1;
    if (this.keys.backward) moveZ += 1;
    if (this.keys.left) moveX -= 1;
    if (this.keys.right) moveX += 1;

    // Combine keyboard and touch joystick input
    if (this.inputVector.lengthSq() > 0.04) {
      moveX = this.inputVector.x;
      moveZ = -this.inputVector.y;
    }

    const inputLen = Math.sqrt(moveX * moveX + moveZ * moveZ);
    this.isMoving = (inputLen > 0.05);

    if (this.isMoving) {
      // Normalize input
      moveX /= Math.max(1, inputLen);
      moveZ /= Math.max(1, inputLen);

      // Camera-relative direction
      const camForward = new THREE.Vector3();
      this.camera.getWorldDirection(camForward);
      camForward.y = 0;
      camForward.normalize();

      const camRight = new THREE.Vector3();
      camRight.crossVectors(camForward, new THREE.Vector3(0, 1, 0)).normalize();

      this.moveDirection.set(0, 0, 0);
      this.moveDirection.addScaledVector(camRight, moveX);
      this.moveDirection.addScaledVector(camForward, -moveZ);
      this.moveDirection.normalize();

      // Move player
      const step = this.speed * delta;
      this.player.position.x += this.moveDirection.x * step;
      this.player.position.z += this.moveDirection.z * step;

      // Platform boundary clamping (38x38 platform, clamp within -17.2 to 17.2)
      this.player.position.x = Math.max(-17.2, Math.min(17.2, this.player.position.x));
      this.player.position.z = Math.max(-17.2, Math.min(17.2, this.player.position.z));

      // Rotate player smoothly towards movement direction
      const targetAngle = Math.atan2(this.moveDirection.x, this.moveDirection.z);
      this.player.rotation.y = THREE.MathUtils.lerp(this.player.rotation.y, targetAngle, delta * 12);

      // Lunar Bouncy Walk Cycle
      this.walkTime += delta * 7.5;
      const bobY = Math.abs(Math.sin(this.walkTime)) * 0.12;
      this.player.position.y = 0.3 + bobY;

      // Record position breadcrumbs for follower train
      if (this.followers.length > 0) {
        const lastPos = this.trailHistory[0];
        const curPos = new THREE.Vector3(this.player.position.x, 0.3, this.player.position.z);
        if (!lastPos || lastPos.distanceTo(curPos) > 0.25) {
          this.trailHistory.unshift(curPos);
          if (this.trailHistory.length > 60) this.trailHistory.pop();
        }
      }

      // Articulated Arm & Leg Swing
      const u = this.player.userData;
      if (this.carriedItem) {
        // Carrying Pose: Both arms outstretched forward holding item with gentle walk bob
        const carryBob = Math.sin(this.walkTime) * 0.08;
        if (u.leftArm && u.rightArm) {
          u.leftArm.rotation.x = -1.25 + carryBob;
          u.leftArm.rotation.y = 0.2;
          u.leftArm.rotation.z = 0.15;
          u.rightArm.rotation.x = -1.25 + carryBob;
          u.rightArm.rotation.y = -0.2;
          u.rightArm.rotation.z = -0.15;
        }
      } else {
        // Normal walking arm swing
        if (u.leftArm && u.rightArm) {
          u.leftArm.rotation.x = Math.sin(this.walkTime) * 0.6;
          u.leftArm.rotation.y = 0;
          u.leftArm.rotation.z = 0;
          u.rightArm.rotation.x = -Math.sin(this.walkTime) * 0.6;
          u.rightArm.rotation.y = 0;
          u.rightArm.rotation.z = 0;
        }
      }

      // Legs always walk
      if (u.leftLeg && u.rightLeg) {
        u.leftLeg.rotation.x = -Math.sin(this.walkTime) * 0.55;
        u.rightLeg.rotation.x = Math.sin(this.walkTime) * 0.55;
      }
    } else {
      // Idle pose
      this.player.position.y = 0.3;
      const u = this.player.userData;
      if (this.carriedItem) {
        // Standing holding item
        if (u.leftArm && u.rightArm) {
          u.leftArm.rotation.x = THREE.MathUtils.lerp(u.leftArm.rotation.x, -1.25, delta * 8);
          u.rightArm.rotation.x = THREE.MathUtils.lerp(u.rightArm.rotation.x, -1.25, delta * 8);
        }
      } else {
        if (u.leftArm && u.rightArm) {
          u.leftArm.rotation.x = THREE.MathUtils.lerp(u.leftArm.rotation.x, 0, delta * 8);
          u.rightArm.rotation.x = THREE.MathUtils.lerp(u.rightArm.rotation.x, 0, delta * 8);
        }
      }
      if (u.leftLeg && u.rightLeg) {
        u.leftLeg.rotation.x = THREE.MathUtils.lerp(u.leftLeg.rotation.x, 0, delta * 8);
        u.rightLeg.rotation.x = THREE.MathUtils.lerp(u.rightLeg.rotation.x, 0, delta * 8);
      }
    }

    // Update Follower Train (Sol 3 Bunker Rush)
    this.updateFollowers(delta);

    // Proximity check to colony stations
    this.checkStationProximity();
  }

  updateFollowers(delta) {
    if (this.followers.length === 0) return;

    this.followers.forEach((follower, idx) => {
      const targetIndex = (idx + 1) * 8; // Offset along trail
      const targetPos = this.trailHistory[targetIndex] || this.player.position;

      // Smoothly steer follower towards target breadcrumb
      const dx = targetPos.x - follower.position.x;
      const dz = targetPos.z - follower.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > 0.4) {
        const moveStep = Math.min(dist, this.speed * delta * 1.1);
        follower.position.x += (dx / dist) * moveStep;
        follower.position.z += (dz / dist) * moveStep;

        const targetAngle = Math.atan2(dx, dz);
        follower.rotation.y = THREE.MathUtils.lerp(follower.rotation.y, targetAngle, delta * 10);

        // Follower walk bob
        follower.position.y = 0.3 + Math.abs(Math.sin(this.walkTime + idx)) * 0.1;
        const u = follower.userData;
        if (u.leftLeg && u.rightLeg) {
          u.leftLeg.rotation.x = -Math.sin(this.walkTime + idx) * 0.5;
          u.rightLeg.rotation.x = Math.sin(this.walkTime + idx) * 0.5;
        }
        if (u.leftArm && u.rightArm) {
          u.leftArm.rotation.x = Math.sin(this.walkTime + idx) * 0.5;
          u.rightArm.rotation.x = -Math.sin(this.walkTime + idx) * 0.5;
        }
      } else {
        follower.position.y = 0.3;
      }
    });
  }

  getDynamicPrompt(stationId) {
    const sol = gameState.currentDay;
    const decided = gameState.currentDayDecided;

    switch (stationId) {
      case 'solar_array':
        if (sol === 1 && !decided) return '⚡ Connect Solar Power Plugs';
        return '⚡ Photovoltaic Solar Farm (Nominal) ✅';

      case 'rover':
        return '🚜 Drive Lunar Rover & Explore';

      case 'habitat':
        if (sol === 2 && !decided) return '🔧 Repair Life-Support Pipe 💧';
        if (sol === 3 && !decided) return '☀️🚨 Enter Solar Storm Shelter';
        return '🏠 Main Habitat Hub (Nominal) ✅';

      case 'greenhouse':
        if (sol === 4 && !decided) return '🌱 Plant & Harvest Greenhouse Crops';
        return '🌱 Hydroponic Bio-Domes (Growing) ✅';

      case 'antenna':
        if (sol === 5 && !decided) return '📡 Align Earth Space Radio Dish';
        return '📡 Deep Space Dish (Locked) ✅';

      case 'research_lab':
        if (sol === 6 && !decided) return '🔬 Geological Lab (Needs Rover Ice/Parts)';
        if (sol === 7) return '🏆 Final Colony Inspection';
        return '🔬 Geological Science Lab (Nominal) ✅';

      default:
        return 'Inspect Station';
    }
  }

  checkStationProximity() {
    let closestStation = null;
    let closestDist = Infinity;

    for (const station of this.stations) {
      const dx = this.player.position.x - station.pos.x;
      const dz = this.player.position.z - station.pos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < this.interactionRadius && dist < closestDist) {
        closestDist = dist;
        closestStation = { ...station, prompt: this.getDynamicPrompt(station.id) };
      }
    }

    const hasChanged = (!this.currentNearStation && closestStation) ||
      (this.currentNearStation && !closestStation) ||
      (this.currentNearStation && closestStation && (this.currentNearStation.id !== closestStation.id || this.currentNearStation.prompt !== closestStation.prompt));

    if (hasChanged) {
      this.currentNearStation = closestStation;
      if (this.currentNearStation) {
        if (this.options.onNearStation) this.options.onNearStation(this.currentNearStation);
      } else {
        if (this.options.onLeaveStation) this.options.onLeaveStation();
      }
    }
  }

  teleport(x, z) {
    if (!this.player) return;
    this.player.position.set(x, 0.3, z);
  }
}
