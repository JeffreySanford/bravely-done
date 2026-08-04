import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { CharacterCreate } from './character-create';
import { CharacterApiService } from '../../core/character-api.service';

describe('CharacterCreate', () => {
  function setup(characterApi: Partial<CharacterApiService>) {
    TestBed.configureTestingModule({
      imports: [CharacterCreate],
      providers: [provideRouter([]), { provide: CharacterApiService, useValue: characterApi }],
    });
    const fixture = TestBed.createComponent(CharacterCreate);
    const router = TestBed.inject(Router);
    jest.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    return { component: fixture.componentInstance, router };
  }

  it('does not submit an invalid form', () => {
    const create = jest.fn();
    const { component } = setup({ create });

    component.submit();

    expect(create).not.toHaveBeenCalled();
  });

  it('shows the success state then navigates to Base Camp for the new character', () => {
    jest.useFakeTimers();
    const create = jest.fn().mockReturnValue(of({ id: 'c1', name: 'Ember Scout', createdAt: '2026-01-01' }));
    const { component, router } = setup({ create });

    component.form.setValue({ name: 'Ember Scout' });
    component.submit();

    expect(create).toHaveBeenCalledWith({ name: 'Ember Scout' });
    expect(component.created()).toBe(true);
    expect(router.navigateByUrl).not.toHaveBeenCalled();

    jest.advanceTimersByTime(900);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/basecamp/c1');
    jest.useRealTimers();
  });

  it('shows an error message on failure', () => {
    const create = jest.fn().mockReturnValue(throwError(() => new Error('boom')));
    const { component } = setup({ create });

    component.form.setValue({ name: 'Ember Scout' });
    component.submit();

    expect(component.errorMessage()).toContain('Could not create');
    expect(component.created()).toBe(false);
  });
});
