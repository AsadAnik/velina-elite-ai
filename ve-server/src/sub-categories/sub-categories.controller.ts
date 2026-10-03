import {
  Controller,
  Post,
  Put,
  Delete,
  Get,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { SubCategoriesService } from './sub-categories.service';
import { CreateSubCategoryDto } from 'src/sub-categories/dto/create-sub-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiBearerAuth()
@Controller('sub-categories')
export class SubCategoriesController {
  constructor(private readonly subCategoriesService: SubCategoriesService) { }

  /**
   * CREATE SUB CATEGORY
   * @param dto CreateSubCategoryDto
   * @returns Object
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.owner)
  create(@Body() dto: CreateSubCategoryDto) {
    return this.subCategoriesService.createSubCategory(dto);
  }

  /**
   * UPDATE SUB CATEGORY
   * @param id sub_category_id
   * @param dto CreateSubCategoryDto
   * @returns Object
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.owner)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateSubCategoryDto) {
    return this.subCategoriesService.updateSubCategory(id, dto);
  }

  /**
   * DELETE SUB CATEGORY
   * @param id sub_category_id
   * @returns Object
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.owner)
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.subCategoriesService.deleteSubCategory(id);
  }

  /**
   * LIST SUB CATEGORIES
   * @returns Object
   */
  @Get()
  findAll() {
    return this.subCategoriesService.findAllSubCategories();
  }

  /**
   * FIND ONE SUB CATEGORY
   * @param id sub_category_id
   * @returns Object
   */
  @Get(':id')
  @ApiOperation({ summary: 'Find One Sub Category' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.subCategoriesService.findOneSubCategory(id);
  }
}
