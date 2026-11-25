import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ShippingCostsService } from './shipping-costs.service';
import { CreateShippingCostDto } from './dto/create-shipping-cost.dto';
import { UpdateShippingCostDto } from './dto/update-shipping-cost.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('shipping-costs')
@ApiBearerAuth()
@Controller('shipping-costs')
export class ShippingCostsController {
  constructor(private readonly shippingCostsService: ShippingCostsService) { }

  /**
   * CREATE SHIPPING COST CONFIGURATION
   * @param dto createShippingCostDto
   * @returns Object
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.owner)
  @ApiOperation({ summary: 'Create Shipping Cost Configuration' })
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  )
  create(@Body() dto: CreateShippingCostDto) {
    return this.shippingCostsService.createShippingCost(dto);
  }

  /**
   * GET SHIPPING COST CONFIGURATION
   * @returns Object
   */
  @Get()
  @ApiOperation({ summary: 'Get Shipping Cost Configuration' })
  getShippingCost() {
    return this.shippingCostsService.getShippingCost();
  }

  /**
   * UPDATE SHIPPING COST CONFIGURATION
   * @param id shipping_cost_id
   * @param dto updateShippingCostDto
   * @returns Object
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.owner)
  @ApiOperation({ summary: 'Update Shipping Cost Configuration' })
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  )
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateShippingCostDto) {
    return this.shippingCostsService.updateShippingCost(id, dto);
  }

  /**
   * DELETE SHIPPING COST CONFIGURATION
   * @param id shipping_cost_id
   * @returns Object
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.owner)
  @ApiOperation({ summary: 'Delete Shipping Cost Configuration' })
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.shippingCostsService.deleteShippingCost(id);
  }
}
