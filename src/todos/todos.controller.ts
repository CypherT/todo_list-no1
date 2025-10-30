import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { TodosService } from './todos.service';
import { FindAllTodosService } from './services/find-all-todos.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { TodoResponse } from './interfaces/todo-response.interface';
import { PaginatedTodosResponse } from './interfaces/paginated-todos.interface';

@Controller('todos')
export class TodosController {
  constructor(
    private readonly todosService: TodosService,
    private readonly findAllTodosService: FindAllTodosService,
  ) {}

  @Get()
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
  ): Promise<PaginatedTodosResponse> {
    return this.findAllTodosService.findAll(page, limit);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<TodoResponse> {
    return this.todosService.findOne(+id);
  }

  @Post()
  async create(@Body() createTodoDto: CreateTodoDto): Promise<TodoResponse> {
    return this.todosService.create(createTodoDto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTodoDto: UpdateTodoDto,
  ): Promise<TodoResponse> {
    return this.todosService.update(+id, updateTodoDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<TodoResponse> {
    return this.todosService.remove(+id);
  }
}
