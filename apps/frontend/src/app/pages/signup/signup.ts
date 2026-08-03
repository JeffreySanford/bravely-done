import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthStateService } from '../../core/auth-state.service';
import { AuthShell } from '../../shared/auth-shell/auth-shell';

@Component({
  selector: 'app-signup',
  imports: [ReactiveFormsModule, RouterLink, AuthShell],
  templateUrl: './signup.html',
  styleUrl: './signup.scss',
})
export class Signup {
  private readonly auth = inject(AuthStateService);
  private readonly router = inject(Router);

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(12)] }),
  });

  submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    this.submitting.set(true);
    const { email, password } = this.form.getRawValue();

    this.auth.signup(email, password).subscribe({
      next: () => this.router.navigateByUrl('/characters/new'),
      error: (err) => {
        this.submitting.set(false);
        this.errorMessage.set(
          err?.status === 409
            ? 'That email is already registered — try logging in instead.'
            : 'Something went wrong creating your account. Please try again.',
        );
      },
    });
  }
}
