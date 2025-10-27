import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../user/user.service';

@Injectable()
export class AuthService {
  constructor(private users: UsersService, private jwt: JwtService) {}

  async register(email: string, password: string, full_name?: string) {
    const hash = await bcrypt.hash(password, 10);
    const user = await this.users.create({ email, password_hash: hash, full_name });
    return { id: user.id, email: user.email };
  }

  async validate(email: string, password: string) {
    const user = await this.users.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    return user;
  }

  sign(user: { id: number; email: string; role?: string }) {
    return this.jwt.sign({ sub: user.id, email: user.email, role: user.role ?? 'teacher' });
  }
}