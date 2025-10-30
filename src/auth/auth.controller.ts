import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';

interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() createUserDto: CreateUserDto): Promise<AuthTokens> {
    return this.authService.register(createUserDto);
  }

  @Post('login')
  login(
    @Body() body: { email: string; password: string },
  ): Promise<AuthTokens> {
    return this.authService.login(body.email, body.password);
  }

  @Post('refresh')
  refresh(@Body('refresh_token') refreshToken: string): Promise<AuthTokens> {
    return this.authService.refresh(refreshToken);
  }

  @Post('logout')
  logout(): { message: string } {
    return this.authService.logout();
  }
}
