import type { FastifyReply } from 'fastify';
import { clearAuthCookies, setAuthCookies } from './cookie.util';

function buildReplyMock(): FastifyReply {
  return {
    setCookie: jest.fn(),
    clearCookie: jest.fn(),
  } as unknown as FastifyReply;
}

describe('cookie.util', () => {
  it('sets both access and refresh cookies with httpOnly options', () => {
    const res = buildReplyMock();
    const refreshTokenExpiresAt = new Date();

    setAuthCookies(res, { accessToken: 'a', refreshToken: 'r', refreshTokenExpiresAt });

    expect(res.setCookie).toHaveBeenCalledWith(
      'access_token',
      'a',
      expect.objectContaining({ httpOnly: true, maxAge: 15 * 60 }),
    );
    expect(res.setCookie).toHaveBeenCalledWith(
      'refresh_token',
      'r',
      expect.objectContaining({ httpOnly: true, expires: refreshTokenExpiresAt }),
    );
  });

  it('clears both cookies', () => {
    const res = buildReplyMock();

    clearAuthCookies(res);

    expect(res.clearCookie).toHaveBeenCalledWith('access_token', expect.any(Object));
    expect(res.clearCookie).toHaveBeenCalledWith('refresh_token', expect.any(Object));
  });
});
