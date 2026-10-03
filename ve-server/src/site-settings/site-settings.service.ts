import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSiteSettingDto } from './dto/update-site-setting.dto';

const DEFAULT_SETTINGS = {
  site_name: 'Velina Elite',
  site_logo: '/1776256116755-removebg-preview.png',
  whatsapp_number: '8801347375533',
  whatsapp_message: 'Hello! I have a question about Velina Elite.',
  is_whatsapp_active: true,
};

@Injectable()
export class SiteSettingsService {
  constructor(private readonly prisma: PrismaService) {}

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

  async updateSettings(dto: UpdateSiteSettingDto) {
    const existing = await this.prisma.siteSetting.findFirst();

    if (existing) {
      return this.prisma.siteSetting.update({
        where: { id: existing.id },
        data: {
          ...(dto.site_name !== undefined && { site_name: dto.site_name }),
          ...(dto.site_logo !== undefined && { site_logo: dto.site_logo }),
          ...(dto.whatsapp_number !== undefined && { whatsapp_number: dto.whatsapp_number }),
          ...(dto.whatsapp_message !== undefined && { whatsapp_message: dto.whatsapp_message }),
          ...(dto.is_whatsapp_active !== undefined && { is_whatsapp_active: dto.is_whatsapp_active }),
        },
      });
    }

    return this.prisma.siteSetting.create({
      data: {
        site_name: dto.site_name ?? DEFAULT_SETTINGS.site_name,
        site_logo: dto.site_logo ?? DEFAULT_SETTINGS.site_logo,
        whatsapp_number: dto.whatsapp_number ?? DEFAULT_SETTINGS.whatsapp_number,
        whatsapp_message: dto.whatsapp_message ?? DEFAULT_SETTINGS.whatsapp_message,
        is_whatsapp_active: dto.is_whatsapp_active ?? DEFAULT_SETTINGS.is_whatsapp_active,
      },
    });
  }
}
