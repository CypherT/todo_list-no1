import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TodosController } from './todos.controller';
import { TodosService } from './todos.service';
import { Todo } from './entities/todo.entity';
import { User } from '../auth/entities/user.entity'; // Thêm: Import User nếu dùng ở service
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Todo, User])], // Thêm User vào forFeature nếu cần query user
  controllers: [TodosController],
  providers: [TodosService, JwtAuthGuard],
  exports: [TodosService],
})
export class TodosModule {}
