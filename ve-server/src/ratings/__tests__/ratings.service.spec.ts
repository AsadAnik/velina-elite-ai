import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RatingsService } from '../ratings.service';

const prismaMock = {
  customer: { findFirst: jest.fn() },
  orderItem: { findFirst: jest.fn() },
  rating: {
    findUnique: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    upsert: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  product: {
    findMany: jest.fn(),
  },
};

describe('RatingsService (unit)', () => {
  let service: RatingsService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RatingsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<RatingsService>(RatingsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------- create ----------
  describe('create', () => {
    it('throws BadRequestException when customer profile is not found', async () => {
      prismaMock.customer.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.create(1, { product_id: 10, stars: 5, comment: 'Great' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when customer has no completed order for the product', async () => {
      prismaMock.customer.findFirst.mockResolvedValueOnce({ id: 50 });
      prismaMock.orderItem.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.create(1, { product_id: 10, stars: 5, comment: 'Great' }),
      ).rejects.toThrow(
        'You can only rate a product after purchasing it and the order is completed.',
      );
    });

    it('throws BadRequestException when customer has already rated the product', async () => {
      prismaMock.customer.findFirst.mockResolvedValueOnce({ id: 50 });
      prismaMock.orderItem.findFirst.mockResolvedValueOnce({ id: 100 });
      prismaMock.rating.findUnique.mockResolvedValueOnce({ id: 9 });

      await expect(
        service.create(1, { product_id: 10, stars: 4 }),
      ).rejects.toThrow('You have already rated this product.');
    });

    it('creates rating when customer has completed purchase and no prior rating', async () => {
      prismaMock.customer.findFirst.mockResolvedValueOnce({ id: 50 });
      prismaMock.orderItem.findFirst.mockResolvedValueOnce({ id: 100 });
      prismaMock.rating.findUnique.mockResolvedValueOnce(null);
      const created = { id: 1, customer_id: 50, product_id: 10, stars: 5, comment: 'Loved it' };
      prismaMock.rating.create.mockResolvedValueOnce(created);

      const result = await service.create(1, {
        product_id: 10,
        stars: 5,
        comment: 'Loved it',
      });

      expect(prismaMock.orderItem.findFirst).toHaveBeenCalledWith({
        where: {
          product_id: 10,
          order: {
            customer_id: 50,
            status: OrderStatus.completed,
          },
        },
      });
      expect(result).toEqual(created);
    });
  });

  // ---------- findAllForProduct ----------
  describe('findAllForProduct', () => {
    it('returns averageRating=0 and totalRatings=0 when product has no ratings', async () => {
      prismaMock.rating.findMany.mockResolvedValueOnce([]);

      const result = await service.findAllForProduct(10);

      expect(result).toEqual({
        ratings: [],
        averageRating: 0,
        totalRatings: 0,
      });
    });

    it('computes averageRating rounded to 1 decimal place', async () => {
      const ratings = [{ stars: 5 }, { stars: 4 }, { stars: 5 }];
      prismaMock.rating.findMany.mockResolvedValueOnce(ratings);

      const result = await service.findAllForProduct(10);

      expect(result).toEqual({
        ratings,
        averageRating: 4.7,
        totalRatings: 3,
      });
    });
  });

  // ---------- findAll / update / remove ----------
  describe('admin CRUD', () => {
    it('findAll returns all ratings ordered by created_at desc', async () => {
      const ratings = [{ id: 1 }, { id: 2 }];
      prismaMock.rating.findMany.mockResolvedValueOnce(ratings);

      expect(await service.findAll()).toEqual(ratings);
    });

    it('update updates rating by id', async () => {
      prismaMock.rating.update.mockResolvedValueOnce({ id: 1, stars: 4 });

      const result = await service.update(1, { stars: 4 });

      expect(prismaMock.rating.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { stars: 4 },
      });
      expect(result).toEqual({ id: 1, stars: 4 });
    });

    it('remove deletes rating by id', async () => {
      prismaMock.rating.delete.mockResolvedValueOnce({ id: 1 });

      const result = await service.remove(1);

      expect(prismaMock.rating.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual({ id: 1 });
    });
  });

  // ---------- seedRatings ----------
  describe('seedRatings', () => {
    it('returns seededCount=0 when no products exist', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 1,
        customer: { id: 10, fname: 'Test', lname: 'User' },
      });
      prismaMock.product.findMany.mockResolvedValueOnce([]);

      const result = await service.seedRatings();

      expect(result).toEqual({
        message: 'No products found to seed ratings for',
        seededCount: 0,
      });
    });
  });
});
