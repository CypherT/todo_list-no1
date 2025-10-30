import { Todo } from '../../entities/todo.entity';

export interface PaginatedTodosResponse {
  ok: 1 | 0;
  t: 'success' | 'error';
  d?: {
    todos: Todo[];
    total: number;
    page: number;
    limit: number;
  };
  e?: string;
}
