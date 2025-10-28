// src/auth/jwt.strategy.ts

import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

interface JwtPayload {
  sub: number;
  email: string;
  role: string;
}

export interface UserPayload {
  userId: number;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends AuthGuard('jwt') {
    constructor(){super({})}
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') { // <-- Chữ 'export' phải ở đây
    constructor(){super({})}
  };

