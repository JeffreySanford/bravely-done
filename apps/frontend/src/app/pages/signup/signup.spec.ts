import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Signup } from './signup';
import { AuthStateService } from '../../core/auth-state.service';

describe('Signup', () => {
  function setup(authState: Partial<AuthStateService>) {
    TestBed.configureTestingModule({
      imports: [Signup],
      providers: [provideRouter([]), { provide: AuthStateService, useValue: authState }],
    });
    const fixture = TestBed.createComponent(Signup);
    const router = TestBed.inject(Router);
    jest.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    return { fixture, component: fixture.componentInstance, router };
  }

  it('does not submit an invalid form', () => {
    const signup = jest.fn();
    const { component } = setup({ signup });

    component.submit();

    expect(signup).not.toHaveBeenCalled();
    expect(component.form.touched).toBe(true);
  });

  it('navigates to character creation on success', () => {
    const signup = jest.fn().mockReturnValue(of({ id: 'u1', email: 'a@example.com', role: 'PLAYER' }));
    const { component, router } = setup({ signup });

    component.form.setValue({ email: 'a@example.com', password: 'correcthorsebattery' });
    component.submit();

    expect(signup).toHaveBeenCalledWith('a@example.com', 'correcthorsebattery');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/characters/new');
  });

  it('shows a specific message for a duplicate email (409)', () => {
    const signup = jest.fn().mockReturnValue(throwError(() => ({ status: 409 })));
    const { component } = setup({ signup });

    component.form.setValue({ email: 'a@example.com', password: 'correcthorsebattery' });
    component.submit();

    expect(component.errorMessage()).toContain('already registered');
    expect(component.submitting()).toBe(false);
  });

  it('shows a generic message for other failures', () => {
    const signup = jest.fn().mockReturnValue(throwError(() => ({ status: 500 })));
    const { component } = setup({ signup });

    component.form.setValue({ email: 'a@example.com', password: 'correcthorsebattery' });
    component.submit();

    expect(component.errorMessage()).toContain('Something went wrong');
  });

  it('shows a generic message when the error has no status at all', () => {
    const signup = jest.fn().mockReturnValue(throwError(() => new Error('network down')));
    const { component } = setup({ signup });

    component.form.setValue({ email: 'a@example.com', password: 'correcthorsebattery' });
    component.submit();

    expect(component.errorMessage()).toContain('Something went wrong');
  });

  it('shows a generic message when the error itself is nullish', () => {
    const signup = jest.fn().mockReturnValue(throwError(() => undefined));
    const { component } = setup({ signup });

    component.form.setValue({ email: 'a@example.com', password: 'correcthorsebattery' });
    component.submit();

    expect(component.errorMessage()).toContain('Something went wrong');
  });
});
