import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Todo } from './entities/todo.entity';
import { CreateTodoDto, TodoStatus } from './dto/create-todo.dto'; // Import TodoStatus từ DTO
import { UpdateTodoDto } from './dto/update-todo.dto';

@Injectable()
export class TodosService {
  constructor(
    @InjectRepository(Todo)
    private readonly todoRepository: Repository<Todo>,
  ) {}

  async create(createTodoDto: CreateTodoDto): Promise<Todo> {
    // Fix: Map TodoStatus enum sang boolean cho entity
    const todoData: Partial<Todo> = {
      title: createTodoDto.title,
      completed: createTodoDto.completed === TodoStatus.DONE, // Map 'DONE' → true, else false
    };
    const todo = this.todoRepository.create(todoData);
    return await this.todoRepository.save(todo);
  }

  async findAll(
    page: number = 1,
    limit: number = 30,
  ): Promise<{ todos: Todo[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit; // Tính offset (bỏ qua items trước page)
    const [todos, total] = await this.todoRepository.findAndCount({
      skip, // Bỏ qua (page-1)*limit items
      take: limit, // Lấy limit items
      order: { id: 'DESC' }, // Sort theo id giảm dần (optional, thay đổi nếu cần)
    });
    return {
      todos,
      total, // Tổng số items để client tính pages
      page,
      limit,
    }; // Return metadata cho client
  }

  async findOne(id: number): Promise<Todo> {
    const todo = await this.todoRepository.findOneBy({ id });
    if (!todo) {
      throw new NotFoundException(`Todo #${id} not found`);
    }
    return todo;
  }

  async update(id: number, updateTodoDto: UpdateTodoDto): Promise<Todo> {
    await this.findOne(id);
    const todo = await this.todoRepository.findOneBy({ id });
    // Fix: Map TodoStatus enum sang boolean nếu DTO update cũng dùng enum
    Object.assign(todo, {
      title: updateTodoDto.title,
      completed: updateTodoDto.completed === TodoStatus.DONE, // Giả sử UpdateDto cũng có TodoStatus
    });
    return await this.todoRepository.save(todo);
  }

  async remove(id: number): Promise<void> {
    const result = await this.todoRepository.delete({ id });
    if (result.affected === 0) {
      throw new NotFoundException(`Todo #${id} not found`);
    }
  }
}
