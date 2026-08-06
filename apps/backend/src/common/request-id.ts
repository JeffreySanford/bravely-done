import { randomUUID } from 'node:crypto';
import type { FastifyReply, FastifyRequest } from 'fastify';

/** Header carrying the correlation id, in both directions: honored when a
 * caller (or an upstream proxy) already set one, echoed on every response
 * so a client can quote it in a bug report. */
export const REQUEST_ID_HEADER = 'x-request-id';

/** The correlation id for this request — an inbound one if the caller
 * supplied it, otherwise a fresh UUID. Deliberately trusts an inbound
 * value: this API sits behind the app's own frontend and any real proxy,
 * and a caller forging an id can only confuse their own trace, not anyone
 * else's. Length-capped so a hostile caller can't bloat every log line. */
export function resolveRequestId(request: FastifyRequest): string {
  const inbound = request.headers[REQUEST_ID_HEADER];
  const candidate = Array.isArray(inbound) ? inbound[0] : inbound;
  return candidate?.trim().slice(0, 200) || randomUUID();
}

/** Attaches the id to the request (so later code can read it) and to the
 * response headers (so the caller can see it). Idempotent — safe if both
 * the hook and the exception filter run for the same request. */
export function applyRequestId(
  request: FastifyRequest,
  reply: FastifyReply,
): string {
  const existing = (request as FastifyRequest & { requestId?: string })
    .requestId;
  const id = existing ?? resolveRequestId(request);
  (request as FastifyRequest & { requestId?: string }).requestId = id;
  reply.header(REQUEST_ID_HEADER, id);
  return id;
}
