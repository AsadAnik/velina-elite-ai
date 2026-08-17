import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateHomeSectionDto {
  @ApiProperty({ example: 'Special Selections' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'Deals You Cannot Miss' })
  @IsString()
  @IsOptional()
  subtitle?: string;

  @ApiPropertyOptional({ example: 'SPECIAL SELECTIONS' })
  @IsString()
  @IsOptional()
  badge_text?: string;

  @ApiPropertyOptional({ example: 'Handpicked authentic beauty offers' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: 'deals_grid',
    description: 'deals_grid | promo_banner | banner_grid | product_showcase',
  })
  @IsString()
  @IsOptional()
  section_type?: string;

  @ApiPropertyOptional({
    example: 'gradient',
    description: 'gradient | color | image',
  })
  @IsString()
  @IsOptional()
  bg_type?: string;

  @ApiPropertyOptional({ example: '#ffffff' })
  @IsString()
  @IsOptional()
  bg_color?: string;

  @ApiPropertyOptional({ example: 'from-blue-600 to-indigo-800' })
  @IsString()
  @IsOptional()
  bg_gradient?: string;

  @ApiPropertyOptional({ example: 'https://...' })
  @IsString()
  @IsOptional()
  bg_image?: string;

  @ApiPropertyOptional({ example: 'https://...' })
  @IsString()
  @IsOptional()
  banner_image?: string;

  @ApiPropertyOptional({ example: '/products?category=deals' })
  @IsString()
  @IsOptional()
  banner_url?: string;

  @ApiPropertyOptional({ example: 'SHOP DEALS' })
  @IsString()
  @IsOptional()
  button_text?: string;

  @ApiPropertyOptional({ example: '/products' })
  @IsString()
  @IsOptional()
  button_url?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  order_index?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true || value === 1 || value === '1') return true;
    if (value === 'false' || value === false || value === 0 || value === '0') return false;
    return value;
  })
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  max_items?: number;
}
