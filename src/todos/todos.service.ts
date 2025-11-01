import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Todo } from './entities/todo.entity';
import { CreateTodoDto, TodoStatus } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { WebsocketGateway } from '../websocket/websocket.gateway';

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
      userId, // Thêm userId vào todo
    };

    const todo = this.todoRepository.create(todoData);
    const savedTodo = await this.todoRepository.save(todo);

    // 🔥 Broadcast to all user's devices
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
  ): Promise<{ todos: Todo[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;
    const [todos, total] = await this.todoRepository.findAndCount({
      where: { userId }, // Chỉ lấy todo của user hiện tại
      skip,
      take: limit,
      order: { id: 'DESC' },
    });

    return {
      todos,
      total,
      page,
      limit,
    };
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
    const todo = await this.findOne(id, userId);

    Object.assign(todo, {
      title: updateTodoDto.title ?? todo.title,
      completed:
        updateTodoDto.completed !== undefined
          ? updateTodoDto.completed === TodoStatus.DONE
          : todo.completed,
    });

    const updatedTodo = await this.todoRepository.save(todo);

    // 🔥 Broadcast to all user's devices
    this.websocketGateway.broadcastToUser(userId, {
      action: 'updated',
      todo: updatedTodo,
      userId,
    });

    return updatedTodo;
  }

  async remove(id: number, userId: number): Promise<void> {
    await this.findOne(id, userId);
    await this.todoRepository.delete({ id });

    // 🔥 Broadcast to all user's devices
    this.websocketGateway.broadcastToUser(userId, {
      action: 'deleted',
      todoId: id,
      userId,
    });
  }
}
