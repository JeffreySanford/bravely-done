import * as THREE from 'three';
import { AnimationDirector, AnimationSequence, BaseCampAnimationEvent } from '../../game-rendering/animation-director';
import { MotionMode } from '../../game-rendering/motion-mode';
import { SceneHandlers } from '../../game-rendering/renderer-lifecycle';
import { MAX_CONSTRUCTION_STAGE } from './construction-stage';

const CYAN = 0x00e5ff;
const VIOLET = 0x8b5cf6;
const FIRE = 0xff7a3d;
const EMBER = 0xffb066;
const WATER = 0x1c5c8a;

const TENT_ERECT_SECONDS = 1.1;
/** Seconds of full flame one chopped log buys. Real firewood (see
 * planning/02-base-camp-animations.md's resource loop) now drives the
 * campfire's fuel state — not a pure time-based loop. */
const SECONDS_PER_LOG = 25;
/** Every arrival finds the fire already going — "continuity, rest, and
 * return" (documentation/product/base-camp.md) — regardless of whether
 * this character has ever chopped a tree. Only once this free burn runs
 * out does the fire actually start drawing down real chopped firewood. */
const INITIAL_FREE_FUEL_SECONDS = 45;
const CHOP_WOBBLE_SECONDS = 0.4;

export interface BaseCampSceneOptions {
  firstArrival: boolean;
  constructionStage: number;
  initialFirewoodCount: number;
  /** Called synchronously the moment a tree is clicked, before the backend
   * confirms — the scene plays its own optimistic wobble regardless; this
   * is purely so the caller can dispatch the real chop request. */
  onChopTree: () => void;
}

export interface BaseCampScene {
  handlers: SceneHandlers;
  director: AnimationDirector;
}

const TREE_POSITIONS = [
  [-6, 0, -2],
  [-5.5, 0, 3.5],
  [6, 0, -3],
] as const;

/**
 * The full first-pass Base Camp scene: ground, campfire (fuel now driven
 * by real chopped firewood), the arriving character's tent, a companion
 * placeholder, resource-loop landmarks (clickable trees, a foraging bush,
 * an animated stream), and the quest-loop landmarks (quest board, chest,
 * treasury, and a bridge that visibly repairs as campConstructionStage
 * advances). See documentation/product/base-camp.md and planning/02-base-
 * camp-animations.md. Foraging/animal harvesting interaction is still out
 * of scope for this pass — only tree-chopping is wired to real state.
 */
export function buildBaseCampScene(motionMode: MotionMode, options: BaseCampSceneOptions): BaseCampScene {
  const director = new AnimationDirector();

  let stream: THREE.Mesh;
  let companion: THREE.Mesh;
  let raycaster: THREE.Raycaster;
  let camera: THREE.PerspectiveCamera;
  let treeMeshes: THREE.Object3D[] = [];
  let canvasRef: HTMLCanvasElement;
  let clickListener: (event: MouseEvent) => void;

  let tentSequence: TentSequence;
  let bridgeSequence: BridgeSequence;
  let campfireSequence: CampfireSequence;
  const treeSequences: TreeSequence[] = [];

  const handlers: SceneHandlers = {
    onInit(ctx) {
      camera = ctx.camera;
      canvasRef = ctx.canvas;
      camera.position.set(0, 4.2, 12);
      camera.lookAt(0, 0.6, -1);

      ctx.scene.add(new THREE.AmbientLight(0x141c33, 1.1));
      const moon = new THREE.PointLight(VIOLET, 2, 40);
      moon.position.set(-6, 8, -4);
      ctx.scene.add(moon);

      ctx.scene.add(buildGround());

      campfireSequence = new CampfireSequence(options.initialFirewoodCount);
      ctx.scene.add(campfireSequence.group);
      director.register(campfireSequence);

      tentSequence = new TentSequence(options.firstArrival);
      tentSequence.mesh.position.set(2.6, 0, -0.6);
      ctx.scene.add(tentSequence.mesh);
      director.register(tentSequence);

      companion = buildCompanion();
      companion.position.set(-1.8, 0.55, -1.6);
      ctx.scene.add(companion);

      TREE_POSITIONS.forEach((position, index) => {
        const treeSequence = new TreeSequence(index);
        treeSequence.group.position.set(position[0], position[1], position[2]);
        ctx.scene.add(treeSequence.group);
        director.register(treeSequence);
        treeSequences.push(treeSequence);
      });
      treeMeshes = treeSequences.map((t) => t.group);

      const bush = buildForagingBush();
      bush.position.set(-3, 0, -4.5);
      ctx.scene.add(bush);

      stream = buildStream();
      stream.position.set(0, 0.01, -7.5);
      ctx.scene.add(stream);

      const questBoard = buildQuestBoard();
      questBoard.position.set(5.5, 0, 0.5);
      ctx.scene.add(questBoard);

      const chest = buildChest();
      chest.position.set(4.5, 0, 3);
      ctx.scene.add(chest);

      const treasury = buildTreasury();
      treasury.position.set(-4.5, 0, 2.8);
      ctx.scene.add(treasury);

      bridgeSequence = new BridgeSequence(options.constructionStage);
      bridgeSequence.group.position.set(0, 0, -6.8);
      ctx.scene.add(bridgeSequence.group);
      director.register(bridgeSequence);

      raycaster = new THREE.Raycaster();
      clickListener = (event: MouseEvent) => {
        const rect = canvasRef.getBoundingClientRect();
        const pointer = new THREE.Vector2(
          ((event.clientX - rect.left) / rect.width) * 2 - 1,
          -((event.clientY - rect.top) / rect.height) * 2 + 1,
        );
        raycaster.setFromCamera(pointer, camera);
        const hit = raycaster.intersectObjects(treeMeshes, true)[0];
        if (!hit) {
          return;
        }
        const treeIndex = treeMeshes.findIndex((mesh) => mesh === hit.object || isDescendantOf(hit.object, mesh));
        if (treeIndex === -1) {
          return;
        }
        director.dispatch({ type: 'chopTree', treeIndex });
        options.onChopTree();
      };
      canvasRef.style.pointerEvents = 'auto';
      canvasRef.addEventListener('click', clickListener);
    },

    onFrame(elapsed, deltaSeconds) {
      campfireSequence.onFrame(elapsed, deltaSeconds, motionMode);
      tentSequence.onFrame(elapsed);
      bridgeSequence.onFrame(deltaSeconds);
      treeSequences.forEach((tree) => tree.onFrame(deltaSeconds));

      companion.position.y = 0.55 + Math.sin(elapsed * 1.6) * 0.08;
      companion.rotation.y = elapsed * 0.3;

      if (motionMode !== 'minimal') {
        const streamPositions = stream.geometry.attributes['position'] as THREE.BufferAttribute;
        for (let i = 0; i < streamPositions.count; i++) {
          const x = streamPositions.getX(i);
          const z0 = (streamPositions as unknown as { z0: number[] }).z0?.[i] ?? 0;
          streamPositions.setZ(i, z0 + Math.sin(elapsed * 1.5 + x * 0.8) * 0.06);
        }
        streamPositions.needsUpdate = true;
      }
    },

    onDispose() {
      canvasRef.removeEventListener('click', clickListener);
      canvasRef.style.pointerEvents = 'none';
      // Geometry/material disposal for everything still in the scene graph
      // is handled centrally by RendererLifecycle.dispose().
    },
  };

  return { handlers, director };
}

function isDescendantOf(node: THREE.Object3D, ancestor: THREE.Object3D): boolean {
  let current: THREE.Object3D | null = node;
  while (current) {
    if (current === ancestor) {
      return true;
    }
    current = current.parent;
  }
  return false;
}

class TentSequence implements AnimationSequence {
  readonly mesh = buildTent();

  constructor(firstArrival: boolean) {
    this.mesh.scale.set(1, firstArrival ? 0.001 : 1, 1);
  }

  onEvent(): void {
    // Arrival is decided at construction time (firstArrival is known
    // up-front), so there's nothing to react to here yet — reserved for a
    // future "character departs and returns" re-trigger.
  }

  onFrame(elapsed: number): void {
    if (this.mesh.scale.y >= 1) {
      return;
    }
    const progress = Math.min(elapsed / TENT_ERECT_SECONDS, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    this.mesh.scale.y = Math.max(eased, 0.001);
  }
}

/** Fuel is a real reserve, not a forever-looping timer: each chopped log
 * (see BaseCampSceneOptions.onChopTree / the 'firewoodGathered' event)
 * buys SECONDS_PER_LOG of full flame. Once the reserve runs out and no
 * more logs are available, the fire settles to embers-only until the
 * player chops another tree. */
class CampfireSequence implements AnimationSequence {
  readonly group: THREE.Group;
  private readonly light: THREE.PointLight;
  private readonly flame: THREE.Mesh;
  private readonly embers: THREE.Points;

  private consumedFirewood = 0;
  private availableFirewood: number;
  private fuelSecondsRemaining = INITIAL_FREE_FUEL_SECONDS;

  constructor(initialFirewood: number) {
    const built = buildCampfire();
    this.group = built.group;
    this.light = built.light;
    this.flame = built.flame;
    this.embers = built.embers;
    this.availableFirewood = initialFirewood;
  }

  onEvent(event: BaseCampAnimationEvent): void {
    if (event.type === 'firewoodGathered') {
      this.availableFirewood = event.totalFirewood;
    }
  }

  onFrame(elapsed: number, deltaSeconds: number, motionMode: MotionMode): void {
    if (this.fuelSecondsRemaining <= 0) {
      this.restockIfPossible();
    }
    this.fuelSecondsRemaining = Math.max(this.fuelSecondsRemaining - deltaSeconds, 0);

    const lit = this.fuelSecondsRemaining > 0;
    const fuel = lit ? 1 : 0.2;
    const flicker = motionMode === 'full' ? Math.sin(elapsed * 11) * 0.4 + Math.sin(elapsed * 23) * 0.2 : 0;

    this.light.intensity = 2 + fuel * 2.5 + flicker * fuel;
    this.flame.scale.y = fuel * (1 + Math.sin(elapsed * 9) * (motionMode === 'minimal' ? 0 : 0.12));
    (this.flame.material as THREE.MeshBasicMaterial).opacity = 0.85 * fuel;

    if (motionMode !== 'minimal') {
      this.embers.visible = lit;
      this.embers.rotation.y = elapsed * 0.4;
      const positions = this.embers.geometry.attributes['position'] as THREE.BufferAttribute;
      for (let i = 0; i < positions.count; i++) {
        const y = positions.getY(i) + 0.01;
        positions.setY(i, y > 2.2 ? 0 : y);
      }
      positions.needsUpdate = true;
    }
  }

  private restockIfPossible(): boolean {
    if (this.consumedFirewood >= this.availableFirewood) {
      return false;
    }
    this.consumedFirewood += 1;
    this.fuelSecondsRemaining += SECONDS_PER_LOG;
    return true;
  }
}

/** A clickable tree: chopping plays a brief wobble (optimistic — it
 * doesn't wait for the backend) each time this specific tree is targeted. */
class TreeSequence implements AnimationSequence {
  readonly group = buildTree();
  private wobbleRemaining = 0;

  constructor(private readonly index: number) {}

  onEvent(event: BaseCampAnimationEvent): void {
    if (event.type === 'chopTree' && event.treeIndex === this.index) {
      this.wobbleRemaining = CHOP_WOBBLE_SECONDS;
    }
  }

  onFrame(deltaSeconds: number): void {
    if (this.wobbleRemaining <= 0) {
      this.group.rotation.z = 0;
      return;
    }
    this.wobbleRemaining = Math.max(this.wobbleRemaining - deltaSeconds, 0);
    const progress = this.wobbleRemaining / CHOP_WOBBLE_SECONDS;
    this.group.rotation.z = Math.sin(progress * Math.PI * 3) * 0.08 * progress;
  }
}

class BridgeSequence implements AnimationSequence {
  readonly group = new THREE.Group();
  private readonly planks: THREE.Mesh[] = [];
  private pulseRemaining = 0;
  private pulseTarget: THREE.Mesh | null = null;

  constructor(private stage: number) {
    const plankCount = MAX_CONSTRUCTION_STAGE + 1;
    const geometry = new THREE.BoxGeometry(1.6, 0.12, 0.9);
    const repairedMaterial = new THREE.MeshStandardMaterial({ color: 0x6b4a2c, roughness: 0.8 });
    const gapMaterial = new THREE.MeshBasicMaterial({ color: 0x05070d, transparent: true, opacity: 0.6 });

    for (let i = 0; i < plankCount; i++) {
      const repaired = i <= this.stage;
      const plank = new THREE.Mesh(geometry, repaired ? repairedMaterial : gapMaterial);
      plank.position.set((i - (plankCount - 1) / 2) * 1.7, repaired ? 0 : -0.15, 0);
      this.group.add(plank);
      this.planks.push(plank);
    }
  }

  onEvent(event: BaseCampAnimationEvent): void {
    if (event.type !== 'questCompleted') {
      return;
    }
    const nextStage = event.constructionStage;
    if (nextStage <= this.stage) {
      return;
    }
    this.stage = nextStage;
    const plank = this.planks[nextStage];
    if (!plank) {
      return;
    }
    plank.material = new THREE.MeshStandardMaterial({ color: 0x6b4a2c, roughness: 0.8, emissive: CYAN, emissiveIntensity: 0.6 });
    plank.position.y = 0;
    this.pulseTarget = plank;
    this.pulseRemaining = 0.6;
  }

  onFrame(deltaSeconds: number): void {
    if (this.pulseRemaining <= 0 || !this.pulseTarget) {
      return;
    }
    this.pulseRemaining -= deltaSeconds;
    const material = this.pulseTarget.material as THREE.MeshStandardMaterial;
    material.emissiveIntensity = Math.max(this.pulseRemaining / 0.6, 0) * 0.6;
    if (this.pulseRemaining <= 0) {
      material.emissiveIntensity = 0;
      this.pulseTarget = null;
    }
  }
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

function buildCompanion(): THREE.Mesh {
  const geometry = new THREE.IcosahedronGeometry(0.28, 1);
  const material = new THREE.MeshStandardMaterial({
    color: VIOLET,
    emissive: VIOLET,
    emissiveIntensity: 0.8,
    roughness: 0.3,
  });
  return new THREE.Mesh(geometry, material);
}

function buildTree(): THREE.Group {
  const group = new THREE.Group();
  const trunkGeometry = new THREE.CylinderGeometry(0.12, 0.16, 1.1, 8);
  const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x2e1d12, roughness: 1 });
  const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
  trunk.position.y = 0.55;
  group.add(trunk);

  const foliageGeometry = new THREE.ConeGeometry(0.75, 1.6, 8);
  const foliageMaterial = new THREE.MeshStandardMaterial({ color: 0x123324, roughness: 0.9 });
  const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
  foliage.position.y = 1.6;
  group.add(foliage);

  return group;
}

function buildForagingBush(): THREE.Group {
  const group = new THREE.Group();
  const geometry = new THREE.SphereGeometry(0.32, 8, 6);
  const material = new THREE.MeshStandardMaterial({ color: 0x1c4a2a, roughness: 1 });
  for (const [x, z] of [
    [0, 0],
    [0.35, 0.1],
    [-0.3, 0.15],
  ] as const) {
    const clump = new THREE.Mesh(geometry, material);
    clump.position.set(x, 0.28, z);
    group.add(clump);
  }
  return group;
}

function buildStream(): THREE.Mesh {
  const geometry = new THREE.PlaneGeometry(20, 3, 40, 4);
  geometry.rotateX(-Math.PI / 2);
  const positions = geometry.attributes['position'] as THREE.BufferAttribute;
  const z0: number[] = [];
  for (let i = 0; i < positions.count; i++) {
    z0.push(positions.getZ(i));
  }
  (positions as unknown as { z0: number[] }).z0 = z0;

  const material = new THREE.MeshStandardMaterial({
    color: WATER,
    roughness: 0.2,
    metalness: 0.4,
    transparent: true,
    opacity: 0.85,
  });
  return new THREE.Mesh(geometry, material);
}

function buildQuestBoard(): THREE.Group {
  const group = new THREE.Group();
  const postGeometry = new THREE.CylinderGeometry(0.06, 0.06, 1.4, 6);
  const postMaterial = new THREE.MeshStandardMaterial({ color: 0x2e2418, roughness: 1 });
  const post = new THREE.Mesh(postGeometry, postMaterial);
  post.position.y = 0.7;
  group.add(post);

  const boardGeometry = new THREE.BoxGeometry(1.1, 0.75, 0.06);
  const boardMaterial = new THREE.MeshStandardMaterial({
    color: 0x101826,
    emissive: CYAN,
    emissiveIntensity: 0.15,
    roughness: 0.6,
  });
  const board = new THREE.Mesh(boardGeometry, boardMaterial);
  board.position.y = 1.3;
  group.add(board);

  return group;
}

function buildChest(): THREE.Mesh {
  const geometry = new THREE.BoxGeometry(0.7, 0.45, 0.45);
  const material = new THREE.MeshStandardMaterial({ color: 0x3a2417, roughness: 0.8 });
  const chest = new THREE.Mesh(geometry, material);
  chest.position.y = 0.22;
  return chest;
}

function buildTreasury(): THREE.Group {
  const group = new THREE.Group();
  const pedestalGeometry = new THREE.CylinderGeometry(0.3, 0.35, 0.3, 8);
  const pedestalMaterial = new THREE.MeshStandardMaterial({ color: 0x1a2440, roughness: 0.7 });
  const pedestal = new THREE.Mesh(pedestalGeometry, pedestalMaterial);
  pedestal.position.y = 0.15;
  group.add(pedestal);

  const coinGeometry = new THREE.TorusGeometry(0.14, 0.04, 8, 16);
  const coinMaterial = new THREE.MeshStandardMaterial({ color: 0xffd166, emissive: 0xffd166, emissiveIntensity: 0.3 });
  const coin = new THREE.Mesh(coinGeometry, coinMaterial);
  coin.rotation.x = Math.PI / 2;
  coin.position.y = 0.42;
  group.add(coin);

  return group;
}
