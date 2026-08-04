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
import { CartsService } from './carts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('carts')
@ApiBearerAuth()
@Controller('carts')
@UseGuards(JwtAuthGuard)
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user cart' })
  getUserCart(@Request() req) {
    return this.cartsService.getUserCart(req.user.customerId);
  }

  @Post(':productId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add product to cart' })
  addToCart(
    @Request() req,
    @Param('productId') productId: string,
    @Body('quantity') quantity?: number,
  ) {
    return this.cartsService.addToCart(
      req.user.customerId,
      parseInt(productId),
      quantity || 1,
    );
  }

  @Put(':productId')
  @ApiOperation({ summary: 'Update cart item quantity' })
  updateCartItem(
    @Request() req,
    @Param('productId') productId: string,
    @Body('quantity') quantity: number,
  ) {
    return this.cartsService.updateCartItem(
      req.user.customerId,
      parseInt(productId),
      quantity,
    );
  }

  @Delete(':productId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove product from cart' })
  removeFromCart(@Request() req, @Param('productId') productId: string) {
    return this.cartsService.removeFromCart(
      req.user.customerId,
      parseInt(productId),
    );
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Clear cart' })
  clearCart(@Request() req) {
    return this.cartsService.clearCart(req.user.customerId);
  }
}
