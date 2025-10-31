import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig = (): TypeOrmModuleOptions => ({
  type: 'postgres', // Thay 'mysql' nếu dùng MySQL
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'todo_db',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'], // Tự động load entities (e.g., TodoEntity)
  synchronize: process.env.NODE_ENV !== 'production', // Tắt ở production để tránh mất data
  logging: ['query', 'error'], // Log queries cho debug
  autoLoadEntities: true, // Tự load nếu dùng
});
