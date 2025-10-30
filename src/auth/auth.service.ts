import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from '../entities/user.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { CreateUserDto } from './dto/create-user.dto';

export interface AuthResponse {
  ok: 1 | 0;
  t: 'success' | 'error';
  d?: { access_token: string; refresh_token?: string } | Record<string, never>;
  e?: string;
}

interface JwtPayload {
  sub: number;
  email: string;
  role: string;
}

function isJwtPayload(decoded: unknown): decoded is JwtPayload {
  if (typeof decoded !== 'object' || decoded === null) {
    return false;
  }
  const obj = decoded as Record<string, unknown>;
  return (
    typeof obj.sub === 'number' &&
    typeof obj.email === 'string' &&
    typeof obj.role === 'string'
  );
}

@Injectable()
export class AuthService {
  private readonly refreshTokenSecret =
    process.env.REFRESH_TOKEN_SECRET || 'your-refresh-secret';
  private readonly accessTokenExpiresIn = '15m';
  private readonly refreshTokenExpiresIn = '7d';

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    private jwtService: JwtService,
  ) {}

  async register(createUserDto: CreateUserDto): Promise<AuthResponse> {
    try {
      const { email, password } = createUserDto;
      const existingUser = await this.userRepository.findOne({
        where: { email },
      });
      if (existingUser) {
        return { ok: 0, t: 'error', e: 'Email đã tồn tại!' };
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = this.userRepository.create({
        email,
        password: hashedPassword,
        role: 'user',
      });
      await this.userRepository.save(user);

      const refreshToken = await this.generateRefreshToken(user.id);

      const payload: JwtPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      };
      return {
        ok: 1,
        t: 'success',
        d: {
          access_token: this.jwtService.sign(payload, {
            expiresIn: this.accessTokenExpiresIn,
          }),
          refresh_token: refreshToken,
        },
      };
    } catch (error: unknown) {
      const err = error as Error;
      return { ok: 0, t: 'error', e: err.message };
    }
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const user = await this.userRepository.findOne({ where: { email } });
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return { ok: 0, t: 'error', e: 'Email hoặc password sai!' };
      }

      const refreshToken = await this.generateRefreshToken(user.id);

      const payload: JwtPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      };
      return {
        ok: 1,
        t: 'success',
        d: {
          access_token: this.jwtService.sign(payload, {
            expiresIn: this.accessTokenExpiresIn,
          }),
          refresh_token: refreshToken,
        },
      };
    } catch (error: unknown) {
      const err = error as Error;
      return { ok: 0, t: 'error', e: err.message };
    }
  }

  async refresh(refreshToken: string): Promise<AuthResponse> {
    try {
      const decoded: JwtPayload = this.jwtService.verify(refreshToken, {
        secret: this.refreshTokenSecret,
      });

      if (!isJwtPayload(decoded)) {
        return { ok: 0, t: 'error', e: 'Invalid token format!' };
      }

      const tokenInDb = await this.refreshTokenRepository.findOne({
        where: { token: refreshToken, user: { id: decoded.sub } },
      });

      if (!tokenInDb || tokenInDb.expiresAt < new Date()) {
        return {
          ok: 0,
          t: 'error',
          e: 'Refresh token không hợp lệ hoặc đã hết hạn!',
        };
      }

      const user = await this.userRepository.findOne({
        where: { id: decoded.sub },
      });
      if (!user) {
        return { ok: 0, t: 'error', e: 'Người dùng không tồn tại!' };
      }

      await this.refreshTokenRepository.delete({ id: tokenInDb.id });
      const newRefreshToken = await this.generateRefreshToken(user.id);

      const payload: JwtPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      };
      return {
        ok: 1,
        t: 'success',
        d: {
          access_token: this.jwtService.sign(payload, {
            expiresIn: this.accessTokenExpiresIn,
          }),
          refresh_token: newRefreshToken,
        },
      };
    } catch (error: unknown) {
      const err = error as Error;
      return { ok: 0, t: 'error', e: err.message };
    }
  }

  private async generateRefreshToken(userId: number): Promise<string> {
    const token = this.jwtService.sign(
      { sub: userId },
      {
        secret: this.refreshTokenSecret,
        expiresIn: this.refreshTokenExpiresIn,
      },
    );

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const refreshTokenEntity = this.refreshTokenRepository.create({
      token,
      user: { id: userId },
      expiresAt,
    });
    await this.refreshTokenRepository.save(refreshTokenEntity);

    return token;
  }

  async logout(userId: number): Promise<AuthResponse> {
    try {
      await this.refreshTokenRepository.delete({ user: { id: userId } });
      return { ok: 1, t: 'success', d: {} };
    } catch (error: unknown) {
      const err = error as Error;
      return { ok: 0, t: 'error', e: err.message };
    }
  }
}
