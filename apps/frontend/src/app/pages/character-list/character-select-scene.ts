import * as THREE from 'three';
import { MotionMode } from '../../game-rendering/motion-mode';
import { SceneHandlers } from '../../game-rendering/renderer-lifecycle';

const CYAN = 0x00e5ff;
const VIOLET = 0x8b5cf6;

/**
 * Ambient holographic backdrop for character select — ties into the real,
 * always-present HTML character cards (see character-list.html); the 3D
 * scene is never the only way to select a character. Deliberately not
 * pickable/interactive 3D objects, per the interaction rule in
 * documentation/product/base-camp.md: important actions stay in real DOM.
 */
export function buildCharacterSelectScene(motionMode: MotionMode): SceneHandlers {
  let particles: THREE.Points;
  let rings: THREE.Mesh[] = [];

  return {
    onInit({ scene, camera }) {
      camera.position.set(0, 0, 9);

      scene.add(new THREE.AmbientLight(0x1a2440, 1.2));
      const key = new THREE.PointLight(CYAN, 6, 30);
      key.position.set(4, 3, 6);
      scene.add(key);
      const rim = new THREE.PointLight(VIOLET, 4, 30);
      rim.position.set(-5, -2, -4);
      scene.add(rim);

      particles = buildParticleField(motionMode);
      scene.add(particles);

      rings = buildOrbitRings();
      rings.forEach((ring) => scene.add(ring));
    },

    onFrame(elapsed) {
      const drift = motionMode === 'full' ? 1 : 0.25;

      particles.rotation.y = elapsed * 0.02 * drift;

      rings.forEach((ring, i) => {
        ring.rotation.x = elapsed * (0.05 + i * 0.02) * drift;
        ring.rotation.y = elapsed * (0.03 + i * 0.015) * drift;
      });
    },

    onDispose() {
      // Geometry/material disposal for everything still in the scene graph
      // is handled centrally by RendererLifecycle.dispose().
    },
  };
}

function buildParticleField(motionMode: MotionMode): THREE.Points {
  const count = motionMode === 'full' ? 800 : 300;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 30;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 20 - 5;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: CYAN,
    size: 0.045,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });

  return new THREE.Points(geometry, material);
}

function buildOrbitRings(): THREE.Mesh[] {
  const specs = [
    { radius: 3.2, tube: 0.01, color: CYAN, position: [3, 1, -4] as const },
    { radius: 2.2, tube: 0.012, color: VIOLET, position: [-4, -1.5, -6] as const },
  ];

  return specs.map(({ radius, tube, color, position }) => {
    const geometry = new THREE.TorusGeometry(radius, tube, 16, 100);
    const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.35 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(position[0], position[1], position[2]);
    mesh.rotation.x = Math.PI / 3;
    return mesh;
  });
}
