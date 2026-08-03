import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CharacterApiService } from '../../core/character-api.service';
import { AuthShell } from '../../shared/auth-shell/auth-shell';

@Component({
  selector: 'app-character-create',
  imports: [ReactiveFormsModule, AuthShell],
  templateUrl: './character-create.html',
  styleUrl: './character-create.scss',
})
export class CharacterCreate {
  private readonly characters = inject(CharacterApiService);
  private readonly router = inject(Router);

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly created = signal(false);

  readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2), Validators.maxLength(40)],
    }),
  });

  submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    this.submitting.set(true);
    const { name } = this.form.getRawValue();

    this.characters.create({ name }).subscribe({
      next: () => {
        this.created.set(true);
        setTimeout(() => this.router.navigateByUrl('/characters'), 900);
      },
      error: () => {
        this.submitting.set(false);
        this.errorMessage.set('Could not create that character. Please try again.');
      },
    });
  }
}
