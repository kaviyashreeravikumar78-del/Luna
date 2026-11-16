import * as THREE from 'three';
import { CONFIG } from '../game/config.js';

/**
 * Creates the cinematic lighting setup for the lunar colony
 * @param {THREE.Scene} scene 
 * @returns {Object} References to dynamic lights for animation
 */
export function createLighting(scene) {
  // Ambient base light - deep space fill
  const ambientLight = new THREE.AmbientLight(0x2A4060, 1.2);
  scene.add(ambientLight);

  // Hemisphere light: cool navy space above, warm orange bounce from lunar surface below
  const hemiLight = new THREE.HemisphereLight(0x102C49, 0xD95736, 0.7);
  hemiLight.position.set(0, 50, 0);
  scene.add(hemiLight);

  // Primary Sun Light - strong low-angle lunar sunlight casting shadows
  const sunLight = new THREE.DirectionalLight(0xFFF6E5, 2.8);
  sunLight.position.set(24, 32, 18);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 1024;
  sunLight.shadow.mapSize.height = 1024;
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 100;
  
  const d = 30;
  sunLight.shadow.camera.left = -d;
  sunLight.shadow.camera.right = d;
  sunLight.shadow.camera.top = d;
  sunLight.shadow.camera.bottom = -d;
  sunLight.shadow.bias = -0.0005;
  sunLight.shadow.normalBias = 0.02;
  scene.add(sunLight);

  // Soft secondary rim light (Earthshine) from the opposite side
  const earthshine = new THREE.DirectionalLight(0x4A78A6, 0.8);
  earthshine.position.set(-20, 15, -20);
  scene.add(earthshine);

  // Blinking Antenna Beacon Point Light
  const antennaBeacon = new THREE.PointLight(CONFIG.colors.beaconRed, 0, 8);
  antennaBeacon.position.set(5.2, 4.8, -5.5);
  scene.add(antennaBeacon);

  // Habitat Entrance Porch Light
  const habitatLight = new THREE.PointLight(0x70C4FF, 1.5, 6);
  habitatLight.position.set(0, 2.2, 2.6);
  scene.add(habitatLight);

  // Greenhouse 1 Interior Glow Light
  const ghLight1 = new THREE.PointLight(0x8EE5A2, 2.0, 9);
  ghLight1.position.set(-6.5, 2.2, 0);
  scene.add(ghLight1);

  // Greenhouse 2 Interior Glow Light
  const ghLight2 = new THREE.PointLight(0x8EE5A2, 2.0, 9);
  ghLight2.position.set(5.5, 2.2, -1.0);
  scene.add(ghLight2);

  return {
    ambientLight,
    hemiLight,
    sunLight,
    earthshine,
    antennaBeacon,
    habitatLight,
    ghLight1,
    ghLight2,
  };
}
