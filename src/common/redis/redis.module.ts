import { DynamicModule, Module } from '@nestjs/common';
import { RedisService } from './redis.service';

@Module({})
export class RedisModule {
  static forRoot(options: { host: string; port: number }): DynamicModule {
    return {
      module: RedisModule,
      global: true,
      providers: [
        {
          provide: 'REDIS_OPTIONS',
          useValue: options,
        },
        RedisService,
      ],
      exports: [RedisService],
    };
  }

  static forRootAsync(): DynamicModule {
    return {
      module: RedisModule,
      global: true,
      providers: [RedisService],
      exports: [RedisService],
    };
  }
}
