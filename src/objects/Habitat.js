import * as THREE from 'three';
import { CONFIG } from '../game/config.js';

/**
 * Creates the primary astronaut Habitat Hub (HAB-01)
 * Matches the tall white central module with cupola window and elevated legs from reference image
 * @returns {THREE.Group} Habitat 3D group
 */
export function createHabitat() {
  const group = new THREE.Group();
  group.name = "Building_Habitat";
  group.userData = {
    buildingId: "habitat",
    buildingName: "Main Habitat Hub (HAB-01)"
  };

  // Center position at the rear-middle of the platform
  group.position.set(0, 0, -2.5);

  const whiteMat = new THREE.MeshStandardMaterial({
    color: CONFIG.colors.habitatWhite,
    roughness: 0.35,
    metalness: 0.15,
    flatShading: true,
  });

  const trimMat = new THREE.MeshStandardMaterial({
    color: CONFIG.colors.habitatTrim,
    roughness: 0.5,
    metalness: 0.3,
  });

  const darkGlassMat = new THREE.MeshStandardMaterial({
    color: 0x141B26,
    roughness: 0.1,
    metalness: 0.9,
  });

  const silverMat = new THREE.MeshStandardMaterial({
    color: 0xD0D7DE,
    roughness: 0.4,
    metalness: 0.8,
  });

  // 1. Main Cylindrical Pod Body
  const bodyGeo = new THREE.CylinderGeometry(2.4, 2.7, 5.0, 24);
  const body = new THREE.Mesh(bodyGeo, whiteMat);
  body.position.y = 4.5;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // 2. Conical Top Cap / Roof Dome
  const roofGeo = new THREE.CylinderGeometry(1.8, 2.4, 1.2, 24);
  const roof = new THREE.Mesh(roofGeo, whiteMat);
  roof.position.y = 7.6;
  roof.castShadow = true;
  roof.receiveShadow = true;
  group.add(roof);

  const roofTopGeo = new THREE.CylinderGeometry(1.7, 1.8, 0.3, 24);
  const roofTop = new THREE.Mesh(roofTopGeo, trimMat);
  roofTop.position.y = 8.35;
  roofTop.castShadow = true;
  group.add(roofTop);

  // 3. Bottom Base Plate
  const baseRingGeo = new THREE.CylinderGeometry(2.75, 2.75, 0.4, 24);
  const baseRing = new THREE.Mesh(baseRingGeo, trimMat);
  baseRing.position.y = 2.0;
  baseRing.castShadow = true;
  group.add(baseRing);

  // 4. Heavy Foundation Legs / Struts (elevating the habitat off regolith)
  const legPositions = [
    { x: -2.3, z: -1.5, rotZ: 0.15, rotX: -0.1 },
    { x: 2.3, z: -1.5, rotZ: -0.15, rotX: -0.1 },
    { x: -2.1, z: 1.8, rotZ: 0.15, rotX: 0.15 },
    { x: 2.1, z: 1.8, rotZ: -0.15, rotX: 0.15 },
  ];

  legPositions.forEach(p => {
    const legGeo = new THREE.CylinderGeometry(0.18, 0.26, 2.4, 8);
    const leg = new THREE.Mesh(legGeo, silverMat);
    leg.position.set(p.x, 1.0, p.z);
    leg.rotation.z = p.rotZ;
    leg.rotation.x = p.rotX;
    leg.castShadow = true;
    group.add(leg);

    // Foot pad
    const padGeo = new THREE.CylinderGeometry(0.45, 0.55, 0.15, 8);
    const pad = new THREE.Mesh(padGeo, trimMat);
    pad.position.set(p.x * 1.12, 0.1, p.z * 1.12);
    pad.receiveShadow = true;
    group.add(pad);
  });

  // 5. Dark Oval Observation Cupola Window (prominent front feature from reference)
  const windowGeo = new THREE.CylinderGeometry(0.85, 0.85, 0.25, 24);
  const win = new THREE.Mesh(windowGeo, darkGlassMat);
  win.rotation.x = Math.PI / 2;
  win.position.set(0.9, 4.2, 2.35);
  win.scale.set(1.0, 1.0, 1.35); // Slight oval
  group.add(win);

  // Window frame ring
  const winFrameGeo = new THREE.TorusGeometry(0.9, 0.08, 8, 24);
  const winFrame = new THREE.Mesh(winFrameGeo, trimMat);
  winFrame.position.set(0.9, 4.2, 2.4);
  group.add(winFrame);

  // 6. Airlock Access Port (Front Left lower body)
  const airlockGroup = new THREE.Group();
  airlockGroup.position.set(-0.8, 2.6, 2.2);

  const doorFrameGeo = new THREE.BoxGeometry(1.2, 1.6, 0.5);
  const doorFrame = new THREE.Mesh(doorFrameGeo, trimMat);
  doorFrame.castShadow = true;
  airlockGroup.add(doorFrame);

  const doorHatchGeo = new THREE.BoxGeometry(0.8, 1.3, 0.2);
  const doorHatchMat = new THREE.MeshStandardMaterial({
    color: 0x3F5E8A,
    roughness: 0.4,
  });
  const doorHatch = new THREE.Mesh(doorHatchGeo, doorHatchMat);
  doorHatch.position.z = 0.2;
  airlockGroup.add(doorHatch);

  // Airlock status indicator light (Green = sealed & nominal)
  const statusLightGeo = new THREE.SphereGeometry(0.08, 8, 8);
  const statusLightMat = new THREE.MeshBasicMaterial({ color: 0x00FF88 });
  const statusLight = new THREE.Mesh(statusLightGeo, statusLightMat);
  statusLight.position.set(0, 0.7, 0.3);
  airlockGroup.add(statusLight);

  group.add(airlockGroup);

  // 7. Access Steps from Airlock to Regolith Ground
  for (let s = 0; s < 4; s++) {
    const stepGeo = new THREE.BoxGeometry(1.4, 0.2, 0.45);
    const step = new THREE.Mesh(stepGeo, trimMat);
    step.position.set(-0.8, 1.5 - s * 0.38, 2.8 + s * 0.4);
    step.castShadow = true;
    step.receiveShadow = true;
    group.add(step);
  }

  // 8. Pressurized Connection Tunnel Tube leading toward left greenhouse
  const tunnelGeo = new THREE.CylinderGeometry(0.65, 0.65, 3.2, 16);
  const tunnel = new THREE.Mesh(tunnelGeo, whiteMat);
  tunnel.rotation.z = Math.PI / 2;
  tunnel.position.set(-3.2, 2.6, 0.2);
  tunnel.castShadow = true;
  group.add(tunnel);

  // Tunnel rib rings
  for (let r = 0; r < 3; r++) {
    const ribGeo = new THREE.TorusGeometry(0.72, 0.06, 8, 16);
    const rib = new THREE.Mesh(ribGeo, trimMat);
    rib.rotation.y = Math.PI / 2;
    rib.position.set(-2.2 - r * 1.0, 2.6, 0.2);
    group.add(rib);
  }

  // Attach interactive raycasting metadata to all children meshes
  group.traverse(child => {
    if (child.isMesh) {
      child.userData = group.userData;
    }
  });

  return group;
}
