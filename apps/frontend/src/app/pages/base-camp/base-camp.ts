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
import { SprintDto } from '../../api/models/sprint-dto';
import { SprintsActions } from '../../state/sprints/sprints.actions';
import {
  selectByQuestId as selectSprintsByQuestId,
  selectError as selectSprintsError,
  selectStartingQuestId,
  selectTransitioningSprintId,
} from '../../state/sprints/sprints.reducer';
import { SPRINT_DURATION_PRESETS_SECONDS, formatSprintDuration } from './sprint-duration';

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

  /** The board defaults to closed — it's an on-demand overlay (a "Quests"
   * toggle button) rather than an always-visible panel, so it doesn't
   * compete with the 3D scene for screen space when the player isn't
   * actively managing quests. */
  readonly boardOpen = signal(false);

  readonly quests = this.store.selectSignal(selectQuests);
  /** The Kanban board's four columns — Backlog/In Progress/Done/Retreated —
   * derived from the same quest list the old flat panel used, just grouped
   * by status instead of rendered as one list. */
  readonly backlogQuests = computed(() => this.quests().filter((q) => q.status === 'OPEN'));
  readonly inProgressQuests = computed(() => this.quests().filter((q) => q.status === 'IN_PROGRESS'));
  readonly doneQuests = computed(() => this.quests().filter((q) => q.status === 'COMPLETED'));
  readonly retreatedQuests = computed(() => this.quests().filter((q) => q.status === 'RETREATED'));
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

  readonly sprintsByQuestId = this.store.selectSignal(selectSprintsByQuestId);
  readonly startingSprintQuestId = this.store.selectSignal(selectStartingQuestId);
  readonly transitioningSprintId = this.store.selectSignal(selectTransitioningSprintId);
  readonly sprintsError = this.store.selectSignal(selectSprintsError);
  readonly sprintDurationPresets = SPRINT_DURATION_PRESETS_SECONDS;
  readonly formatSprintDuration = formatSprintDuration;
  /** Ticks once a second purely to re-render the elapsed/remaining sprint
   * display — the authoritative elapsed time is always recomputed from the
   * sprint's own timestamps (see elapsedSecondsFor), never accumulated
   * client-side, so a missed tick or a reload never desyncs it. */
  private readonly now = signal(Date.now());
  private nowIntervalId: ReturnType<typeof setInterval> | null = null;

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

    // Recovers any in-flight sprint after a reload: every time the quest
    // list loads, fetch sprints for whichever quests are already In
    // Progress so a card can reconstruct its timer from real timestamps
    // instead of starting blank.
    this.actions$
      .pipe(ofType(QuestsActions.loadQuestsSuccess), takeUntilDestroyed(this.destroyRef))
      .subscribe(({ quests }) => {
        quests
          .filter((quest) => quest.status === 'IN_PROGRESS')
          .forEach((quest) => this.store.dispatch(SprintsActions.loadSprints({ questId: quest.id })));
      });

    this.nowIntervalId = setInterval(() => this.now.set(Date.now()), 1000);
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
    if (this.nowIntervalId !== null) {
      clearInterval(this.nowIntervalId);
    }
  }

  toggleBoard(): void {
    this.boardOpen.update((open) => !open);
  }

  closeBoard(): void {
    this.boardOpen.set(false);
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

  startQuest(questId: string): void {
    this.store.dispatch(QuestsActions.startQuest({ questId }));
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

  sprintFor(questId: string): SprintDto | undefined {
    return this.sprintsByQuestId()[questId];
  }

  /** Real elapsed active time, recomputed the same way the backend does
   * (see SprintService.elapsedActiveSeconds) — this is a display-only
   * mirror; the server is what actually gates completion, so an
   * out-of-sync client clock can at worst show a stale number for a
   * moment, never grant a reward it shouldn't. */
  elapsedSecondsFor(sprint: SprintDto): number {
    const now = this.now();
    const startedAtMs = Date.parse(sprint.startedAt);
    const livePauseMs = sprint.status === 'PAUSED' && sprint.pausedAt ? now - Date.parse(sprint.pausedAt) : 0;
    const totalPausedMs = sprint.pausedSeconds * 1000 + livePauseMs;
    return Math.max(Math.floor((now - startedAtMs - totalPausedMs) / 1000), 0);
  }

  remainingSecondsFor(sprint: SprintDto): number {
    return Math.max(sprint.targetSeconds - this.elapsedSecondsFor(sprint), 0);
  }

  canCompleteSprint(sprint: SprintDto): boolean {
    return this.elapsedSecondsFor(sprint) >= sprint.targetSeconds;
  }

  startSprint(questId: string, targetSeconds: number): void {
    this.store.dispatch(SprintsActions.startSprint({ questId, targetSeconds }));
  }

  pauseSprint(sprintId: string): void {
    this.store.dispatch(SprintsActions.pauseSprint({ sprintId }));
  }

  resumeSprint(sprintId: string): void {
    this.store.dispatch(SprintsActions.resumeSprint({ sprintId }));
  }

  completeSprint(sprintId: string): void {
    this.store.dispatch(SprintsActions.completeSprint({ sprintId }));
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
