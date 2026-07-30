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
import { Type, Transform } from 'class-transformer';

export enum ProductStatus {
  draft = 'draft',
  active = 'active',
  inactive = 'inactive',
};

export enum ProductSizeUnit {
  ml = 'ml',
  gm = 'gm',
}

export class CreateProductDto {
  @ApiProperty({ example: 'Nike Air Max' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Nike Air Max' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 99 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Type(() => Number)
  price?: number;

  @ApiProperty({ example: 80 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Type(() => Number)
  regular_price: number;

  @ApiProperty({ example: 100 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Type(() => Number)
  mrp_price: number;

  @ApiPropertyOptional({ example: 120 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  size?: number;

  @ApiPropertyOptional({ enum: ProductSizeUnit, default: ProductSizeUnit.gm })
  @IsOptional()
  @IsEnum(ProductSizeUnit)
  size_unit?: ProductSizeUnit;

  @ApiPropertyOptional({ example: '৳', default: '৳' })
  @IsOptional()
  @IsString()
  currency_symbol?: string;

  @ApiProperty({ example: 50 })
  @IsInt()
  @Min(0)
  @Type(() => Number)
  stock_quantity: number;

  @ApiPropertyOptional({ example: ['https://img1.jpg', 'https://img2.jpg'] })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined) return value;
    return Array.isArray(value) ? value : [value];
  })
  @IsArray()
  @IsString({ each: true })
  images_url?: string[];

  // This field is whitelisted so the global ValidationPipe (forbidNonWhitelisted: true)
  // doesn't reject multipart requests. The actual file data is extracted via @UploadedFiles()
  // by multer and this field is never used from the DTO body.
  @IsOptional()
  images?: any;


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