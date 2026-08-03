import type { CookieSerializeOptions } from '@fastify/cookie';
import type { FastifyReply } from 'fastify';
import { AuthTokens } from './auth.service';

const baseOptions: CookieSerializeOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
};

export function setAuthCookies(res: FastifyReply, tokens: AuthTokens): void {
  res.setCookie('access_token', tokens.accessToken, {
    ...baseOptions,
    maxAge: 15 * 60, // seconds
  });
  res.setCookie('refresh_token', tokens.refreshToken, {
    ...baseOptions,
    expires: tokens.refreshTokenExpiresAt,
  });
}

export function clearAuthCookies(res: FastifyReply): void {
  res.clearCookie('access_token', baseOptions);
  res.clearCookie('refresh_token', baseOptions);
}
