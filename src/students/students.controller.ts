// src/students/students.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Put,
  Delete,
  UseGuards,
  ParseIntPipe, // <-- Thêm
} from '@nestjs/common';
import {
  ApiTags,
  ApiQuery,
  ApiResponse,
  ApiBearerAuth, // <-- Thêm
  ApiBody,
} from '@nestjs/swagger';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { JwtAuthGuard } from 'src/common/jwt-auth.guard'; // <-- Thêm

// (Yêu cầu 9) Thêm ApiTags, ApiBearerAuth, UseGuards
@ApiTags('students')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('students')
export class StudentsController {
  constructor(private readonly svc: StudentsService) {}

  @Post()
  @ApiBody({ type: CreateStudentDto }) // (Yêu cầu 3) Giải quyết conflict
  @ApiResponse({ status: 201, description: 'Created' })
  create(@Body() dto: CreateStudentDto) {
    return this.svc.create(dto);
  }

  @Get()
  @ApiQuery({
    name: 'q',
    required: false,
    description: 'Search by name/code/class',
  })
  findAll(@Query('q') q?: string) {
    return this.svc.findAll(q);
  }

  @Get(':id')
  @ApiResponse({ status: 200, description: 'Found' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  findOne(@Param('id', ParseIntPipe) id: number) { // <-- Dùng ParseIntPipe
    return this.svc.findOne(id);
  }

  @Put(':id')
  @ApiBody({ type: UpdateStudentDto })
  @ApiResponse({ status: 200, description: 'Updated' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  update(
    @Param('id', ParseIntPipe) id: number, // <-- Dùng ParseIntPipe
    @Body() dto: UpdateStudentDto,
  ) {
    return this.svc.update(id, dto);
  }

  @Delete(':id')
  @ApiResponse({ status: 200, description: 'Deleted' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  remove(@Param('id', ParseIntPipe) id: number) { // <-- Dùng ParseIntPipe
    return this.svc.remove(id);
  }
}