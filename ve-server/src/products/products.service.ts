import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, ProductStatus } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * CREATE PRODUCT SERVICE
   * @param dto createProductDto
   * @returns Object
   */
  // region Create Product
  async createProduct(dto: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        ...dto,
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

    await this.prisma.product.update({
      where: { id },
      data: dto,
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
  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [products, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        skip,
        take: limit,
        include: {
          category: true,
          sub_category: true
        },
        orderBy: { created_at: 'desc' }
      }),
      this.prisma.product.count()
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
    await this.findOne(id);
    await this.prisma.product.delete({ where: { id } });
    return { message: `Product #${id} is deleted successfully!` };
  }
}
