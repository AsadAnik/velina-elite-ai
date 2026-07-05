import { Body, Controller, Param, Post, Put, Patch, Get, Delete, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto, ProductStatus } from 'src/dto/create-product.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdateProductDto } from 'src/dto/update-product.dto';

@ApiTags('products')
@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }

    @Post()
    @ApiOperation({ summary: 'Create Product' })
    create(@Body() dto: CreateProductDto) {
        return this.productsService.createProduct(dto);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update Product' })
    update(@Param() id: number, @Body() dto: UpdateProductDto) {
        return this.productsService.updateProduct(id, dto);
    }

    @Patch('status/:id')
    @ApiOperation({ summary: 'Update Product Status' })
    updateProductStatus(@Param() id: number, @Body('status') status: ProductStatus) {
        return this.productsService.updateProductStatus(id, status);
    }

    @Get()
    @ApiOperation({ summary: 'Find All Products' })
    findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
        return this.productsService.findAll(page, limit);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Find One Product' })
    findOne(@Param() id: number) {
        return this.productsService.findOne(id);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete Product' })
    delete(@Param() id: number) {
        return this.productsService.remove(id);
    }
}
