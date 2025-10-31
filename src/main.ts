import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './common/response.interceptor';
import { HttpExceptionFilter } from './common/http-exception.filter';
import { WsAdapter } from '@nestjs/platform-ws';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // ⭐ Sử dụng Native WebSocket Adapter (WsAdapter từ @nestjs/platform-ws)
  app.useWebSocketAdapter(new WsAdapter(app));

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Global interceptors
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Global filters
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(3000);
  console.log('🚀 Application is running on: http://localhost:3000/api/v1');
  console.log('🔌 WebSocket Server is listening on: ws://localhost:3000');
}

void bootstrap();
