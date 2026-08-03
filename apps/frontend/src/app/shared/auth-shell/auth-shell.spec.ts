import { TestBed } from '@angular/core/testing';
import { AuthShell } from './auth-shell';

describe('AuthShell', () => {
  it('renders the given title and subtitle', () => {
    TestBed.configureTestingModule({ imports: [AuthShell] });
    const fixture = TestBed.createComponent(AuthShell);
    fixture.componentRef.setInput('title', 'Welcome back');
    fixture.componentRef.setInput('subtitle', 'Return to camp');
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Welcome back');
    expect(text).toContain('Return to camp');
  });

  it('omits the subtitle element when none is given', () => {
    TestBed.configureTestingModule({ imports: [AuthShell] });
    const fixture = TestBed.createComponent(AuthShell);
    fixture.componentRef.setInput('title', 'Welcome back');
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('.panel__subtitle')).toBeNull();
  });
});
