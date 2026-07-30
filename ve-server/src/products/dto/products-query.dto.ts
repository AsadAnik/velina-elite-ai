import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProductStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

export class ProductsQueryDto {
  @ApiPropertyOptional({ example: 1, minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 12, minimum: 1, maximum: 100, default: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ example: 1, description: 'Only return products in this category.' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  category_id?: number;

  @ApiPropertyOptional({ example: 3, description: 'Only return products in this sub-category.' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  sub_category_id?: number;

  @ApiPropertyOptional({ enum: ProductStatus, example: ProductStatus.active })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;
}
