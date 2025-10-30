import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Todo } from '../../entities/todo.entity';

export interface PaginatedTodosResponse {
  ok: 1 | 0;
  t: 'success' | 'error';
  d?: {
    todos: Todo[];
    total: number;
    page: number;
    limit: number;
  };
  e?: string;
}

@Injectable()
export class FindAllTodosService {
  constructor(
    @InjectRepository(Todo)
    private todoRepository: Repository<Todo>,
  ) {}

  async findAll(
    page: number = 1,
    limit: number = 50,
  ): Promise<PaginatedTodosResponse> {
    try {
      const skip = (page - 1) * limit;
      const [todos, total] = await this.todoRepository.findAndCount({
        skip,
        take: limit,
        order: { createdAt: 'DESC' },
      }); // findAndCount returns [Todo[], number], typed OK

      return {
        ok: 1,
        t: 'success',
        d: {
          todos,
          total,
          page,
          limit,
        },
      };
    } catch (error: unknown) {
      // Fix: unknown for error
      const err = error as Error;
      return { ok: 0, t: 'error', e: err.message };
    }
  }
}
