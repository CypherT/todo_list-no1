import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { Transform } from 'class-transformer';
import { BadRequestException } from '@nestjs/common'; // Import mới: Để throw lỗi trong @Transform

export class CreateTodoDto {
  @IsString({ message: 'Title phải là string!' })
  @IsNotEmpty({ message: 'Title không được để trống!' })
  title: string;

  @IsOptional()
  @IsBoolean({
    message:
      'Completed phải là boolean (true hoặc false), không phải số hoặc string!',
  })
  @Type(() => Boolean)
  @Transform(({ value }) => {
    // Custom check: Chỉ accept true/false hoặc string 'true'/'false', reject 123/'abc'
    if (
      value !== true &&
      value !== false &&
      value !== 'true' &&
      value !== 'false'
    ) {
      throw new BadRequestException(
        'Completed phải là true/false hoặc "true"/"false"!',
      ); // Giờ import đúng, không lỗi TS
    }
    return value === true || value === 'true'; // Convert an toàn
  })
  completed?: boolean;
}
