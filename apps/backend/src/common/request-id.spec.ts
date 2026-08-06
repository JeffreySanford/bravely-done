import type { FastifyReply, FastifyRequest } from 'fastify';
import {
  REQUEST_ID_HEADER,
  applyRequestId,
  resolveRequestId,
} from './request-id';

function buildRequest(
  headers: Record<string, string | string[] | undefined> = {},
) {
  return { headers } as unknown as FastifyRequest;
}

function buildReply() {
  return { header: jest.fn().mockReturnThis() } as unknown as FastifyReply;
}

describe('resolveRequestId', () => {
  it('honors an inbound id so a trace survives across a proxy', () => {
    expect(
      resolveRequestId(buildRequest({ [REQUEST_ID_HEADER]: 'upstream-123' })),
    ).toBe('upstream-123');
  });

  it('generates a fresh id when none was supplied', () => {
    const id = resolveRequestId(buildRequest());
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('generates a fresh id when the inbound header is blank', () => {
    expect(
      resolveRequestId(buildRequest({ [REQUEST_ID_HEADER]: '   ' })),
    ).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('takes the first value when a header arrives repeated', () => {
    expect(
      resolveRequestId(
        buildRequest({ [REQUEST_ID_HEADER]: ['first', 'second'] }),
      ),
    ).toBe('first');
  });

  it('caps length so a hostile caller cannot bloat every log line', () => {
    const id = resolveRequestId(
      buildRequest({ [REQUEST_ID_HEADER]: 'x'.repeat(5000) }),
    );
    expect(id).toHaveLength(200);
  });
});

describe('applyRequestId', () => {
  it('echoes the id on the response so a caller can quote it', () => {
    const request = buildRequest({ [REQUEST_ID_HEADER]: 'trace-me' });
    const reply = buildReply();

    const id = applyRequestId(request, reply);

    expect(id).toBe('trace-me');
    expect(reply.header).toHaveBeenCalledWith(REQUEST_ID_HEADER, 'trace-me');
  });

  it('is idempotent — a second call reuses the id rather than minting a new one', () => {
    const request = buildRequest();
    const reply = buildReply();

    const first = applyRequestId(request, reply);
    const second = applyRequestId(request, reply);

    expect(second).toBe(first);
  });
});
