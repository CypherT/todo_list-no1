import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TodosService } from './todos.service';
import { TodosController } from './todos.controller';
import { Todo } from '../entities/todo.entity';
import { FindAllTodosService } from './services/find-all-todos.service';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  imports: [TypeOrmModule.forFeature([Todo]), WebsocketModule],
  controllers: [TodosController],
  providers: [TodosService, FindAllTodosService],
})
export class TodosModule {}
