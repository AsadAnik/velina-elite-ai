import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUserPayload } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminUsersService } from './admin-users.service';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { UpdateAdminRoleDto } from './dto/update-admin-role.dto';

@ApiTags('admin-users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.admin, Role.owner)
@Controller('admin-users')
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all Admins and Owners' })
  getAdminUsers() {
    return this.adminUsersService.getAdminUsers();
  }

  @Get('search-customers')
  @ApiOperation({ summary: 'Search Customers by name/email/phone to promote' })
  @ApiQuery({ name: 'query', required: false, type: String })
  searchCustomers(@Query('query') query: string) {
    return this.adminUsersService.searchCustomers(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new Admin or Owner user' })
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  )
  createAdminUser(@Body() dto: CreateAdminUserDto) {
    return this.adminUsersService.createAdminUser(dto);
  }

  @Patch(':id/role')
  @ApiOperation({ summary: 'Update user role (owner / admin / customer)' })
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  )
  updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAdminRoleDto,
    @CurrentUser() user: AuthenticatedUserPayload,
  ) {
    return this.adminUsersService.updateUserRole(id, dto, user.sub);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove or revoke Admin privileges / delete user' })
  @ApiQuery({ name: 'action', required: false, enum: ['revoke', 'delete'] })
  removeAdmin(
    @Param('id', ParseIntPipe) id: number,
    @Query('action') action: 'revoke' | 'delete' = 'revoke',
    @CurrentUser() user: AuthenticatedUserPayload,
  ) {
    return this.adminUsersService.removeAdmin(id, user.sub, action);
  }
}
