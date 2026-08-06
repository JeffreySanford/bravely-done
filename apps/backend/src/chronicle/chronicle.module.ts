import { Module } from '@nestjs/common';
import { ChronicleController } from './chronicle.controller';
import { ChronicleService } from './chronicle.service';

@Module({
  controllers: [ChronicleController],
  providers: [ChronicleService],
})
export class ChronicleModule {}
