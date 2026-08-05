import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiConfiguration } from '../api/api-configuration';
import { sprintControllerComplete } from '../api/fn/sprints/sprint-controller-complete';
import { sprintControllerList } from '../api/fn/sprints/sprint-controller-list';
import { sprintControllerPause } from '../api/fn/sprints/sprint-controller-pause';
import { sprintControllerResume } from '../api/fn/sprints/sprint-controller-resume';
import { sprintControllerStart } from '../api/fn/sprints/sprint-controller-start';
import { CompleteSprintResponseDto } from '../api/models/complete-sprint-response-dto';
import { CreateSprintDto } from '../api/models/create-sprint-dto';
import { SprintDto } from '../api/models/sprint-dto';

@Injectable({ providedIn: 'root' })
export class SprintApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ApiConfiguration);

  start(questId: string, body: CreateSprintDto): Observable<SprintDto> {
    return sprintControllerStart(this.http, this.config.rootUrl, { questId, body }).pipe(
      map((res) => res.body),
    );
  }

  list(questId: string): Observable<SprintDto[]> {
    return sprintControllerList(this.http, this.config.rootUrl, { questId }).pipe(
      map((res) => res.body),
    );
  }

  pause(id: string): Observable<SprintDto> {
    return sprintControllerPause(this.http, this.config.rootUrl, { id }).pipe(
      map((res) => res.body),
    );
  }

  resume(id: string): Observable<SprintDto> {
    return sprintControllerResume(this.http, this.config.rootUrl, { id }).pipe(
      map((res) => res.body),
    );
  }

  complete(id: string): Observable<CompleteSprintResponseDto> {
    return sprintControllerComplete(this.http, this.config.rootUrl, { id }).pipe(
      map((res) => res.body),
    );
  }
}
