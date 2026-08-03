import { ExecutionContext } from '@nestjs/common';
import { getCurrentUserFromContext } from './current-user.decorator';
import { Role } from '../../generated/prisma/enums';

describe('getCurrentUserFromContext', () => {
  it('returns the request user', () => {
    const user = { sub: 'user-1', role: Role.PLAYER };
    const ctx = {
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    } as unknown as ExecutionContext;

    expect(getCurrentUserFromContext(undefined, ctx)).toBe(user);
  });
});
