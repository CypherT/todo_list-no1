import { Controller, Post, Body } from '@nestjs/common'; // Bỏ UnauthorizedException nếu không dùng
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { AuthResponse } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto): Promise<AuthResponse> {
    return this.authService.register(createUserDto);
  }

  @Post('login')
  async login(
    @Body() body: { email: string; password: string },
  ): Promise<AuthResponse> {
    return this.authService.login(body.email, body.password);
  }

  @Post('refresh')
  async refresh(
    @Body('refresh_token') refreshToken: string,
  ): Promise<AuthResponse> {
    return this.authService.refresh(refreshToken);
  }

  @Post('logout')
  async logout(@Body('userId') userId: number): Promise<AuthResponse> {
    return this.authService.logout(userId);
  }
}
