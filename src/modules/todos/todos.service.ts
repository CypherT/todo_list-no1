import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Todo } from './entities/todo.entity';
import { CreateTodoDto, TodoStatus } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { WebsocketGateway } from '../../common/websocket/websocket.gateway';
import {
  getPagination,
  buildPagination,
} from '../../common/utils/pagination.helper';
import { Pagination } from '../../common/interfaces/pagination.interface';

@Injectable()
export class TodosService {
  constructor(
    @InjectRepository(Todo)
    private readonly todoRepository: Repository<Todo>,
    private readonly websocketGateway: WebsocketGateway,
  ) {}

  async create(createTodoDto: CreateTodoDto, userId: number): Promise<Todo> {
    const todoData: Partial<Todo> = {
      title: createTodoDto.title,
      completed: createTodoDto.completed === TodoStatus.DONE,
      userId,
    };

    const todo = this.todoRepository.create(todoData);
    const savedTodo = await this.todoRepository.save(todo);

    this.websocketGateway.broadcastToUser(userId, {
      action: 'created',
      todo: savedTodo,
      userId,
    });

    return savedTodo;
  }

  async findAll(
    userId: number,
    page: number = 1,
    limit: number = 30,
  ): Promise<Pagination<Todo>> {
    const { pageNum, limitNum, skip, take } = getPagination(page, limit);
    const [todos, total] = await this.todoRepository.findAndCount({
      where: { userId },
      skip,
      take,
      order: { id: 'DESC' },
    });

    return buildPagination(todos, total, pageNum, limitNum);
  }

  async findOne(id: number, userId: number): Promise<Todo> {
    const todo = await this.todoRepository.findOneBy({ id, userId });
    if (!todo) {
      throw new NotFoundException(`Todo #${id} not found`);
    }
    return todo;
  }

  async update(
    id: number,
    updateTodoDto: UpdateTodoDto,
    userId: number,
  ): Promise<Todo> {
    const updateData: Partial<Todo> = {
      title: updateTodoDto.title,
      completed:
        updateTodoDto.completed !== undefined
          ? updateTodoDto.completed === TodoStatus.DONE
          : undefined,
    };

    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key],
    );

    const updateResult = await this.todoRepository.update(
      { id, userId },
      updateData,
    );

    if (updateResult.affected === 0) {
      throw new NotFoundException(`Todo #${id} not found`);
    }

    const updatedTodo = await this.todoRepository.findOneBy({ id, userId });
    if (!updatedTodo) {
      throw new NotFoundException(`Todo #${id} not found`);
    }

    this.websocketGateway.broadcastToUser(userId, {
      action: 'updated',
      todo: updatedTodo,
      userId,
    });

    return updatedTodo;
  }

  async remove(id: number, userId: number): Promise<void> {
    const deleteResult = await this.todoRepository.delete({ id, userId });

    if (deleteResult.affected === 0) {
      throw new NotFoundException(`Todo #${id} not found`);
    }

    this.websocketGateway.broadcastToUser(userId, {
      action: 'deleted',
      todoId: id,
      userId,
    });
  }
}
