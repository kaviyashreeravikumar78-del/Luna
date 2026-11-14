import * as THREE from 'three';
import { CONFIG } from '../game/config.js';

/**
 * Creates the friendly 3D floating robot ORBIT
 * @returns {THREE.Group} Orbit robot 3D group with animation handles
 */
export function createOrbitRobot() {
  const group = new THREE.Group();
  group.name = "Assistant_ORBIT";
  group.userData = {
    isOrbit: true,
    hoverOffset: 0,
    targetPosition: new THREE.Vector3(2.5, 3.2, 5.0),
  };

  group.position.set(2.5, 3.2, 5.0);

  const whiteMat = new THREE.MeshStandardMaterial({
    color: CONFIG.colors.orbitBody,
    roughness: 0.25,
    metalness: 0.2,
  });

  const blueMat = new THREE.MeshStandardMaterial({
    color: 0x2A75D3,
    roughness: 0.35,
    metalness: 0.3,
  });

  const visorMat = new THREE.MeshStandardMaterial({
    color: 0x0E1724,
    roughness: 0.1,
    metalness: 0.95,
  });

  const eyeMat = new THREE.MeshBasicMaterial({
    color: CONFIG.colors.orbitEye,
  });

  // 1. Spherical Floating Body
  const bodyGeo = new THREE.SphereGeometry(0.55, 24, 24);
  const body = new THREE.Mesh(bodyGeo, whiteMat);
  body.castShadow = true;
  group.add(body);

  // 2. Head Visor Screen (Glossy dark glass curved visor)
  const visorGeo = new THREE.CylinderGeometry(0.38, 0.42, 0.32, 24, 1, false, 0, Math.PI);
  const visor = new THREE.Mesh(visorGeo, visorMat);
  visor.rotation.y = -Math.PI / 2;
  visor.position.set(0, 0.05, 0.28);
  group.add(visor);

  // 3. Glowing Cyan Animated Eyes (Dual glowing oblongs)
  [-0.14, 0.14].forEach(x => {
    const eyeGeo = new THREE.CapsuleGeometry(0.045, 0.08, 8, 8);
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.rotation.z = Math.PI / 2;
    eye.position.set(x, 0.08, 0.52);
    group.add(eye);
  });

  // 4. Equatorial Ring Accent (Blue futuristic stripe)
  const ringGeo = new THREE.TorusGeometry(0.56, 0.035, 8, 32);
  const ring = new THREE.Mesh(ringGeo, blueMat);
  ring.rotation.x = Math.PI / 2;
  group.add(ring);

  // 5. Dual Floating Thruster Pods / Ear Antennae
  [-0.62, 0.62].forEach((x, idx) => {
    const podGroup = new THREE.Group();
    podGroup.position.set(x, 0.05, 0);

    const podGeo = new THREE.SphereGeometry(0.18, 12, 12);
    const pod = new THREE.Mesh(podGeo, whiteMat);
    podGroup.add(pod);

    const finGeo = new THREE.BoxGeometry(0.04, 0.32, 0.16);
    const fin = new THREE.Mesh(finGeo, blueMat);
    fin.position.x = idx === 0 ? -0.1 : 0.1;
    podGroup.add(fin);

    // Thruster glow bottom
    const nozzleGeo = new THREE.CylinderGeometry(0.06, 0.09, 0.1, 8);
    const nozzleMat = new THREE.MeshBasicMaterial({ color: 0x00E5FF });
    const nozzle = new THREE.Mesh(nozzleGeo, nozzleMat);
    nozzle.position.y = -0.16;
    podGroup.add(nozzle);

    group.add(podGroup);
  });

  // 6. Rooftop Communication Antenna
  const mastGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8);
  const mast = new THREE.Mesh(mastGeo, blueMat);
  mast.position.y = 0.65;
  group.add(mast);

  const tipGeo = new THREE.SphereGeometry(0.06, 8, 8);
  const tipMat = new THREE.MeshBasicMaterial({ color: 0x00E5FF });
  const tip = new THREE.Mesh(tipGeo, tipMat);
  tip.position.y = 0.82;
  group.add(tip);

  // 7. Subtle Underbody Gravity Levitation Light
  const levLight = new THREE.PointLight(0x00E5FF, 1.2, 3);
  levLight.position.set(0, -0.4, 0);
  group.add(levLight);

  return group;
}
