// src/auth/auth.controller.ts

import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ConfigService } from '@nestjs/config'; // <-- Thêm

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  // (Yêu cầu 1) Inject ConfigService
  constructor(
    private auth: AuthService,
    private configService: ConfigService,
  ) {}

  @Post('register')
  @ApiBody({ type: RegisterDto })
  async register(@Body() dto: RegisterDto) {
    return this.auth.register(
      dto.email.trim(),
      dto.password,
      dto.full_name?.trim(),
    );
  }

  @Post('login')
  @ApiBody({ type: LoginDto })
  async login(@Body() dto: LoginDto) {
    const user = await this.auth.validate(dto.email.trim(), dto.password);
    const access_token = this.auth.sign(user);

    // (Yêu cầu 1) Lấy thời gian hết hạn từ config
    const expiresIn = this.configService.get<number>('jwtExpiresIn');

    return {
      access_token,
      token_type: 'Bearer',
      expires_in: expiresIn, // <-- Sử dụng giá trị từ config
    };
  }
}