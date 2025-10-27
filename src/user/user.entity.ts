// src/user/user.entity.ts

import { ApiProperty } from '@nestjs/swagger'; // <-- Thêm
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @ApiProperty({ example: 1 }) // (Yêu cầu 9)
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'teacher@example.com' }) // (Yêu cầu 9)
  @Column({ unique: true })
  email: string;

  // Không thêm ApiProperty cho password_hash để bảo mật
  @Column()
  password_hash: string;

  @ApiProperty({ example: 'Nguyễn Văn B', required: false }) // (Yêu cầu 9)
  @Column({ nullable: true })
  full_name?: string;

  @ApiProperty({
    example: 'teacher',
    enum: ['admin', 'teacher', 'staff'],
  }) // (Yêu cầu 9)
  @Column({ default: 'teacher' })
  role: 'admin' | 'teacher' | 'staff';

  @ApiProperty() // (Yêu cầu 9)
  @CreateDateColumn()
  created_at: Date;
}