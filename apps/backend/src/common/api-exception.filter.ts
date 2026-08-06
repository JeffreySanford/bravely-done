import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { applyRequestId } from './request-id';

/** The single error shape every endpoint returns. Before this, callers saw
 * whatever Nest happened to produce — `message` was a string for a thrown
 * HttpException but a string[] for a ValidationPipe rejection, and an
 * unhandled error leaked its internal message. */
export interface ApiErrorBody {
  statusCode: number;
  /** Always a string, never an array — the frontend reads this directly
   * (see camp.effects.ts's errorMessage) to surface real, user-actionable
   * failures like "Not enough coins for the next workbench upgrade". */
  message: string;
  error: string;
  /** Present only for validation failures, where several field-level
   * messages arrive at once and collapsing them into `message` alone would
   * lose which field failed. */
  details?: string[];
  /** Echoed from (or generated for) this request — quote it in a bug report
   * and the matching server log line can be found directly. */
  requestId: string;
  path: string;
  timestamp: string;
}

const GENERIC_SERVER_ERROR = 'Internal server error';

/** Standard HTTP reason phrases for the statuses this API actually returns.
 * Used when an exception carries no `error` of its own — Nest's
 * UnauthorizedException is the common case, and without this the field
 * would read "UnauthorizedException", leaking a framework class name and
 * reading inconsistently next to "Not Found" / "Bad Request". */
const REASON_PHRASES: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'Bad Request',
  [HttpStatus.UNAUTHORIZED]: 'Unauthorized',
  [HttpStatus.FORBIDDEN]: 'Forbidden',
  [HttpStatus.NOT_FOUND]: 'Not Found',
  [HttpStatus.CONFLICT]: 'Conflict',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'Unprocessable Entity',
  [HttpStatus.INTERNAL_SERVER_ERROR]: GENERIC_SERVER_ERROR,
  [HttpStatus.SERVICE_UNAVAILABLE]: 'Service Unavailable',
};

function reasonPhrase(status: number, fallback: string): string {
  return REASON_PHRASES[status] ?? fallback;
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<FastifyRequest>();
    const reply = ctx.getResponse<FastifyReply>();
    const requestId = applyRequestId(request, reply);

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const { message, error, details } = this.describe(exception, status);

    // Only 5xx is genuinely our bug and worth a stack trace; 4xx is the API
    // working correctly (a client sent something invalid), and logging every
    // one at error level would bury the real failures.
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url} -> ${status} [${requestId}]`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const body: ApiErrorBody = {
      statusCode: status,
      message,
      error,
      ...(details ? { details } : {}),
      requestId,
      path: request.url,
      timestamp: new Date().toISOString(),
    };
    reply.status(status).send(body);
  }

  private describe(
    exception: unknown,
    status: number,
  ): { message: string; error: string; details?: string[] } {
    // Never surface an unhandled error's own message: it can carry
    // connection strings, SQL, or file paths. The real one is logged above,
    // findable by requestId.
    if (!(exception instanceof HttpException)) {
      return { message: GENERIC_SERVER_ERROR, error: GENERIC_SERVER_ERROR };
    }

    const response = exception.getResponse();
    if (typeof response === 'string') {
      return { message: response, error: reasonPhrase(status, exception.name) };
    }

    const shape = response as { message?: string | string[]; error?: string };
    const error = shape.error ?? reasonPhrase(status, exception.name);

    if (Array.isArray(shape.message)) {
      // ValidationPipe's field-level messages: join for the always-a-string
      // `message` contract, and keep the individual ones in `details`.
      return {
        message: shape.message.join('; '),
        error,
        details: shape.message,
      };
    }
    if (typeof shape.message === 'string') {
      return { message: shape.message, error };
    }
    return { message: exception.message, error };
  }
}
