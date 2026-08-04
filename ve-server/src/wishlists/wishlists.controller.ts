import {
  Controller,
  Get,
  Post,
  Delete,
  UseGuards,
  Request,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WishlistsService } from './wishlists.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('wishlists')
@ApiBearerAuth()
@Controller('wishlists')
@UseGuards(JwtAuthGuard)
export class WishlistsController {
  constructor(private readonly wishlistsService: WishlistsService) { }

  @Get()
  @ApiOperation({ summary: 'Get user wishlist' })
  getUserWishlist(@Request() req) {
    return this.wishlistsService.getUserWishlist(req.user.customerId);
  }

  @Post(':productId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add product to wishlist' })
  addToWishlist(@Request() req, @Param('productId') productId: string) {
    return this.wishlistsService.addToWishlist(req.user.customerId, parseInt(productId));
  }

  @Delete(':productId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove product from wishlist' })
  removeFromWishlist(@Request() req, @Param('productId') productId: string) {
    return this.wishlistsService.removeFromWishlist(
      req.user.customerId,
      parseInt(productId),
    );
  }
}
