import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Todo } from './entities/todo.entity';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import type { JwtUser } from '../auth/interfaces/jwt-user.interface'; // Fix: Thêm 'type'

@Injectable()
export class TodosService {
  constructor(
    @InjectRepository(Todo)
    private todoRepository: Repository<Todo>,
  ) {}

  async findAll(user: JwtUser) {
    return this.todoRepository.find({ where: { user: { id: user.userId } } });
  }

  async findOne(id: string, user: JwtUser) {
    const todo = await this.todoRepository.findOne({
      where: { id, user: { id: user.userId } },
    });
    if (!todo) {
      throw new NotFoundException(`Todo với ID ${id} không tồn tại!`);
    }
    return todo;
  }

  async create(createTodoDto: CreateTodoDto, user: JwtUser) {
    const newTodo = this.todoRepository.create({
      ...createTodoDto,
      user: { id: user.userId },
    });
    return this.todoRepository.save(newTodo);
  }

  async update(id: string, updateTodoDto: UpdateTodoDto, user: JwtUser) {
    await this.findOne(id, user);
    await this.todoRepository.update(
      { id, user: { id: user.userId } },
      updateTodoDto,
    );
    return this.findOne(id, user);
  }

  async remove(id: string, user: JwtUser) {
    const todo = await this.findOne(id, user);
    await this.todoRepository.remove(todo);
    return todo;
  }
}
