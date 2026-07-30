import { Controller, Get, Post, Body, Param, Put, Delete, ParseIntPipe } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService) { }

    @Post()
    @ApiOperation({ summary: 'Create Category' })
    create(@Body() dto: CreateCategoryDto) {
        return this.categoriesService.createCategory(dto);
    }

    @Get()
    @ApiOperation({ summary: 'List categories with their sub-categories and active-product counts' })
    findAllCategories() {
        return this.categoriesService.findAllCategories();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Find One Category' })
    findOneCategory(@Param('id', ParseIntPipe) id: number) {
        return this.categoriesService.findOneCategory(id);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update Category' })
    updateCategory(@Param() id: number, @Body() dto: CreateCategoryDto) {
        return this.categoriesService.updateCategory(id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete Category' })
    deleteCategory(@Param() id: number) {
        return this.categoriesService.deleteCategory(id);
    }
}
