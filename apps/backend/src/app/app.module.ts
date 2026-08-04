import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CharacterModule } from '../character/character.module';
import { PrismaModule } from '../prisma/prisma.module';
import { QuestModule } from '../quest/quest.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [PrismaModule, AuthModule, CharacterModule, QuestModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
