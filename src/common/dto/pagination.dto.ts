import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive } from 'class-validator';

class PaginationDto {
  @IsInt()
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsInt()
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;
}

export default PaginationDto;
