import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, Length } from 'class-validator';

export class CreateStudentDto {
  @ApiProperty({ example: 'HS001' })
  @IsString() @Length(1, 50)
  code: string;

  @ApiProperty({ example: 'Nguyen Van A' })
  @IsString() @Length(1, 255)
  full_name: string;

  @ApiProperty({ example: '10A1', required: false })
  @IsOptional() @IsString()
  class_name?: string;

  @ApiProperty({ example: '2008-05-20', required: false })
  @IsOptional() @IsDateString()
  dob?: string;
}