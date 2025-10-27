import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Student } from './student.entity';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

@Injectable()
export class StudentsService {
  constructor(@InjectRepository(Student) private repo: Repository<Student>) {}

  create(dto: CreateStudentDto) {
    const student = this.repo.create(dto);
    return this.repo.save(student);
  }

  async findAll(q?: string) {
    if (!q) return this.repo.find();
    return this.repo.find({
      where: [{ full_name: Like(`%${q}%`) }, { code: Like(`%${q}%`) }, { class_name: Like(`%${q}%`) }],
      order: { id: 'DESC' },
    });
  }

  async findOne(id: number) {
    const s = await this.repo.findOne({ where: { id } });
    if (!s) throw new NotFoundException('Student not found');
    return s;
  }

  async update(id: number, dto: UpdateStudentDto) {
    const s = await this.findOne(id);
    Object.assign(s, dto);
    return this.repo.save(s);
  }

  async remove(id: number) {
    const s = await this.findOne(id);
    await this.repo.remove(s);
    return { deleted: true };
  }
}