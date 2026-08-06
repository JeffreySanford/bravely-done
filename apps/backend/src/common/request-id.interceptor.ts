import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { Observable } from 'rxjs';
import { applyRequestId } from './request-id';

/** Stamps every *successful* response with its correlation id. The error
 * path is covered by ApiExceptionFilter, which applies the same id — the
 * two together mean no response leaves without one.
 *
 * An interceptor rather than a Fastify onRequest hook: it's typed cleanly
 * against Nest's ExecutionContext (Fastify's addHook overloads fight the
 * NestFastifyApplication instance type — the same self-referential quirk
 * already documented for @fastify/cookie in main.ts) and it's testable
 * without standing up a server. */
@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    applyRequestId(
      ctx.getRequest<FastifyRequest>(),
      ctx.getResponse<FastifyReply>(),
    );
    return next.handle();
  }
}
