import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiConfiguration } from '../api/api-configuration';
import { questControllerComplete } from '../api/fn/quests/quest-controller-complete';
import { questControllerContinue } from '../api/fn/quests/quest-controller-continue';
import { questControllerCreate } from '../api/fn/quests/quest-controller-create';
import { questControllerList } from '../api/fn/quests/quest-controller-list';
import { questControllerRetreat } from '../api/fn/quests/quest-controller-retreat';
import { questControllerStart } from '../api/fn/quests/quest-controller-start';
import { CompleteQuestResponseDto } from '../api/models/complete-quest-response-dto';
import { CreateQuestDto } from '../api/models/create-quest-dto';
import { QuestDto } from '../api/models/quest-dto';

@Injectable({ providedIn: 'root' })
export class QuestApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ApiConfiguration);

  list(characterId: string): Observable<QuestDto[]> {
    return questControllerList(this.http, this.config.rootUrl, { characterId }).pipe(
      map((res) => res.body),
    );
  }

  create(characterId: string, body: CreateQuestDto): Observable<QuestDto> {
    return questControllerCreate(this.http, this.config.rootUrl, { characterId, body }).pipe(
      map((res) => res.body),
    );
  }

  start(id: string): Observable<QuestDto> {
    return questControllerStart(this.http, this.config.rootUrl, { id }).pipe(
      map((res) => res.body),
    );
  }

  continue(id: string): Observable<QuestDto> {
    return questControllerContinue(this.http, this.config.rootUrl, { id }).pipe(
      map((res) => res.body),
    );
  }

  complete(id: string): Observable<CompleteQuestResponseDto> {
    return questControllerComplete(this.http, this.config.rootUrl, { id }).pipe(
      map((res) => res.body),
    );
  }

  retreat(id: string): Observable<QuestDto> {
    return questControllerRetreat(this.http, this.config.rootUrl, { id }).pipe(
      map((res) => res.body),
    );
  }
}
