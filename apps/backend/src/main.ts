/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  const openApiConfig = new DocumentBuilder()
    .setTitle('Bravely Done API')
    .setDescription(
      'OpenAPI contract for the Bravely Done backend. This is the single source of truth for request/response DTOs consumed by the Angular frontend codegen.',
    )
    .setVersion('0.0.1')
    .build();
  const document = SwaggerModule.createDocument(app, openApiConfig);
  SwaggerModule.setup('api-docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`,
  );
  Logger.log(`📄 OpenAPI docs available at: http://localhost:${port}/api-docs`);
}

bootstrap();
