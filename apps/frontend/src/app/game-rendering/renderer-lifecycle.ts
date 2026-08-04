import * as THREE from 'three';
import { MotionMode } from './motion-mode';

const MAX_PIXEL_RATIO = 2;

export interface SceneHandlers {
  /** Called once after the renderer/camera exist, before the first frame. */
  onInit?(ctx: { scene: THREE.Scene; camera: THREE.PerspectiveCamera; motionMode: MotionMode }): void;
  /** Called every frame while running. `elapsed` is seconds since start. */
  onFrame?(elapsed: number, deltaSeconds: number): void;
  /** Called on dispose, before the renderer/scene are torn down. */
  onDispose?(): void;
}

/**
 * Mounts a Three.js scene onto a canvas with the performance/lifecycle rules
 * from documentation/architecture/animation-architecture.md: clamp device
 * pixel ratio, stop the render loop when hidden, dispose everything cleanly.
 * Deliberately independent of any Angular component internals — a component
 * just constructs one in ngAfterViewInit and calls dispose() in
 * ngOnDestroy.
 */
export class RendererLifecycle {
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;

  private readonly renderer: THREE.WebGLRenderer;
  private readonly handlers: SceneHandlers;
  private readonly motionMode: MotionMode;
  private readonly resizeObserver: ResizeObserver;
  private readonly visibilityListener: () => void;

  private frameId: number | null = null;
  private running = false;
  private startTime = 0;
  private lastFrameTime = 0;

  constructor(canvas: HTMLCanvasElement, motionMode: MotionMode, handlers: SceneHandlers = {}) {
    this.motionMode = motionMode;
    this.handlers = handlers;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO));

    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);

    const parent = canvas.parentElement ?? canvas;
    this.resize(parent.clientWidth, parent.clientHeight);

    this.resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const { width, height } = entry.contentRect;
        this.resize(width, height);
      }
    });
    this.resizeObserver.observe(parent);

    this.visibilityListener = () => {
      if (document.hidden) {
        this.pause();
      } else {
        this.resume();
      }
    };
    document.addEventListener('visibilitychange', this.visibilityListener);

    this.handlers.onInit?.({ scene: this.scene, camera: this.camera, motionMode: this.motionMode });
  }

  start(): void {
    if (this.running) {
      return;
    }
    this.running = true;
    this.startTime = performance.now();
    this.lastFrameTime = this.startTime;
    this.frameId = requestAnimationFrame(this.tick);
  }

  pause(): void {
    this.running = false;
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
  }

  resume(): void {
    if (!this.running && this.frameId === null) {
      this.start();
    }
  }

  dispose(): void {
    this.pause();
    this.resizeObserver.disconnect();
    document.removeEventListener('visibilitychange', this.visibilityListener);
    this.handlers.onDispose?.();
    disposeSceneGraph(this.scene);
    this.renderer.dispose();
  }

  private resize(width: number, height: number): void {
    if (width <= 0 || height <= 0) {
      return;
    }
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  private readonly tick = (now: number): void => {
    if (!this.running) {
      return;
    }
    const elapsed = (now - this.startTime) / 1000;
    const deltaSeconds = (now - this.lastFrameTime) / 1000;
    this.lastFrameTime = now;

    this.handlers.onFrame?.(elapsed, deltaSeconds);
    this.renderer.render(this.scene, this.camera);

    this.frameId = requestAnimationFrame(this.tick);
  };
}

function disposeSceneGraph(root: THREE.Object3D): void {
  root.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (mesh.geometry) {
      mesh.geometry.dispose();
    }
    const material = (object as THREE.Mesh).material;
    if (Array.isArray(material)) {
      material.forEach((m) => m.dispose());
    } else if (material) {
      material.dispose();
    }
  });
}
