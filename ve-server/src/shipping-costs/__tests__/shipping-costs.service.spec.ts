import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { ShippingCostsService } from '../shipping-costs.service';

const prismaMock = {
  shippingCost: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('ShippingCostsService (unit)', () => {
  let service: ShippingCostsService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShippingCostsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<ShippingCostsService>(ShippingCostsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createShippingCost', () => {
    it('throws BadRequestException if configuration already exists', async () => {
      prismaMock.shippingCost.findFirst.mockResolvedValueOnce({ id: 1 });

      await expect(
        service.createShippingCost({ inside_dhaka_cost: 60, outside_dhaka_cost: 120 }),
      ).rejects.toThrow(BadRequestException);
      expect(prismaMock.shippingCost.create).not.toHaveBeenCalled();
    });

    it('creates configuration with default currency symbol ৳', async () => {
      const created = { id: 1, inside_dhaka_cost: 60, outside_dhaka_cost: 120, currency_symbol: '৳' };
      prismaMock.shippingCost.findFirst.mockResolvedValueOnce(null);
      prismaMock.shippingCost.create.mockResolvedValueOnce(created);

      const result = await service.createShippingCost({
        inside_dhaka_cost: 60,
        outside_dhaka_cost: 120,
      });

      expect(prismaMock.shippingCost.create).toHaveBeenCalledWith({
        data: {
          inside_dhaka_cost: 60,
          outside_dhaka_cost: 120,
          currency_symbol: '৳',
        },
      });
      expect(result).toEqual(created);
    });
  });

  describe('getShippingCost', () => {
    it('returns default shipping cost values when no record exists', async () => {
      prismaMock.shippingCost.findFirst.mockResolvedValueOnce(null);

      const result = await service.getShippingCost();

      expect(result).toEqual({
        id: null,
        inside_dhaka_cost: 70,
        outside_dhaka_cost: 120,
        currency_symbol: '৳',
        created_at: null,
        updated_at: null,
      });
    });

    it('returns existing shipping cost record when present', async () => {
      const existing = { id: 1, inside_dhaka_cost: 80, outside_dhaka_cost: 150, currency_symbol: '৳' };
      prismaMock.shippingCost.findFirst.mockResolvedValueOnce(existing);

      expect(await service.getShippingCost()).toEqual(existing);
    });
  });

  describe('updateShippingCost', () => {
    it('throws BadRequestException when configuration does not exist', async () => {
      prismaMock.shippingCost.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.updateShippingCost(99, { inside_dhaka_cost: 90 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('updates provided fields for existing configuration', async () => {
      prismaMock.shippingCost.findUnique.mockResolvedValueOnce({ id: 1 });
      prismaMock.shippingCost.update.mockResolvedValueOnce({
        id: 1,
        inside_dhaka_cost: 90,
        outside_dhaka_cost: 120,
      });

      const result = await service.updateShippingCost(1, { inside_dhaka_cost: 90 });

      expect(prismaMock.shippingCost.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { inside_dhaka_cost: 90 },
      });
      expect(result).toMatchObject({ id: 1, inside_dhaka_cost: 90 });
    });
  });

  describe('deleteShippingCost', () => {
    it('throws BadRequestException when configuration does not exist', async () => {
      prismaMock.shippingCost.findUnique.mockResolvedValueOnce(null);

      await expect(service.deleteShippingCost(99)).rejects.toThrow(BadRequestException);
    });

    it('deletes existing configuration', async () => {
      prismaMock.shippingCost.findUnique.mockResolvedValueOnce({ id: 1 });
      prismaMock.shippingCost.delete.mockResolvedValueOnce({ id: 1 });

      const result = await service.deleteShippingCost(1);

      expect(prismaMock.shippingCost.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual({ id: 1 });
    });
  });
});
