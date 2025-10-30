import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Todo } from '../entities/todo.entity';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';

export interface TodoResponse {
  ok: 1 | 0;
  t: 'success' | 'error';
  d?: Todo | null;
  e?: string;
}

@Injectable()
export class TodosService {
  constructor(
    @InjectRepository(Todo)
    private todoRepository: Repository<Todo>,
  ) {}

  async create(createTodoDto: CreateTodoDto): Promise<TodoResponse> {
    try {
      const todo = this.todoRepository.create(createTodoDto); // create returns Partial<Todo>, but since DTO matches, it's Todo
      const savedTodo = await this.todoRepository.save(todo);
      return { ok: 1, t: 'success', d: savedTodo };
    } catch (error: unknown) {
      // Fix: unknown
      const err = error as Error;
      return { ok: 0, t: 'error', e: err.message };
    }
  }

  async findOne(id: number): Promise<TodoResponse> {
    try {
      const todo = await this.todoRepository.findOne({ where: { id } });
      if (!todo) {
        return { ok: 0, t: 'error', e: 'Todo không tồn tại!' };
      }
      return { ok: 1, t: 'success', d: todo };
    } catch (error: unknown) {
      const err = error as Error;
      return { ok: 0, t: 'error', e: err.message };
    }
  }

  async update(
    id: number,
    updateTodoDto: UpdateTodoDto,
  ): Promise<TodoResponse> {
    try {
      const result = await this.todoRepository.update(id, updateTodoDto);
      if (result.affected === 0) {
        return { ok: 0, t: 'error', e: 'Không tìm thấy todo để cập nhật!' };
      }

      const updatedTodo = await this.todoRepository.findOne({ where: { id } });
      return { ok: 1, t: 'success', d: updatedTodo };
    } catch (error: unknown) {
      const err = error as Error;
      return { ok: 0, t: 'error', e: err.message };
    }
  }

  async remove(id: number): Promise<TodoResponse> {
    try {
      const result = await this.todoRepository.delete(id);
      if (result.affected === 0) {
        return { ok: 0, t: 'error', e: 'Todo không tồn tại!' };
      }
      return { ok: 1, t: 'success', d: null };
    } catch (error: unknown) {
      const err = error as Error;
      return { ok: 0, t: 'error', e: err.message };
    }
  }
}
