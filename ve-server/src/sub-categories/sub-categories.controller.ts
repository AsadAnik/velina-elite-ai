import { Controller, Post, Put, Delete, Get, Body, Param } from '@nestjs/common';
import { SubCategoriesService } from './sub-categories.service';
import { CreateSubCategoryDto } from 'src/sub-categories/dto/create-sub-category.dto';

@Controller('sub-categories')
export class SubCategoriesController {
    constructor(private readonly subCategoriesService: SubCategoriesService) { }

    @Post()
    create(@Body() dto: CreateSubCategoryDto) {
        return this.subCategoriesService.createSubCategory(dto);
    }

    @Put(':id')
    update(@Param('id') id: number, @Body() dto: CreateSubCategoryDto) {
        return this.subCategoriesService.updateSubCategory(id, dto);
    }

    @Delete(':id')
    delete(@Param('id') id: number) {
        return this.subCategoriesService.deleteSubCategory(id);
    }

    @Get()
    findAll() {
        return this.subCategoriesService.findAllSubCategories();
    }
}
