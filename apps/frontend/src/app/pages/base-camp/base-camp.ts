import {
  AfterViewInit,
  Component,
  computed,
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

/** Purely a display convenience — the backend only tracks raw xp. Deliberately
 * simple (linear, no diminishing curve) until there's an actual leveling
 * system with per-level unlocks to design around. */
const XP_PER_LEVEL = 100;
import { CampActions } from '../../state/camp/camp.actions';
import {
  selectError as selectCampError,
  selectFirewoodCount,
  selectForageCount,
  selectUpgradingWorkbench,
  selectWorkbenchLevel,
} from '../../state/camp/camp.reducer';
import { QuestsActions } from '../../state/quests/quests.actions';
import { WORKBENCH_MAX_LEVEL, WORKBENCH_UPGRADE_COSTS } from './workbench-level';
import {
  selectCoins,
  selectConstructionStage,
  selectLoading,
  selectQuests,
  selectResolvingQuestId,
  selectXp,
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
  readonly resolvingQuestId = this.store.selectSignal(selectResolvingQuestId);
  readonly xp = this.store.selectSignal(selectXp);
  readonly coins = this.store.selectSignal(selectCoins);
  readonly level = computed(() => Math.floor(this.xp() / XP_PER_LEVEL) + 1);
  readonly firewoodCount = this.store.selectSignal(selectFirewoodCount);
  readonly forageCount = this.store.selectSignal(selectForageCount);
  readonly workbenchLevel = this.store.selectSignal(selectWorkbenchLevel);
  readonly upgradingWorkbench = this.store.selectSignal(selectUpgradingWorkbench);
  readonly campError = this.store.selectSignal(selectCampError);
  readonly workbenchMaxLevel = WORKBENCH_MAX_LEVEL;
  readonly nextWorkbenchCost = computed(() => WORKBENCH_UPGRADE_COSTS[this.workbenchLevel()] ?? null);
  readonly canAffordWorkbenchUpgrade = computed(() => {
    const cost = this.nextWorkbenchCost();
    return cost !== null && this.coins() >= cost;
  });

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
      .subscribe(({ forageCount }) => {
        this.director?.dispatch({ type: 'forage' });
        this.director?.dispatch({ type: 'forageGathered', totalForage: forageCount });
      });

    this.actions$
      .pipe(ofType(CampActions.upgradeWorkbenchSuccess), takeUntilDestroyed(this.destroyRef))
      .subscribe(({ workbenchLevel }) => {
        this.director?.dispatch({ type: 'workbenchUpgraded', workbenchLevel });
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
            xp: character.xp,
            coins: character.coins,
          }),
        );
        this.store.dispatch(QuestsActions.loadQuests({ characterId: character.id }));
        this.store.dispatch(
          CampActions.setCharacterContext({
            characterId: character.id,
            firewoodCount: character.firewoodCount,
            forageCount: character.forageCount,
            workbenchLevel: character.workbenchLevel,
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

  retreatQuest(questId: string): void {
    this.store.dispatch(QuestsActions.retreatQuest({ questId }));
  }

  upgradeWorkbench(): void {
    if (!this.characterId) {
      return;
    }
    this.store.dispatch(CampActions.upgradeWorkbench({ characterId: this.characterId }));
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
      initialForageCount: this.forageCount(),
      initialWorkbenchLevel: this.workbenchLevel(),
      onChopTree: () => this.store.dispatch(CampActions.chopTree({ characterId })),
      onForage: () => this.store.dispatch(CampActions.forage({ characterId })),
      onUpgradeWorkbench: () => this.upgradeWorkbench(),
    });
    this.director = scene.director;
    this.renderer = new RendererLifecycle(this.canvasRef.nativeElement, motionMode, scene.handlers);
    this.renderer.start();
  }
}
