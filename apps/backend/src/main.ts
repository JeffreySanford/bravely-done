/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

// Must run before any other import, since AppModule's providers (e.g.
// JwtStrategy) read process.env at module-evaluation/construction time.
import 'dotenv/config';

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import fastifyCookie from '@fastify/cookie';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
  await app.register(fastifyCookie);

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({
    origin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:4200',
    credentials: true,
  });

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
  await app.listen(port, '0.0.0.0');
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`,
  );
  Logger.log(`📄 OpenAPI docs available at: http://localhost:${port}/api-docs`);
}

bootstrap();
