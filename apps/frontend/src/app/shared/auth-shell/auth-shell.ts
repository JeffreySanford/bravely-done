import { Component, input } from '@angular/core';

@Component({
  selector: 'app-auth-shell',
  templateUrl: './auth-shell.html',
  styleUrl: './auth-shell.scss',
})
export class AuthShell {
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
}
