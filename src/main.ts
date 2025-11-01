import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { WsAdapter } from '@nestjs/platform-ws';
import { HttpExceptionFilter } from './common/http-exception.filter';
import { ResponseInterceptor } from './common/response.interceptor';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
// Package sẽ được cài đặt: npm install @scalar/nestjs-api-reference
// import { apiReference } from '@scalar/nestjs-api-reference';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
  });

  const wsAdapter = new WsAdapter(app, {
    messageParser: (data: unknown): { event: string; data: unknown } => {
      let messageStr: string;
      if (typeof data === 'string') {
        messageStr = data;
      } else if (Buffer.isBuffer(data)) {
        messageStr = data.toString();
      } else if (data instanceof ArrayBuffer) {
        messageStr = Buffer.from(data).toString();
      } else if (typeof data === 'object' && data !== null) {
        messageStr = JSON.stringify(data);
      } else if (data === null) {
        messageStr = 'null';
      } else if (data === undefined) {
        messageStr = 'undefined';
      } else if (typeof data === 'number' || typeof data === 'boolean') {
        messageStr = String(data);
      } else {
        messageStr = JSON.stringify(data);
      }

      const parsed = JSON.parse(messageStr) as { t?: string; d?: unknown };
      return { event: parsed.t || '', data: parsed.d };
    },
  });
  app.useWebSocketAdapter(wsAdapter);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  const config = new DocumentBuilder()
    .setTitle('Todo App API')
    .setDescription('API documentation for Todo App')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 Swagger UI: http://localhost:${port}/api/docs`);
  console.log(`🔌 WebSocket is running on: ws://localhost:${port}`);
}

void bootstrap();
