import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  UseGuards,
  Request,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AddressesService } from './addresses.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@ApiTags('addresses')
@ApiBearerAuth()
@Controller('addresses')
@UseGuards(JwtAuthGuard)
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Get()
  @ApiOperation({ summary: 'Get user addresses' })
  getUserAddresses(@Request() req) {
    return this.addressesService.getUserAddresses(req.user.customerId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new address' })
  createAddress(@Request() req, @Body() createAddressDto: CreateAddressDto) {
    return this.addressesService.createAddress(
      req.user.customerId,
      createAddressDto,
    );
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update address' })
  updateAddress(
    @Request() req,
    @Param('id') id: string,
    @Body() updateAddressDto: UpdateAddressDto,
  ) {
    return this.addressesService.updateAddress(
      req.user.customerId,
      parseInt(id),
      updateAddressDto,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete address' })
  deleteAddress(@Request() req, @Param('id') id: string) {
    return this.addressesService.deleteAddress(req.user.customerId, parseInt(id));
  }

  @Put(':id/default')
  @ApiOperation({ summary: 'Set address as default' })
  setDefaultAddress(@Request() req, @Param('id') id: string) {
    return this.addressesService.setDefaultAddress(
      req.user.customerId,
      parseInt(id),
    );
  }
}
