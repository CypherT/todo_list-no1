import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  await app.listen(3000); // Await to handle promise
  console.log('Application is running on: http://localhost:3000/api/v1');
}

// Fixed: Mark bootstrap call as ignored with void
void bootstrap();
