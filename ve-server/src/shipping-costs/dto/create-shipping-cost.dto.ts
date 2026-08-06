import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateShippingCostDto {
  @ApiProperty({ example: 70, default: 70 })
  @IsNumber()
  @Type(() => Number)
  inside_dhaka_cost!: number;

  @ApiProperty({ example: 120, default: 120 })
  @IsNumber()
  @Type(() => Number)
  outside_dhaka_cost!: number;

  @ApiProperty({ example: '৳', required: false, default: '৳' })
  @IsString()
  @IsOptional()
  currency_symbol?: string;
}
