// src/main.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { INestApplication , ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // (Yêu cầu 8) Áp dụng định dạng response chuẩn
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  // Áp dụng Validation
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle('Student CRUD API')
    .setDescription('Simple CRUD for students')
    .setVersion('1.0')
    .addBearerAuth() // (Yêu cầu 3) Đã giải quyết xung đột Git
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // (Yêu cầu 1) Lấy port từ ConfigService
  const configService = app.get(ConfigService);
  const port = configService.get('port');

  await app.listen(port);
  console.log(`API http://localhost:${port} | Swagger http://localhost:${port}/docs`);
}
bootstrap();