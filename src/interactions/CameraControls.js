import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CONFIG } from '../game/config.js';

/**
 * Sets up and manages smooth camera navigation, boundaries, and animated transitions
 */
export class ColonyCameraManager {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;

    this.defaultPos = new THREE.Vector3(
      CONFIG.camera.defaultPos.x,
      CONFIG.camera.defaultPos.y,
      CONFIG.camera.defaultPos.z
    );
    this.defaultTarget = new THREE.Vector3(
      CONFIG.camera.defaultTarget.x,
      CONFIG.camera.defaultTarget.y,
      CONFIG.camera.defaultTarget.z
    );

    this.initControls();

    // Animation transition state
    this.isTransitioning = false;
    this.transitionStart = 0;
    this.transitionDuration = 1000;
    this.startCamPos = new THREE.Vector3();
    this.targetCamPos = new THREE.Vector3();
    this.startLookAt = new THREE.Vector3();
    this.targetLookAt = new THREE.Vector3();
  }

  initControls() {
    this.controls = new OrbitControls(this.camera, this.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;

    // Strict angle and distance constraints to prevent underground clipping
    this.controls.minDistance = CONFIG.camera.minDistance;
    this.controls.maxDistance = CONFIG.camera.maxDistance;
    this.controls.minPolarAngle = CONFIG.camera.minPolarAngle;
    this.controls.maxPolarAngle = CONFIG.camera.maxPolarAngle;

    this.controls.target.copy(this.defaultTarget);
    this.camera.position.copy(this.defaultPos);
    this.controls.update();
  }

  /**
   * Smoothly tweens camera position and lookAt target
   */
  flyTo(pos, lookAt, duration = 1200, onComplete = null) {
    this.isTransitioning = true;
    this.transitionStart = performance.now();
    this.transitionDuration = duration;
    this.onTransitionComplete = onComplete;

    this.startCamPos.copy(this.camera.position);
    this.targetCamPos.set(pos.x, pos.y, pos.z);

    this.startLookAt.copy(this.controls.target);
    this.targetLookAt.set(lookAt.x, lookAt.y, lookAt.z);

    this.controls.enabled = false;
  }

  /**
   * Resets camera to default perspective overview
   */
  reset(duration = 1000) {
    this.flyTo(this.defaultPos, this.defaultTarget, duration);
  }

  /**
   * Update called every animation frame
   */
  update() {
    if (this.isTransitioning) {
      const now = performance.now();
      const elapsed = now - this.transitionStart;
      const progress = Math.min(elapsed / this.transitionDuration, 1.0);

      // Smooth ease-in-out cubic curve
      const t = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      this.camera.position.lerpVectors(this.startCamPos, this.targetCamPos, t);
      this.controls.target.lerpVectors(this.startLookAt, this.targetLookAt, t);

      if (progress >= 1.0) {
        this.isTransitioning = false;
        this.controls.enabled = true;
        if (this.onTransitionComplete) {
          this.onTransitionComplete();
          this.onTransitionComplete = null;
        }
      }
    } else {
      this.controls.update();
    }
  }
}
