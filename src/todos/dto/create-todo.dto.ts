import { IsString, IsNotEmpty, IsEnum } from 'class-validator';

export enum TodoStatus {
  Incomplete = 0,
  Complete = 1,
}

export class CreateTodoDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsEnum(TodoStatus)
  completed: TodoStatus;
}
