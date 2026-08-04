import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiConfiguration } from '../api/api-configuration';
import { characterControllerArrive } from '../api/fn/characters/character-controller-arrive';
import { characterControllerCompleteMockQuest } from '../api/fn/characters/character-controller-complete-mock-quest';
import { characterControllerCreate } from '../api/fn/characters/character-controller-create';
import { characterControllerList } from '../api/fn/characters/character-controller-list';
import { ArriveResponseDto } from '../api/models/arrive-response-dto';
import { CharacterDto } from '../api/models/character-dto';
import { CreateCharacterDto } from '../api/models/create-character-dto';

@Injectable({ providedIn: 'root' })
export class CharacterApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ApiConfiguration);

  list(): Observable<CharacterDto[]> {
    return characterControllerList(this.http, this.config.rootUrl).pipe(map((res) => res.body));
  }

  create(body: CreateCharacterDto): Observable<CharacterDto> {
    return characterControllerCreate(this.http, this.config.rootUrl, { body }).pipe(
      map((res) => res.body),
    );
  }

  arrive(id: string): Observable<ArriveResponseDto> {
    return characterControllerArrive(this.http, this.config.rootUrl, { id }).pipe(
      map((res) => res.body),
    );
  }

  completeMockQuest(id: string): Observable<CharacterDto> {
    return characterControllerCompleteMockQuest(this.http, this.config.rootUrl, { id }).pipe(
      map((res) => res.body),
    );
  }
}
