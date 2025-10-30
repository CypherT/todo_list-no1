import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';

export const databaseConfig = (): TypeOrmModuleOptions => {
  const configService = new ConfigService();
  return {
    type: 'mysql',
    host: configService.get('DB_HOST') || 'localhost',
    port: parseInt(configService.get('DB_PORT') || '3306'),
    username: configService.get('DB_USERNAME') || 'root',
    password: configService.get('DB_PASSWORD') || '',
    database: configService.get('DB_DATABASE') || 'tododb',
    entities: [join(__dirname, '../entities/*.entity{.ts,.js}')], // Auto-load từ entities/
    synchronize: true,
  };
};
