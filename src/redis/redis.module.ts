import { DynamicModule, Module } from '@nestjs/common';
import { RedisService } from './redis.service'; // Giữ nếu có, hoặc tạo basic

@Module({})
export class RedisModule {
  static forRoot(options: { host: string; port: number }): DynamicModule {
    return {
      module: RedisModule,
      global: true,
      providers: [
        {
          provide: 'REDIS_OPTIONS',
          useValue: options, // Fix: No any[], direct value
        },
        RedisService,
      ],
      exports: [RedisService],
    };
  }

  static forRootAsync(): DynamicModule {
    // Fix: Simple no options, no unsafe call
    return {
      module: RedisModule,
      global: true,
      providers: [RedisService],
      exports: [RedisService],
    };
  }
}
