import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';
import { RequestIdInterceptor } from './request-id.interceptor';
import { REQUEST_ID_HEADER } from './request-id';

describe('RequestIdInterceptor', () => {
  function setup(headers: Record<string, string> = {}) {
    const reply = { header: jest.fn().mockReturnThis() };
    const request = { headers };
    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => reply,
      }),
    } as unknown as ExecutionContext;
    const next: CallHandler = {
      handle: jest.fn().mockReturnValue(of('payload')),
    };
    return { interceptor: new RequestIdInterceptor(), context, next, reply };
  }

  it('echoes an inbound id on a successful response', (done) => {
    const { interceptor, context, next, reply } = setup({
      [REQUEST_ID_HEADER]: 'trace-1',
    });

    interceptor.intercept(context, next).subscribe((value) => {
      expect(reply.header).toHaveBeenCalledWith(REQUEST_ID_HEADER, 'trace-1');
      expect(value).toBe('payload');
      done();
    });
  });

  it('generates an id when the caller supplied none', (done) => {
    const { interceptor, context, next, reply } = setup();

    interceptor.intercept(context, next).subscribe(() => {
      expect(reply.header).toHaveBeenCalledWith(
        REQUEST_ID_HEADER,
        expect.stringMatching(/^[0-9a-f-]{36}$/),
      );
      done();
    });
  });

  it('passes the handler result through untouched', (done) => {
    const { interceptor, context, next } = setup();

    interceptor.intercept(context, next).subscribe((value) => {
      expect(next.handle).toHaveBeenCalled();
      expect(value).toBe('payload');
      done();
    });
  });
});
