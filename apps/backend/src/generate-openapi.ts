/**
 * Generates the static OpenAPI spec used by the Angular frontend's
 * codegen step, without starting an HTTP listener.
 *
 * Usage: nx run @org/backend:generate-openapi
 */
import Module from 'node:module';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Prisma's generated client (moduleFormat: "cjs") requires its own internal
// modules with explicit `.js` specifiers pointing at `.ts` files, following
// the nodenext convention. Webpack's build resolves this fine, but ts-node's
// CJS require hook doesn't — this script runs the source directly via
// ts-node, not through webpack, so it needs the fallback itself: on a failed
// resolution ending in `.js`, retry without the extension so ts-node's `.ts`
// handler can find the real file.
type ResolveFilename = (this: unknown, request: string, ...rest: unknown[]) => string;
const moduleWithResolver = Module as unknown as { _resolveFilename: ResolveFilename };
const resolveFilename = moduleWithResolver._resolveFilename;
moduleWithResolver._resolveFilename = function (this: unknown, request: string, ...rest: unknown[]) {
  try {
    return resolveFilename.call(this, request, ...rest);
  } catch (err) {
    if (request.endsWith('.js')) {
      return resolveFilename.call(this, request.slice(0, -3), ...rest);
    }
    throw err;
  }
};

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
    .addCookieAuth('access_token')
    .build();
  const document = SwaggerModule.createDocument(app, openApiConfig);

  const outPath = resolve(__dirname, '../../../packages/openapi/openapi.json');
  writeFileSync(outPath, JSON.stringify(document, null, 2));

  await app.close();
  // eslint-disable-next-line no-console
  console.log(`OpenAPI spec written to ${outPath}`);
}

generate();
