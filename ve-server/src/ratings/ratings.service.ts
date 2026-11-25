import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { UpdateRatingDto } from './dto/update-rating.dto';
import { OrderStatus, Role } from '@prisma/client';

@Injectable()
export class RatingsService {
  constructor(private prisma: PrismaService) { }

  /**
   * Create a new rating
   * @param user_id foriegn key reference from user model, unique identifier for user
   * @param createRatingDto updated rating data
   * @returns 
   */
  // region CREATE RATING
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

  /**
   * Find all ratings for a product
   * @param productId unique identifier for product
   * @returns array of ratings
   */
  // region FIND ALL RATINGS
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

  /**
   * Find all ratings
   * @returns array of ratings
   */
  // region FIND ALL RATINGS
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

  /**
   * Update a rating
   * @param id unique identifier for rating 
   * @param updateRatingDto updated rating data
   * @returns updated rating
   */
  // region UPDATE RATINGS
  async update(id: number, updateRatingDto: UpdateRatingDto) {
    return this.prisma.rating.update({
      where: { id },
      data: updateRatingDto,
    });
  }

  /**
   * Delete a rating
   * @param id unique identifier for rating 
   * @returns removed rating
   */
  // region DELETE RATINGS
  async remove(id: number) {
    return this.prisma.rating.delete({
      where: { id },
    });
  }

  /**
   * Seed ratings
   * @returns seed ratings
   */
  // region SEED RATINGS
  async seedRatings() {
    const sampleCustomers = [
      { fname: 'Nusrat', lname: 'Jahan', email: 'nusrat.jahan@gmail.com', username: 'nusrat-jahan' },
      { fname: 'Ayesha', lname: 'Rahman', email: 'ayesha.rahman@gmail.com', username: 'ayesha-r' },
      { fname: 'Tanjila', lname: 'Akter', email: 'tanjila.akter@gmail.com', username: 'tanjila-a' },
      { fname: 'Sultana', lname: 'Parvin', email: 'sultana.parvin@gmail.com', username: 'sultana-p' },
      { fname: 'Farhana', lname: 'Islam', email: 'farhana.islam@gmail.com', username: 'farhana-i' },
      { fname: 'Sadia', lname: 'Chowdhury', email: 'sadia.chowdhury@gmail.com', username: 'sadia-c' },
      { fname: 'Mehzabin', lname: 'Ahmed', email: 'mehzabin.ahmed@gmail.com', username: 'mehzabin-a' },
      { fname: 'Tasnim', lname: 'Kazi', email: 'tasnim.kazi@gmail.com', username: 'tasnim-k' },
      { fname: 'Anika', lname: 'Tabassum', email: 'anika.tabassum@gmail.com', username: 'anika-t' },
      { fname: 'Sharmin', lname: 'Sultana', email: 'sharmin.sultana@gmail.com', username: 'sharmin-s' },
      { fname: 'Humayra', lname: 'Zerin', email: 'humayra.zerin@gmail.com', username: 'humayra-z' },
      { fname: 'Tamanna', lname: 'Yeasmin', email: 'tamanna.yeasmin@gmail.com', username: 'tamanna-y' },
      { fname: 'Mariya', lname: 'Hossain', email: 'mariya.hossain@gmail.com', username: 'mariya-h' },
      { fname: 'Nabila', lname: 'Khan', email: 'nabila.khan@gmail.com', username: 'nabila-k' },
      { fname: 'Rafi', lname: 'Ahmed', email: 'rafi.ahmed@gmail.com', username: 'rafi-ahmed' },
    ];

    const reviewComments = [
      "100% authentic product! Loved the texture and results on my skin.",
      "Extremely satisfied with the purchase! Delivery was fast and quality is top notch.",
      "Super hydrating and gentle. Will definitely reorder again from Velina Elite!",
      "Great value for money. Smells wonderful and feels very premium.",
      "Highly recommended! Visible improvements within a few days of use.",
      "Original product, fast delivery, packaging was amazing.",
      "Very nice product! Fits my skin type perfectly.",
      "Simply awesome! My go-to daily beauty staple now.",
      "Loved it so much! 5 stars without any doubt.",
      "Good product overall. Works really well and gentle on skin.",
      "Best beauty purchase this month! Really pleased with the outcome.",
      "Smooth finish and long lasting effect. Definitely genuine product.",
      "Bought it for the second time. Super happy with Velina Elite service!",
      "Five stars! Smooth application and non-sticky feel."
    ];

    // 1. Ensure sample customers exist
    const customerRecords: Array<{ id: number; user_id: number; fname: string; lname: string }> = [];
    for (const sc of sampleCustomers) {
      let user = await this.prisma.user.findUnique({
        where: { email: sc.email },
        include: { customer: true },
      });

      if (!user) {
        user = await this.prisma.user.create({
          data: {
            username: sc.username,
            email: sc.email,
            password: '$2a$10$w09u.Hk0/d4nBqC45Y268.mX9sH1sY5S4mQ8P.g7H2aP5M1s6A5K6',
            role: Role.customer,
            customer: {
              create: {
                fname: sc.fname,
                lname: sc.lname,
                phone: `+88017${Math.floor(10000000 + Math.random() * 90000000)}`,
                gender: Math.random() > 0.1 ? 'female' : 'male',
              },
            },
          },
          include: { customer: true },
        });
      }

      if (user.customer) {
        customerRecords.push(user.customer);
      }
    }

    if (customerRecords.length === 0) {
      throw new BadRequestException('Failed to create or find sample customers for ratings');
    }

    // 2. Fetch all products
    const products = await this.prisma.product.findMany();
    if (products.length === 0) {
      return { message: 'No products found to seed ratings for', seededCount: 0 };
    }

    let seededCount = 0;

    // 3. For each product, seed 8 to 10 ratings
    for (const product of products) {
      const targetCount = Math.floor(Math.random() * 3) + 8; // 8, 9, or 10 ratings per product
      const shuffled = [...customerRecords].sort(() => 0.5 - Math.random());
      const selectedCustomers = shuffled.slice(0, Math.min(targetCount, customerRecords.length));

      for (let i = 0; i < selectedCustomers.length; i++) {
        const customer = selectedCustomers[i];
        const stars = Math.random() < 0.75 ? 5 : 4; // 75% 5-star, 25% 4-star -> Avg ~4.75 stars
        const comment = reviewComments[Math.floor(Math.random() * reviewComments.length)];

        const randomDaysAgo = Math.floor(Math.random() * 60);
        const createdDate = new Date(Date.now() - randomDaysAgo * 24 * 60 * 60 * 1000);

        try {
          await this.prisma.rating.upsert({
            where: {
              customer_id_product_id: {
                customer_id: customer.id,
                product_id: product.id,
              },
            },
            update: {
              stars,
              comment,
            },
            create: {
              customer_id: customer.id,
              product_id: product.id,
              stars,
              comment,
              created_at: createdDate,
            },
          });
          seededCount++;
        } catch (err) {
          // Ignore unique constraint edge cases
        }
      }
    }

    return {
      message: `Successfully seeded real ratings across ${products.length} products (8-10 reviews each, 4.5-5 stars average)!`,
      totalProducts: products.length,
      seededCount,
    };
  }
}
