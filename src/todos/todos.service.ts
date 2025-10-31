import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Todo } from '../entities/todo.entity';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { RedisService } from '../redis/redis.service';
import { User } from '../entities/user.entity';

/**
 * Service xử lý logic business cho Todo
 * Tích hợp: TypeORM, Redis cache, WebSocket broadcast (Native WS)
 * Đồng bộ todo giữa các thiết bị của cùng 1 user
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
   * Tạo todo mới
   * - Lưu vào DB
   * - Cache vào Redis
   * - Broadcast qua WebSocket tới tất cả thiết bị của user
   */
  async create(createTodoDto: CreateTodoDto, user: User): Promise<Todo> {
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
      console.warn(
        `⚠️  Lỗi lưu cache cho todo mới ${savedTodo.id}:`,
        cacheError,
      );
    }

    // Broadcast qua WebSocket tới tất cả thiết bị của user
    this.websocketGateway.emitTodoCreated(savedTodo, user.id);

    return savedTodo;
  }

  /**
   * Tìm todo theo ID
   * - Ưu tiên lấy từ cache Redis
   * - Nếu không có, lấy từ DB
   */
  async findOne(id: number): Promise<Todo> {
    const cacheKey = `todo:${id}`;
    let cached: string | null;

    try {
      cached = await this.redisService.get(cacheKey);
    } catch (error) {
      console.warn(`⚠️  Lỗi đọc cache Redis cho key ${cacheKey}:`, error);
      cached = null;
    }

    if (cached) {
      try {
        const parsedTodo = JSON.parse(cached) as Todo;

        if (parsedTodo.id === id) {
          console.log(`✅ Todo ${id} lấy từ cache`);
          return parsedTodo;
        }
      } catch (parseError) {
        console.warn(
          `⚠️  Lỗi parse JSON từ cache cho key ${cacheKey}:`,
          parseError,
        );
        try {
          await this.redisService.del(cacheKey);
        } catch (delError) {
          console.warn(`⚠️  Lỗi xóa cache hỏng cho key ${cacheKey}:`, delError);
        }
      }
    }

    // Fallback lấy từ DB
    const todo = await this.todoRepository.findOneBy({ id });

    if (!todo) {
      throw new NotFoundException('Todo không tồn tại!');
    }

    // Lưu vào cache
    try {
      await this.redisService.set(
        cacheKey,
        JSON.stringify(todo),
        this.CACHE_TTL,
      );
    } catch (cacheError) {
      console.warn(`⚠️  Lỗi lưu cache cho todo ${id}:`, cacheError);
    }

    return todo;
  }

  /**
   * Cập nhật todo
   * - Cập nhật DB
   * - Cập nhật cache Redis
   * - Broadcast qua WebSocket tới tất cả thiết bị của user
   */
  async update(
    id: number,
    updateTodoDto: UpdateTodoDto,
    user: User,
  ): Promise<Todo> {
    const existingTodo = await this.todoRepository.findOneBy({ id });

    if (!existingTodo) {
      throw new NotFoundException('Không tìm thấy todo để cập nhật!');
    }

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
      console.warn(`⚠️  Lỗi cập nhật cache cho todo ${id}:`, cacheError);
    }

    // Broadcast qua WebSocket tới tất cả thiết bị của user
    this.websocketGateway.emitTodoUpdated(updatedTodo, user.id);

    return updatedTodo;
  }

  /**
   * Xóa todo
   * - Xóa khỏi DB
   * - Xóa khỏi cache Redis
   * - Broadcast qua WebSocket tới tất cả thiết bị của user
   */
  async remove(id: number, user: User): Promise<{ message: string }> {
    const existingTodo = await this.todoRepository.findOneBy({ id });

    if (!existingTodo) {
      throw new NotFoundException('Todo không tồn tại!');
    }

    await this.todoRepository.remove(existingTodo);

    const cacheKey = `todo:${id}`;

    // Xóa khỏi cache
    try {
      await this.redisService.del(cacheKey);
    } catch (cacheError) {
      console.warn(`⚠️  Lỗi xóa cache cho todo ${id}:`, cacheError);
    }

    // Broadcast qua WebSocket tới tất cả thiết bị của user
    this.websocketGateway.emitTodoDeleted(id, user.id);

    return { message: 'Xóa todo thành công' };
  }

  /**
   * Tìm tất cả todo (có phân trang)
   */
  async findAll(page: number = 1, limit: number = 50) {
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
