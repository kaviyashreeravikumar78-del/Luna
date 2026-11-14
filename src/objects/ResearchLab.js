import * as THREE from 'three';
import { CONFIG } from '../game/config.js';

/**
 * Creates the Lunar Geological Laboratory (LAB-01)
 * Advanced geochemical and core-sample scientific analysis pod
 * @returns {THREE.Group} Research Lab 3D group
 */
export function createResearchLab() {
  const group = new THREE.Group();
  group.name = "Building_ResearchLab";
  group.userData = {
    buildingId: "research_lab",
    buildingName: "Lunar Geological Laboratory"
  };

  // Position on the right flank
  group.position.set(5.5, 0.3, 2.2);

  const whiteMat = new THREE.MeshStandardMaterial({
    color: CONFIG.colors.habitatWhite,
    roughness: 0.35,
    metalness: 0.15,
    flatShading: true,
  });

  const blueTrimMat = new THREE.MeshStandardMaterial({
    color: CONFIG.colors.labBlue,
    roughness: 0.45,
    metalness: 0.2,
  });

  const darkTrimMat = new THREE.MeshStandardMaterial({
    color: 0x303E4D,
    roughness: 0.5,
  });

  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x1A2838,
    roughness: 0.1,
    metalness: 0.9,
  });

  // 1. Foundation Plinth
  const plinthGeo = new THREE.BoxGeometry(3.6, 0.35, 3.4);
  const plinth = new THREE.Mesh(plinthGeo, darkTrimMat);
  plinth.position.y = 0.18;
  plinth.receiveShadow = true;
  plinth.castShadow = true;
  group.add(plinth);

  // 2. Main Lab Geometric Module (Angular futuristic scientific pod)
  const podGeo = new THREE.BoxGeometry(3.2, 2.2, 2.9);
  const pod = new THREE.Mesh(podGeo, whiteMat);
  pod.position.y = 1.45;
  pod.castShadow = true;
  pod.receiveShadow = true;
  group.add(pod);

  // Beveled rooftop equipment housing
  const roofBoxGeo = new THREE.BoxGeometry(2.4, 0.6, 2.0);
  const roofBox = new THREE.Mesh(roofBoxGeo, blueTrimMat);
  roofBox.position.y = 2.85;
  roofBox.castShadow = true;
  group.add(roofBox);

  // 3. Panoramic Observation Window (Front face)
  const winGeo = new THREE.BoxGeometry(2.2, 0.9, 0.15);
  const win = new THREE.Mesh(winGeo, glassMat);
  win.position.set(0, 1.6, 1.45);
  group.add(win);

  // Interior blue cleanroom glow through the window
  const interiorGlowGeo = new THREE.BoxGeometry(2.0, 0.7, 0.05);
  const interiorGlowMat = new THREE.MeshBasicMaterial({ color: 0x54A0FF });
  const interiorGlow = new THREE.Mesh(interiorGlowGeo, interiorGlowMat);
  interiorGlow.position.set(0, 1.6, 1.4);
  group.add(interiorGlow);

  // 4. Rooftop Laser Spectrometer Pylon & Optical Turret
  const turretBaseGeo = new THREE.CylinderGeometry(0.3, 0.35, 0.5, 12);
  const turretBase = new THREE.Mesh(turretBaseGeo, darkTrimMat);
  turretBase.position.set(-0.7, 3.35, -0.4);
  group.add(turretBase);

  const laserEmitterGeo = new THREE.CylinderGeometry(0.1, 0.14, 0.6, 8);
  const laserEmitter = new THREE.Mesh(laserEmitterGeo, blueTrimMat);
  laserEmitter.rotation.z = Math.PI / 4;
  laserEmitter.position.set(-0.7, 3.7, -0.4);
  group.add(laserEmitter);

  // 5. Specimen Ingestion Air-Chamber (Right wall)
  const chamberGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.8, 12);
  const chamber = new THREE.Mesh(chamberGeo, darkTrimMat);
  chamber.rotation.z = Math.PI / 2;
  chamber.position.set(1.7, 1.2, 0);
  group.add(chamber);

  // 6. Cryogenic Coolant Tanks on the Rear
  [-0.6, 0.6].forEach(x => {
    const tankGeo = new THREE.CylinderGeometry(0.28, 0.28, 1.4, 12);
    const tank = new THREE.Mesh(tankGeo, blueTrimMat);
    tank.position.set(x, 1.4, -1.6);
    tank.castShadow = true;
    group.add(tank);
  });

  // Tag all meshes
  group.traverse(child => {
    if (child.isMesh) {
      child.userData = group.userData;
    }
  });

  return group;
}
