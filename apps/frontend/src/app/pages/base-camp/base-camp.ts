import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Actions, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { CharacterApiService } from '../../core/character-api.service';
import { AnimationDirector } from '../../game-rendering/animation-director';
import { detectMotionMode } from '../../game-rendering/motion-mode';
import { RendererLifecycle } from '../../game-rendering/renderer-lifecycle';
import { isWebglAvailable } from '../../game-rendering/webgl-support';
import { buildBaseCampScene } from './base-camp-scene';
import { MAX_CONSTRUCTION_STAGE } from './construction-stage';
import { CampActions } from '../../state/camp/camp.actions';
import { selectFirewoodCount, selectForageCount } from '../../state/camp/camp.reducer';
import { QuestsActions } from '../../state/quests/quests.actions';
import {
  selectCompletingQuestId,
  selectConstructionStage,
  selectLoading,
  selectQuests,
} from '../../state/quests/quests.reducer';

@Component({
  selector: 'app-base-camp',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './base-camp.html',
  styleUrl: './base-camp.scss',
})
export class BaseCamp implements OnInit, AfterViewInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly characters = inject(CharacterApiService);
  private readonly store = inject(Store);
  private readonly actions$ = inject(Actions);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild('sceneCanvas') private readonly canvasRef?: ElementRef<HTMLCanvasElement>;

  private characterId: string | null = null;
  private firstArrival = false;
  private director: AnimationDirector | null = null;

  readonly characterName = signal<string | null>(null);
  readonly maxConstructionStage = MAX_CONSTRUCTION_STAGE;
  /** Only true when WebGL is actually available — gates the <canvas> in the template. */
  readonly renderScene = isWebglAvailable();

  readonly quests = this.store.selectSignal(selectQuests);
  readonly constructionStage = this.store.selectSignal(selectConstructionStage);
  readonly questsLoading = this.store.selectSignal(selectLoading);
  readonly completingQuestId = this.store.selectSignal(selectCompletingQuestId);
  readonly firewoodCount = this.store.selectSignal(selectFirewoodCount);
  readonly forageCount = this.store.selectSignal(selectForageCount);

  readonly newQuestForm = new FormGroup({
    title: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2), Validators.maxLength(80)],
    }),
  });

  private renderer: RendererLifecycle | null = null;

  constructor() {
    this.actions$
      .pipe(ofType(QuestsActions.completeQuestSuccess), takeUntilDestroyed(this.destroyRef))
      .subscribe(({ constructionStage }) => {
        this.director?.dispatch({ type: 'questCompleted', constructionStage });
      });

    this.actions$
      .pipe(ofType(CampActions.chopTreeSuccess), takeUntilDestroyed(this.destroyRef))
      .subscribe(({ firewoodCount }) => {
        this.director?.dispatch({ type: 'firewoodGathered', totalFirewood: firewoodCount });
      });

    this.actions$
      .pipe(ofType(CampActions.forageSuccess), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.director?.dispatch({ type: 'forage' });
      });
  }

  ngOnInit(): void {
    this.characterId = this.route.snapshot.paramMap.get('characterId');
    if (!this.characterId) {
      return;
    }
    this.characters.arrive(this.characterId).subscribe({
      next: ({ firstArrival, character }) => {
        this.firstArrival = firstArrival;
        this.characterName.set(character.name);
        this.store.dispatch(
          QuestsActions.setCharacterContext({
            characterId: character.id,
            constructionStage: character.campConstructionStage,
          }),
        );
        this.store.dispatch(QuestsActions.loadQuests({ characterId: character.id }));
        this.store.dispatch(
          CampActions.setCharacterContext({
            characterId: character.id,
            firewoodCount: character.firewoodCount,
            forageCount: character.forageCount,
          }),
        );
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

  createQuest(): void {
    if (this.newQuestForm.invalid || !this.characterId) {
      this.newQuestForm.markAllAsTouched();
      return;
    }
    const { title } = this.newQuestForm.getRawValue();
    this.store.dispatch(QuestsActions.createQuest({ characterId: this.characterId, title }));
    this.newQuestForm.reset();
  }

  completeQuest(questId: string): void {
    this.store.dispatch(QuestsActions.completeQuest({ questId }));
  }

  private mountRendererIfReady(): void {
    if (!this.renderScene || !this.canvasRef || this.renderer || this.characterName() === null) {
      return;
    }
    // Non-null: mountRendererIfReady only proceeds once characterName() is
    // set, which ngOnInit only does after this.characterId was already
    // confirmed non-null.
    const characterId = this.characterId as string;
    const motionMode = detectMotionMode();
    const scene = buildBaseCampScene(motionMode, {
      firstArrival: this.firstArrival,
      constructionStage: this.constructionStage(),
      initialFirewoodCount: this.firewoodCount(),
      onChopTree: () => this.store.dispatch(CampActions.chopTree({ characterId })),
      onForage: () => this.store.dispatch(CampActions.forage({ characterId })),
    });
    this.director = scene.director;
    this.renderer = new RendererLifecycle(this.canvasRef.nativeElement, motionMode, scene.handlers);
    this.renderer.start();
  }
}
