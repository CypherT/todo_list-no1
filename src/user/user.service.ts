import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}

  create(data: Partial<User>) { return this.repo.save(this.repo.create(data)); }

  findByEmail(email: string) { return this.repo.findOne({ where: { email } }); }

  findById(id: number) { return this.repo.findOne({ where: { id } }); }
}