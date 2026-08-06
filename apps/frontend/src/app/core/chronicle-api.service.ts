import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiConfiguration } from '../api/api-configuration';
import { chronicleControllerForCharacter } from '../api/fn/chronicle/chronicle-controller-for-character';
import { ChronicleDto } from '../api/models/chronicle-dto';

@Injectable({ providedIn: 'root' })
export class ChronicleApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ApiConfiguration);

  /** `days` is left to the backend's default (a week) unless a caller asks
   * for something else — the Chronicle is the weekly artifact. */
  forCharacter(characterId: string, days?: number): Observable<ChronicleDto> {
    return chronicleControllerForCharacter(this.http, this.config.rootUrl, {
      characterId,
      days,
    }).pipe(map((res) => res.body));
  }
}
