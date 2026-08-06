import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateShippingCostDto {
  @ApiProperty({ example: 60, required: false })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  inside_dhaka_cost?: number;

  @ApiProperty({ example: 120, required: false })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  outside_dhaka_cost?: number;

  @ApiProperty({ example: '৳', required: false })
  @IsString()
  @IsOptional()
  currency_symbol?: string;
}
