import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { TodosService } from "./todos.service";
import { CreateTodoDto } from "./dto/create-todo.dto";
import { UpdateTodoDto } from "./dto/update-todo.dto";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtUser } from "../auth/interfaces/jwt-user.interface"; // Fix: Thêm 'type' để import type-only

@Controller("todos")
@UseGuards(JwtAuthGuard)
export class TodosController {
  constructor(private todosService: TodosService) {}

  @Get()
  async findAll(@CurrentUser() user: JwtUser) {
    // Giờ TS happy với type import
    return this.todosService.findAll(user);
  }

  @Get(":id")
  async findOne(@Param("id") id: string, @CurrentUser() user: JwtUser) {
    return this.todosService.findOne(id, user);
  }

  @Post()
  async create(
    @Body() createTodoDto: CreateTodoDto,
    @CurrentUser() user: JwtUser
  ) {
    return this.todosService.create(createTodoDto, user);
  }

  @Put(":id")
  async update(
    @Param("id") id: string,
    @Body() updateTodoDto: UpdateTodoDto,
    @CurrentUser() user: JwtUser
  ) {
    return this.todosService.update(id, updateTodoDto, user);
  }

  @Delete(":id")
  async remove(@Param("id") id: string, @CurrentUser() user: JwtUser) {
    const result = await this.todosService.remove(id, user);
    return { message: "Todo đã xóa thành công", id, data: result };
  }
}
