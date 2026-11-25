import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { OrdersService } from '../orders.service';

const txMock = {
  order: {
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  orderItem: {
    createMany: jest.fn(),
    findMany: jest.fn(),
    deleteMany: jest.fn(),
  },
  orderHistory: {
    create: jest.fn(),
    deleteMany: jest.fn(),
  },
  product: {
    update: jest.fn(),
  },
  cart: {
    deleteMany: jest.fn(),
  },
};

const prismaMock = {
  address: { findUnique: jest.fn() },
  product: { findMany: jest.fn() },
  order: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  $transaction: jest.fn(async (cb: (tx: typeof txMock) => Promise<any>) => cb(txMock)),
};

describe('OrdersService (unit)', () => {
  let service: OrdersService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------- createOrder ----------
  describe('createOrder', () => {
    it('throws NotFoundException when shipping address does not exist', async () => {
      prismaMock.address.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.createOrder(10, {
          shipping_address_id: 99,
          items: [{ product_id: 1, quantity: 1 }],
        } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when shipping address belongs to another customer', async () => {
      prismaMock.address.findUnique.mockResolvedValueOnce({ id: 5, customer_id: 999 });

      await expect(
        service.createOrder(10, {
          shipping_address_id: 5,
          items: [{ product_id: 1, quantity: 1 }],
        } as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws BadRequestException when one or more products are not found', async () => {
      prismaMock.address.findUnique.mockResolvedValueOnce({ id: 5, customer_id: 10 });
      prismaMock.product.findMany.mockResolvedValueOnce([{ id: 1, price: 100, stock_quantity: 5 }]);

      await expect(
        service.createOrder(10, {
          shipping_address_id: 5,
          items: [
            { product_id: 1, quantity: 1 },
            { product_id: 2, quantity: 1 },
          ],
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when product stock is insufficient', async () => {
      prismaMock.address.findUnique.mockResolvedValueOnce({ id: 5, customer_id: 10 });
      prismaMock.product.findMany.mockResolvedValueOnce([
        { id: 1, title: 'Serum', price: 500, stock_quantity: 1 },
      ]);

      await expect(
        service.createOrder(10, {
          shipping_address_id: 5,
          items: [{ product_id: 1, quantity: 3 }],
        } as any),
      ).rejects.toThrow('Insufficient stock for product: Serum');
    });

    it('creates order, decrements stock, logs history, clears cart, and returns complete order', async () => {
      prismaMock.address.findUnique.mockResolvedValueOnce({ id: 5, customer_id: 10 });
      prismaMock.product.findMany.mockResolvedValueOnce([
        { id: 1, title: 'Serum', price: 500, stock_quantity: 5 },
        { id: 2, title: 'Toner', price: 300, stock_quantity: 10 },
      ]);
      txMock.order.create.mockResolvedValueOnce({ id: 100 });
      const completeOrder = { id: 100, total_amount: 1300, status: OrderStatus.pending };
      prismaMock.order.findUnique.mockResolvedValueOnce(completeOrder);

      const result = await service.createOrder(10, {
        shipping_address_id: 5,
        note: 'Leave at gate',
        items: [
          { product_id: 1, quantity: 2 },
          { product_id: 2, quantity: 1 },
        ],
      } as any);

      expect(txMock.order.create).toHaveBeenCalledWith({
        data: {
          customer_id: 10,
          shipping_address_id: 5,
          total_amount: 1300,
          payment_method: 'cod',
          note: 'Leave at gate',
          status: OrderStatus.pending,
        },
      });
      expect(txMock.orderItem.createMany).toHaveBeenCalledWith({
        data: [
          { order_id: 100, product_id: 1, quantity: 2, unit_price: 500 },
          { order_id: 100, product_id: 2, quantity: 1, unit_price: 300 },
        ],
      });
      expect(txMock.product.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { stock_quantity: { decrement: 2 } },
      });
      expect(txMock.product.update).toHaveBeenCalledWith({
        where: { id: 2 },
        data: { stock_quantity: { decrement: 1 } },
      });
      expect(txMock.orderHistory.create).toHaveBeenCalledWith({
        data: {
          order_id: 100,
          status: OrderStatus.pending,
          note: 'Order placed successfully',
        },
      });
      expect(txMock.cart.deleteMany).toHaveBeenCalledWith({
        where: { customer_id: 10, product_id: { in: [1, 2] } },
      });
      expect(result).toEqual(completeOrder);
    });
  });

  // ---------- getCustomerOrders ----------
  describe('getCustomerOrders', () => {
    it('returns empty array when customerId is falsy', async () => {
      const result = await service.getCustomerOrders(0);
      expect(result).toEqual([]);
      expect(prismaMock.order.findMany).not.toHaveBeenCalled();
    });

    it('returns orders for customer', async () => {
      const orders = [{ id: 1 }, { id: 2 }];
      prismaMock.order.findMany.mockResolvedValueOnce(orders);

      const result = await service.getCustomerOrders(10);
      expect(prismaMock.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { customer_id: 10 },
          orderBy: { created_at: 'desc' },
        }),
      );
      expect(result).toEqual(orders);
    });
  });

  // ---------- getOrderById ----------
  describe('getOrderById', () => {
    it('throws NotFoundException when order does not exist', async () => {
      prismaMock.order.findUnique.mockResolvedValueOnce(null);

      await expect(service.getOrderById(999)).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when customerId does not own the order', async () => {
      prismaMock.order.findUnique.mockResolvedValueOnce({ id: 1, customer_id: 20 });

      await expect(service.getOrderById(1, 10)).rejects.toThrow(ForbiddenException);
    });

    it('returns order when customer owns it', async () => {
      const order = { id: 1, customer_id: 10 };
      prismaMock.order.findUnique.mockResolvedValueOnce(order);

      const result = await service.getOrderById(1, 10);
      expect(result).toEqual(order);
    });
  });

  // ---------- getAllOrders ----------
  describe('getAllOrders', () => {
    it('returns all orders ordered by created_at desc', async () => {
      const orders = [{ id: 5 }, { id: 4 }];
      prismaMock.order.findMany.mockResolvedValueOnce(orders);

      const result = await service.getAllOrders();
      expect(result).toEqual(orders);
    });
  });

  // ---------- updateOrderStatus ----------
  describe('updateOrderStatus', () => {
    it('throws NotFoundException when order is missing', async () => {
      prismaMock.order.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.updateOrderStatus(99, { status: OrderStatus.shipped } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('updates status and records orderHistory inside transaction', async () => {
      prismaMock.order.findUnique
        .mockResolvedValueOnce({ id: 5, status: OrderStatus.pending })
        .mockResolvedValueOnce({ id: 5, status: OrderStatus.shipped });
      txMock.order.update.mockResolvedValueOnce({ id: 5, status: OrderStatus.shipped });

      const result = await service.updateOrderStatus(5, {
        status: OrderStatus.shipped,
        note: 'Dispatched via Steadfast',
      });

      expect(txMock.order.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: { status: OrderStatus.shipped },
      });
      expect(txMock.orderHistory.create).toHaveBeenCalledWith({
        data: {
          order_id: 5,
          status: OrderStatus.shipped,
          note: 'Dispatched via Steadfast',
        },
      });
      expect(result).toEqual({ id: 5, status: OrderStatus.shipped });
    });
  });

  // ---------- cancelOrder ----------
  describe('cancelOrder', () => {
    it('throws NotFoundException if order does not exist', async () => {
      prismaMock.order.findUnique.mockResolvedValueOnce(null);

      await expect(service.cancelOrder(99, 10)).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException if order belongs to another customer', async () => {
      prismaMock.order.findUnique.mockResolvedValueOnce({ id: 5, customer_id: 99 });

      await expect(service.cancelOrder(5, 10)).rejects.toThrow(ForbiddenException);
    });

    it('throws BadRequestException if order is already completed or cancelled', async () => {
      prismaMock.order.findUnique.mockResolvedValueOnce({
        id: 5,
        customer_id: 10,
        status: OrderStatus.completed,
      });

      await expect(service.cancelOrder(5, 10)).rejects.toThrow(BadRequestException);
    });

    it('cancels order, creates history, and restores stock inside transaction', async () => {
      prismaMock.order.findUnique.mockResolvedValueOnce({
        id: 5,
        customer_id: 10,
        status: OrderStatus.pending,
      });
      txMock.orderItem.findMany.mockResolvedValueOnce([
        { product_id: 1, quantity: 2 },
        { product_id: 3, quantity: 1 },
      ]);

      const result = await service.cancelOrder(5, 10);

      expect(txMock.order.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: { status: OrderStatus.cancelled },
      });
      expect(txMock.orderHistory.create).toHaveBeenCalledWith({
        data: {
          order_id: 5,
          status: OrderStatus.cancelled,
          note: 'Order cancelled by customer',
        },
      });
      expect(txMock.product.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { stock_quantity: { increment: 2 } },
      });
      expect(txMock.product.update).toHaveBeenCalledWith({
        where: { id: 3 },
        data: { stock_quantity: { increment: 1 } },
      });
      expect(result).toEqual({ message: 'Order cancelled successfully' });
    });
  });

  // ---------- deleteOrder ----------
  describe('deleteOrder', () => {
    it('throws NotFoundException when order does not exist', async () => {
      prismaMock.order.findUnique.mockResolvedValueOnce(null);

      await expect(service.deleteOrder(99)).rejects.toThrow(NotFoundException);
    });

    it('deletes orderHistory, orderItem, and order inside transaction', async () => {
      prismaMock.order.findUnique.mockResolvedValueOnce({ id: 5 });

      const result = await service.deleteOrder(5);

      expect(txMock.orderHistory.deleteMany).toHaveBeenCalledWith({ where: { order_id: 5 } });
      expect(txMock.orderItem.deleteMany).toHaveBeenCalledWith({ where: { order_id: 5 } });
      expect(txMock.order.delete).toHaveBeenCalledWith({ where: { id: 5 } });
      expect(result).toEqual({ message: 'Order deleted successfully' });
    });
  });
});
