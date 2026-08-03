import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import { Role } from '../generated/prisma/enums';

function buildPrismaMock() {
  return {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    session: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };
}

describe('AuthService', () => {
  let service: AuthService;
  let prisma: ReturnType<typeof buildPrismaMock>;

  beforeEach(() => {
    prisma = buildPrismaMock();
    const jwt = new JwtService({ secret: 'test-secret' });
    service = new AuthService(prisma as unknown as PrismaService, jwt);
  });

  describe('signup', () => {
    it('creates a user with a hashed password and issues tokens', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      const created = { id: 'user-1', email: 'a@example.com', passwordHash: 'hash', role: Role.PLAYER };
      prisma.user.create.mockResolvedValue(created);
      prisma.session.create.mockResolvedValue({});

      const { user, tokens } = await service.signup({ email: 'a@example.com', password: 'correcthorsebattery' });

      expect(user).toEqual(created);
      expect(tokens.accessToken).toEqual(expect.any(String));
      expect(tokens.refreshToken).toEqual(expect.any(String));
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ email: 'a@example.com' }) }),
      );
      const passwordHashArg = prisma.user.create.mock.calls[0][0].data.passwordHash;
      expect(await argon2.verify(passwordHashArg, 'correcthorsebattery')).toBe(true);
    });

    it('rejects a duplicate email', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        service.signup({ email: 'a@example.com', password: 'correcthorsebattery' }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('issues tokens for correct credentials', async () => {
      const passwordHash = await argon2.hash('correcthorsebattery');
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1', email: 'a@example.com', passwordHash, role: Role.PLAYER });
      prisma.session.create.mockResolvedValue({});

      const { tokens } = await service.login({ email: 'a@example.com', password: 'correcthorsebattery' });

      expect(tokens.accessToken).toEqual(expect.any(String));
    });

    it('rejects an unknown email', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nobody@example.com', password: 'whatever12345' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects an incorrect password', async () => {
      const passwordHash = await argon2.hash('correcthorsebattery');
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1', email: 'a@example.com', passwordHash, role: Role.PLAYER });

      await expect(
        service.login({ email: 'a@example.com', password: 'wrong-password' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('rotates the session and issues new tokens', async () => {
      const user = { id: 'user-1', email: 'a@example.com', passwordHash: 'x', role: Role.PLAYER };
      prisma.session.findFirst.mockResolvedValue({ id: 'session-1', user });
      prisma.session.update.mockResolvedValue({});
      prisma.session.create.mockResolvedValue({});

      const { tokens } = await service.refresh('raw-refresh-token');

      expect(tokens.accessToken).toEqual(expect.any(String));
      expect(prisma.session.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'session-1' } }),
      );
    });

    it('rejects a missing or expired session', async () => {
      prisma.session.findFirst.mockResolvedValue(null);

      await expect(service.refresh('bad-token')).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('revokeSession', () => {
    it('revokes matching non-revoked sessions', async () => {
      prisma.session.updateMany.mockResolvedValue({ count: 1 });

      await service.revokeSession('raw-refresh-token');

      expect(prisma.session.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ revokedAt: null }) }),
      );
    });
  });
});
