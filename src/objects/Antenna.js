import * as THREE from 'three';
import { CONFIG } from '../game/config.js';

/**
 * Creates the Deep Space Uplink Terminal Antenna
 * Matches the elevated parabolic dish behind the habitat from reference image
 * @returns {THREE.Group} Antenna 3D group
 */
export function createAntenna() {
  const group = new THREE.Group();
  group.name = "Building_Antenna";
  group.userData = {
    buildingId: "antenna",
    buildingName: "Deep Space Uplink Terminal"
  };

  // Position atop the dedicated rocky terrace (fully visible and unobstructed)
  group.position.set(5.2, 1.8, -5.5);

  const whiteMat = new THREE.MeshStandardMaterial({
    color: CONFIG.colors.habitatWhite,
    roughness: 0.35,
    metalness: 0.2,
    flatShading: true,
  });

  const silverMat = new THREE.MeshStandardMaterial({
    color: CONFIG.colors.antennaSilver,
    roughness: 0.4,
    metalness: 0.75,
  });

  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x2A3545,
    roughness: 0.6,
  });

  // 1. Elevated Equipment Pedestal
  const pedestalGeo = new THREE.BoxGeometry(1.6, 1.2, 1.6);
  const pedestal = new THREE.Mesh(pedestalGeo, whiteMat);
  pedestal.position.y = 0.6;
  pedestal.castShadow = true;
  pedestal.receiveShadow = true;
  group.add(pedestal);

  // Stepped base rim
  const baseTrimGeo = new THREE.BoxGeometry(1.9, 0.2, 1.9);
  const baseTrim = new THREE.Mesh(baseTrimGeo, darkMat);
  baseTrim.position.y = 0.1;
  baseTrim.receiveShadow = true;
  group.add(baseTrim);

  // 2. Swivel Mast & Motor Turret (Rotating section)
  const rotatingGroup = new THREE.Group();
  rotatingGroup.position.y = 1.2;

  const mastGeo = new THREE.CylinderGeometry(0.18, 0.24, 1.2, 12);
  const mast = new THREE.Mesh(mastGeo, silverMat);
  mast.position.y = 0.6;
  mast.castShadow = true;
  rotatingGroup.add(mast);

  const gimbalGeo = new THREE.SphereGeometry(0.3, 12, 12);
  const gimbal = new THREE.Mesh(gimbalGeo, darkMat);
  gimbal.position.y = 1.2;
  rotatingGroup.add(gimbal);

  // 3. Parabolic Dish Assembly (Tilted towards sky/Earth)
  const dishAssembly = new THREE.Group();
  dishAssembly.position.y = 1.35;
  dishAssembly.rotation.x = -Math.PI * 0.28; // Tilted elevation angle
  dishAssembly.rotation.z = Math.PI * 0.08;

  // Parabolic Bowl (Inverted dome with curved walls)
  const dishGeo = new THREE.SphereGeometry(1.7, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.38);
  const dishMat = new THREE.MeshStandardMaterial({
    color: 0xDFE6EE,
    roughness: 0.3,
    metalness: 0.4,
    side: THREE.DoubleSide,
  });
  const dish = new THREE.Mesh(dishGeo, dishMat);
  dish.rotation.x = Math.PI; // Concave facing outward
  dish.castShadow = true;
  dishAssembly.add(dish);

  // Central Feed Horn Support Struts (Tripod)
  const strutMat = new THREE.MeshStandardMaterial({ color: 0x5C6D82 });
  for (let s = 0; s < 3; s++) {
    const angle = (s * Math.PI * 2) / 3;
    const strutGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.4, 6);
    const strut = new THREE.Mesh(strutGeo, strutMat);
    strut.position.set(Math.cos(angle) * 0.6, Math.sin(angle) * 0.6, 0.65);
    strut.rotation.x = Math.PI / 4;
    strut.rotation.y = angle;
    dishAssembly.add(strut);
  }

  // Feed Horn Receptor Tip
  const feedGeo = new THREE.ConeGeometry(0.12, 0.35, 12);
  const feedMat = new THREE.MeshStandardMaterial({
    color: 0xFFB703,
    metalness: 0.8,
  });
  const feed = new THREE.Mesh(feedGeo, feedMat);
  feed.rotation.x = -Math.PI / 2;
  feed.position.set(0, 0, 1.15);
  dishAssembly.add(feed);

  // 4. Blinking Beacon LED atop the mast
  const beaconGeo = new THREE.SphereGeometry(0.1, 8, 8);
  const beaconMat = new THREE.MeshBasicMaterial({ color: CONFIG.colors.beaconRed });
  const beacon = new THREE.Mesh(beaconGeo, beaconMat);
  beacon.position.set(0, 1.6, 0);
  dishAssembly.add(beacon);

  rotatingGroup.add(dishAssembly);
  group.add(rotatingGroup);

  // Tag all meshes
  group.traverse(child => {
    if (child.isMesh) {
      child.userData = group.userData;
    }
  });

  group.userData.rotatingHead = rotatingGroup;
  group.userData.beaconMesh = beacon;
  group.userData.beaconMaterial = beaconMat;

  return group;
}
