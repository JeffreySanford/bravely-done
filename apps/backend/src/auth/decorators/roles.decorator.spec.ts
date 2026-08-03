import { Reflector } from '@nestjs/core';
import { Role } from '../../generated/prisma/enums';
import { ROLES_KEY, Roles } from './roles.decorator';

describe('Roles decorator', () => {
  it('attaches the given roles as metadata under ROLES_KEY', () => {
    class Target {
      @Roles(Role.ADMIN)
      handler() {
        return undefined;
      }
    }

    const reflector = new Reflector();
    const roles = reflector.get(ROLES_KEY, new Target().handler);

    expect(roles).toEqual([Role.ADMIN]);
  });
});
