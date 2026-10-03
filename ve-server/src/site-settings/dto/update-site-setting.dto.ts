import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSiteSettingDto {
  @ApiPropertyOptional({ example: 'Velina Elite', description: 'Storefront and Admin brand name' })
  @IsOptional()
  @IsString()
  site_name?: string;

  @ApiPropertyOptional({ example: '/1776256116755-removebg-preview.png', description: 'Brand logo image URL' })
  @IsOptional()
  @IsString()
  site_logo?: string;

  @ApiPropertyOptional({ example: '8801347375533', description: 'WhatsApp phone number with country code' })
  @IsOptional()
  @IsString()
  whatsapp_number?: string;

  @ApiPropertyOptional({ example: 'Hello! I have a question about Velina Elite.', description: 'Default message for WhatsApp chat' })
  @IsOptional()
  @IsString()
  whatsapp_message?: string;

  @ApiPropertyOptional({ example: true, description: 'Whether WhatsApp button is active' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true || value === 1 || value === '1') return true;
    if (value === 'false' || value === false || value === 0 || value === '0') return false;
    return value;
  })
  @IsBoolean()
  is_whatsapp_active?: boolean;
}
