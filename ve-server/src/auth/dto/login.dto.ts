import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'velinaelitebd01@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Velina.Admin1234' })
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}
