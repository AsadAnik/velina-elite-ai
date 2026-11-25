import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { SiteSettingsService } from '../site-settings.service';

const prismaMock = {
  siteSetting: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

describe('SiteSettingsService (unit)', () => {
  let service: SiteSettingsService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SiteSettingsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<SiteSettingsService>(SiteSettingsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getSettings', () => {
    it('returns existing site settings when found', async () => {
      const existing = { id: 1, site_name: 'Velina Elite', is_ai_active: true };
      prismaMock.siteSetting.findFirst.mockResolvedValueOnce(existing);

      expect(await service.getSettings()).toEqual(existing);
      expect(prismaMock.siteSetting.create).not.toHaveBeenCalled();
    });

    it('auto-creates default settings when table is empty', async () => {
      const created = { id: 1, site_name: 'Velina Elite', is_whatsapp_active: true };
      prismaMock.siteSetting.findFirst.mockResolvedValueOnce(null);
      prismaMock.siteSetting.create.mockResolvedValueOnce(created);

      const result = await service.getSettings();

      expect(prismaMock.siteSetting.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual(created);
    });

    it('returns in-memory default settings if DB throws', async () => {
      prismaMock.siteSetting.findFirst.mockRejectedValueOnce(new Error('DB down'));

      const result = await service.getSettings();

      expect(result).toMatchObject({
        id: 1,
        site_name: 'Velina Elite',
        is_whatsapp_active: true,
        is_ai_active: true,
      });
    });
  });

  describe('updateSettings', () => {
    it('updates existing settings row', async () => {
      prismaMock.siteSetting.findFirst.mockResolvedValueOnce({ id: 1 });
      prismaMock.siteSetting.update.mockResolvedValueOnce({
        id: 1,
        site_name: 'Velina Store',
        is_ai_active: false,
      });

      const result = await service.updateSettings({
        site_name: 'Velina Store',
        is_ai_active: false,
      });

      expect(prismaMock.siteSetting.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { site_name: 'Velina Store', is_ai_active: false },
      });
      expect(result).toMatchObject({ site_name: 'Velina Store', is_ai_active: false });
    });

    it('falls back to updating without is_ai_active if column is missing in DB', async () => {
      prismaMock.siteSetting.findFirst.mockResolvedValueOnce({ id: 1 });
      prismaMock.siteSetting.update
        .mockRejectedValueOnce(new Error('column is_ai_active does not exist'))
        .mockResolvedValueOnce({ id: 1, site_name: 'Velina Store' });

      const result = await service.updateSettings({
        site_name: 'Velina Store',
        is_ai_active: false,
      });

      expect(prismaMock.siteSetting.update).toHaveBeenCalledTimes(2);
      expect(result).toMatchObject({
        id: 1,
        site_name: 'Velina Store',
        is_ai_active: false,
      });
    });

    it('creates a new settings row when none exists', async () => {
      prismaMock.siteSetting.findFirst.mockResolvedValueOnce(null);
      prismaMock.siteSetting.create.mockResolvedValueOnce({
        id: 1,
        site_name: 'New Brand',
      });

      const result = await service.updateSettings({ site_name: 'New Brand' });

      expect(prismaMock.siteSetting.create).toHaveBeenCalledTimes(1);
      expect(result).toMatchObject({ id: 1, site_name: 'New Brand' });
    });
  });
});
