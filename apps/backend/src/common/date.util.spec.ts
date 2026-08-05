import { isSameUtcDay, utcDayStart } from './date.util';

describe('utcDayStart', () => {
  it('truncates a UTC date-time down to midnight UTC', () => {
    expect(utcDayStart(new Date('2026-08-05T23:59:59.999Z'))).toEqual(new Date('2026-08-05T00:00:00.000Z'));
  });
});

describe('isSameUtcDay', () => {
  it('is true for two timestamps on the same UTC day', () => {
    expect(isSameUtcDay(new Date('2026-08-05T00:00:00.000Z'), new Date('2026-08-05T23:59:59.999Z'))).toBe(true);
  });

  it('is false for timestamps on different UTC days', () => {
    expect(isSameUtcDay(new Date('2026-08-05T23:59:59.999Z'), new Date('2026-08-06T00:00:00.000Z'))).toBe(false);
  });

  it('is false when the date is null or undefined', () => {
    expect(isSameUtcDay(null, new Date())).toBe(false);
    expect(isSameUtcDay(undefined, new Date())).toBe(false);
  });
});
