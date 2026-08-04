import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateAddressDto {
  @ApiProperty({ example: '123 Main Street', required: false })
  @IsString()
  @IsOptional()
  line1?: string;

  @ApiProperty({ example: 'Apt 4B', required: false })
  @IsString()
  @IsOptional()
  line2?: string;

  @ApiProperty({ example: 'Dhaka', required: false })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({ example: 'Bangladesh', required: false })
  @IsString()
  @IsOptional()
  counrty?: string;

  @ApiProperty({ example: '1234', required: false })
  @IsString()
  @IsOptional()
  postal_code?: string;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  is_default?: boolean;
}
