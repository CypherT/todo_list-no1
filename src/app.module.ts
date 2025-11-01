import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RATE_LIMIT_CONFIG } from './config/rate-limit.config';
import { databaseConfig } from './config/database.config';
import { TodosModule } from './modules/todos/todos.module';
import { AuthModule } from './modules/auth/auth.module';
import { WebsocketModule } from './common/websocket/websocket.module';
import { LoggerMiddleware } from './common/middleware/logger.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(databaseConfig()),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: RATE_LIMIT_CONFIG.TTL,
          limit: RATE_LIMIT_CONFIG.LIMIT,
          blockDuration: RATE_LIMIT_CONFIG.BLOCK_DURATION,
        },
      ],
      // Uncomment sau khi cài nestjs-throttler-storage-redis: npm install nestjs-throttler-storage-redis
      // storage: new ThrottlerStorageRedisService(
      //   new ConfigService().get('REDIS_URL_CONNECT'),
      // ),
    }),
    AuthModule,
    TodosModule,
    WebsocketModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
