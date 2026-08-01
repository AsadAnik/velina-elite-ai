import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSubCategoryDto {
  @ApiProperty({ example: 'Sub Category Name' })
  @IsString()
  @Type(() => String)
  name: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Type(() => Number)
  category_id: number;
}
