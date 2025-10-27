// src/students/student.entity.ts

import { ApiProperty } from '@nestjs/swagger'; // <-- Thêm
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('students')
export class Student {
  @ApiProperty({ example: 1 }) // (Yêu cầu 9)
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'S12345', required: false }) // (Yêu cầu 9)
  @Column({ unique: true, nullable: true })
  code: string;

  @ApiProperty({ example: 'Nguyễn Văn A' }) // (Yêu cầu 9)
  @Column()
  full_name: string;

  @ApiProperty({ example: 'Lớp 10A1', required: false }) // (Yêu cầu 9)
  @Column({ nullable: true })
  class_name?: string;

  @ApiProperty({ example: '2010-01-20', required: false }) // (Yêu cầu 9)
  @Column({ type: 'date', nullable: true })
  dob?: string;

  @ApiProperty() // (Yêu cầu 9)
  @CreateDateColumn()
  created_at: Date;
}