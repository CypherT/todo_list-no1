import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtUser } from '../interfaces/jwt-user.interface'; // Import mới

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): JwtUser => {
    // Type JwtUser
    const request = ctx.switchToHttp().getRequest();
    return request.user; // User từ JwtStrategy's validate()
  },
);
