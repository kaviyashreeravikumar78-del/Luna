import * as THREE from 'three';
import { BUILDINGS_DATA } from '../data/buildings.js';

/**
 * Handles Raycasting, hover highlights, tooltips, click selection,
 * and a friendly 3D floating arrow beacon above the selected building.
 */
export class ObjectInteraction {
  constructor(scene, camera, domElement, onSelectCallback) {
    this.scene = scene;
    this.camera = camera;
    this.domElement = domElement;
    this.onSelect = onSelectCallback;

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2(-999, -999);
    this.hoveredBuildingId = null;
    this.activeBuildingId = null;
    this.hoveredMeshes = [];
    this.originalEmissives = new Map();

    // Create Tooltip DOM Element
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'colony-tooltip';
    this.tooltip.style.display = 'none';
    document.body.appendChild(this.tooltip);

    // Create 3D Floating Pointer Beacon
    this.createBeacon();

    this.enabled = false; // Enabled only when player is actively exploring the colony
    this.bindEvents();
  }

  createBeacon() {
    this.beaconGroup = new THREE.Group();
    this.beaconGroup.name = "Building_Pointer_Beacon";
    this.beaconGroup.visible = false;

    // Glowing Neon Down-Arrow Cone
    const coneGeo = new THREE.ConeGeometry(0.35, 0.75, 16);
    const arrowMat = new THREE.MeshBasicMaterial({
      color: 0x00E5FF,
      transparent: true,
      opacity: 0.9,
    });
    const arrow = new THREE.Mesh(coneGeo, arrowMat);
    arrow.rotation.x = Math.PI; // Point down
    arrow.position.y = 0.45;
    this.beaconGroup.add(arrow);

    // Glowing Halo Ring
    const ringGeo = new THREE.TorusGeometry(0.65, 0.05, 8, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xFFE066,
      transparent: true,
      opacity: 0.85,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.9;
    this.beaconGroup.add(ring);

    // Localized Light
    this.beaconLight = new THREE.PointLight(0x00E5FF, 2.0, 5);
    this.beaconLight.position.y = 0.4;
    this.beaconGroup.add(this.beaconLight);

    this.scene.add(this.beaconGroup);

    // Marker height offsets for each building
    this.beaconHeights = {
      habitat: { x: 0, y: 9.3, z: -2.5 },
      greenhouse: { x: 6.8, y: 4.2, z: -0.6 },
      solar_array: { x: -2.0, y: 2.6, z: 3.8 },
      research_lab: { x: 5.5, y: 4.6, z: 2.2 },
      antenna: { x: 5.2, y: 5.5, z: -5.5 },
      rover: { x: 0.2, y: 3.0, z: 6.2 },
    };
  }

  bindEvents() {
    this.onPointerMove = (e) => {
      if (!this.enabled) return;
      const rect = this.domElement.getBoundingClientRect();
      this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      // Position tooltip near cursor
      this.tooltip.style.left = `${e.clientX + 16}px`;
      this.tooltip.style.top = `${e.clientY + 12}px`;

      this.checkHover();
    };

    this.onPointerDown = (e) => {
      this.pointerDownX = e.clientX;
      this.pointerDownY = e.clientY;
    };

    this.onPointerUp = (e) => {
      if (!this.enabled) return;
      // Differentiate between small tap and dragging camera
      const dx = Math.abs(e.clientX - this.pointerDownX);
      const dy = Math.abs(e.clientY - this.pointerDownY);
      if (dx < 7 && dy < 7) {
        this.checkClick();
      }
    };

    this.domElement.addEventListener('pointermove', this.onPointerMove);
    this.domElement.addEventListener('pointerdown', this.onPointerDown);
    this.domElement.addEventListener('pointerup', this.onPointerUp);
  }

  /**
   * Raycasts into the scene and finds matching building userData
   */
  getIntersectedBuilding() {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);

    for (let hit of intersects) {
      if (hit.object && hit.object.userData && hit.object.userData.buildingId) {
        return {
          buildingId: hit.object.userData.buildingId,
          buildingName: hit.object.userData.buildingName,
          object: hit.object,
        };
      }
    }
    return null;
  }

  checkHover() {
    const hit = this.getIntersectedBuilding();

    if (hit) {
      if (this.hoveredBuildingId !== hit.buildingId) {
        this.clearHighlight();
        this.hoveredBuildingId = hit.buildingId;
        this.applyHighlight(hit.buildingId);

        const data = BUILDINGS_DATA[hit.buildingId];
        this.tooltip.innerHTML = `
          <div class="tooltip-header">
            <span class="tooltip-icon">${data ? data.icon : '📡'}</span>
            <span class="tooltip-title">${hit.buildingName}</span>
          </div>
          <div class="tooltip-status">
            <span class="status-dot"></span>
            <span>Click to explore! ✨</span>
          </div>
        `;
        this.tooltip.style.display = 'block';
        this.domElement.style.cursor = 'pointer';
      }
    } else {
      if (this.hoveredBuildingId) {
        this.clearHighlight();
        this.hoveredBuildingId = null;
        this.tooltip.style.display = 'none';
        this.domElement.style.cursor = 'default';
      }
    }
  }

  checkClick() {
    const hit = this.getIntersectedBuilding();
    if (hit && this.onSelect) {
      this.onSelect(hit.buildingId);
    }
  }

  /**
   * Applies glowing emissive tint to all meshes belonging to the building
   */
  applyHighlight(buildingId) {
    this.scene.traverse((obj) => {
      if (obj.isMesh && obj.userData && obj.userData.buildingId === buildingId) {
        this.hoveredMeshes.push(obj);
        if (obj.material && obj.material.emissive) {
          if (!this.originalEmissives.has(obj.id)) {
            this.originalEmissives.set(obj.id, obj.material.emissive.clone());
          }
          obj.material.emissive.setHex(0x00E5FF);
          obj.material.emissiveIntensity = 0.55;
        }
      }
    });

    // Move 3D beacon above the building
    const pos = this.beaconHeights[buildingId];
    if (pos) {
      this.beaconGroup.position.set(pos.x, pos.y, pos.z);
      this.beaconGroup.visible = true;
      this.activeBaseY = pos.y;
    }
  }

  clearHighlight() {
    this.hoveredMeshes.forEach((mesh) => {
      if (mesh.material && mesh.material.emissive && this.originalEmissives.has(mesh.id)) {
        mesh.material.emissive.copy(this.originalEmissives.get(mesh.id));
        mesh.material.emissiveIntensity = 0;
      }
    });
    this.hoveredMeshes = [];
    if (!this.isTutorialLocked) {
      this.beaconGroup.visible = false;
    }
  }

  /**
   * Programmatic highlight (used by ORBIT tutorial)
   */
  highlightBuilding(buildingId) {
    this.isTutorialLocked = !!buildingId;
    this.clearHighlight();
    if (buildingId) {
      this.hoveredBuildingId = buildingId;
      this.applyHighlight(buildingId);
    } else {
      this.beaconGroup.visible = false;
    }
  }

  /**
   * Update animation for the 3D beacon
   */
  update(elapsedTime) {
    if (this.beaconGroup.visible) {
      this.beaconGroup.rotation.y = elapsedTime * 2.5;
      if (this.activeBaseY !== undefined) {
        this.beaconGroup.position.y = this.activeBaseY + Math.sin(elapsedTime * 4.0) * 0.25;
      }
    }
  }

  dispose() {
    this.domElement.removeEventListener('pointermove', this.onPointerMove);
    this.domElement.removeEventListener('pointerdown', this.onPointerDown);
    this.domElement.removeEventListener('pointerup', this.onPointerUp);
    if (this.tooltip && this.tooltip.parentNode) {
      this.tooltip.parentNode.removeChild(this.tooltip);
    }
  }
}
