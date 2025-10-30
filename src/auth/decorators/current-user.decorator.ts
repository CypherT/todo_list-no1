import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express'; // Import Request from express
import { User } from '../../entities/user.entity';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): User | undefined => {
    const request = ctx.switchToHttp().getRequest<Request>(); // Fixed: Type request as Request
    return request.user as User | undefined; // Fixed: request.user typed
  },
);
