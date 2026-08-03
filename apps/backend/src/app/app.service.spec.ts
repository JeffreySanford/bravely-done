import { Test } from '@nestjs/testing';
import { AppService } from './app.service';

describe('AppService', () => {
  let service: AppService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [AppService],
    }).compile();

    service = module.get(AppService);
  });

  it('returns the greeting message', () => {
    expect(service.getData()).toEqual({ message: 'Hello API' });
  });
});
