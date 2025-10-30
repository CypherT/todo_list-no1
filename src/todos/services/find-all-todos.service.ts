import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Todo } from '../../entities/todo.entity';

export interface PaginatedTodos {
  todos: Todo[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class FindAllTodosService {
  constructor(
    @InjectRepository(Todo)
    private todoRepository: Repository<Todo>,
  ) {}

  async findAll(page: number = 1, limit: number = 50): Promise<PaginatedTodos> {
    const skip = (page - 1) * limit;
    const [todos, total] = await this.todoRepository.findAndCount({
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      todos,
      total,
      page,
      limit,
    };
  }
}
