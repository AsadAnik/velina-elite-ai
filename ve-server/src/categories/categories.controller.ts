import { Controller, Get, Post, Body, Param, Put, Delete, ParseIntPipe, UseGuards, Header } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('categories')
@ApiBearerAuth()
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) { }

  /**
   * CREATE CATEGORY
   * @param dto CreateCategoryDto
   * @returns Object
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.owner)
  @ApiOperation({ summary: 'Create Category' })
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.createCategory(dto);
  }

  /**
   * LIST CATEGORIES WITH SUB-CATEGORIES AND ACTIVE-PRODUCT COUNTS
   * @returns Object
   */
  @Get()
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  @ApiOperation({
    summary:
      'List categories with their sub-categories and active-product counts',
  })
  findAllCategories() {
    return this.categoriesService.findAllCategories();
  }

  /**
   * FIND ONE CATEGORY
   * @param id category_id
   * @returns Object
   */
  @Get(':id')
  @ApiOperation({ summary: 'Find One Category' })
  findOneCategory(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.findOneCategory(id);
  }

  /**
   * UPDATE CATEGORY
   * @param id category_id
   * @param dto CreateCategoryDto
   * @returns Object
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.owner)
  @ApiOperation({ summary: 'Update Category' })
  updateCategory(@Param() id: number, @Body() dto: CreateCategoryDto) {
    return this.categoriesService.updateCategory(id, dto);
  }

  /**
   * DELETE CATEGORY
   * @param id category_id
   * @returns Object
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.owner)
  @ApiOperation({ summary: 'Delete Category' })
  deleteCategory(@Param() id: number) {
    return this.categoriesService.deleteCategory(id);
  }
}
