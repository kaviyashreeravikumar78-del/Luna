import * as THREE from 'three';
import { CONFIG } from '../game/config.js';

/**
 * Creates the LUNA Surface Rover-01 (Pathfinder)
 * Matches the 6-wheel vehicle with solar panel wings from reference image
 * @returns {THREE.Group} Rover 3D group
 */
export function createLunarRover() {
  const group = new THREE.Group();
  group.name = "Building_Rover";
  group.userData = {
    buildingId: "rover",
    buildingName: "LUNA Surface Rover-01 (Pathfinder)"
  };

  // Position in the front-center courtyard area
  group.position.set(0.2, 0.45, 6.2);
  group.rotation.y = -Math.PI * 0.15; // Angled attractively

  const bodyMat = new THREE.MeshStandardMaterial({
    color: CONFIG.colors.roverWhite,
    roughness: 0.35,
    metalness: 0.2,
    flatShading: true,
  });

  const chassisMat = new THREE.MeshStandardMaterial({
    color: 0x333A42,
    roughness: 0.7,
    metalness: 0.5,
  });

  const wheelMat = new THREE.MeshStandardMaterial({
    color: CONFIG.colors.roverTire,
    roughness: 0.85,
    metalness: 0.1,
  });

  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xD0D7DE,
    roughness: 0.3,
    metalness: 0.8,
  });

  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x1A2838,
    roughness: 0.1,
    metalness: 0.9,
  });

  const solarWingMat = new THREE.MeshStandardMaterial({
    color: CONFIG.colors.solarPanelBlue,
    roughness: 0.25,
    metalness: 0.7,
  });

  // 1. Chassis Underbody
  const chassisGeo = new THREE.BoxGeometry(1.6, 0.25, 2.2);
  const chassis = new THREE.Mesh(chassisGeo, chassisMat);
  chassis.position.y = 0.35;
  chassis.castShadow = true;
  group.add(chassis);

  // 2. Cabin / Main Shell
  const cabinGeo = new THREE.BoxGeometry(1.4, 0.9, 1.4);
  const cabin = new THREE.Mesh(cabinGeo, bodyMat);
  cabin.position.set(0, 0.85, -0.15);
  cabin.castShadow = true;
  group.add(cabin);

  // Front Windshield (tilted dark glass)
  const windshieldGeo = new THREE.BoxGeometry(1.2, 0.55, 0.1);
  const windshield = new THREE.Mesh(windshieldGeo, glassMat);
  windshield.position.set(0, 0.95, 0.56);
  windshield.rotation.x = -Math.PI * 0.1;
  group.add(windshield);

  // 3. Six In-Hub Drive Wheels (3 on left, 3 on right)
  const wheelRadius = 0.28;
  const wheelWidth = 0.22;
  const wheelGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 16);
  const rimGeo = new THREE.CylinderGeometry(wheelRadius * 0.6, wheelRadius * 0.6, wheelWidth + 0.02, 12);

  const wheelPositions = [
    // Left side
    { x: -0.92, z: -0.75 },
    { x: -0.92, z: 0.0 },
    { x: -0.92, z: 0.75 },
    // Right side
    { x: 0.92, z: -0.75 },
    { x: 0.92, z: 0.0 },
    { x: 0.92, z: 0.75 },
  ];

  const wheels = [];
  wheelPositions.forEach(p => {
    const wGroup = new THREE.Group();
    wGroup.position.set(p.x, wheelRadius, p.z);

    const tire = new THREE.Mesh(wheelGeo, wheelMat);
    tire.rotation.z = Math.PI / 2;
    tire.castShadow = true;
    wGroup.add(tire);

    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.z = Math.PI / 2;
    wGroup.add(rim);

    // Suspension axle arm connecting wheel to chassis
    const axleGeo = new THREE.BoxGeometry(0.12, 0.1, 0.12);
    const axle = new THREE.Mesh(axleGeo, chassisMat);
    axle.position.x = p.x > 0 ? -0.12 : 0.12;
    wGroup.add(axle);

    group.add(wGroup);
    wheels.push(tire);
  });

  // 4. Dual Solar Panel "Wings" (Prominent signature feature from reference image)
  // Left solar wing
  const wingLeft = new THREE.Group();
  wingLeft.position.set(-1.15, 0.75, -0.6);
  wingLeft.rotation.z = Math.PI * 0.12; // Angled outward
  const wingGeo = new THREE.BoxGeometry(1.0, 0.04, 0.7);
  const wingLeftMesh = new THREE.Mesh(wingGeo, solarWingMat);
  wingLeftMesh.castShadow = true;
  wingLeft.add(wingLeftMesh);
  group.add(wingLeft);

  // Right solar wing
  const wingRight = new THREE.Group();
  wingRight.position.set(1.15, 0.75, -0.6);
  wingRight.rotation.z = -Math.PI * 0.12;
  const wingRightMesh = new THREE.Mesh(wingGeo, solarWingMat);
  wingRightMesh.castShadow = true;
  wingRight.add(wingRightMesh);
  group.add(wingRight);

  // 5. Rooftop Mast & Science Sensor Turret
  const mastGeo = new THREE.CylinderGeometry(0.03, 0.04, 0.6, 8);
  const mast = new THREE.Mesh(mastGeo, chassisMat);
  mast.position.set(0.35, 1.6, -0.3);
  group.add(mast);

  const camHeadGeo = new THREE.BoxGeometry(0.22, 0.12, 0.16);
  const camHead = new THREE.Mesh(camHeadGeo, chassisMat);
  camHead.position.set(0.35, 1.9, -0.3);
  group.add(camHead);

  // 6. Dual LED Headlights & Subtle Light Cones
  const lightGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.1, 8);
  const lightMat = new THREE.MeshBasicMaterial({ color: 0xFFFBE6 });

  [-0.45, 0.45].forEach(x => {
    const headlamp = new THREE.Mesh(lightGeo, lightMat);
    headlamp.rotation.x = Math.PI / 2;
    headlamp.position.set(x, 0.45, 1.12);
    group.add(headlamp);

    // Subtle volumetric beam cone
    const beamGeo = new THREE.ConeGeometry(0.65, 2.2, 12, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xFFFBE6,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.rotation.x = -Math.PI / 2;
    beam.position.set(x, 0.45, 2.15);
    group.add(beam);
  });

  // Tag all meshes
  group.traverse(child => {
    if (child.isMesh) {
      child.userData = group.userData;
    }
  });

  group.userData.wheels = wheels;
  return group;
}
