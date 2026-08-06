import {
  ArgumentsHost,
  BadRequestException,
  HttpStatus,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { ApiErrorBody, ApiExceptionFilter } from './api-exception.filter';
import { REQUEST_ID_HEADER } from './request-id';

describe('ApiExceptionFilter', () => {
  let filter: ApiExceptionFilter;
  let reply: { status: jest.Mock; send: jest.Mock; header: jest.Mock };
  let request: FastifyRequest;

  function host(): ArgumentsHost {
    return {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => reply,
      }),
    } as unknown as ArgumentsHost;
  }

  function sentBody(): ApiErrorBody {
    return reply.send.mock.calls[0][0] as ApiErrorBody;
  }

  beforeEach(() => {
    filter = new ApiExceptionFilter();
    jest.spyOn(filter['logger'], 'error').mockImplementation(() => undefined);
    reply = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      header: jest.fn().mockReturnThis(),
    };
    request = {
      method: 'POST',
      url: '/api/characters/c1/upgrade-workbench',
      headers: { [REQUEST_ID_HEADER]: 'trace-1' },
    } as unknown as FastifyRequest;
  });

  it('keeps a thrown message as a plain string — the frontend reads error.message directly', () => {
    filter.catch(
      new BadRequestException(
        'Not enough coins for the next workbench upgrade',
      ),
      host(),
    );

    expect(reply.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(sentBody().message).toBe(
      'Not enough coins for the next workbench upgrade',
    );
  });

  it('preserves the status and reason phrase of a known HttpException', () => {
    filter.catch(new NotFoundException('Quest not found'), host());

    expect(reply.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(sentBody()).toEqual(
      expect.objectContaining({
        statusCode: 404,
        message: 'Quest not found',
        error: 'Not Found',
      }),
    );
  });

  it('collapses ValidationPipe field messages into one string but keeps them individually in details', () => {
    filter.catch(
      new BadRequestException({
        statusCode: 400,
        message: ['title must be longer', 'title is required'],
        error: 'Bad Request',
      }),
      host(),
    );

    const body = sentBody();
    expect(body.message).toBe('title must be longer; title is required');
    expect(body.details).toEqual(['title must be longer', 'title is required']);
  });

  it('never leaks an unhandled error message, and reports it as a 500', () => {
    filter.catch(
      new Error('connect ECONNREFUSED 127.0.0.1:5432 password=hunter2'),
      host(),
    );

    expect(reply.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    const body = sentBody();
    expect(body.message).toBe('Internal server error');
    expect(JSON.stringify(body)).not.toContain('hunter2');
  });

  it('uses the standard reason phrase rather than leaking a framework class name', () => {
    // UnauthorizedException's payload carries no `error` field, so without a
    // reason-phrase fallback this would read "UnauthorizedException".
    filter.catch(new UnauthorizedException(), host());

    expect(sentBody().error).toBe('Unauthorized');
  });

  it('logs 5xx with the request id, since that is genuinely our bug', () => {
    filter.catch(new Error('boom'), host());

    expect(filter['logger'].error).toHaveBeenCalledWith(
      expect.stringContaining('trace-1'),
      expect.any(String),
    );
  });

  it('does not log 4xx at error level — a client sending something invalid is the API working', () => {
    filter.catch(new NotFoundException('Quest not found'), host());

    expect(filter['logger'].error).not.toHaveBeenCalled();
  });

  it('includes the correlation id, path, and timestamp on every error', () => {
    filter.catch(new NotFoundException('Quest not found'), host());

    expect(sentBody()).toEqual(
      expect.objectContaining({
        requestId: 'trace-1',
        path: '/api/characters/c1/upgrade-workbench',
        timestamp: expect.any(String),
      }),
    );
    expect(reply.header).toHaveBeenCalledWith(REQUEST_ID_HEADER, 'trace-1');
  });
});
