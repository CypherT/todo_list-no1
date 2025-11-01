import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

export enum TodoStatus {
  OPEN = 'OPEN',
  DONE = 'DONE',
}

export class CreateTodoDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsEnum(TodoStatus)
  completed?: TodoStatus;
}
