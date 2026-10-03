import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateAdminRoleDto {
  @ApiProperty({ enum: Role, example: Role.admin })
  @IsNotEmpty()
  @IsEnum(Role, { message: 'Role must be owner, admin, or customer' })
  role: Role;
}
