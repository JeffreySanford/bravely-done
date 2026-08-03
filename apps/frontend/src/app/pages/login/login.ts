import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthStateService } from '../../core/auth-state.service';
import { CharacterApiService } from '../../core/character-api.service';
import { AuthShell } from '../../shared/auth-shell/auth-shell';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, AuthShell],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly auth = inject(AuthStateService);
  private readonly characters = inject(CharacterApiService);
  private readonly router = inject(Router);

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    this.submitting.set(true);
    const { email, password } = this.form.getRawValue();

    this.auth.login(email, password).subscribe({
      next: () => this.routeAfterLogin(),
      error: () => {
        this.submitting.set(false);
        this.errorMessage.set('Incorrect email or password.');
      },
    });
  }

  private routeAfterLogin(): void {
    // Character select (Three.js) is a later milestone; for now, a returning
    // user with no characters still has to complete the mandatory first step.
    this.characters.list().subscribe({
      next: (list) => this.router.navigateByUrl(list.length > 0 ? '/characters' : '/characters/new'),
      error: () => this.router.navigateByUrl('/characters/new'),
    });
  }
}
