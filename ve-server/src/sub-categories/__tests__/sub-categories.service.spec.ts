import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/prisma/prisma.service';
import { SubCategoriesService } from '../sub-categories.service';

const prismaMock = {
  subCategory: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
};

describe('SubCategoriesService (unit)', () => {
  let service: SubCategoriesService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubCategoriesService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<SubCategoriesService>(SubCategoriesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('createSubCategory throws BadRequestException when name already exists', async () => {
    prismaMock.subCategory.findFirst.mockResolvedValueOnce({ id: 1, name: 'Serums' });

    await expect(
      service.createSubCategory({ name: 'Serums', category_id: 1 }),
    ).rejects.toThrow(BadRequestException);
    expect(prismaMock.subCategory.create).not.toHaveBeenCalled();
  });

  it('createSubCategory creates sub-category when unique', async () => {
    const created = { id: 2, name: 'Cleansers', category_id: 1 };
    prismaMock.subCategory.findFirst.mockResolvedValueOnce(null);
    prismaMock.subCategory.create.mockResolvedValueOnce(created);

    const result = await service.createSubCategory({ name: 'Cleansers', category_id: 1 });
    expect(result).toEqual(created);
  });

  it('updateSubCategory updates sub-category by id', async () => {
    const updated = { id: 2, name: 'Face Wash', category_id: 1 };
    prismaMock.subCategory.update.mockResolvedValueOnce(updated);

    const result = await service.updateSubCategory(2, { name: 'Face Wash', category_id: 1 });
    expect(prismaMock.subCategory.update).toHaveBeenCalledWith({
      where: { id: 2 },
      data: { name: 'Face Wash', category_id: 1 },
    });
    expect(result).toEqual(updated);
  });

  it('deleteSubCategory deletes sub-category by id', async () => {
    prismaMock.subCategory.delete.mockResolvedValueOnce({ id: 2 });

    expect(await service.deleteSubCategory(2)).toEqual({ id: 2 });
    expect(prismaMock.subCategory.delete).toHaveBeenCalledWith({ where: { id: 2 } });
  });

  it('findOneSubCategory throws BadRequestException when not found', async () => {
    prismaMock.subCategory.findUnique.mockResolvedValueOnce(null);

    await expect(service.findOneSubCategory(99)).rejects.toThrow(BadRequestException);
  });

  it('findOneSubCategory returns sub-category with category and products', async () => {
    const subCat = { id: 2, name: 'Cleansers', category: { id: 1 }, products: [] };
    prismaMock.subCategory.findUnique.mockResolvedValueOnce(subCat);

    expect(await service.findOneSubCategory(2)).toEqual(subCat);
  });

  it('findAllSubCategories returns all sub-categories', async () => {
    const list = [{ id: 1, name: 'Serums' }];
    prismaMock.subCategory.findMany.mockResolvedValueOnce(list);

    expect(await service.findAllSubCategories()).toEqual(list);
  });
});
