import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { WishlistsService } from '../wishlists.service';

const prismaMock = {
  wishlist: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  product: {
    findUnique: jest.fn(),
  },
};

describe('WishlistsService (unit)', () => {
  let service: WishlistsService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WishlistsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<WishlistsService>(WishlistsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserWishlist', () => {
    it('returns empty array when userId is falsy', async () => {
      const result = await service.getUserWishlist(0);
      expect(result).toEqual([]);
      expect(prismaMock.wishlist.findMany).not.toHaveBeenCalled();
    });

    it('returns mapped product list from wishlist entries', async () => {
      const product = { id: 10, title: 'Lip Oil' };
      prismaMock.wishlist.findMany.mockResolvedValueOnce([{ id: 1, product }]);

      const result = await service.getUserWishlist(50);

      expect(prismaMock.wishlist.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { customer_id: 50 },
          orderBy: { created_at: 'desc' },
        }),
      );
      expect(result).toEqual([product]);
    });

    it('throws error when Prisma query fails', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => undefined);
      prismaMock.wishlist.findMany.mockRejectedValueOnce(new Error('DB failure'));

      await expect(service.getUserWishlist(50)).rejects.toThrow('Failed to fetch wishlist');
    });
  });

  describe('addToWishlist', () => {
    it('throws NotFoundException when userId is missing', async () => {
      await expect(service.addToWishlist(0, 10)).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when product does not exist', async () => {
      prismaMock.product.findUnique.mockResolvedValueOnce(null);

      await expect(service.addToWishlist(50, 999)).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when product is already in wishlist', async () => {
      prismaMock.product.findUnique.mockResolvedValueOnce({ id: 10 });
      prismaMock.wishlist.findUnique.mockResolvedValueOnce({ id: 1 });

      await expect(service.addToWishlist(50, 10)).rejects.toThrow(ConflictException);
    });

    it('adds product to wishlist and returns message', async () => {
      prismaMock.product.findUnique.mockResolvedValueOnce({ id: 10 });
      prismaMock.wishlist.findUnique.mockResolvedValueOnce(null);
      prismaMock.wishlist.create.mockResolvedValueOnce({ id: 1 });

      const result = await service.addToWishlist(50, 10);

      expect(prismaMock.wishlist.create).toHaveBeenCalledWith({
        data: { customer_id: 50, product_id: 10 },
      });
      expect(result).toEqual({ message: 'Added to wishlist' });
    });
  });

  describe('removeFromWishlist', () => {
    it('throws NotFoundException when userId is missing', async () => {
      await expect(service.removeFromWishlist(0, 10)).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when product is not in wishlist', async () => {
      prismaMock.wishlist.findUnique.mockResolvedValueOnce(null);

      await expect(service.removeFromWishlist(50, 10)).rejects.toThrow(NotFoundException);
    });

    it('deletes wishlist item and returns message', async () => {
      prismaMock.wishlist.findUnique.mockResolvedValueOnce({ id: 77 });
      prismaMock.wishlist.delete.mockResolvedValueOnce({ id: 77 });

      const result = await service.removeFromWishlist(50, 10);

      expect(prismaMock.wishlist.delete).toHaveBeenCalledWith({ where: { id: 77 } });
      expect(result).toEqual({ message: 'Removed from wishlist' });
    });
  });
});
