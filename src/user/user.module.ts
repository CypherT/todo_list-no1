// src/user/user.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; // <-- Đảm bảo đã import
import { User } from './user.entity'; // <-- Đảm bảo đã import
import { UsersService } from './user.service';

@Module({
  // DÒNG NÀY RẤT CÓ THỂ ĐANG BỊ THIẾU TRONG FILE CỦA BẠN:
  imports: [TypeOrmModule.forFeature([User])],
  
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}