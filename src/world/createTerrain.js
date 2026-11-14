import * as THREE from 'three';
import { CONFIG } from '../game/config.js';

/**
 * Creates the expanded stylized 3D lunar platform, craters, rocks, tracks, and backdrop cliffs
 * @param {THREE.Scene} scene 
 * @returns {THREE.Group} Terrain group
 */
export function createTerrain(scene) {
  const terrainGroup = new THREE.Group();
  terrainGroup.name = "Terrain_Environment";

  const { width, depth, height } = CONFIG.platform; // 38 x 38 x 4.0

  // 1. Base Platform - Main Floating Regolith Block
  // Top layer (Lunar orange regolith with rolling micro-hills)
  const topGeo = new THREE.BoxGeometry(width, 0.7, depth, 32, 1, 32);
  const pos = topGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    if (pos.getY(i) > 0.1) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      // Gentle slope / dune rolling variation across the expanded surface
      const wave1 = Math.sin(x * 0.25) * Math.cos(z * 0.25) * 0.12;
      const wave2 = Math.sin(x * 0.5 + 1.2) * Math.cos(z * 0.45) * 0.06;
      pos.setY(i, pos.getY(i) + wave1 + wave2);
    }
  }
  topGeo.computeVertexNormals();

  const topMat = new THREE.MeshStandardMaterial({
    color: CONFIG.colors.lunarOrange,
    roughness: 0.88,
    metalness: 0.05,
    flatShading: true,
  });
  const platformTop = new THREE.Mesh(topGeo, topMat);
  platformTop.position.y = 0;
  platformTop.receiveShadow = true;
  terrainGroup.add(platformTop);

  // Sub-surface Bedrock Base (dark reddish-brown faceted sides)
  const baseGeo = new THREE.BoxGeometry(width * 0.985, height, depth * 0.985);
  const baseMat = new THREE.MeshStandardMaterial({
    color: CONFIG.colors.lunarBedrock,
    roughness: 0.92,
    metalness: 0.08,
    flatShading: true,
  });
  const platformBase = new THREE.Mesh(baseGeo, baseMat);
  platformBase.position.y = -height / 2;
  platformBase.receiveShadow = true;
  terrainGroup.add(platformBase);

  // Beveled outer collar trim
  const collarGeo = new THREE.BoxGeometry(width + 0.4, 0.45, depth + 0.4);
  const collarMat = new THREE.MeshStandardMaterial({
    color: CONFIG.colors.lunarDark,
    roughness: 0.85,
    metalness: 0.1,
    flatShading: true,
  });
  const collar = new THREE.Mesh(collarGeo, collarMat);
  collar.position.y = -0.32;
  collar.receiveShadow = true;
  terrainGroup.add(collar);

  // 2. Rear Low-Poly Rocky Ridge / Cliffs & Mountain Backdrop
  const rockMaterial = new THREE.MeshStandardMaterial({
    color: CONFIG.colors.coral,
    roughness: 0.85,
    metalness: 0.08,
    flatShading: true,
  });

  const cliffPositions = [
    // Flat foundation terrace directly supporting the Space Radio Dish at x: 5.2, z: -5.5
    { x: 5.2, y: 0.8, z: -5.5, scale: [3.2, 1.8, 3.0], rotY: 0.2 },
    // Rear mountain ridges pushed back behind the antenna so the dish is 100% visible
    { x: 5.8, y: 3.2, z: -9.8, scale: [4.4, 7.5, 3.8], rotY: 0.8 },
    { x: 2.8, y: 3.5, z: -10.5, scale: [4.8, 8.0, 4.4], rotY: 0.3 },
    { x: -2.5, y: 3.0, z: -11.0, scale: [4.2, 6.8, 3.8], rotY: 0.7 },
    { x: 8.8, y: 3.2, z: -9.5, scale: [4.2, 7.0, 4.0], rotY: 1.1 },
    { x: 11.8, y: 2.2, z: -6.8, scale: [3.5, 4.8, 3.2], rotY: 0.4 },
    { x: -6.2, y: 2.2, z: -11.0, scale: [3.4, 4.5, 3.0], rotY: 0.8 },
    // Expanded outer rear cliff wall (Z: -12 to -17)
    { x: -12.5, y: 3.8, z: -14.5, scale: [5.2, 8.5, 4.5], rotY: 0.5 },
    { x: -16.0, y: 3.2, z: -13.0, scale: [4.5, 7.2, 4.2], rotY: 1.2 },
    { x: -8.5, y: 4.2, z: -15.5, scale: [5.0, 9.0, 4.8], rotY: 0.2 },
    { x: 0.0, y: 4.5, z: -16.0, scale: [5.5, 9.5, 5.0], rotY: 0.6 },
    { x: 7.5, y: 4.0, z: -15.5, scale: [5.0, 8.8, 4.6], rotY: 0.9 },
    { x: 13.5, y: 3.5, z: -14.0, scale: [4.8, 7.8, 4.4], rotY: 0.4 },
    { x: 16.5, y: 2.8, z: -11.5, scale: [4.2, 6.2, 3.8], rotY: 1.3 },
    // Flanking side ridges (East & West edges)
    { x: -17.0, y: 2.2, z: -4.5, scale: [3.6, 5.0, 4.2], rotY: 0.4 },
    { x: -16.5, y: 1.8, z: 2.0, scale: [3.2, 4.2, 3.5], rotY: 0.9 },
    { x: 16.5, y: 2.4, z: -2.0, scale: [3.8, 5.2, 3.8], rotY: 0.7 },
    { x: 16.0, y: 1.9, z: 6.5, scale: [3.4, 4.4, 3.4], rotY: 0.3 },
  ];

  cliffPositions.forEach(cfg => {
    const cliffGeo = new THREE.DodecahedronGeometry(1, 1);
    const cliff = new THREE.Mesh(cliffGeo, rockMaterial);
    cliff.position.set(cfg.x, cfg.y, cfg.z);
    cliff.scale.set(...cfg.scale);
    cliff.rotation.y = cfg.rotY;
    cliff.rotation.x = 0.15;
    cliff.castShadow = true;
    cliff.receiveShadow = true;
    terrainGroup.add(cliff);
  });

  // 3. Low-Poly Boulders & Rocks scattered across the expanded platform
  const smallRockMat = new THREE.MeshStandardMaterial({
    color: 0xC45133,
    roughness: 0.9,
    flatShading: true,
  });

  const darkBasaltMat = new THREE.MeshStandardMaterial({
    color: 0x8A321E,
    roughness: 0.92,
    flatShading: true,
  });

  const rocks = [
    // Central courtyard rocks
    { x: -2.5, y: 0.4, z: 2.5, s: 0.45, mat: smallRockMat },
    { x: -3.8, y: 0.35, z: 7.2, s: 0.5, mat: smallRockMat },
    { x: 3.6, y: 0.35, z: 4.8, s: 0.4, mat: smallRockMat },
    { x: 2.8, y: 0.3, z: 6.8, s: 0.35, mat: darkBasaltMat },
    { x: 7.2, y: 0.35, z: -1.2, s: 0.4, mat: smallRockMat },
    // Expanded perimeter rock clusters
    { x: -14.2, y: 0.4, z: 14.5, s: 0.65, mat: darkBasaltMat },
    { x: -15.5, y: 0.35, z: 12.8, s: 0.45, mat: smallRockMat },
    { x: -8.8, y: 0.3, z: 15.2, s: 0.55, mat: smallRockMat },
    { x: 11.2, y: 0.35, z: 15.5, s: 0.5, mat: smallRockMat },
    { x: 15.5, y: 0.4, z: 13.8, s: 0.6, mat: darkBasaltMat },
    { x: 14.8, y: 0.35, z: 1.5, s: 0.45, mat: smallRockMat },
    { x: -15.2, y: 0.35, z: -8.5, s: 0.55, mat: darkBasaltMat },
    { x: 12.5, y: 0.35, z: -9.5, s: 0.5, mat: smallRockMat },
    { x: -1.5, y: 0.35, z: 16.5, s: 0.4, mat: smallRockMat },
    { x: 5.5, y: 0.35, z: 16.2, s: 0.45, mat: darkBasaltMat },
  ];

  rocks.forEach(r => {
    const geo = new THREE.DodecahedronGeometry(r.s, 0);
    const mesh = new THREE.Mesh(geo, r.mat);
    mesh.position.set(r.x, r.y, r.z);
    mesh.rotation.set(r.x * 2, r.z * 1.5, r.y * 3);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    terrainGroup.add(mesh);
  });

  // 4. Multiple Realistic Craters
  const createCrater = (x, z, radius) => {
    const craterGroup = new THREE.Group();
    craterGroup.position.set(x, 0.33, z);

    // Outer rim (flattened torus)
    const rimGeo = new THREE.TorusGeometry(radius, radius * 0.28, 6, 16);
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0xBA462A,
      roughness: 0.95,
      flatShading: true,
    });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.x = Math.PI / 2;
    rim.scale.set(1, 1, 0.35);
    rim.receiveShadow = true;
    craterGroup.add(rim);

    // Inner shadow floor
    const floorGeo = new THREE.CircleGeometry(radius * 0.85, 12);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x782715,
      roughness: 1.0,
      flatShading: true,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.05;
    floor.receiveShadow = true;
    craterGroup.add(floor);

    terrainGroup.add(craterGroup);
  };

  // Original & Expanded Craters across the 38x38 terrain
  createCrater(-6.5, 8.5, 1.4);
  createCrater(8.8, 8.2, 1.3);
  createCrater(-11.2, -2.8, 1.5);
  createCrater(11.5, -4.5, 1.7);
  // New outer craters
  createCrater(-14.5, -10.5, 2.2); // Large deep crater
  createCrater(14.0, 12.0, 1.6);  // Southeast rim crater
  createCrater(-5.0, 15.2, 1.2);  // South crater
  createCrater(6.8, 15.0, 0.9);   // Micro impact crater
  createCrater(-15.5, 2.5, 1.3);  // West crater

  // 5. Stylized Rover Tracks grooved across the regolith
  const trackMat = new THREE.MeshStandardMaterial({
    color: 0xB84528,
    roughness: 0.95,
    flatShading: true,
  });

  const createTrackSegment = (startX, startZ, endX, endZ, width = 0.28) => {
    const dx = endX - startX;
    const dz = endZ - startZ;
    const len = Math.sqrt(dx * dx + dz * dz);
    const angle = Math.atan2(dx, dz);

    const trackGeo = new THREE.PlaneGeometry(width, len);
    const track = new THREE.Mesh(trackGeo, trackMat);
    track.rotation.x = -Math.PI / 2;
    track.rotation.z = angle;
    track.position.set((startX + endX) / 2, 0.36, (startZ + endZ) / 2);
    track.receiveShadow = true;
    terrainGroup.add(track);
  };

  // Dual tire tracks from Rover towards Landing Pad
  createTrackSegment(0.2, 6.5, -8.5, 8.8, 0.2);
  createTrackSegment(0.6, 6.3, -8.1, 8.6, 0.2);

  // Dual tire tracks from Rover towards Southeast exploration crater
  createTrackSegment(0.5, 6.5, 10.5, 11.5, 0.2);
  createTrackSegment(0.9, 6.3, 10.9, 11.3, 0.2);

  scene.add(terrainGroup);
  return terrainGroup;
}
