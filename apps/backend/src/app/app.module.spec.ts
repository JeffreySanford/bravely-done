import { Test } from '@nestjs/testing';
import { AppModule } from './app.module';
import { AppController } from './app.controller';

describe('AppModule', () => {
  it('compiles and resolves AppController', async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    expect(module.get(AppController)).toBeDefined();
  });
});
