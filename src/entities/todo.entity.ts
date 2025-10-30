import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { TodoStatus } from '../todos/dto/create-todo.dto';

@Entity('todos')
export class Todo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'enum', enum: TodoStatus, default: TodoStatus.Incomplete })
  completed: TodoStatus;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
