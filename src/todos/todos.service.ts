import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Todo } from '../entities/todo.entity';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';

@Injectable()
export class TodosService {
  constructor(
    @InjectRepository(Todo)
    private readonly todoRepository: Repository<Todo>,
  ) {}

  async create(createTodoDto: CreateTodoDto): Promise<Todo> {
    const todo = this.todoRepository.create(createTodoDto);
    return this.todoRepository.save(todo);
  }

  async findOne(id: number): Promise<Todo> {
    const todo = await this.todoRepository.findOne({ where: { id } });

    if (!todo) {
      throw new NotFoundException('Todo không tồn tại!');
    }

    return todo;
  }

  async update(id: number, updateTodoDto: UpdateTodoDto): Promise<Todo> {
    const result = await this.todoRepository.update(id, updateTodoDto);

    if (result.affected === 0) {
      throw new NotFoundException('Không tìm thấy todo để cập nhật!');
    }

    const updatedTodo = await this.todoRepository.findOne({ where: { id } });

    if (!updatedTodo) {
      throw new NotFoundException('Todo không tồn tại!');
    }

    return updatedTodo;
  }

  async remove(id: number): Promise<{ message: string }> {
    const result = await this.todoRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException('Todo không tồn tại!');
    }

    return { message: 'Xóa todo thành công' };
  }
}
