import {
  Controller,
  Get,
  Put,
  Patch,
  Body,
  UseGuards,
  UsePipes,
  ValidationPipe,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SiteSettingsService } from './site-settings.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { UpdateSiteSettingDto } from './dto/update-site-setting.dto';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('site-settings')
@Controller('site-settings')
export class SiteSettingsController {
  constructor(private readonly siteSettingsService: SiteSettingsService, private readonly cloudinaryService: CloudinaryService) {}

  /**
   * GET SITE SETTINGS
   * @returns Object
   */
  @Get()
  @ApiOperation({ summary: 'Get Site Settings (Public)' })
  getSettings() {
    return this.siteSettingsService.getSettings();
  }

  /**
   * UPDATE SITE SETTINGS
   * @param dto UpdateSiteSettingDto
   * @param file UploadedFile
   * @returns Object
   */
  @Put()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.owner)
  @ApiOperation({ summary: 'Update Site Settings (Admin - PUT)' })
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(FileInterceptor('logo_file'))
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  )
  async updateSettingsPut(
    @Body() dto: UpdateSiteSettingDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (file) {
      const uploadResult = await this.cloudinaryService.uploadFile(file);
      dto.site_logo = uploadResult.secure_url;
    }
    return this.siteSettingsService.updateSettings(dto);
  }

  /**
   * UPDATE SITE SETTINGS
   * @param dto UpdateSiteSettingDto
   * @param file UploadedFile
   * @returns Object
   */
  @Patch()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.owner)
  @ApiOperation({ summary: 'Update Site Settings (Admin - PATCH)' })
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(FileInterceptor('logo_file'))
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  )
  async updateSettingsPatch(
    @Body() dto: UpdateSiteSettingDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (file) {
      const uploadResult = await this.cloudinaryService.uploadFile(file);
      dto.site_logo = uploadResult.secure_url;
    }
    return this.siteSettingsService.updateSettings(dto);
  }
}
