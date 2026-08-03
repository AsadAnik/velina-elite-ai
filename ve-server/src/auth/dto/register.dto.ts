import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  Matches,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'John Doe' })
  @IsNotEmpty()
  @MinLength(2)
  fullName: string;

  @ApiProperty({ example: 'customer@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+8801700000000' })
  @IsOptional()
  @Matches(/^\+?[0-9\-\s]{7,20}$/)
  phone?: string;

  @ApiProperty({ example: 'Customer.1234' })
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'Customer.1234' })
  @IsNotEmpty()
  @MinLength(8)
  confirmPassword: string;

  @ApiPropertyOptional({ example: 'female' })
  @IsOptional()
  gender?: string;
}
