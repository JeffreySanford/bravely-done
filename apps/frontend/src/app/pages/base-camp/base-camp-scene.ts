import * as THREE from 'three';
import { MotionMode } from '../../game-rendering/motion-mode';
import { SceneHandlers } from '../../game-rendering/renderer-lifecycle';

const CYAN = 0x00e5ff;
const VIOLET = 0x8b5cf6;
const FIRE = 0xff7a3d;
const EMBER = 0xffb066;

const TENT_ERECT_SECONDS = 1.1;

/**
 * The first real Base Camp scene: ground, a lit campfire, and the arriving
 * character's tent erecting once on arrival (see documentation/product/
 * base-camp.md — "Initial landmarks" and "Scene states: Tent erection").
 * Trees, foraging spots, wandering animals, and the stream/lake are the
 * next layers on top of this foundation (see planning/02-base-camp-
 * animations.md) — deliberately not in this first pass.
 */
export function buildBaseCampScene(motionMode: MotionMode): SceneHandlers {
  let fireLight: THREE.PointLight;
  let flame: THREE.Mesh;
  let embers: THREE.Points;
  let tent: THREE.Group;

  return {
    onInit({ scene, camera }) {
      camera.position.set(0, 2.4, 7.5);
      camera.lookAt(0, 0.6, 0);

      scene.add(new THREE.AmbientLight(0x141c33, 1.1));
      const moon = new THREE.PointLight(VIOLET, 2, 40);
      moon.position.set(-6, 8, -4);
      scene.add(moon);

      scene.add(buildGround());

      const campfire = buildCampfire();
      fireLight = campfire.light;
      flame = campfire.flame;
      embers = campfire.embers;
      scene.add(campfire.group);

      tent = buildTent();
      tent.position.set(2.6, 0, -0.6);
      tent.scale.set(1, 0.001, 1);
      scene.add(tent);
    },

    onFrame(elapsed) {
      const flicker = motionMode === 'full' ? Math.sin(elapsed * 11) * 0.4 + Math.sin(elapsed * 23) * 0.2 : 0;
      fireLight.intensity = 4.5 + flicker;
      flame.scale.y = 1 + Math.sin(elapsed * 9) * (motionMode === 'minimal' ? 0 : 0.12);

      if (motionMode !== 'minimal') {
        embers.rotation.y = elapsed * 0.4;
        const positions = embers.geometry.attributes['position'] as THREE.BufferAttribute;
        for (let i = 0; i < positions.count; i++) {
          const y = positions.getY(i) + 0.01;
          positions.setY(i, y > 2.2 ? 0 : y);
        }
        positions.needsUpdate = true;
      }

      const erectProgress = Math.min(elapsed / TENT_ERECT_SECONDS, 1);
      const eased = 1 - Math.pow(1 - erectProgress, 3);
      tent.scale.y = Math.max(eased, 0.001);
    },

    onDispose() {
      // Geometry/material disposal for everything still in the scene graph
      // is handled centrally by RendererLifecycle.dispose().
    },
  };
}

function buildGround(): THREE.Mesh {
  const geometry = new THREE.CircleGeometry(14, 48);
  const material = new THREE.MeshStandardMaterial({
    color: 0x0a1220,
    roughness: 0.9,
    metalness: 0.1,
  });
  const ground = new THREE.Mesh(geometry, material);
  ground.rotation.x = -Math.PI / 2;
  return ground;
}

function buildCampfire(): { group: THREE.Group; light: THREE.PointLight; flame: THREE.Mesh; embers: THREE.Points } {
  const group = new THREE.Group();

  const logGeometry = new THREE.CylinderGeometry(0.06, 0.06, 1.1, 8);
  const logMaterial = new THREE.MeshStandardMaterial({ color: 0x3a2417, roughness: 1 });
  for (let i = 0; i < 4; i++) {
    const log = new THREE.Mesh(logGeometry, logMaterial);
    log.rotation.z = Math.PI / 2;
    log.rotation.y = (Math.PI / 4) * i;
    log.position.y = 0.08;
    group.add(log);
  }

  const flameGeometry = new THREE.ConeGeometry(0.32, 0.9, 12);
  const flameMaterial = new THREE.MeshBasicMaterial({ color: FIRE, transparent: true, opacity: 0.85 });
  const flame = new THREE.Mesh(flameGeometry, flameMaterial);
  flame.position.y = 0.55;
  group.add(flame);

  const light = new THREE.PointLight(FIRE, 4.5, 12);
  light.position.y = 0.7;
  group.add(light);

  const emberCount = 60;
  const positions = new Float32Array(emberCount * 3);
  for (let i = 0; i < emberCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 0.6;
    positions[i * 3 + 1] = Math.random() * 2.2;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 0.6;
  }
  const emberGeometry = new THREE.BufferGeometry();
  emberGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const emberMaterial = new THREE.PointsMaterial({
    color: EMBER,
    size: 0.05,
    transparent: true,
    opacity: 0.75,
    depthWrite: false,
  });
  const embers = new THREE.Points(emberGeometry, emberMaterial);
  group.add(embers);

  return { group, light, flame, embers };
}

function buildTent(): THREE.Group {
  const group = new THREE.Group();

  const bodyGeometry = new THREE.ConeGeometry(0.9, 1.3, 4);
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: 0x101826,
    roughness: 0.7,
    metalness: 0.2,
    emissive: CYAN,
    emissiveIntensity: 0.08,
  });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.rotation.y = Math.PI / 4;
  body.position.y = 0.65;
  group.add(body);

  const trimGeometry = new THREE.TorusGeometry(0.9, 0.015, 8, 4);
  const trimMaterial = new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0.6 });
  const trim = new THREE.Mesh(trimGeometry, trimMaterial);
  trim.rotation.x = Math.PI / 2;
  trim.rotation.z = Math.PI / 4;
  group.add(trim);

  return group;
}
