import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WishlistsService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserWishlist(userId: number) {
    if (!userId) {
      // Return empty array if no customer ID (e.g., admin users)
      return [];
    }

    try {
      const wishlists = await this.prisma.wishlist.findMany({
        where: { customer_id: userId },
        include: {
          product: {
            include: {
              category: true,
              sub_category: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
      });

      return wishlists.map((w) => w.product);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      throw new Error('Failed to fetch wishlist');
    }
  }

  async addToWishlist(userId: number, productId: number) {
    if (!userId) {
      throw new NotFoundException('Customer ID not found in token');
    }

    // Check if product exists
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check if already in wishlist
    const existing = await this.prisma.wishlist.findUnique({
      where: {
        customer_id_product_id: {
          customer_id: userId,
          product_id: productId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Product already in wishlist');
    }

    // Add to wishlist
    await this.prisma.wishlist.create({
      data: {
        customer_id: userId,
        product_id: productId,
      },
    });

    return { message: 'Added to wishlist' };
  }

  async removeFromWishlist(userId: number, productId: number) {
    if (!userId) {
      throw new NotFoundException('Customer ID not found in token');
    }

    const wishlist = await this.prisma.wishlist.findUnique({
      where: {
        customer_id_product_id: {
          customer_id: userId,
          product_id: productId,
        },
      },
    });

    if (!wishlist) {
      throw new NotFoundException('Product not in wishlist');
    }

    await this.prisma.wishlist.delete({
      where: { id: wishlist.id },
    });

    return { message: 'Removed from wishlist' };
  }
}
