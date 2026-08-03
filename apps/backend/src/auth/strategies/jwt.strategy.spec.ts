import type { FastifyRequest } from 'fastify';
import { extractFromCookie, JwtStrategy } from './jwt.strategy';
import { Role } from '../../generated/prisma/enums';

describe('extractFromCookie', () => {
  it('returns the access_token cookie value when present', () => {
    const req = { cookies: { access_token: 'jwt-value' } } as unknown as FastifyRequest;
    expect(extractFromCookie(req)).toBe('jwt-value');
  });

  it('returns null when no cookies are present', () => {
    const req = { cookies: undefined } as unknown as FastifyRequest;
    expect(extractFromCookie(req)).toBeNull();
  });
});

describe('JwtStrategy', () => {
  it('returns the payload unchanged from validate()', () => {
    const strategy = new JwtStrategy();
    const payload = { sub: 'user-1', role: Role.PLAYER };

    expect(strategy.validate(payload)).toBe(payload);
  });

  it('fails fast at construction when JWT_SECRET is not configured', () => {
    const original = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;

    expect(() => new JwtStrategy()).toThrow('JWT_SECRET is not configured');

    process.env.JWT_SECRET = original;
  });
});
