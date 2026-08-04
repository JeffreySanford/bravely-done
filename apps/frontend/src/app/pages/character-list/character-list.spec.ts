import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { CharacterList } from './character-list';
import { AuthStateService } from '../../core/auth-state.service';
import { CharacterApiService } from '../../core/character-api.service';

describe('CharacterList', () => {
  function setup(characterApi: Partial<CharacterApiService>, authState: Partial<AuthStateService> = {}) {
    TestBed.configureTestingModule({
      imports: [CharacterList],
      providers: [
        provideRouter([]),
        { provide: CharacterApiService, useValue: characterApi },
        { provide: AuthStateService, useValue: authState },
      ],
    });
    const fixture = TestBed.createComponent(CharacterList);
    const router = TestBed.inject(Router);
    jest.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    return { fixture, component: fixture.componentInstance, router };
  }

  it('loads the character list on init', () => {
    const list = jest.fn().mockReturnValue(of([{ id: 'c1', name: 'Ember Scout', createdAt: '2026-01-01' }]));
    const { component } = setup({ list });

    component.ngOnInit();

    expect(component.items()).toEqual([{ id: 'c1', name: 'Ember Scout', createdAt: '2026-01-01' }]);
    expect(component.loading()).toBe(false);
  });

  it('stops loading even if the request fails', () => {
    const list = jest.fn().mockReturnValue(throwError(() => new Error('boom')));
    const { component } = setup({ list });

    component.ngOnInit();

    expect(component.loading()).toBe(false);
    expect(component.items()).toEqual([]);
  });

  it('logs out and navigates to /login', () => {
    const list = jest.fn().mockReturnValue(of([]));
    const logout = jest.fn().mockReturnValue(of(undefined));
    const { component, router } = setup({ list }, { logout });

    component.logout();

    expect(logout).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });

  it('does not mount a renderer when WebGL is unavailable (e.g. jsdom)', () => {
    const list = jest.fn().mockReturnValue(of([]));
    const { component } = setup({ list });

    expect(component.renderScene).toBe(false);
    expect(() => component.ngAfterViewInit()).not.toThrow();
  });

  it('disposing is a no-op when no renderer was ever mounted', () => {
    const list = jest.fn().mockReturnValue(of([]));
    const { component } = setup({ list });

    expect(() => component.ngOnDestroy()).not.toThrow();
  });
});
