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
import { Role } from '@prisma/client';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@ApiTags('orders')
@ApiBearerAuth()
@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) { }

  /**
   * CREATE ORDER
   * @param req Request object containing user information
   * @param createOrderDto CreateOrderDto object containing order information
   * @returns 
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new order (COD)' })
  createOrder(@Request() req, @Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.createOrder(req.user.customerId, createOrderDto);
  }

  /**
   * GET CURRENT USER ORDERS
   * @param req 
   * @returns 
   */
  @Get('my-orders')
  @ApiOperation({ summary: 'Get current user orders' })
  getMyOrders(@Request() req) {
    return this.ordersService.getCustomerOrders(req.user.customerId);
  }

  /**
   * GET CURRENT USER ORDER BY ID
   * @param req Request object containing user information
   * @param id Order ID
   * @returns Order information
   */
  @Get('my-orders/:id')
  @ApiOperation({ summary: 'Get current user order by ID' })
  getMyOrderById(@Request() req, @Param('id') id: string) {
    return this.ordersService.getOrderById(parseInt(id), req.user.customerId);
  }

  /**
   * CANCEL CURRENT USER ORDER
   * @param req Request object containing user information
   * @param id Order ID
   * @returns Order information
   */
  @Post('my-orders/:id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel current user order' })
  cancelMyOrder(@Request() req, @Param('id') id: string) {
    return this.ordersService.cancelOrder(parseInt(id), req.user.customerId);
  }

  /**
   * GET ALL ORDERS (ADMIN)
   * @returns All orders
   */
  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.admin, Role.owner)
  @ApiOperation({ summary: 'Get all orders (Admin)' })
  getAllOrders() {
    return this.ordersService.getAllOrders();
  }

  /**
   * GET ORDER BY ID (ADMIN)
   * @param id Order ID
   * @returns Order information
   */
  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.admin, Role.owner)
  @ApiOperation({ summary: 'Get order by ID (Admin)' })
  getOrderById(@Param('id') id: string) {
    return this.ordersService.getOrderById(parseInt(id));
  }

  /**
   * UPDATE ORDER STATUS (ADMIN)
   * @param id Order ID
   * @param updateOrderStatusDto UpdateOrderStatusDto object containing order status information
   * @returns Order information
   */
  @Put(':id/status')
  @UseGuards(RolesGuard)
  @Roles(Role.admin, Role.owner)
  @ApiOperation({ summary: 'Update order status (Admin)' })
  updateOrderStatus(
    @Param('id') id: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateOrderStatus(
      parseInt(id),
      updateOrderStatusDto,
    );
  }

  /**
   * DELETE ORDER (ADMIN)
   * @param id Order ID
   * @returns Order information
   */
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.admin, Role.owner)
  @ApiOperation({ summary: 'Delete order (Admin)' })
  deleteOrder(@Param('id') id: string) {
    return this.ordersService.deleteOrder(parseInt(id));
  }
}
