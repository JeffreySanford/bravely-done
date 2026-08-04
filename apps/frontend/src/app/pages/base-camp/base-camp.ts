import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CharacterApiService } from '../../core/character-api.service';
import { AnimationDirector } from '../../game-rendering/animation-director';
import { detectMotionMode } from '../../game-rendering/motion-mode';
import { RendererLifecycle } from '../../game-rendering/renderer-lifecycle';
import { isWebglAvailable } from '../../game-rendering/webgl-support';
import { buildBaseCampScene } from './base-camp-scene';
import { MAX_CONSTRUCTION_STAGE } from './construction-stage';

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

  private characterId: string | null = null;
  private firstArrival = false;
  private director: AnimationDirector | null = null;

  readonly characterName = signal<string | null>(null);
  readonly constructionStage = signal(0);
  readonly maxConstructionStage = MAX_CONSTRUCTION_STAGE;
  readonly advancingBridge = signal(false);
  /** Only true when WebGL is actually available — gates the <canvas> in the template. */
  readonly renderScene = isWebglAvailable();

  private renderer: RendererLifecycle | null = null;

  ngOnInit(): void {
    this.characterId = this.route.snapshot.paramMap.get('characterId');
    if (!this.characterId) {
      return;
    }
    this.characters.arrive(this.characterId).subscribe({
      next: ({ firstArrival, character }) => {
        this.firstArrival = firstArrival;
        this.characterName.set(character.name);
        this.constructionStage.set(character.campConstructionStage);
        this.mountRendererIfReady();
      },
    });
  }

  ngAfterViewInit(): void {
    this.mountRendererIfReady();
  }

  ngOnDestroy(): void {
    this.renderer?.dispose();
    this.renderer = null;
  }

  completeMockQuest(): void {
    if (!this.characterId || this.advancingBridge() || this.constructionStage() >= this.maxConstructionStage) {
      return;
    }
    this.advancingBridge.set(true);
    this.characters.completeMockQuest(this.characterId).subscribe({
      next: (character) => {
        this.constructionStage.set(character.campConstructionStage);
        this.advancingBridge.set(false);
        this.director?.dispatch({ type: 'questCompleted', constructionStage: character.campConstructionStage });
      },
      error: () => this.advancingBridge.set(false),
    });
  }

  private mountRendererIfReady(): void {
    if (!this.renderScene || !this.canvasRef || this.renderer || this.characterName() === null) {
      return;
    }
    const motionMode = detectMotionMode();
    const scene = buildBaseCampScene(motionMode, {
      firstArrival: this.firstArrival,
      constructionStage: this.constructionStage(),
    });
    this.director = scene.director;
    this.renderer = new RendererLifecycle(this.canvasRef.nativeElement, motionMode, scene.handlers);
    this.renderer.start();
  }
}
