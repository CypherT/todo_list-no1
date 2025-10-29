import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config'; // Import ConfigService
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { TodosModule } from './todos/todos.module';
import { User } from './auth/entities/user.entity';
import { Todo } from './todos/entities/todo.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      // Đổi thành async để dùng ConfigService
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('MYSQL_HOST') || 'localhost', // Fallback string
        port: configService.get<number>('MYSQL_PORT') || 3306, // Cast number
        username: configService.get<string>('MYSQL_USER') || 'root', // Fallback nếu thiếu
        password: configService.get<string>('MYSQL_PASSWORD') || '', // Fallback empty
        database: configService.get<string>('MYSQL_DATABASE') || 'tododb',
        entities: [User, Todo],
        synchronize: true, // Chỉ dev, tắt prod
      }),
      inject: [ConfigService], // Inject ConfigService
    }),
    AuthModule,
    TodosModule,
  ],
})
export class AppModule {}
