import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Todo } from '../../todos/entities/todo.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string; // Hashed bằng bcrypt

  @Column({ default: 'user' })
  role: string;

  @OneToMany(() => Todo, (todo) => todo.user)
  todos: Todo[];
}
