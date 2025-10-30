import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Todo } from '../entities/todo.entity';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class TodosService {
  constructor(
    @InjectRepository(Todo)
    private readonly todoRepository: Repository<Todo>,
    private readonly websocketGateway: WebsocketGateway,
    private readonly redisService: RedisService,
  ) {}

  async create(createTodoDto: CreateTodoDto): Promise<Todo> {
    const todo = this.todoRepository.create(createTodoDto);
    const savedTodo = await this.todoRepository.save(todo);

    // Cache todo trong Redis (TTL 1 giờ)
    await this.redisService.set(
      `todo:${savedTodo.id}`,
      JSON.stringify(savedTodo),
      3600,
    );

    // Broadcast qua WebSocket
    this.websocketGateway.emitTodoCreated(savedTodo);

    return savedTodo;
  }

  async findOne(id: number): Promise<Todo> {
    // Kiểm tra cache trước
    const cached = await this.redisService.get(`todo:${id}`);
    if (cached) {
      return JSON.parse(cached);
    }

    const todo = await this.todoRepository.findOne({ where: { id } });

    if (!todo) {
      throw new NotFoundException('Todo không tồn tại!');
    }

    // Lưu vào cache
    await this.redisService.set(`todo:${id}`, JSON.stringify(todo), 3600);

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

    // Cập nhật cache
    await this.redisService.set(
      `todo:${id}`,
      JSON.stringify(updatedTodo),
      3600,
    );

    // Broadcast qua WebSocket
    this.websocketGateway.emitTodoUpdated(updatedTodo);

    return updatedTodo;
  }

  async remove(id: number): Promise<{ message: string }> {
    const result = await this.todoRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException('Todo không tồn tại!');
    }

    // Xóa khỏi cache
    await this.redisService.del(`todo:${id}`);

    // Broadcast qua WebSocket
    this.websocketGateway.emitTodoDeleted(id);

    return { message: 'Xóa todo thành công' };
  }
}
