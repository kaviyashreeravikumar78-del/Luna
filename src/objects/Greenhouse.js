import * as THREE from 'three';
import { CONFIG } from '../game/config.js';

/**
 * Creates the Hydroponic Bio-Domes
 * Matches the curved transparent greenhouses with visible interior plants, white end caps and stairs
 * @returns {THREE.Group} Combined group containing both Alpha and Beta Greenhouses
 */
export function createGreenhouse() {
  const mainGroup = new THREE.Group();
  mainGroup.name = "Building_Greenhouse_Cluster";

  // Shared Materials
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xDCF4FF,
    metalness: 0.1,
    roughness: 0.15,
    transmission: 0.65, // True Three.js glass transmission
    transparent: true,
    opacity: 0.55,
    ior: 1.45,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const frameMat = new THREE.MeshStandardMaterial({
    color: CONFIG.colors.habitatWhite,
    roughness: 0.35,
    metalness: 0.2,
    flatShading: true,
  });

  const bedMat = new THREE.MeshStandardMaterial({
    color: 0x5C4033, // Rich fertile soil
    roughness: 0.95,
  });

  const trayMat = new THREE.MeshStandardMaterial({
    color: CONFIG.colors.habitatTrim,
    roughness: 0.5,
  });

  const trunkMat = new THREE.MeshStandardMaterial({
    color: CONFIG.colors.trunkBrown,
    roughness: 0.9,
    flatShading: true,
  });

  const leafMat = new THREE.MeshStandardMaterial({
    color: CONFIG.colors.plantGreen,
    roughness: 0.8,
    flatShading: true,
  });

  const darkLeafMat = new THREE.MeshStandardMaterial({
    color: CONFIG.colors.plantDarkGreen,
    roughness: 0.85,
    flatShading: true,
  });

  /**
   * Helper to construct one curved tunnel greenhouse
   */
  function buildDome(id, name, posX, posZ, rotY, showDecal = false) {
    const domeGroup = new THREE.Group();
    domeGroup.name = `Building_Greenhouse_${id}`;
    domeGroup.userData = {
      buildingId: "greenhouse",
      buildingName: name,
    };
    domeGroup.position.set(posX, 0.3, posZ);
    domeGroup.rotation.y = rotY;

    const length = 9.2;
    const width = 3.6;
    const height = 3.2;

    // 1. Concrete / Composite Base Foundation
    const baseGeo = new THREE.BoxGeometry(width + 0.4, 0.45, length + 0.4);
    const baseMesh = new THREE.Mesh(baseGeo, frameMat);
    baseMesh.position.y = 0.22;
    baseMesh.receiveShadow = true;
    baseMesh.castShadow = true;
    domeGroup.add(baseMesh);

    // 2. Transparent Curved Tunnel Canopy
    // Half cylinder (0 to PI) oriented along Z axis
    const canopyGeo = new THREE.CylinderGeometry(
      width / 2,
      width / 2,
      length,
      24,
      1,
      true, // open-ended cylinder
      0,
      Math.PI // half cylinder arch
    );
    const canopy = new THREE.Mesh(canopyGeo, glassMat);
    canopy.rotation.z = -Math.PI / 2;
    canopy.rotation.y = Math.PI / 2;
    canopy.position.y = 0.45;
    domeGroup.add(canopy);

    // 3. Structural White Rib Frames along the arch length
    const ribCount = 6;
    for (let i = 0; i <= ribCount; i++) {
      const zPos = -length / 2 + (i * length) / ribCount;
      const ribGeo = new THREE.TorusGeometry(width / 2 + 0.05, 0.08, 8, 20, Math.PI);
      const rib = new THREE.Mesh(ribGeo, frameMat);
      rib.position.set(0, 0.45, zPos);
      rib.rotation.y = Math.PI; // Face up
      rib.castShadow = true;
      domeGroup.add(rib);
    }

    // 4. White Front and Rear Solid End-Cap Bulkheads
    [-length / 2, length / 2].forEach((zPos, idx) => {
      const capGroup = new THREE.Group();
      capGroup.position.set(0, 0.45, zPos);

      // Arch shaped end wall
      const wallGeo = new THREE.CylinderGeometry(width / 2, width / 2, 0.3, 20, 1, false, 0, Math.PI);
      const wall = new THREE.Mesh(wallGeo, frameMat);
      wall.rotation.z = -Math.PI / 2;
      wall.rotation.y = Math.PI / 2;
      wall.castShadow = true;
      capGroup.add(wall);

      // Rectangular bottom portion
      const lowerGeo = new THREE.BoxGeometry(width, 0.8, 0.3);
      const lower = new THREE.Mesh(lowerGeo, frameMat);
      lower.position.y = -0.4;
      lower.castShadow = true;
      capGroup.add(lower);

      // Airlock Door Frame
      const doorGeo = new THREE.BoxGeometry(1.2, 1.8, 0.35);
      const doorMat = new THREE.MeshStandardMaterial({
        color: 0x3A5272,
        roughness: 0.5,
      });
      const door = new THREE.Mesh(doorGeo, doorMat);
      door.position.set(0, 0.3, 0);
      capGroup.add(door);

      // Entrance Stairs on the outward front end
      if (idx === 1 && showDecal) {
        for (let s = 0; s < 3; s++) {
          const stepGeo = new THREE.BoxGeometry(1.5, 0.16, 0.4);
          const step = new THREE.Mesh(stepGeo, frameMat);
          step.position.set(0, -0.1 - s * 0.12, 0.35 + s * 0.35);
          step.castShadow = true;
          step.receiveShadow = true;
          capGroup.add(step);
        }

        // "01-1" Decal plate above door
        const decalPlateGeo = new THREE.BoxGeometry(1.0, 0.35, 0.05);
        const decalPlateMat = new THREE.MeshBasicMaterial({ color: 0xF0F4F8 });
        const decalPlate = new THREE.Mesh(decalPlateGeo, decalPlateMat);
        decalPlate.position.set(0, 1.4, 0.18);
        capGroup.add(decalPlate);
      }

      domeGroup.add(capGroup);
    });

    // 5. Interior Hydroponic Growing Beds & Lush Miniature Plants
    // Two rows of plant beds running along the length
    [-0.85, 0.85].forEach(xOff => {
      // Hydroponic tray
      const trayGeo = new THREE.BoxGeometry(1.1, 0.3, length - 1.2);
      const tray = new THREE.Mesh(trayGeo, trayMat);
      tray.position.set(xOff, 0.45, 0);
      tray.castShadow = true;
      domeGroup.add(tray);

      // Soil layer
      const soilGeo = new THREE.BoxGeometry(0.95, 0.05, length - 1.3);
      const soil = new THREE.Mesh(soilGeo, bedMat);
      soil.position.set(xOff, 0.62, 0);
      domeGroup.add(soil);

      // Row of plants/trees inside
      const plantCount = 7;
      for (let p = 0; p < plantCount; p++) {
        const pz = -(length - 2.2) / 2 + (p * (length - 2.2)) / (plantCount - 1);
        const plantGroup = new THREE.Group();
        plantGroup.position.set(xOff + (Math.sin(p * 2) * 0.08), 0.65, pz);

        // Trunk
        const trunkGeo = new THREE.CylinderGeometry(0.04, 0.07, 0.75, 6);
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = 0.375;
        trunk.castShadow = true;
        plantGroup.add(trunk);

        // Foliage Crown (Low-poly dodecahedron)
        const crownGeo = new THREE.DodecahedronGeometry(0.38 + (p % 2) * 0.06, 1);
        const crown = new THREE.Mesh(crownGeo, (p % 2 === 0) ? leafMat : darkLeafMat);
        crown.position.y = 0.85;
        crown.scale.set(1.1, 0.9, 1.1);
        crown.castShadow = true;
        plantGroup.add(crown);

        domeGroup.add(plantGroup);
      }
    });

    // 6. Overhead LED Grow Light Strip
    const lightStripGeo = new THREE.BoxGeometry(0.15, 0.08, length - 1.0);
    const lightStripMat = new THREE.MeshBasicMaterial({ color: 0x98FFB3 });
    const lightStrip = new THREE.Mesh(lightStripGeo, lightStripMat);
    lightStrip.position.set(0, 1.95, 0);
    domeGroup.add(lightStrip);

    // Tag all child meshes with buildingId
    domeGroup.traverse(child => {
      if (child.isMesh) {
        child.userData = domeGroup.userData;
      }
    });

    return domeGroup;
  }

  // Greenhouse 1 (Alpha - Left side, angled along perimeter)
  const ghAlpha = buildDome("Alpha", "Hydroponic Bio-Dome Alpha", -7.2, 0.8, Math.PI * 0.18, false);
  mainGroup.add(ghAlpha);

  // Greenhouse 2 (Beta - Right/Front side, angled towards viewer with stairs, matches reference image)
  const ghBeta = buildDome("Beta", "Hydroponic Bio-Dome Beta", 6.8, -0.6, -Math.PI * 0.22, true);
  mainGroup.add(ghBeta);

  return mainGroup;
}
