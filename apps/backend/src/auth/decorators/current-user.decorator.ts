import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../jwt-payload.interface';

export function getCurrentUserFromContext(_data: unknown, ctx: ExecutionContext): JwtPayload {
  return ctx.switchToHttp().getRequest<{ user: JwtPayload }>().user;
}

export const CurrentUser = createParamDecorator(getCurrentUserFromContext);
