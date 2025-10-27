// src/app.module.ts

import { Module } from '@nestjs/common';
import { StudentsModule } from './students/students.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { TypeOrmConfigService } from './config/typeorm.config'; // <-- Sửa

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration], // Tải file config của bạn
    }),

    // (Yêu cầu 4 & 5) Sử dụng forRootAsync
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule], // Đảm bảo ConfigModule có sẵn
      useClass: TypeOrmConfigService, // Lớp config mới
    }),

    StudentsModule,
    AuthModule,
    UsersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}