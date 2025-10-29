import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "./auth/auth.module";
import { TodosModule } from "./todos/todos.module";
import { User } from "./auth/entities/user.entity";
import { Todo } from "./todos/entities/todo.entity";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: "mysql",
        host: configService.get<string>("MYSQL_HOST") || "localhost",
        port: configService.get<number>("MYSQL_PORT") || 3306,
        username: configService.get<string>("MYSQL_USER") || "root",
        password: configService.get<string>("MYSQL_PASSWORD") || "", // Rỗng cho root
        database: configService.get<string>("MYSQL_DATABASE") || "tododb",
        entities: [User, Todo],
        synchronize: true, // Tự tạo tables (dev only, tắt prod)
        logging: true, // Log query để debug (tắt nếu không cần)
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    TodosModule,
  ],
})
export class AppModule {}
