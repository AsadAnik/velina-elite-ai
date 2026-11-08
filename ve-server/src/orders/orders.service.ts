import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderStatus } from '@prisma/client';

enum PaymentMethod {
  cod = 'cod',
}

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * @param customerId Customer ID
   * @param createOrderDto CreateOrderDto object containing order information
   * @returns Order information
   */
  // region CREATE ORDER
  async createOrder(customerId: number, createOrderDto: CreateOrderDto) {
    const { shipping_address_id, items, note } = createOrderDto;

    // Verify address belongs to customer
    const address = await this.prisma.address.findUnique({
      where: { id: shipping_address_id },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    if (address.customer_id !== customerId) {
      throw new ForbiddenException('You do not have permission to use this address');
    }

    // Validate products and calculate total
    const productIds = items.map(item => item.product_id);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException('One or more products not found');
    }

    // Check stock availability
    for (const item of items) {
      const product = products.find(p => p.id === item.product_id);
      if (!product) {
        throw new BadRequestException(`Product not found: ${item.product_id}`);
      }
      if (product.stock_quantity < item.quantity) {
        throw new BadRequestException(`Insufficient stock for product: ${product.title}`);
      }
    }

    // Calculate total amount
    let totalAmount = 0;
    const orderItemsData = items.map(item => {
      const product = products.find(p => p.id === item.product_id);
      if (!product) {
        throw new BadRequestException(`Product not found: ${item.product_id}`);
      }
      const unitPrice = Number(product.price);
      const itemTotal = unitPrice * item.quantity;
      totalAmount += itemTotal;

      return {
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: unitPrice,
      };
    });

    // Create order with transaction
    const order = await this.prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          customer_id: customerId,
          shipping_address_id: shipping_address_id,
          total_amount: totalAmount,
          payment_method: PaymentMethod.cod,
          note: note,
          status: OrderStatus.pending,
        },
      });

      // Create order items
      await tx.orderItem.createMany({
        data: orderItemsData.map(item => ({
          order_id: newOrder.id,
          ...item,
        })),
      });

      // Update product stock
      for (const item of items) {
        await tx.product.update({
          where: { id: item.product_id },
          data: {
            stock_quantity: {
              decrement: item.quantity,
            },
          },
        });
      }

      // Create initial order history
      await tx.orderHistory.create({
        data: {
          order_id: newOrder.id,
          status: OrderStatus.pending,
          note: 'Order placed successfully',
        },
      });

      // Clear cart items
      await tx.cart.deleteMany({
        where: {
          customer_id: customerId,
          product_id: { in: productIds },
        },
      });

      return newOrder;
    });

    // Fetch complete order with relations
    const completeOrder = await this.prisma.order.findUnique({
      where: { id: order.id },
      include: {
        customer: {
          include: {
            user: true,
          },
        },
        shipping_address: true,
        order_items: {
          include: {
            product: {
              include: {
                category: true,
                sub_category: true,
              },
            },
          },
        },
        order_histories: {
          orderBy: { created_at: 'desc' },
        },
      },
    });

    return completeOrder;
  }

  /**
   * @param customerId Customer ID
   * @returns Orders for the specified customer
   */
  // region GET CUSTOMER ORDERS
  async getCustomerOrders(customerId: number) {
    if (!customerId) return [];
    const orders = await this.prisma.order.findMany({
      where: { customer_id: customerId },
      include: {
        shipping_address: true,
        order_items: {
          include: {
            product: {
              include: {
                category: true,
                sub_category: true,
              },
            },
          },
        },
        order_histories: {
          orderBy: { created_at: 'desc' },
          take: 1,
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return orders;
  }

  /**
   * @param orderId Order ID
   * @param customerId Customer ID
   * @returns Order information
   */
  // region GET ORDER BY ID
  async getOrderById(orderId: number, customerId?: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: {
          include: {
            user: true,
          },
        },
        shipping_address: true,
        order_items: {
          include: {
            product: {
              include: {
                category: true,
                sub_category: true,
              },
            },
          },
        },
        order_histories: {
          orderBy: { created_at: 'desc' },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // If customerId is provided, check if order belongs to customer
    if (customerId && order.customer_id !== customerId) {
      throw new ForbiddenException('You do not have permission to view this order');
    }

    return order;
  }

  /**
   * @returns All orders
   */
  // region GET ALL ORDERS
  async getAllOrders() {
    const orders = await this.prisma.order.findMany({
      include: {
        customer: {
          include: {
            user: true,
          },
        },
        shipping_address: true,
        order_items: {
          include: {
            product: {
              include: {
                category: true,
                sub_category: true,
              },
            },
          },
        },
        order_histories: {
          orderBy: { created_at: 'desc' },
          take: 1,
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return orders;
  }

  /**
   * @param orderId Order ID
   * @param updateOrderStatusDto UpdateOrderStatusDto object containing order status information
   * @returns Order information
   */
  // region UPDATE ORDER STATUS
  async updateOrderStatus(orderId: number, updateOrderStatusDto: UpdateOrderStatusDto) {
    const { status, note } = updateOrderStatusDto;

    // Check if order exists
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Update order status with transaction
    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      // Update order status
      const updated = await tx.order.update({
        where: { id: orderId },
        data: { status },
      });

      // Create order history entry
      await tx.orderHistory.create({
        data: {
          order_id: orderId,
          status,
          note: note || `Status updated to ${status}`,
        },
      });

      return updated;
    });

    // Fetch complete order
    const completeOrder = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: {
          include: {
            user: true,
          },
        },
        shipping_address: true,
        order_items: {
          include: {
            product: {
              include: {
                category: true,
                sub_category: true,
              },
            },
          },
        },
        order_histories: {
          orderBy: { created_at: 'desc' },
        },
      },
    });

    return completeOrder;
  }

  /**
   * @param orderId Order ID
   * @param customerId Customer ID
   * @returns Message indicating successful cancellation
   */
  // region CANCEL ORDER
  async cancelOrder(orderId: number, customerId: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.customer_id !== customerId) {
      throw new ForbiddenException('You do not have permission to cancel this order');
    }

    // Check if order can be cancelled
    if (order.status === OrderStatus.completed || order.status === OrderStatus.cancelled) {
      throw new BadRequestException('Cannot cancel this order');
    }

    // Cancel order with transaction
    await this.prisma.$transaction(async (tx) => {
      // Update order status
      await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.cancelled },
      });

      // Create order history entry
      await tx.orderHistory.create({
        data: {
          order_id: orderId,
          status: OrderStatus.cancelled,
          note: 'Order cancelled by customer',
        },
      });

      // Restore product stock
      const orderItems = await tx.orderItem.findMany({
        where: { order_id: orderId },
      });

      for (const item of orderItems) {
        await tx.product.update({
          where: { id: item.product_id },
          data: {
            stock_quantity: {
              increment: item.quantity,
            },
          },
        });
      }
    });

    return { message: 'Order cancelled successfully' };
  }

  /**
   * @param orderId Order ID
   * @returns Message indicating successful deletion
   */
  // region DELETE ORDER
  async deleteOrder(orderId: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Delete order with transaction
    await this.prisma.$transaction(async (tx) => {
      // Delete order history entries
      await tx.orderHistory.deleteMany({
        where: { order_id: orderId },
      });

      // Delete order items
      await tx.orderItem.deleteMany({
        where: { order_id: orderId },
      });

      // Delete order
      await tx.order.delete({
        where: { id: orderId },
      });
    });

    return { message: 'Order deleted successfully' };
  }
}
