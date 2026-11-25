import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';
import { PrismaService } from '../../prisma/prisma.service';
import { HomeSectionsService } from '../home-sections.service';

const prismaMock = {
  homeSection: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    aggregate: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  homeSectionItem: {
    findUnique: jest.fn(),
    aggregate: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  $transaction: jest.fn(async (ops: Promise<any>[]) => Promise.all(ops)),
};

const cloudinaryMock = {
  deleteFile: jest.fn().mockResolvedValue(undefined),
};

describe('HomeSectionsService (unit)', () => {
  let service: HomeSectionsService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HomeSectionsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: CloudinaryService, useValue: cloudinaryMock },
      ],
    }).compile();

    service = module.get<HomeSectionsService>(HomeSectionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------- getPublicSections ----------
  describe('getPublicSections', () => {
    it('slices items to max_items when max_items > 0 and keeps all when max_items is 0', async () => {
      prismaMock.homeSection.findMany.mockResolvedValueOnce([
        { id: 1, max_items: 2, items: [{ id: 1 }, { id: 2 }, { id: 3 }] },
        { id: 2, max_items: 0, items: [{ id: 4 }, { id: 5 }] },
      ]);

      const result = await service.getPublicSections();

      expect(result[0].items).toHaveLength(2);
      expect(result[1].items).toHaveLength(2);
    });
  });

  // ---------- getSectionById ----------
  describe('getSectionById', () => {
    it('throws NotFoundException when section does not exist', async () => {
      prismaMock.homeSection.findUnique.mockResolvedValueOnce(null);

      await expect(service.getSectionById(99)).rejects.toThrow(NotFoundException);
    });

    it('returns section when found', async () => {
      const section = { id: 1, title: 'Flash Deals', items: [] };
      prismaMock.homeSection.findUnique.mockResolvedValueOnce(section);

      const result = await service.getSectionById(1);
      expect(result).toEqual(section);
    });
  });

  // ---------- createSection ----------
  describe('createSection', () => {
    it('auto-computes order_index from max existing order_index and applies defaults', async () => {
      prismaMock.homeSection.aggregate.mockResolvedValueOnce({ _max: { order_index: 2 } });
      prismaMock.homeSection.create.mockResolvedValueOnce({
        id: 10,
        title: 'New Section',
        order_index: 3,
        items: [],
      });

      const result = await service.createSection({ title: 'New Section' } as any);

      expect(prismaMock.homeSection.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'New Section',
            section_type: 'deals_grid',
            bg_type: 'gradient',
            order_index: 3,
            is_active: true,
            max_items: 4,
          }),
        }),
      );
      expect(result.order_index).toBe(3);
    });
  });

  // ---------- updateSection ----------
  describe('updateSection', () => {
    it('updates section after verifying existence', async () => {
      prismaMock.homeSection.findUnique.mockResolvedValueOnce({ id: 1, items: [] });
      prismaMock.homeSection.update.mockResolvedValueOnce({ id: 1, title: 'Updated' });

      const result = await service.updateSection(1, { title: 'Updated' });

      expect(prismaMock.homeSection.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: { title: 'Updated' },
        }),
      );
      expect(result.title).toBe('Updated');
    });
  });

  // ---------- reorderSections ----------
  describe('reorderSections', () => {
    it('throws BadRequestException when items array is empty', async () => {
      await expect(service.reorderSections([])).rejects.toThrow(BadRequestException);
    });

    it('updates section order_index in transaction and returns all sections', async () => {
      prismaMock.homeSection.update.mockResolvedValue({});
      prismaMock.homeSection.findMany.mockResolvedValueOnce([
        { id: 2, order_index: 0 },
        { id: 1, order_index: 1 },
      ]);

      const result = await service.reorderSections([
        { id: 2, order_index: 0 },
        { id: 1, order_index: 1 },
      ]);

      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(2);
    });
  });

  // ---------- deleteSection ----------
  describe('deleteSection', () => {
    it('deletes banner, background, and item images from Cloudinary before deleting section', async () => {
      prismaMock.homeSection.findUnique.mockResolvedValueOnce({
        id: 1,
        banner_image: 'https://cdn/banner.jpg',
        bg_image: 'https://cdn/bg.jpg',
        items: [{ id: 10, image_url: 'https://cdn/item1.jpg' }, { id: 11, image_url: null }],
      });
      prismaMock.homeSection.delete.mockResolvedValueOnce({ id: 1 });

      await service.deleteSection(1);

      expect(cloudinaryMock.deleteFile).toHaveBeenCalledTimes(3);
      expect(cloudinaryMock.deleteFile).toHaveBeenCalledWith('https://cdn/banner.jpg');
      expect(cloudinaryMock.deleteFile).toHaveBeenCalledWith('https://cdn/bg.jpg');
      expect(cloudinaryMock.deleteFile).toHaveBeenCalledWith('https://cdn/item1.jpg');
      expect(prismaMock.homeSection.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });

  // ---------- addItem / updateItem / reorderItems / deleteItem ----------
  describe('section items', () => {
    it('addItem computes next order_index and creates item', async () => {
      prismaMock.homeSection.findUnique.mockResolvedValueOnce({ id: 1, items: [] });
      prismaMock.homeSectionItem.aggregate.mockResolvedValueOnce({ _max: { order_index: null } });
      prismaMock.homeSectionItem.create.mockResolvedValueOnce({
        id: 50,
        section_id: 1,
        title: 'Promo Card',
        order_index: 0,
      });

      const result = await service.addItem(1, { title: 'Promo Card' } as any);

      expect(prismaMock.homeSectionItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            section_id: 1,
            title: 'Promo Card',
            order_index: 0,
            is_active: true,
          }),
        }),
      );
      expect(result.id).toBe(50);
    });

    it('updateItem throws NotFoundException if item is missing', async () => {
      prismaMock.homeSectionItem.findUnique.mockResolvedValueOnce(null);

      await expect(service.updateItem(999, { title: 'X' })).rejects.toThrow(NotFoundException);
    });

    it('reorderItems throws BadRequestException when items array is empty', async () => {
      await expect(service.reorderItems(1, [])).rejects.toThrow(BadRequestException);
    });

    it('reorderItems updates item order_index in transaction and returns section', async () => {
      prismaMock.homeSectionItem.update.mockResolvedValue({});
      prismaMock.homeSection.findUnique.mockResolvedValueOnce({ id: 1, items: [] });

      const result = await service.reorderItems(1, [{ id: 10, order_index: 0 }]);

      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
      expect(result.id).toBe(1);
    });

    it('deleteItem deletes Cloudinary image if present and removes item', async () => {
      prismaMock.homeSectionItem.findUnique.mockResolvedValueOnce({
        id: 10,
        image_url: 'https://cdn/item.jpg',
      });
      prismaMock.homeSectionItem.delete.mockResolvedValueOnce({ id: 10 });

      await service.deleteItem(10);

      expect(cloudinaryMock.deleteFile).toHaveBeenCalledWith('https://cdn/item.jpg');
      expect(prismaMock.homeSectionItem.delete).toHaveBeenCalledWith({ where: { id: 10 } });
    });
  });
});
