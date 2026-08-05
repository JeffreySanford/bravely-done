import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiConfiguration } from '../api/api-configuration';
import { encounterControllerComplete } from '../api/fn/encounters/encounter-controller-complete';
import { encounterControllerCreate } from '../api/fn/encounters/encounter-controller-create';
import { encounterControllerList } from '../api/fn/encounters/encounter-controller-list';
import { CompleteEncounterResponseDto } from '../api/models/complete-encounter-response-dto';
import { CreateEncounterDto } from '../api/models/create-encounter-dto';
import { EncounterDto } from '../api/models/encounter-dto';

@Injectable({ providedIn: 'root' })
export class EncounterApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ApiConfiguration);

  create(questId: string, body: CreateEncounterDto): Observable<EncounterDto> {
    return encounterControllerCreate(this.http, this.config.rootUrl, { questId, body }).pipe(
      map((res) => res.body),
    );
  }

  list(questId: string): Observable<EncounterDto[]> {
    return encounterControllerList(this.http, this.config.rootUrl, { questId }).pipe(
      map((res) => res.body),
    );
  }

  complete(id: string): Observable<CompleteEncounterResponseDto> {
    return encounterControllerComplete(this.http, this.config.rootUrl, { id }).pipe(
      map((res) => res.body),
    );
  }
}
