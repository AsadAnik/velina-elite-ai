import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  Min,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsArray,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum ProductStatus {
  draft = 'draft',
  active = 'active',
  inactive = 'inactive',
};

export class CreateProductDto {
  @ApiProperty({ example: 'Nike Air Max' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Nike Air Max' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 99 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Type(() => Number)
  price: number;

  @ApiProperty({ example: 50 })
  @IsInt()
  @Min(0)
  @Type(() => Number)
  stock_quantity: number;

  @ApiPropertyOptional({ example: ['https://img1.jpg', 'https://img2.jpg'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images_url?: string[];

  @ApiPropertyOptional({ enum: ProductStatus, default: ProductStatus.draft })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Type(() => Number)
  category_id: number;

  @ApiProperty({ example: 3 })
  @IsInt()
  @Type(() => Number)
  sub_category_id: number;
}