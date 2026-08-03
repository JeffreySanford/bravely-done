import { UnauthorizedException } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Role } from '../generated/prisma/enums';

function buildReplyMock(): FastifyReply {
  return {
    setCookie: jest.fn(),
    clearCookie: jest.fn(),
  } as unknown as FastifyReply;
}

function buildRequestMock(cookies: Record<string, string> = {}): FastifyRequest {
  return {
    headers: { 'user-agent': 'jest' },
    cookies,
  } as unknown as FastifyRequest;
}

describe('AuthController', () => {
  const user = { id: 'user-1', email: 'a@example.com', role: Role.PLAYER, passwordHash: 'x' };
  const tokens = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    refreshTokenExpiresAt: new Date(),
  };

  function buildController() {
    const auth = {
      signup: jest.fn().mockResolvedValue({ user, tokens }),
      login: jest.fn().mockResolvedValue({ user, tokens }),
      refresh: jest.fn().mockResolvedValue({ user, tokens }),
      revokeSession: jest.fn().mockResolvedValue(undefined),
    } as unknown as AuthService;
    return { controller: new AuthController(auth), auth };
  }

  it('signup sets auth cookies and returns the public user shape', async () => {
    const { controller } = buildController();
    const res = buildReplyMock();

    const result = await controller.signup(
      { email: 'a@example.com', password: 'correcthorsebattery' },
      buildRequestMock(),
      res,
    );

    expect(result).toEqual({ id: user.id, email: user.email, role: user.role });
    expect(res.setCookie).toHaveBeenCalledWith('access_token', tokens.accessToken, expect.any(Object));
    expect(res.setCookie).toHaveBeenCalledWith('refresh_token', tokens.refreshToken, expect.any(Object));
  });

  it('login sets auth cookies and returns the public user shape', async () => {
    const { controller } = buildController();
    const res = buildReplyMock();

    const result = await controller.login(
      { email: 'a@example.com', password: 'correcthorsebattery' },
      buildRequestMock(),
      res,
    );

    expect(result).toEqual({ id: user.id, email: user.email, role: user.role });
  });

  it('refresh rejects when no refresh cookie is present', async () => {
    const { controller } = buildController();

    await expect(
      controller.refresh(buildRequestMock(), buildReplyMock()),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('refresh rotates the session when a refresh cookie is present', async () => {
    const { controller, auth } = buildController();
    const req = buildRequestMock({ refresh_token: 'raw-refresh-token' });

    await controller.refresh(req, buildReplyMock());

    expect(auth.refresh).toHaveBeenCalledWith('raw-refresh-token', 'jest');
  });

  it('logout clears cookies and revokes the session when present', async () => {
    const { controller, auth } = buildController();
    const req = buildRequestMock({ refresh_token: 'raw-refresh-token' });
    const res = buildReplyMock();

    const result = await controller.logout(req, res);

    expect(auth.revokeSession).toHaveBeenCalledWith('raw-refresh-token');
    expect(res.clearCookie).toHaveBeenCalledWith('access_token', expect.any(Object));
    expect(result).toEqual({ success: true });
  });

  it('logout is a no-op on revocation when no refresh cookie is present', async () => {
    const { controller, auth } = buildController();

    await controller.logout(buildRequestMock(), buildReplyMock());

    expect(auth.revokeSession).not.toHaveBeenCalled();
  });

  it('me returns the current JWT payload', () => {
    const { controller } = buildController();
    const payload = { sub: 'user-1', role: Role.PLAYER, iat: 0, exp: 0 };

    expect(controller.me(payload)).toBe(payload);
  });
});
