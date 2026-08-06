import { Component, OnInit, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { ChronicleEntryDto } from '../../api/models/chronicle-entry-dto';
import { ChronicleActions } from '../../state/chronicle/chronicle.actions';
import {
  selectChronicle,
  selectError,
  selectLoading,
} from '../../state/chronicle/chronicle.reducer';

/** Player-facing wording for each entry kind. Deliberately plain and
 * non-judgemental — "Stepped back from" rather than "Abandoned", because
 * rewards-retention.md's ethical rules make retreating legitimate play, and
 * a summary that scolds is worse than no summary. */
const ENTRY_LABELS: Record<ChronicleEntryDto['kind'], string> = {
  QUEST_COMPLETED: 'Completed',
  QUEST_SPLIT: 'Split',
  QUEST_RETREATED: 'Stepped back from',
  QUEST_CONTINUED: 'Continued',
  SPRINT_COMPLETED: 'Finished a sprint on',
  ENCOUNTER_COMPLETED: 'Took a step on',
};

@Component({
  selector: 'app-chronicle',
  imports: [RouterLink, DatePipe],
  templateUrl: './chronicle.html',
  styleUrl: './chronicle.scss',
})
export class Chronicle implements OnInit {
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);

  readonly characterId = this.route.snapshot.paramMap.get('characterId') ?? '';
  readonly chronicle = this.store.selectSignal(selectChronicle);
  readonly loading = this.store.selectSignal(selectLoading);
  readonly error = this.store.selectSignal(selectError);

  /** True only once a load has genuinely returned nothing — distinct from
   * "still loading", so a quiet week and a pending request never show the
   * same thing. */
  readonly isQuiet = computed(() => {
    const chronicle = this.chronicle();
    return chronicle !== null && chronicle.entries.length === 0;
  });

  ngOnInit(): void {
    if (this.characterId) {
      this.store.dispatch(
        ChronicleActions.loadChronicle({ characterId: this.characterId }),
      );
    }
  }

  labelFor(kind: ChronicleEntryDto['kind']): string {
    return ENTRY_LABELS[kind] ?? 'Worked on';
  }
}
