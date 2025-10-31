import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  UseGuards,
  DefaultValuePipe,
} from '@nestjs/common';
import { TodosService } from './todos.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { Todo } from '../entities/todo.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../entities/user.entity';

@Controller('todos')
export class TodosController {
  constructor(private readonly todosService: TodosService) {}

  /**
   * Lấy tất cả todo (có phân trang)
   * GET /api/v1/todos?page=1&limit=50
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @CurrentUser() user: User,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.todosService.findAll(page, limit);
  }

  /**
   * Lấy todo theo ID
   * GET /api/v1/todos/1
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Todo> {
    return this.todosService.findOne(id);
  }

  /**
   * Tạo todo mới
   * POST /api/v1/todos
   * Body: { title: string, completed: 0 | 1 }
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Body() createTodoDto: CreateTodoDto,
    @CurrentUser() user: User,
  ): Promise<Todo> {
    console.log(`📝 User ${user.id} tạo todo: ${createTodoDto.title}`);
    return this.todosService.create(createTodoDto, user);
  }

  /**
   * Cập nhật todo
   * PATCH /api/v1/todos/1
   * Body: { title?: string, completed?: 0 | 1 }
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTodoDto: UpdateTodoDto,
    @CurrentUser() user: User,
  ): Promise<Todo> {
    console.log(`✏️  User ${user.id} cập nhật todo ID ${id}`);
    return this.todosService.update(id, updateTodoDto, user);
  }

  /**
   * Xóa todo
   * DELETE /api/v1/todos/1
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<{ message: string }> {
    console.log(`🗑️  User ${user.id} xóa todo ID ${id}`);
    return this.todosService.remove(id, user);
  }
}
