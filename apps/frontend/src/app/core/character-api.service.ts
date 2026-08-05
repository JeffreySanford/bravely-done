import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiConfiguration } from '../api/api-configuration';
import { characterControllerArrive } from '../api/fn/characters/character-controller-arrive';
import { characterControllerChopTree } from '../api/fn/characters/character-controller-chop-tree';
import { characterControllerCreate } from '../api/fn/characters/character-controller-create';
import { characterControllerForage } from '../api/fn/characters/character-controller-forage';
import { characterControllerList } from '../api/fn/characters/character-controller-list';
import { characterControllerUpgradeWorkbench } from '../api/fn/characters/character-controller-upgrade-workbench';
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

  chopTree(id: string): Observable<CharacterDto> {
    return characterControllerChopTree(this.http, this.config.rootUrl, { id }).pipe(
      map((res) => res.body),
    );
  }

  forage(id: string): Observable<CharacterDto> {
    return characterControllerForage(this.http, this.config.rootUrl, { id }).pipe(
      map((res) => res.body),
    );
  }

  upgradeWorkbench(id: string): Observable<CharacterDto> {
    return characterControllerUpgradeWorkbench(this.http, this.config.rootUrl, { id }).pipe(
      map((res) => res.body),
    );
  }
}
