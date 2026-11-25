import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { CategoriesService } from '../categories.service';

const prismaMock = {
  category: {
    findFirst: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('CategoriesService (unit)', () => {
  let service: CategoriesService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------- createCategory ----------
  describe('createCategory', () => {
    it('throws BadRequestException when category already exists', async () => {
      prismaMock.category.findFirst.mockResolvedValueOnce({ id: 1, name: 'Skincare' });

      await expect(service.createCategory({ name: 'Skincare' })).rejects.toThrow(
        BadRequestException,
      );
      expect(prismaMock.category.create).not.toHaveBeenCalled();
    });

    it('creates and returns a new category when name is unique', async () => {
      const created = { id: 2, name: 'Makeup' };
      prismaMock.category.findFirst.mockResolvedValueOnce(null);
      prismaMock.category.create.mockResolvedValueOnce(created);

      const result = await service.createCategory({ name: 'Makeup' });

      expect(prismaMock.category.findFirst).toHaveBeenCalledWith({
        where: { name: 'Makeup' },
      });
      expect(prismaMock.category.create).toHaveBeenCalledWith({
        data: { name: 'Makeup' },
      });
      expect(result).toEqual(created);
    });
  });

  // ---------- findAllCategories ----------
  describe('findAllCategories', () => {
    it('queries all categories with sub_categories and active product counts', async () => {
      const mockCategories = [
        { id: 1, name: 'Skincare', sub_categories: [], _count: { products: 5 } },
      ];
      prismaMock.category.findMany.mockResolvedValueOnce(mockCategories);

      const result = await service.findAllCategories();

      expect(prismaMock.category.findMany).toHaveBeenCalledWith({
        include: {
          sub_categories: {
            include: {
              _count: { select: { products: { where: { status: 'active' } } } },
            },
          },
          _count: { select: { products: { where: { status: 'active' } } } },
        },
      });
      expect(result).toEqual(mockCategories);
    });
  });

  // ---------- findOneCategory ----------
  describe('findOneCategory', () => {
    it('queries category by id including sub_categories and products', async () => {
      const mockCategory = { id: 3, name: 'Haircare', sub_categories: [], products: [] };
      prismaMock.category.findUnique.mockResolvedValueOnce(mockCategory);

      const result = await service.findOneCategory(3);

      expect(prismaMock.category.findUnique).toHaveBeenCalledWith({
        where: { id: 3 },
        include: {
          sub_categories: true,
          products: true,
        },
      });
      expect(result).toEqual(mockCategory);
    });
  });

  // ---------- updateCategory ----------
  describe('updateCategory', () => {
    it('updates category name by id', async () => {
      const updated = { id: 4, name: 'Fragrance' };
      prismaMock.category.update.mockResolvedValueOnce(updated);

      const result = await service.updateCategory(4, { name: 'Fragrance' });

      expect(prismaMock.category.update).toHaveBeenCalledWith({
        where: { id: 4 },
        data: { name: 'Fragrance' },
      });
      expect(result).toEqual(updated);
    });
  });

  // ---------- deleteCategory ----------
  describe('deleteCategory', () => {
    it('deletes category by id', async () => {
      const deleted = { id: 5, name: 'Old Category' };
      prismaMock.category.delete.mockResolvedValueOnce(deleted);

      const result = await service.deleteCategory(5);

      expect(prismaMock.category.delete).toHaveBeenCalledWith({
        where: { id: 5 },
      });
      expect(result).toEqual(deleted);
    });
  });
});
