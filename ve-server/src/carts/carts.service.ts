import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CartsService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserCart(customerId: number) {
    const cartItems = await this.prisma.cart.findMany({
      where: { customer_id: customerId },
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

    return cartItems.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      product: item.product,
    }));
  }

  async addToCart(customerId: number, productId: number, quantity: number = 1) {
    // Check if product exists
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check if already in cart
    const existing = await this.prisma.cart.findUnique({
      where: {
        customer_id_product_id: {
          customer_id: customerId,
          product_id: productId,
        },
      },
    });

    const newQuantity = existing ? existing.quantity + quantity : quantity;

    // Validate stock availability
    if (newQuantity > product.stock_quantity) {
      throw new ConflictException(
        `Insufficient stock. Only ${product.stock_quantity} item(s) available for "${product.title}"`
      );
    }

    if (existing) {
      // Update quantity
      const updated = await this.prisma.cart.update({
        where: { id: existing.id },
        data: { quantity: newQuantity },
        include: {
          product: {
            include: {
              category: true,
              sub_category: true,
            },
          },
        },
      });

      return {
        id: updated.id,
        quantity: updated.quantity,
        product: updated.product,
      };
    }

    // Add to cart
    const cart = await this.prisma.cart.create({
      data: {
        customer_id: customerId,
        product_id: productId,
        quantity,
      },
      include: {
        product: {
          include: {
            category: true,
            sub_category: true,
          },
        },
      },
    });

    return {
      id: cart.id,
      quantity: cart.quantity,
      product: cart.product,
    };
  }

  async updateCartItem(customerId: number, productId: number, quantity: number) {
    if (quantity <= 0) {
      return this.removeFromCart(customerId, productId);
    }

    const cart = await this.prisma.cart.findUnique({
      where: {
        customer_id_product_id: {
          customer_id: customerId,
          product_id: productId,
        },
      },
      include: {
        product: true,
      },
    });

    if (!cart) {
      throw new NotFoundException('Product not in cart');
    }

    // Validate stock availability
    if (quantity > cart.product.stock_quantity) {
      throw new ConflictException(
        `Insufficient stock. Only ${cart.product.stock_quantity} item(s) available for "${cart.product.title}"`
      );
    }

    const updated = await this.prisma.cart.update({
      where: { id: cart.id },
      data: { quantity },
      include: {
        product: {
          include: {
            category: true,
            sub_category: true,
          },
        },
      },
    });

    return {
      id: updated.id,
      quantity: updated.quantity,
      product: updated.product,
    };
  }

  async removeFromCart(customerId: number, productId: number) {
    const cart = await this.prisma.cart.findUnique({
      where: {
        customer_id_product_id: {
          customer_id: customerId,
          product_id: productId,
        },
      },
    });

    if (!cart) {
      throw new NotFoundException('Product not in cart');
    }

    await this.prisma.cart.delete({
      where: { id: cart.id },
    });

    return { message: 'Removed from cart' };
  }

  async clearCart(customerId: number) {
    await this.prisma.cart.deleteMany({
      where: { customer_id: customerId },
    });

    return { message: 'Cart cleared' };
  }
}
