import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Put,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUserPayload } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CustomersService } from './customers.service';
import { QueryCustomersDto } from './dto/query-customers.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@ApiTags('customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.admin, Role.owner)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @ApiOperation({ summary: 'Get paginated customers list with search' })
  @UsePipes(new ValidationPipe({ transform: true }))
  getCustomers(@Query() query: QueryCustomersDto) {
    return this.customersService.getCustomers(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer details by user ID' })
  getCustomerById(@Param('id', ParseIntPipe) id: number) {
    return this.customersService.getCustomerById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update customer and user profile (PUT)' })
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  )
  updateCustomerPut(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customersService.updateCustomer(id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update customer and user profile (PATCH)' })
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  )
  updateCustomerPatch(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customersService.updateCustomer(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Permanently delete customer and related profile' })
  deleteCustomer(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUserPayload,
  ) {
    return this.customersService.deleteCustomer(id, user.sub);
  }
}
