import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CharacterApiService } from '../../core/character-api.service';
import { detectMotionMode } from '../../game-rendering/motion-mode';
import { RendererLifecycle } from '../../game-rendering/renderer-lifecycle';
import { isWebglAvailable } from '../../game-rendering/webgl-support';
import { buildBaseCampScene } from './base-camp-scene';

@Component({
  selector: 'app-base-camp',
  imports: [RouterLink],
  templateUrl: './base-camp.html',
  styleUrl: './base-camp.scss',
})
export class BaseCamp implements OnInit, AfterViewInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly characters = inject(CharacterApiService);

  @ViewChild('sceneCanvas') private readonly canvasRef?: ElementRef<HTMLCanvasElement>;

  readonly characterName = signal<string | null>(null);
  /** Only true when WebGL is actually available — gates the <canvas> in the template. */
  readonly renderScene = isWebglAvailable();

  private renderer: RendererLifecycle | null = null;

  ngOnInit(): void {
    const characterId = this.route.snapshot.paramMap.get('characterId');
    if (!characterId) {
      return;
    }
    this.characters.list().subscribe({
      next: (list) => {
        const character = list.find((c) => c.id === characterId);
        this.characterName.set(character?.name ?? null);
      },
    });
  }

  ngAfterViewInit(): void {
    if (!this.renderScene || !this.canvasRef) {
      return;
    }
    const motionMode = detectMotionMode();
    this.renderer = new RendererLifecycle(
      this.canvasRef.nativeElement,
      motionMode,
      buildBaseCampScene(motionMode),
    );
    this.renderer.start();
  }

  ngOnDestroy(): void {
    this.renderer?.dispose();
    this.renderer = null;
  }
}
