/**
 * Generates the static OpenAPI spec used by the Angular frontend's
 * codegen step, without starting an HTTP listener.
 *
 * Usage: nx run @org/backend:generate-openapi
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app/app.module';

async function generate() {
  const app = await NestFactory.create(AppModule, { logger: false });

  const openApiConfig = new DocumentBuilder()
    .setTitle('Bravely Done API')
    .setDescription(
      'OpenAPI contract for the Bravely Done backend. This is the single source of truth for request/response DTOs consumed by the Angular frontend codegen.',
    )
    .setVersion('0.0.1')
    .build();
  const document = SwaggerModule.createDocument(app, openApiConfig);

  const outPath = resolve(__dirname, '../../../packages/openapi/openapi.json');
  writeFileSync(outPath, JSON.stringify(document, null, 2));

  await app.close();
  // eslint-disable-next-line no-console
  console.log(`OpenAPI spec written to ${outPath}`);
}

generate();
