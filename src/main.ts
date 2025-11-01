import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { WsAdapter } from '@nestjs/platform-ws';
import { HttpExceptionFilter } from './common/http-exception.filter';
import { ResponseInterceptor } from './common/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS - Cho phép frontend gọi API
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:5173'], // Thêm port frontend
    credentials: true,
  });

  // WebSocket Adapter
  app.useWebSocketAdapter(new WsAdapter(app));

  // Global Pipes - Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Loại bỏ props không có trong DTO
      forbidNonWhitelisted: true, // Throw error nếu có props thừa
      transform: true, // Tự động transform type (string -> number)
      transformOptions: {
        enableImplicitConversion: true, // '123' -> 123 tự động
      },
    }),
  );

  // Global Filters - Error handling
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global Interceptors - Response formatting
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Prefix API
  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`🔌 WebSocket is running on: ws://localhost:${port}`);
}

bootstrap();
