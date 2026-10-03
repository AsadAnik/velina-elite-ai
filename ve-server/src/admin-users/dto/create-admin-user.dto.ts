import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  Matches,
  MinLength,
} from 'class-validator';

export class CreateAdminUserDto {
  @ApiProperty({ example: 'Admin Name' })
  @IsNotEmpty()
  @MinLength(2)
  fullName: string;

  @ApiProperty({ example: 'admin@velinaelite.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'AdminPassword123' })
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ enum: Role, example: Role.admin })
  @IsEnum(Role, { message: 'Role must be either admin or owner' })
  role: Role;

  @ApiPropertyOptional({ example: '+8801700000000' })
  @IsOptional()
  @Matches(/^\+?[0-9\-\s]{7,20}$/, { message: 'Please provide a valid phone number' })
  phone?: string;

  @ApiPropertyOptional({ example: 'other' })
  @IsOptional()
  gender?: string;
}
