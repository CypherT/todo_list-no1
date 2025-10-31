import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { TodosService } from './todos.service';
import { TodosController } from './todos.controller';
import { Todo } from '../entities/todo.entity';
import { WebsocketModule } from '../websocket/websocket.module';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Todo]),
    WebsocketModule,
    PassportModule,
    AuthModule,
  ],
  controllers: [TodosController],
  providers: [TodosService, JwtStrategy],
})
export class TodosModule {}
