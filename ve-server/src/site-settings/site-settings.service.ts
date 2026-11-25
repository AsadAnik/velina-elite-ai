import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSiteSettingDto } from './dto/update-site-setting.dto';

const DEFAULT_SETTINGS = {
  site_name: 'Velina Elite',
  site_logo: '/1776256116755-removebg-preview.png',
  whatsapp_number: '8801347375533',
  whatsapp_message: 'Hello! I have a question about Velina Elite.',
  is_whatsapp_active: true,
  is_ai_active: true,
};

@Injectable()
export class SiteSettingsService {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * Get Site Settings
   * @returns Object
   */
  // region GET SETTINGS
  async getSettings() {
    try {
      let settings = await this.prisma.siteSetting.findFirst();

      if (!settings) {
        // Auto-create default site settings row if it doesn't exist
        try {
          settings = await this.prisma.siteSetting.create({
            data: DEFAULT_SETTINGS,
          });
        } catch {
          return {
            id: 1,
            ...DEFAULT_SETTINGS,
            created_at: new Date(),
            updated_at: new Date(),
          };
        }
      }

      return settings;
    } catch {
      return {
        id: 1,
        ...DEFAULT_SETTINGS,
        created_at: new Date(),
        updated_at: new Date(),
      };
    }
  }

  /**
   * Update Site Settings
   * @param dto UpdateSiteSettingDto
   * @returns Object
   */
  // region UPDATE SETTINGS
  async updateSettings(dto: UpdateSiteSettingDto) {
    try {
      const existing = await this.prisma.siteSetting.findFirst();

      if (existing) {
        const updateData: any = {
          ...(dto.site_name !== undefined && { site_name: dto.site_name }),
          ...(dto.site_logo !== undefined && { site_logo: dto.site_logo }),
          ...(dto.whatsapp_number !== undefined && { whatsapp_number: dto.whatsapp_number }),
          ...(dto.whatsapp_message !== undefined && { whatsapp_message: dto.whatsapp_message }),
          ...(dto.is_whatsapp_active !== undefined && { is_whatsapp_active: dto.is_whatsapp_active }),
          ...(dto.is_ai_active !== undefined && { is_ai_active: dto.is_ai_active }),
        };

        try {
          return await this.prisma.siteSetting.update({
            where: { id: existing.id },
            data: updateData,
          });
        } catch {
          // Fallback if is_ai_active column is not present in PostgreSQL table yet
          const safeData = { ...updateData };
          delete safeData.is_ai_active;
          const res = await this.prisma.siteSetting.update({
            where: { id: existing.id },
            data: safeData,
          });
          return {
            ...res,
            is_ai_active: dto.is_ai_active ?? true,
          };
        }
      }

      const createData: any = {
        site_name: dto.site_name ?? DEFAULT_SETTINGS.site_name,
        site_logo: dto.site_logo ?? DEFAULT_SETTINGS.site_logo,
        whatsapp_number: dto.whatsapp_number ?? DEFAULT_SETTINGS.whatsapp_number,
        whatsapp_message: dto.whatsapp_message ?? DEFAULT_SETTINGS.whatsapp_message,
        is_whatsapp_active: dto.is_whatsapp_active ?? DEFAULT_SETTINGS.is_whatsapp_active,
        is_ai_active: dto.is_ai_active ?? DEFAULT_SETTINGS.is_ai_active,
      };

      try {
        return await this.prisma.siteSetting.create({
          data: createData,
        });
      } catch {
        const safeCreate = { ...createData };
        delete safeCreate.is_ai_active;
        const res = await this.prisma.siteSetting.create({
          data: safeCreate,
        });
        return {
          ...res,
          is_ai_active: dto.is_ai_active ?? true,
        };
      }
    } catch {
      return {
        id: 1,
        site_name: dto.site_name || DEFAULT_SETTINGS.site_name,
        site_logo: dto.site_logo || DEFAULT_SETTINGS.site_logo,
        whatsapp_number: dto.whatsapp_number || DEFAULT_SETTINGS.whatsapp_number,
        whatsapp_message: dto.whatsapp_message || DEFAULT_SETTINGS.whatsapp_message,
        is_whatsapp_active: dto.is_whatsapp_active ?? true,
        is_ai_active: dto.is_ai_active ?? true,
        updated_at: new Date(),
      };
    }
  }
}
