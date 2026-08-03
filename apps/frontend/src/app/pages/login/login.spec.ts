import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Login } from './login';
import { AuthStateService } from '../../core/auth-state.service';
import { CharacterApiService } from '../../core/character-api.service';

describe('Login', () => {
  function setup(authState: Partial<AuthStateService>, characterApi: Partial<CharacterApiService>) {
    TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideRouter([]),
        { provide: AuthStateService, useValue: authState },
        { provide: CharacterApiService, useValue: characterApi },
      ],
    });
    const fixture = TestBed.createComponent(Login);
    const router = TestBed.inject(Router);
    jest.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    return { fixture, component: fixture.componentInstance, router };
  }

  it('does not submit an invalid form', () => {
    const login = jest.fn();
    const { component } = setup({ login }, { list: jest.fn() });

    component.submit();

    expect(login).not.toHaveBeenCalled();
  });

  it('routes to /characters when the user already has characters', () => {
    const login = jest.fn().mockReturnValue(of({ id: 'u1', email: 'a@example.com', role: 'PLAYER' }));
    const list = jest.fn().mockReturnValue(of([{ id: 'c1', name: 'Ember Scout', createdAt: '2026-01-01' }]));
    const { component, router } = setup({ login }, { list });

    component.form.setValue({ email: 'a@example.com', password: 'x' });
    component.submit();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/characters');
  });

  it('routes to /characters/new when the user has no characters yet', () => {
    const login = jest.fn().mockReturnValue(of({ id: 'u1', email: 'a@example.com', role: 'PLAYER' }));
    const list = jest.fn().mockReturnValue(of([]));
    const { component, router } = setup({ login }, { list });

    component.form.setValue({ email: 'a@example.com', password: 'x' });
    component.submit();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/characters/new');
  });

  it('falls back to /characters/new if the character list request fails', () => {
    const login = jest.fn().mockReturnValue(of({ id: 'u1', email: 'a@example.com', role: 'PLAYER' }));
    const list = jest.fn().mockReturnValue(throwError(() => new Error('boom')));
    const { component, router } = setup({ login }, { list });

    component.form.setValue({ email: 'a@example.com', password: 'x' });
    component.submit();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/characters/new');
  });

  it('shows an error message on invalid credentials', () => {
    const login = jest.fn().mockReturnValue(throwError(() => new Error('401')));
    const { component } = setup({ login }, { list: jest.fn() });

    component.form.setValue({ email: 'a@example.com', password: 'wrong' });
    component.submit();

    expect(component.errorMessage()).toBe('Incorrect email or password.');
    expect(component.submitting()).toBe(false);
  });
});
