import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateHomeSectionItemDto {
  @ApiProperty({ example: 'MEGA OFFERS' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'UP TO 50% OFF' })
  @IsString()
  @IsOptional()
  subtitle?: string;

  @ApiPropertyOptional({ example: 'Top brands in skincare & hair treatments' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: '50% OFF' })
  @IsString()
  @IsOptional()
  tag?: string;

  @ApiPropertyOptional({ example: 'bg-cyan-400 text-slate-900' })
  @IsString()
  @IsOptional()
  tag_bg?: string;

  @ApiPropertyOptional({ example: 'https://...' })
  @IsString()
  @IsOptional()
  image_url?: string;

  @ApiPropertyOptional({ example: '/products?category=skincare' })
  @IsString()
  @IsOptional()
  link_url?: string;

  @ApiPropertyOptional({ example: 'SHOP DEALS' })
  @IsString()
  @IsOptional()
  button_text?: string;

  @ApiPropertyOptional({ example: 'from-blue-600 to-indigo-800' })
  @IsString()
  @IsOptional()
  bg_gradient?: string;

  @ApiPropertyOptional({ example: '#1e293b' })
  @IsString()
  @IsOptional()
  bg_color?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  product_id?: number;

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
}
