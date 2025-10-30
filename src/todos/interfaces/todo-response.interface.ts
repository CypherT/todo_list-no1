import { Todo } from '../../entities/todo.entity';

export interface TodoResponse {
  ok: 1 | 0;
  t: 'success' | 'error';
  d?: Todo | null;
  e?: string;
}
