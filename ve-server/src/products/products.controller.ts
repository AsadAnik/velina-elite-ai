import { Body, Controller, Param, Post, Put, Patch, Get, Delete, Query, UseInterceptors, UploadedFiles, BadRequestException, UsePipes, ValidationPipe, ParseIntPipe } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { ProductsService } from './products.service';
import { CreateProductDto, ProductStatus } from 'src/products/dto/create-product.dto';
import { ApiOperation, ApiTags, ApiConsumes, ApiQuery } from '@nestjs/swagger';
import { UpdateProductDto } from 'src/products/dto/update-product.dto';
import { ProductsQueryDto } from './dto/products-query.dto';

@ApiTags('products')
@Controller('products')
export class ProductsController {
    constructor(
        private readonly productsService: ProductsService,
        private readonly cloudinaryService: CloudinaryService
    ) { }

    @Post()
    @ApiOperation({ summary: 'Create Product' })
    @ApiConsumes('multipart/form-data', 'application/json')
    @UseInterceptors(FilesInterceptor('images'))
    @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: false, transform: true }))
    async create(@Body() dto: CreateProductDto, @UploadedFiles() files?: Array<Express.Multer.File>) {
        const existingUrls = Array.isArray(dto.images_url) ? dto.images_url : (dto.images_url ? [dto.images_url as string] : []);
        const totalImagesCount = existingUrls.length + (files ? files.length : 0);

        if (totalImagesCount < 1 || totalImagesCount > 3) {
            throw new BadRequestException('A product must have between 1 and 3 images (uploaded or URLs)');
        }

        if (files && files.length > 0) {
            const uploadPromises = files.map(file => this.cloudinaryService.uploadFile(file));
            const uploadResults = await Promise.all(uploadPromises);
            const urls = uploadResults.map(res => res.secure_url);

            dto.images_url = [...existingUrls, ...urls];
        } else {
            dto.images_url = existingUrls;
        }

        return this.productsService.createProduct(dto);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update Product' })
    @ApiConsumes('multipart/form-data', 'application/json')
    @UseInterceptors(FilesInterceptor('images'))
    @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: false, transform: true }))
    async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProductDto, @UploadedFiles() files?: Array<Express.Multer.File>) {
        if (dto.images_url !== undefined || (files && files.length > 0)) {
            const existingUrls = Array.isArray(dto.images_url) ? dto.images_url : (dto.images_url ? [dto.images_url as string] : []);
            const totalImagesCount = existingUrls.length + (files ? files.length : 0);

            if (totalImagesCount < 1 || totalImagesCount > 3) {
                throw new BadRequestException('A product must have between 1 and 3 images (uploaded or URLs)');
            }
        }

        if (files && files.length > 0) {
            const uploadPromises = files.map(file => this.cloudinaryService.uploadFile(file));
            const uploadResults = await Promise.all(uploadPromises);
            const urls = uploadResults.map(res => res.secure_url);

            const existingUrls = Array.isArray(dto.images_url) ? dto.images_url : (dto.images_url ? [dto.images_url as string] : []);
            dto.images_url = [...existingUrls, ...urls];
        } else if (dto.images_url !== undefined) {
            dto.images_url = Array.isArray(dto.images_url) ? dto.images_url : [dto.images_url as string];
        }

        return this.productsService.updateProduct(id, dto);
    }

    @Patch('status/:id')
    @ApiOperation({ summary: 'Update Product Status' })
    updateProductStatus(@Param('id', ParseIntPipe) id: number, @Body('status') status: ProductStatus) {
        return this.productsService.updateProductStatus(id, status);
    }

    @Get()
    @ApiOperation({ summary: 'List products, optionally filtered by category, sub-category, and status' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'category_id', required: false, type: Number })
    @ApiQuery({ name: 'sub_category_id', required: false, type: Number })
    @ApiQuery({ name: 'status', required: false, enum: ProductStatus })
    findAll(@Query() query: ProductsQueryDto) {
        return this.productsService.findAll(query);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get product details by ID, including category and sub-category' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.productsService.findOne(id);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete Product' })
    delete(@Param('id', ParseIntPipe) id: number) {
        return this.productsService.remove(id);
    }
}
