import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { CartsService } from '../carts.service';

const prismaMock = {
  cart: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  product: {
    findUnique: jest.fn(),
  },
};

describe('CartsService (unit)', () => {
  let service: CartsService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<CartsService>(CartsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------- getUserCart ----------
  describe('getUserCart', () => {
    it('returns empty array and skips DB query when customerId is falsy', async () => {
      const result = await service.getUserCart(0);

      expect(result).toEqual([]);
      expect(prismaMock.cart.findMany).not.toHaveBeenCalled();
    });

    it('returns mapped cart items ordered by created_at desc', async () => {
      const mockProduct = { id: 10, title: 'Serum', stock_quantity: 5 };
      prismaMock.cart.findMany.mockResolvedValueOnce([
        { id: 1, customer_id: 7, product_id: 10, quantity: 2, product: mockProduct },
      ]);

      const result = await service.getUserCart(7);

      expect(prismaMock.cart.findMany).toHaveBeenCalledWith({
        where: { customer_id: 7 },
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
      expect(result).toEqual([{ id: 1, quantity: 2, product: mockProduct }]);
    });
  });

  // ---------- addToCart ----------
  describe('addToCart', () => {
    it('throws NotFoundException when product does not exist', async () => {
      prismaMock.product.findUnique.mockResolvedValueOnce(null);

      await expect(service.addToCart(7, 999, 1)).rejects.toThrow(NotFoundException);
      expect(prismaMock.cart.create).not.toHaveBeenCalled();
    });

    it('throws ConflictException when requested quantity exceeds stock for new item', async () => {
      prismaMock.product.findUnique.mockResolvedValueOnce({
        id: 10,
        title: 'Lipstick',
        stock_quantity: 2,
      });
      prismaMock.cart.findUnique.mockResolvedValueOnce(null);

      await expect(service.addToCart(7, 10, 3)).rejects.toThrow(ConflictException);
      expect(prismaMock.cart.create).not.toHaveBeenCalled();
    });

    it('throws ConflictException when combined quantity exceeds stock for existing item', async () => {
      prismaMock.product.findUnique.mockResolvedValueOnce({
        id: 10,
        title: 'Lipstick',
        stock_quantity: 3,
      });
      prismaMock.cart.findUnique.mockResolvedValueOnce({
        id: 1,
        customer_id: 7,
        product_id: 10,
        quantity: 2,
      });

      await expect(service.addToCart(7, 10, 2)).rejects.toThrow(ConflictException);
      expect(prismaMock.cart.update).not.toHaveBeenCalled();
    });

    it('creates a new cart item when product is not yet in cart', async () => {
      const product = { id: 10, title: 'Lipstick', stock_quantity: 5 };
      prismaMock.product.findUnique.mockResolvedValueOnce(product);
      prismaMock.cart.findUnique.mockResolvedValueOnce(null);
      prismaMock.cart.create.mockResolvedValueOnce({
        id: 100,
        quantity: 1,
        product,
      });

      const result = await service.addToCart(7, 10);

      expect(prismaMock.cart.create).toHaveBeenCalledWith({
        data: {
          customer_id: 7,
          product_id: 10,
          quantity: 1,
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
      expect(result).toEqual({ id: 100, quantity: 1, product });
    });

    it('increments quantity when product is already in cart and stock allows', async () => {
      const product = { id: 10, title: 'Lipstick', stock_quantity: 5 };
      prismaMock.product.findUnique.mockResolvedValueOnce(product);
      prismaMock.cart.findUnique.mockResolvedValueOnce({
        id: 100,
        customer_id: 7,
        product_id: 10,
        quantity: 2,
      });
      prismaMock.cart.update.mockResolvedValueOnce({
        id: 100,
        quantity: 4,
        product,
      });

      const result = await service.addToCart(7, 10, 2);

      expect(prismaMock.cart.update).toHaveBeenCalledWith({
        where: { id: 100 },
        data: { quantity: 4 },
        include: {
          product: {
            include: {
              category: true,
              sub_category: true,
            },
          },
        },
      });
      expect(result).toEqual({ id: 100, quantity: 4, product });
    });
  });

  // ---------- updateCartItem ----------
  describe('updateCartItem', () => {
    it('removes item from cart when quantity is 0 or negative', async () => {
      prismaMock.cart.findUnique.mockResolvedValueOnce({ id: 55 });
      prismaMock.cart.delete.mockResolvedValueOnce({ id: 55 });

      const result = await service.updateCartItem(7, 10, 0);

      expect(prismaMock.cart.delete).toHaveBeenCalledWith({ where: { id: 55 } });
      expect(result).toEqual({ message: 'Removed from cart' });
    });

    it('throws NotFoundException when cart item does not exist', async () => {
      prismaMock.cart.findUnique.mockResolvedValueOnce(null);

      await expect(service.updateCartItem(7, 10, 2)).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when new quantity exceeds stock', async () => {
      prismaMock.cart.findUnique.mockResolvedValueOnce({
        id: 55,
        product: { id: 10, title: 'Cream', stock_quantity: 2 },
      });

      await expect(service.updateCartItem(7, 10, 5)).rejects.toThrow(ConflictException);
      expect(prismaMock.cart.update).not.toHaveBeenCalled();
    });

    it('updates cart item quantity when valid', async () => {
      const product = { id: 10, title: 'Cream', stock_quantity: 5 };
      prismaMock.cart.findUnique.mockResolvedValueOnce({
        id: 55,
        product,
      });
      prismaMock.cart.update.mockResolvedValueOnce({
        id: 55,
        quantity: 3,
        product,
      });

      const result = await service.updateCartItem(7, 10, 3);

      expect(prismaMock.cart.update).toHaveBeenCalledWith({
        where: { id: 55 },
        data: { quantity: 3 },
        include: {
          product: {
            include: {
              category: true,
              sub_category: true,
            },
          },
        },
      });
      expect(result).toEqual({ id: 55, quantity: 3, product });
    });
  });

  // ---------- removeFromCart ----------
  describe('removeFromCart', () => {
    it('throws NotFoundException when product is not in cart', async () => {
      prismaMock.cart.findUnique.mockResolvedValueOnce(null);

      await expect(service.removeFromCart(7, 10)).rejects.toThrow(NotFoundException);
      expect(prismaMock.cart.delete).not.toHaveBeenCalled();
    });

    it('deletes the cart item and returns confirmation message', async () => {
      prismaMock.cart.findUnique.mockResolvedValueOnce({ id: 55 });
      prismaMock.cart.delete.mockResolvedValueOnce({ id: 55 });

      const result = await service.removeFromCart(7, 10);

      expect(prismaMock.cart.findUnique).toHaveBeenCalledWith({
        where: {
          customer_id_product_id: {
            customer_id: 7,
            product_id: 10,
          },
        },
      });
      expect(prismaMock.cart.delete).toHaveBeenCalledWith({ where: { id: 55 } });
      expect(result).toEqual({ message: 'Removed from cart' });
    });
  });

  // ---------- clearCart ----------
  describe('clearCart', () => {
    it('deletes all cart items for customer and returns confirmation message', async () => {
      prismaMock.cart.deleteMany.mockResolvedValueOnce({ count: 3 });

      const result = await service.clearCart(7);

      expect(prismaMock.cart.deleteMany).toHaveBeenCalledWith({
        where: { customer_id: 7 },
      });
      expect(result).toEqual({ message: 'Cart cleared' });
    });
  });
});
