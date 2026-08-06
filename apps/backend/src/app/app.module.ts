import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CharacterModule } from '../character/character.module';
import { ChronicleModule } from '../chronicle/chronicle.module';
import { EncounterModule } from '../encounter/encounter.module';
import { HealthModule } from '../health/health.module';
import { PrismaModule } from '../prisma/prisma.module';
import { QuestModule } from '../quest/quest.module';
import { SprintModule } from '../sprint/sprint.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    PrismaModule,
    HealthModule,
    AuthModule,
    CharacterModule,
    QuestModule,
    SprintModule,
    EncounterModule,
    ChronicleModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
