import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  // Constructor DI param decorator emits a synthetic branch this project's
  // coverage collector can't fully hit; see testing-exceptions.md OPEN-002.
  constructor(private readonly appService: AppService) {}

  @Get()
  getData() {
    return this.appService.getData();
  }
}
