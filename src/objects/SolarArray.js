import * as THREE from 'three';
import { CONFIG } from '../game/config.js';

/**
 * Creates the Photovoltaic Solar Farm Array
 * Matches the neat angled grid of dark blue solar panels on metallic posts from reference image
 * @returns {THREE.Group} Solar Array 3D group
 */
export function createSolarArray() {
  const group = new THREE.Group();
  group.name = "Building_SolarArray";
  group.userData = {
    buildingId: "solar_array",
    buildingName: "Photovoltaic Solar Farm"
  };

  // Center the array in the courtyard
  group.position.set(-2.8, 0.3, 3.8);

  const panelMat = new THREE.MeshStandardMaterial({
    color: CONFIG.colors.solarPanelBlue,
    roughness: 0.2,
    metalness: 0.8,
  });

  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x9AAEC4,
    roughness: 0.4,
    metalness: 0.6,
  });

  const standMat = new THREE.MeshStandardMaterial({
    color: 0x5A6A80,
    roughness: 0.6,
    metalness: 0.7,
  });

  const cellGridMat = new THREE.MeshBasicMaterial({
    color: 0x306CA8,
    wireframe: false,
  });

  // Create an array of 8-10 panels arranged in 2 staggered rows (matching reference image)
  const panels = [];
  const panelWidth = 1.35;
  const panelLength = 0.85;

  const panelLayout = [
    // Back row
    { x: -2.4, z: -1.4 },
    { x: -0.9, z: -1.4 },
    { x: 0.6, z: -1.4 },
    { x: 2.1, z: -1.4 },
    // Middle row
    { x: -2.8, z: -0.2 },
    { x: -1.3, z: -0.2 },
    { x: 0.2, z: -0.2 },
    { x: 1.7, z: -0.2 },
    // Front row
    { x: -3.2, z: 1.0 },
    { x: -1.7, z: 1.0 },
    { x: -0.2, z: 1.0 },
  ];

  panelLayout.forEach((pos, idx) => {
    const singlePanel = new THREE.Group();
    singlePanel.position.set(pos.x, 0, pos.z);

    // Support Post from ground
    const postGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.7, 8);
    const post = new THREE.Mesh(postGeo, standMat);
    post.position.y = 0.35;
    post.castShadow = true;
    singlePanel.add(post);

    // Pivot mount at top of post
    const pivotGeo = new THREE.SphereGeometry(0.07, 8, 8);
    const pivot = new THREE.Mesh(pivotGeo, frameMat);
    pivot.position.y = 0.7;
    singlePanel.add(pivot);

    // Panel Board (tilted towards sun ~35 degrees)
    const boardGroup = new THREE.Group();
    boardGroup.position.y = 0.7;
    boardGroup.rotation.x = -Math.PI * 0.24; // Tilt towards sunlight
    boardGroup.rotation.y = Math.PI * 0.12;

    // Panel backing / frame
    const frameGeo = new THREE.BoxGeometry(panelWidth, 0.05, panelLength);
    const frameMesh = new THREE.Mesh(frameGeo, frameMat);
    frameMesh.castShadow = true;
    frameMesh.receiveShadow = true;
    boardGroup.add(frameMesh);

    // Photovoltaic surface
    const faceGeo = new THREE.BoxGeometry(panelWidth * 0.94, 0.02, panelLength * 0.92);
    const faceMesh = new THREE.Mesh(faceGeo, panelMat);
    faceMesh.position.y = 0.026;
    boardGroup.add(faceMesh);

    // Subtle cell grid divider lines
    for (let c = 1; c <= 2; c++) {
      const lineGeo = new THREE.BoxGeometry(0.015, 0.03, panelLength * 0.9);
      const lineMesh = new THREE.Mesh(lineGeo, cellGridMat);
      lineMesh.position.set(-panelWidth * 0.3 + c * (panelWidth * 0.3), 0.027, 0);
      boardGroup.add(lineMesh);
    }

    singlePanel.add(boardGroup);
    panels.push(boardGroup);
    group.add(singlePanel);
  });

  // Power Distribution & Accumulator Substation Box
  const subGeo = new THREE.BoxGeometry(0.8, 0.65, 0.8);
  const subMat = new THREE.MeshStandardMaterial({
    color: CONFIG.colors.habitatWhite,
    roughness: 0.4,
  });
  const subBox = new THREE.Mesh(subGeo, subMat);
  subBox.position.set(-4.2, 0.32, -0.6);
  subBox.castShadow = true;
  group.add(subBox);

  // Substation status LED (Cyan = Power flowing)
  const ledGeo = new THREE.SphereGeometry(0.06, 8, 8);
  const ledMat = new THREE.MeshBasicMaterial({ color: 0x00E5FF });
  const led = new THREE.Mesh(ledGeo, ledMat);
  led.position.set(-4.2, 0.68, -0.2);
  group.add(led);

  // Tag all child meshes
  group.traverse(child => {
    if (child.isMesh) {
      child.userData = group.userData;
    }
  });

  group.userData.animatedPanels = panels;
  return group;
}
