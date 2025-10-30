import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Todo } from '../entities/todo.entity';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { RedisService } from '../redis/redis.service';

/**
 * Service xử lý logic business cho Todo, tích hợp TypeORM, Redis cache, và WebSocket broadcast.
 */
@Injectable()
export class TodosService {
  private readonly CACHE_TTL = 3600; // 1 giờ

  constructor(
    @InjectRepository(Todo)
    private readonly todoRepository: Repository<Todo>,
    private readonly websocketGateway: WebsocketGateway,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Tạo todo mới, cache vào Redis, và broadcast qua WebSocket.
   */
  async create(createTodoDto: CreateTodoDto): Promise<Todo> {
    const todo = this.todoRepository.create(createTodoDto);
    const savedTodo = await this.todoRepository.save(todo);

    // Cache todo trong Redis
    try {
      await this.redisService.set(
        `todo:${savedTodo.id}`,
        JSON.stringify(savedTodo),
        this.CACHE_TTL,
      );
    } catch (cacheError) {
      console.warn(`Lỗi lưu cache cho todo mới ${savedTodo.id}:`, cacheError);
    }

    // Broadcast qua WebSocket
    this.websocketGateway.emitTodoCreated(savedTodo);

    return savedTodo;
  }

  /**
   * Tìm todo theo ID, ưu tiên cache Redis.
   */
  async findOne(id: number): Promise<Todo> {
    const cacheKey = `todo:${id}`;
    let cached: string | null;

    try {
      cached = await this.redisService.get(cacheKey);
    } catch (error) {
      console.warn(`Lỗi đọc cache Redis cho key ${cacheKey}:`, error);
      cached = null;
    }

    if (cached) {
      try {
        // Parse và cast về Todo type để fix ESLint (type-safe)
        const parsedTodo = JSON.parse(cached) as Todo;

        // Optional: Validate thêm nếu cần (ví dụ: kiểm tra id khớp)
        if (parsedTodo.id === id) {
          return parsedTodo; // Bây giờ return Todo, không phải any
        }
      } catch (parseError) {
        console.warn(
          `Lỗi parse JSON từ cache cho key ${cacheKey}:`,
          parseError,
        );
        // Fallback: Xóa cache hỏng và lấy từ DB
        try {
          await this.redisService.del(cacheKey);
        } catch (delError) {
          console.warn(`Lỗi xóa cache hỏng cho key ${cacheKey}:`, delError);
        }
      }
    }

    // Fallback luôn về DB nếu cache fail
    const todo = await this.todoRepository.findOneBy({ id });

    if (!todo) {
      throw new NotFoundException('Todo không tồn tại!');
    }

    // Lưu vào cache (với error handling)
    try {
      await this.redisService.set(
        cacheKey,
        JSON.stringify(todo),
        this.CACHE_TTL,
      );
    } catch (cacheError) {
      console.warn(`Lỗi lưu cache cho todo ${id}:`, cacheError);
    }

    return todo;
  }

  /**
   * Cập nhật todo, invalidate cache, và broadcast qua WebSocket.
   */
  async update(id: number, updateTodoDto: UpdateTodoDto): Promise<Todo> {
    const existingTodo = await this.todoRepository.findOneBy({ id });

    if (!existingTodo) {
      throw new NotFoundException('Không tìm thấy todo để cập nhật!');
    }

    // Merge changes với preload để hiệu quả hơn
    Object.assign(existingTodo, updateTodoDto);
    const updatedTodo = await this.todoRepository.save(existingTodo);

    const cacheKey = `todo:${id}`;

    // Cập nhật cache
    try {
      await this.redisService.set(
        cacheKey,
        JSON.stringify(updatedTodo),
        this.CACHE_TTL,
      );
    } catch (cacheError) {
      console.warn(`Lỗi cập nhật cache cho todo ${id}:`, cacheError);
    }

    // Broadcast qua WebSocket
    this.websocketGateway.emitTodoUpdated(updatedTodo);

    return updatedTodo;
  }

  /**
   * Xóa todo, remove cache, và broadcast qua WebSocket.
   */
  async remove(id: number): Promise<{ message: string }> {
    const existingTodo = await this.todoRepository.findOneBy({ id });

    if (!existingTodo) {
      throw new NotFoundException('Todo không tồn tại!');
    }

    await this.todoRepository.remove(existingTodo); // Sử dụng remove thay delete để trigger events nếu có

    const cacheKey = `todo:${id}`;

    // Xóa khỏi cache
    try {
      await this.redisService.del(cacheKey);
    } catch (cacheError) {
      console.warn(`Lỗi xóa cache cho todo ${id}:`, cacheError);
    }

    // Broadcast qua WebSocket
    this.websocketGateway.emitTodoDeleted(id);

    return { message: 'Xóa todo thành công' };
  }
}
