import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthStateService } from '../../core/auth-state.service';
import { CharacterApiService } from '../../core/character-api.service';
import { CharacterDto } from '../../api/models/character-dto';

@Component({
  selector: 'app-character-list',
  imports: [RouterLink],
  templateUrl: './character-list.html',
  styleUrl: './character-list.scss',
})
export class CharacterList implements OnInit {
  private readonly characters = inject(CharacterApiService);
  private readonly auth = inject(AuthStateService);
  private readonly router = inject(Router);

  readonly items = signal<CharacterDto[]>([]);
  readonly loading = signal(true);

  ngOnInit(): void {
    this.characters.list().subscribe({
      next: (list) => {
        this.items.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  logout(): void {
    this.auth.logout().subscribe(() => this.router.navigateByUrl('/login'));
  }
}
