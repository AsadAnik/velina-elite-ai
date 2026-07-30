import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreateProductDto, ProductStatus } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { buildPricingSummary } from './pricing.util';
import { ProductsQueryDto } from './dto/products-query.dto';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService
  ) { }

  /**
   * CREATE PRODUCT SERVICE
   * @param dto createProductDto
   * @returns Object
   */
  // region Create Product
  async createProduct(dto: CreateProductDto) {
    const { images, ...data } = dto;
    const regularPrice = Number(dto.regular_price ?? dto.price ?? 0);
    const mrpPrice = Number(dto.mrp_price ?? regularPrice);
    const pricingSummary = buildPricingSummary({ regularPrice, mrpPrice });

    return this.prisma.product.create({
      data: {
        ...data,
        price: regularPrice,
        regular_price: regularPrice,
        mrp_price: mrpPrice,
        save_amount: pricingSummary.saveAmount,
        save_percentage: pricingSummary.savePercentage,
        currency_symbol: dto.currency_symbol ?? '৳',
        description: dto.description || '',
      },
      include: {
        category: true,
        sub_category: true,
      }
    });
  }

  /**
   * UPDATE PRODUCT SERVICE
   * @param id product_id
   * @param dto updateProductDto
   */
  // region Update Product
  async updateProduct(id: number, dto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        sub_category: true
      }
    });

    if (!product) throw new NotFoundException(`Product #${id} not found`);

    // Detect images that were removed and delete them from Cloudinary
    if (dto.images_url !== undefined) {
      const newImageUrls = Array.isArray(dto.images_url) ? dto.images_url : (dto.images_url ? [dto.images_url as string] : []);
      const oldImageUrls = product.images_url || [];
      
      const removedImages = oldImageUrls.filter(url => !newImageUrls.includes(url));
      if (removedImages.length > 0) {
        await this.cloudinaryService.deleteMultipleFiles(removedImages);
      }
    }

    const regularPrice = dto.regular_price ?? dto.price ?? product.regular_price ?? product.price ?? 0;
    const mrpPrice = dto.mrp_price ?? product.mrp_price ?? regularPrice;
    const pricingSummary = buildPricingSummary({
      regularPrice: Number(regularPrice),
      mrpPrice: Number(mrpPrice),
    });

    await this.prisma.product.update({
      where: { id },
      data: {
        ...dto,
        price: Number(regularPrice),
        regular_price: Number(regularPrice),
        mrp_price: Number(mrpPrice),
        save_amount: pricingSummary.saveAmount,
        save_percentage: pricingSummary.savePercentage,
        currency_symbol: dto.currency_symbol ?? product.currency_symbol,
      },
      include: {
        category: true,
        sub_category: true
      }
    });
  }

  /**
   * UPDATE PRODUCT STATUS SERVICE
   * @param id product_id
   * @param status product_status
   */
  // region Update Status
  async updateProductStatus(id: number, status: ProductStatus) {
    await this.findOne(id);
    await this.prisma.product.update({
      where: { id },
      data: { status }
    });
    return { message: `Product #${id} is updated successfully!` };
  }


  /**
   * FIND ONE PRODUCT SERVICE
   * @param id product_id
   */
  // region Find One Product
  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        sub_category: true
      }
    });

    if (!product) throw new NotFoundException(`Product #${id} not found`);
    return product;
  }

  /**
   * FIND ALL PRODUCT SERVICE
   * @param page page_number
   * @param limit limit_number
   * @returns Object
   */
  // region Find All Products
  async findAll({
    page = 1,
    limit = 10,
    category_id,
    sub_category_id,
    status,
  }: ProductsQueryDto = {}) {
    const skip = (page - 1) * limit;
    const where = {
      ...(category_id ? { category_id } : {}),
      ...(sub_category_id ? { sub_category_id } : {}),
      ...(status ? { status } : {}),
    };

    const [products, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        skip,
        take: limit,
        where,
        include: {
          category: true,
          sub_category: true
        },
        orderBy: { created_at: 'desc' }
      }),
      this.prisma.product.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: products,
      meta: {
        total,
        page,
        limit,
        total_pages: totalPages,
      },
    };
  }

  /**
   * REMOVE PRODUCT SERVICE
   * @param id product_id
   * @returns Object
   */
  // region Remove Product
  async remove(id: number) {
    const product = await this.findOne(id);
    
    // Delete all associated images from Cloudinary
    if (product.images_url && product.images_url.length > 0) {
      await this.cloudinaryService.deleteMultipleFiles(product.images_url);
    }
    
    await this.prisma.product.delete({ where: { id } });
    return { message: `Product #${id} is deleted successfully!` };
  }
}
