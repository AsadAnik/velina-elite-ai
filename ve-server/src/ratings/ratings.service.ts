import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { UpdateRatingDto } from './dto/update-rating.dto';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class RatingsService {
  constructor(private prisma: PrismaService) {}

  async create(user_id: number, createRatingDto: CreateRatingDto) {
    const { product_id, stars, comment } = createRatingDto;

    const customer = await this.prisma.customer.findFirst({
      where: { user_id },
    });

    if (!customer) {
      throw new BadRequestException('Customer profile not found');
    }

    const orderItem = await this.prisma.orderItem.findFirst({
      where: {
        product_id,
        order: {
          customer_id: customer.id,
          status: OrderStatus.completed,
        },
      },
    });

    if (!orderItem) {
      throw new BadRequestException('You can only rate a product after purchasing it and the order is completed.');
    }

    const existingRating = await this.prisma.rating.findUnique({
      where: {
        customer_id_product_id: {
          customer_id: customer.id,
          product_id,
        },
      },
    });

    if (existingRating) {
      throw new BadRequestException('You have already rated this product.');
    }

    return this.prisma.rating.create({
      data: {
        customer_id: customer.id,
        product_id,
        stars,
        comment,
      },
    });
  }

  async findAllForProduct(productId: number) {
    const ratings = await this.prisma.rating.findMany({
      where: { product_id: productId },
      include: {
        customer: {
          include: {
            user: {
              select: { username: true }
            }
          }
        },
      },
      orderBy: { created_at: 'desc' },
    });

    const averageRating = ratings.length > 0 
      ? ratings.reduce((acc, curr) => acc + curr.stars, 0) / ratings.length 
      : 0;

    return {
      ratings,
      averageRating: parseFloat(averageRating.toFixed(1)),
      totalRatings: ratings.length
    };
  }

  async findAll() {
    return this.prisma.rating.findMany({
      include: {
        customer: {
          include: {
            user: { select: { username: true } }
          }
        },
        product: { select: { title: true, images_url: true } }
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async update(id: number, updateRatingDto: UpdateRatingDto) {
    return this.prisma.rating.update({
      where: { id },
      data: updateRatingDto,
    });
  }

  async remove(id: number) {
    return this.prisma.rating.delete({
      where: { id },
    });
  }
}
