import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ProductStatus } from '../dto/create-product.dto';
import { ProductsService } from '../products.service';

const prismaMock = {
  product: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  $transaction: jest.fn(async (ops: Promise<any>[]) => Promise.all(ops)),
};

const cloudinaryMock = {
  deleteMultipleFiles: jest.fn().mockResolvedValue(undefined),
};

const cacheStoreMock = {
  keys: jest.fn().mockResolvedValue(['products:list:page=1']),
};

const cacheMock = {
  get: jest.fn(),
  set: jest.fn().mockResolvedValue(undefined),
  del: jest.fn().mockResolvedValue(undefined),
  stores: [cacheStoreMock],
};

describe('ProductsService (unit)', () => {
  let service: ProductsService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: CloudinaryService, useValue: cloudinaryMock },
        { provide: CACHE_MANAGER, useValue: cacheMock },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    cacheStoreMock.keys.mockResolvedValue(['products:list:page=1']);
  });

  // ---------- createProduct ----------
  describe('createProduct', () => {
    it('computes pricing summary, creates product, and invalidates list caches', async () => {
      const created = { id: 1, title: 'Glow Serum', price: 800, save_amount: 200, save_percentage: 20 };
      prismaMock.product.create.mockResolvedValueOnce(created);

      const result = await service.createProduct({
        title: 'Glow Serum',
        regular_price: 800,
        mrp_price: 1000,
        category_id: 1,
        images_url: ['https://cdn/1.jpg'],
      } as any);

      expect(prismaMock.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'Glow Serum',
            price: 800,
            regular_price: 800,
            mrp_price: 1000,
            save_amount: 200,
            save_percentage: 20,
            currency_symbol: '৳',
          }),
        }),
      );
      expect(cacheStoreMock.keys).toHaveBeenCalledWith('products:*');
      expect(cacheMock.del).toHaveBeenCalledWith('products:list:page=1');
      expect(result).toEqual(created);
    });
  });

  // ---------- findOne ----------
  describe('findOne', () => {
    it('returns cached product on cache HIT without querying DB', async () => {
      const cached = { id: 10, title: 'Cached Serum' };
      cacheMock.get.mockResolvedValueOnce(cached);
      jest.spyOn(console, 'log').mockImplementation(() => undefined);

      const result = await service.findOne(10);

      expect(cacheMock.get).toHaveBeenCalledWith('products:detail:10');
      expect(prismaMock.product.findUnique).not.toHaveBeenCalled();
      expect(result).toEqual(cached);
    });

    it('queries DB, caches for 300s, and returns product on cache MISS', async () => {
      const dbProduct = { id: 10, title: 'DB Serum' };
      cacheMock.get.mockResolvedValueOnce(null);
      prismaMock.product.findUnique.mockResolvedValueOnce(dbProduct);
      jest.spyOn(console, 'log').mockImplementation(() => undefined);

      const result = await service.findOne(10);

      expect(cacheMock.set).toHaveBeenCalledWith('products:detail:10', dbProduct, 300_000);
      expect(result).toEqual(dbProduct);
    });

    it('throws NotFoundException when product does not exist', async () => {
      cacheMock.get.mockResolvedValueOnce(null);
      prismaMock.product.findUnique.mockResolvedValueOnce(null);
      jest.spyOn(console, 'log').mockImplementation(() => undefined);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  // ---------- findAll ----------
  describe('findAll', () => {
    it('returns cached paginated list on cache HIT', async () => {
      const cachedList = { data: [{ id: 1 }], meta: { total: 1, page: 1, limit: 10, total_pages: 1 } };
      cacheMock.get.mockResolvedValueOnce(cachedList);
      jest.spyOn(console, 'log').mockImplementation(() => undefined);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(prismaMock.$transaction).not.toHaveBeenCalled();
      expect(result).toEqual(cachedList);
    });

    it('queries DB with filters & sorting on cache MISS and caches for 60s', async () => {
      cacheMock.get.mockResolvedValueOnce(null);
      prismaMock.product.findMany.mockResolvedValueOnce([{ id: 1, price: 500 }]);
      prismaMock.product.count.mockResolvedValueOnce(1);
      jest.spyOn(console, 'log').mockImplementation(() => undefined);

      const result = await service.findAll({
        page: 1,
        limit: 10,
        category_id: 2,
        min_price: 100,
        max_price: 1000,
        sort_by: 'price_asc',
      });

      expect(prismaMock.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            category_id: 2,
            price: { gte: 100, lte: 1000 },
          }),
          orderBy: { price: 'asc' },
        }),
      );
      expect(cacheMock.set).toHaveBeenCalledWith(
        expect.stringContaining('products:list:'),
        expect.objectContaining({ meta: { total: 1, page: 1, limit: 10, total_pages: 1 } }),
        60_000,
      );
      expect(result).toMatchObject({ data: [{ id: 1, price: 500 }] });
    });
  });

  // ---------- search ----------
  describe('search', () => {
    it('returns empty array for blank query', async () => {
      const result = await service.search('   ');
      expect(result).toEqual([]);
      expect(cacheMock.get).not.toHaveBeenCalled();
    });

    it('clamps limit to 20 and caches search results', async () => {
      cacheMock.get.mockResolvedValueOnce(null);
      prismaMock.product.findMany.mockResolvedValueOnce([{ id: 3, title: 'Lip Gloss' }]);
      jest.spyOn(console, 'log').mockImplementation(() => undefined);

      const result = await service.search('Lip', 50);

      expect(prismaMock.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 20 }),
      );
      expect(cacheMock.set).toHaveBeenCalledWith(
        'products:search:lip:limit=20',
        [{ id: 3, title: 'Lip Gloss' }],
        60_000,
      );
      expect(result).toHaveLength(1);
    });
  });

  // ---------- updateProduct & updateProductStatus ----------
  describe('updateProduct & updateProductStatus', () => {
    it('updateProduct deletes removed Cloudinary images and invalidates caches', async () => {
      prismaMock.product.findUnique.mockResolvedValueOnce({
        id: 5,
        regular_price: 500,
        mrp_price: 600,
        currency_symbol: '৳',
        images_url: ['https://cdn/old.jpg', 'https://cdn/keep.jpg'],
      });
      prismaMock.product.update.mockResolvedValueOnce({ id: 5 });

      await service.updateProduct(5, {
        images_url: ['https://cdn/keep.jpg'],
        regular_price: 450,
      } as any);

      expect(cloudinaryMock.deleteMultipleFiles).toHaveBeenCalledWith(['https://cdn/old.jpg']);
      expect(cacheMock.del).toHaveBeenCalledWith('products:detail:5');
    });

    it('updateProductStatus updates status and invalidates cache', async () => {
      cacheMock.get.mockResolvedValueOnce({ id: 5 });
      prismaMock.product.update.mockResolvedValueOnce({ id: 5, status: ProductStatus.inactive });
      jest.spyOn(console, 'log').mockImplementation(() => undefined);

      const result = await service.updateProductStatus(5, ProductStatus.inactive);

      expect(prismaMock.product.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: { status: ProductStatus.inactive },
      });
      expect(result).toEqual({ message: 'Product #5 is updated successfully!' });
    });
  });

  // ---------- findRelated & remove ----------
  describe('findRelated & remove', () => {
    it('findRelated fetches products in same category excluding current product', async () => {
      cacheMock.get
        .mockResolvedValueOnce(null) // related cache miss
        .mockResolvedValueOnce({ id: 5, category_id: 2 }); // findOne(5) cache hit
      prismaMock.product.findMany.mockResolvedValueOnce([{ id: 6 }]);
      jest.spyOn(console, 'log').mockImplementation(() => undefined);

      const result = await service.findRelated(5, 4);

      expect(prismaMock.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { category_id: 2, id: { not: 5 }, status: 'active' },
          take: 4,
        }),
      );
      expect(cacheMock.set).toHaveBeenCalledWith('products:related:5:limit=4', [{ id: 6 }], 120_000);
      expect(result).toEqual([{ id: 6 }]);
    });

    it('remove deletes Cloudinary images, removes DB record, and invalidates caches', async () => {
      cacheMock.get.mockResolvedValueOnce({
        id: 5,
        images_url: ['https://cdn/1.jpg'],
      });
      prismaMock.product.delete.mockResolvedValueOnce({ id: 5 });
      jest.spyOn(console, 'log').mockImplementation(() => undefined);

      const result = await service.remove(5);

      expect(cloudinaryMock.deleteMultipleFiles).toHaveBeenCalledWith(['https://cdn/1.jpg']);
      expect(prismaMock.product.delete).toHaveBeenCalledWith({ where: { id: 5 } });
      expect(cacheMock.del).toHaveBeenCalledWith('products:detail:5');
      expect(result).toEqual({ message: 'Product #5 is deleted successfully!' });
    });
  });
});
