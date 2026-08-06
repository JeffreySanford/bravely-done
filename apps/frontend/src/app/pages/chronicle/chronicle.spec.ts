import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { provideRouter } from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { provideStore } from '@ngrx/store';
import { of, throwError } from 'rxjs';
import { ApiConfiguration } from '../../api/api-configuration';
import { ChronicleApiService } from '../../core/chronicle-api.service';
import { ChronicleEffects } from '../../state/chronicle/chronicle.effects';
import { chronicleFeature } from '../../state/chronicle/chronicle.reducer';
import { Chronicle } from './chronicle';

const chronicle = {
  characterId: 'c1',
  from: '2026-07-31T00:00:00.000Z',
  to: '2026-08-06T12:00:00.000Z',
  days: 7,
  questsCompleted: 1,
  questsSplit: 1,
  questsRetreated: 1,
  questsContinued: 1,
  sprintsCompleted: 1,
  focusMinutes: 15,
  encountersCompleted: 1,
  entries: [
    {
      kind: 'QUEST_COMPLETED' as const,
      title: 'Answer three emails',
      at: '2026-08-06T10:00:00.000Z',
    },
    {
      kind: 'QUEST_RETREATED' as const,
      title: 'Take a rest day',
      at: '2026-08-06T09:00:00.000Z',
    },
  ],
};

describe('Chronicle', () => {
  function setup(forCharacter: jest.Mock): ComponentFixture<Chronicle> {
    TestBed.configureTestingModule({
      imports: [Chronicle],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideStore({ [chronicleFeature.name]: chronicleFeature.reducer }),
        provideEffects(ChronicleEffects),
        { provide: ApiConfiguration, useValue: { rootUrl: 'http://test' } },
        { provide: ChronicleApiService, useValue: { forCharacter } },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: new Map([['characterId', 'c1']]) },
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(Chronicle);
    fixture.detectChanges();
    return fixture;
  }

  it('loads the chronicle for the routed character on init', () => {
    const forCharacter = jest.fn().mockReturnValue(of(chronicle));

    const fixture = setup(forCharacter);

    expect(forCharacter).toHaveBeenCalledWith('c1');
    expect(fixture.componentInstance.chronicle()).toEqual(chronicle);
  });

  it('renders each entry with a human-readable label and its title', () => {
    const fixture = setup(jest.fn().mockReturnValue(of(chronicle)));

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Completed');
    expect(text).toContain('Answer three emails');
    expect(text).toContain('Take a rest day');
  });

  it('labels a retreat without judgement — it is legitimate play, not failure', () => {
    const fixture = setup(jest.fn().mockReturnValue(of(chronicle)));

    expect(fixture.componentInstance.labelFor('QUEST_RETREATED')).toBe(
      'Stepped back from',
    );
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).not.toMatch(/failed|abandoned|gave up/i);
  });

  it('reports a quiet week as quiet, with nothing lost', () => {
    const fixture = setup(
      jest.fn().mockReturnValue(of({ ...chronicle, entries: [] })),
    );

    expect(fixture.componentInstance.isQuiet()).toBe(true);
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('quiet week');
    expect(text).toContain('nothing was lost');
  });

  it('does not claim a quiet week while the request is still in flight', () => {
    // Never emits, so the load stays pending.
    const fixture = setup(jest.fn().mockReturnValue(of()));

    expect(fixture.componentInstance.chronicle()).toBeNull();
    expect(fixture.componentInstance.isQuiet()).toBe(false);
  });

  it('surfaces an error without blanking the page', () => {
    const fixture = setup(
      jest.fn().mockReturnValue(throwError(() => new Error('boom'))),
    );

    expect(fixture.componentInstance.error()).toBeTruthy();
  });
});
