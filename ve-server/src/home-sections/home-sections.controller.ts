import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  UploadedFile,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  FileFieldsInterceptor,
  FileInterceptor,
} from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { HomeSectionsService } from './home-sections.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreateHomeSectionDto } from './dto/create-home-section.dto';
import { UpdateHomeSectionDto } from './dto/update-home-section.dto';
import { CreateHomeSectionItemDto } from './dto/create-home-section-item.dto';
import { UpdateHomeSectionItemDto } from './dto/update-home-section-item.dto';
import { ReorderHomeSectionsDto } from './dto/reorder-home-sections.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('home-sections')
@Controller('home-sections')
export class HomeSectionsController {
  constructor(
    private readonly homeSectionsService: HomeSectionsService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  /**
   * Get all active sections for storefront
   * @returns Array of home sections
   */
  @Get('public')
  @ApiOperation({ summary: 'Get active home sections for storefront' })
  getPublicSections() {
    return this.homeSectionsService.getPublicSections();
  }

  /**
   * Get all home sections
   * @returns Array of home sections
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.owner)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all home sections (Admin)' })
  getAllSections() {
    return this.homeSectionsService.getAllSections();
  }

  /**
   * Reorder home sections
   * @param dto Array of home sections
   * @returns Array of home sections
   */
  @Patch('reorder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.owner)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reorder home sections' })
  reorderSections(@Body() dto: ReorderHomeSectionsDto) {
    return this.homeSectionsService.reorderSections(dto.items);
  }

  /**
   * Reorder items within a section
   * @param id Section ID
   * @param dto Array of items
   * @returns Array of items
   */
  @Patch(':id/items/reorder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.owner)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reorder items within a section' })
  reorderItems(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReorderHomeSectionsDto,
  ) {
    return this.homeSectionsService.reorderItems(id, dto.items);
  }

  /**
   * Get home section by ID
   * @param id Section ID
   * @returns Home section object
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get home section by ID' })
  getSectionById(@Param('id', ParseIntPipe) id: number) {
    return this.homeSectionsService.getSectionById(id);
  }

  /**
   * Create home section
   * @param dto Home section data
   * @param files Banner and background image files
   * @returns Created home section object
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.owner)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create home section' })
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'banner_file', maxCount: 1 },
      { name: 'bg_file', maxCount: 1 },
    ]),
  )
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  )
  async createSection(
    @Body() dto: CreateHomeSectionDto,
    @UploadedFiles()
    files?: {
      banner_file?: Express.Multer.File[];
      bg_file?: Express.Multer.File[];
    },
  ) {
    if (files?.banner_file?.[0]) {
      const result = await this.cloudinaryService.uploadFile(
        files.banner_file[0],
      );
      dto.banner_image = result.secure_url;
    }
    if (files?.bg_file?.[0]) {
      const result = await this.cloudinaryService.uploadFile(files.bg_file[0]);
      dto.bg_image = result.secure_url;
    }

    return this.homeSectionsService.createSection(dto);
  }

  /**
   * Update home section
   * @param id Section ID
   * @param dto Home section data
   * @param files Banner and background image files
   * @returns Updated home section object
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.owner)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update home section' })
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'banner_file', maxCount: 1 },
      { name: 'bg_file', maxCount: 1 },
    ]),
  )
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  )
  async updateSection(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateHomeSectionDto,
    @UploadedFiles()
    files?: {
      banner_file?: Express.Multer.File[];
      bg_file?: Express.Multer.File[];
    },
  ) {
    if (files?.banner_file?.[0]) {
      const result = await this.cloudinaryService.uploadFile(
        files.banner_file[0],
      );
      dto.banner_image = result.secure_url;
    }
    if (files?.bg_file?.[0]) {
      const result = await this.cloudinaryService.uploadFile(files.bg_file[0]);
      dto.bg_image = result.secure_url;
    }

    return this.homeSectionsService.updateSection(id, dto);
  }

  /**
   * Delete home section
   * @param id Section ID
   * @returns Deleted home section object
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.owner)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete home section' })
  deleteSection(@Param('id', ParseIntPipe) id: number) {
    return this.homeSectionsService.deleteSection(id);
  }

  /**
   * Add item to home section
   * @param sectionId Section ID
   * @param dto Item data
   * @param file Item image file
   * @returns Added item object
   */
  @Post(':id/items')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.owner)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add item to home section' })
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(FileInterceptor('image_file'))
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  )
  async addItem(
    @Param('id', ParseIntPipe) sectionId: number,
    @Body() dto: CreateHomeSectionItemDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (file) {
      const result = await this.cloudinaryService.uploadFile(file);
      dto.image_url = result.secure_url;
    }

    return this.homeSectionsService.addItem(sectionId, dto);
  }

  /**
   * Update home section item
   * @param itemId Item ID
   * @param dto Item data
   * @param file Item image file
   * @returns Updated item object
   */
  @Put('items/:itemId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.owner)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update home section item' })
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(FileInterceptor('image_file'))
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  )
  async updateItem(
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() dto: UpdateHomeSectionItemDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (file) {
      const result = await this.cloudinaryService.uploadFile(file);
      dto.image_url = result.secure_url;
    }

    return this.homeSectionsService.updateItem(itemId, dto);
  }

  /**
   * Delete home section item
   * @param itemId Item ID
   * @returns Deleted item object
   */
  @Delete('items/:itemId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.owner)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete home section item' })
  deleteItem(@Param('itemId', ParseIntPipe) itemId: number) {
    return this.homeSectionsService.deleteItem(itemId);
  }
}
