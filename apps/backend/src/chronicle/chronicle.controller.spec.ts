import { Role } from '../generated/prisma/enums';
import { ChronicleController } from './chronicle.controller';
import { ChronicleService } from './chronicle.service';

describe('ChronicleController', () => {
  const user = { sub: 'user-1', role: Role.PLAYER, iat: 0, exp: 0 };

  function buildController() {
    const chronicle = {
      forCharacter: jest
        .fn()
        .mockResolvedValue({ characterId: 'char-1', entries: [] }),
    } as unknown as ChronicleService;
    return { controller: new ChronicleController(chronicle), chronicle };
  }

  it('passes the caller, character, and requested window through to the service', async () => {
    const { controller, chronicle } = buildController();

    await controller.forCharacter(user, 'char-1', { days: 14 });

    expect(chronicle.forCharacter).toHaveBeenCalledWith('user-1', 'char-1', 14);
  });

  it('leaves days undefined when unspecified, so the service applies its own default', async () => {
    const { controller, chronicle } = buildController();

    await controller.forCharacter(user, 'char-1', {});

    expect(chronicle.forCharacter).toHaveBeenCalledWith(
      'user-1',
      'char-1',
      undefined,
    );
  });
});
