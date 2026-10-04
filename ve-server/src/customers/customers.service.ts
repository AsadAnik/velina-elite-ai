import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Role } from '@prisma/client';
import { QueryCustomersDto } from './dto/query-customers.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async getCustomers(query: QueryCustomersDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
    const skip = (page - 1) * limit;
    const search = query.search?.trim();

    const where: Prisma.UserWhereInput = {};

    if (query.role) {
      const roleStr = Array.isArray(query.role) ? query.role[0] : String(query.role).trim();
      if (roleStr && roleStr.toLowerCase() !== 'all') {
        if (Object.values(Role).includes(roleStr as Role)) {
          where.role = roleStr as Role;
        }
      }
    } else {
      where.role = Role.customer;
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        {
          customer: {
            OR: [
              { fname: { contains: search, mode: 'insensitive' } },
              { lname: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          customer: {
            include: {
              addresses: true,
              orders: {
                select: {
                  id: true,
                  total_amount: true,
                  status: true,
                  created_at: true,
                },
              },
              _count: {
                select: {
                  orders: true,
                  ratings: true,
                  wishlists: true,
                },
              },
            },
          },
        },
      }),
    ]);

    const items = users.map((user) => {
      const orders = user.customer?.orders || [];
      const totalSpent = orders.reduce((sum, order) => {
        return sum + Number(order?.total_amount ?? 0);
      }, 0);

      const fullName = user.customer
        ? `${user.customer.fname || ''} ${user.customer.lname || ''}`.trim() || user.username
        : user.username;

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
        updated_at: user.updated_at,
        fullName,
        customer: user.customer
          ? {
              id: user.customer.id,
              fname: user.customer.fname || '',
              lname: user.customer.lname || '',
              phone: user.customer.phone || null,
              gender: user.customer.gender || 'other',
              addresses: user.customer.addresses || [],
              ordersCount: user.customer._count?.orders ?? 0,
              ratingsCount: user.customer._count?.ratings ?? 0,
              wishlistsCount: user.customer._count?.wishlists ?? 0,
              totalSpent,
            }
          : null,
      };
    });

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  async getCustomerById(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        customer: {
          include: {
            addresses: true,
            orders: {
              orderBy: { created_at: 'desc' },
              include: {
                order_items: {
                  include: {
                    product: true,
                  },
                },
              },
            },
            ratings: {
              include: {
                product: true,
              },
            },
            wishlists: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Customer not found');
    }

    const orders = user.customer?.orders || [];
    const totalSpent = orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at,
      fullName: user.customer
        ? `${user.customer.fname} ${user.customer.lname}`.trim()
        : user.username,
      customer: user.customer,
      totalSpent,
    };
  }

  async updateCustomer(id: number, dto: UpdateCustomerDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { customer: true },
    });

    if (!user) {
      throw new NotFoundException('Customer not found');
    }

    // Check unique email if changed
    if (dto.email && dto.email.toLowerCase() !== user.email.toLowerCase()) {
      const emailExists = await this.prisma.user.findUnique({
        where: { email: dto.email.toLowerCase() },
      });
      if (emailExists) {
        throw new BadRequestException('A user with this email already exists');
      }
    }

    // Check unique username if changed
    if (dto.username && dto.username.toLowerCase() !== user.username.toLowerCase()) {
      const usernameExists = await this.prisma.user.findUnique({
        where: { username: dto.username },
      });
      if (usernameExists) {
        throw new BadRequestException('A user with this username already exists');
      }
    }

    const userDataToUpdate: Prisma.UserUpdateInput = {};
    if (dto.username) userDataToUpdate.username = dto.username.trim();
    if (dto.email) userDataToUpdate.email = dto.email.trim().toLowerCase();
    if (dto.role) userDataToUpdate.role = dto.role;

    const customerDataToUpdate: Prisma.CustomerUpdateWithoutUserInput = {};
    if (dto.fname !== undefined) customerDataToUpdate.fname = dto.fname.trim();
    if (dto.lname !== undefined) customerDataToUpdate.lname = dto.lname.trim();
    if (dto.phone !== undefined) customerDataToUpdate.phone = dto.phone ? dto.phone.trim() : null;
    if (dto.gender !== undefined) customerDataToUpdate.gender = dto.gender.trim();

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        ...userDataToUpdate,
        ...(user.customer && Object.keys(customerDataToUpdate).length > 0
          ? {
              customer: {
                update: customerDataToUpdate,
              },
            }
          : !user.customer && (dto.fname || dto.lname)
          ? {
              customer: {
                create: {
                  fname: dto.fname || user.username,
                  lname: dto.lname || '',
                  phone: dto.phone || null,
                  gender: dto.gender || 'other',
                },
              },
            }
          : {}),
      },
      include: {
        customer: {
          include: {
            addresses: true,
          },
        },
      },
    });

    return {
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role,
      created_at: updatedUser.created_at,
      updated_at: updatedUser.updated_at,
      fullName: updatedUser.customer
        ? `${updatedUser.customer.fname} ${updatedUser.customer.lname}`.trim()
        : updatedUser.username,
      customer: updatedUser.customer,
    };
  }

  async deleteCustomer(id: number, currentUserId: number) {
    if (id === currentUserId) {
      throw new BadRequestException('You cannot delete your own account');
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        customer: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Customer not found');
    }

    if (user.role === Role.owner) {
      const ownerCount = await this.prisma.user.count({
        where: { role: Role.owner },
      });
      if (ownerCount <= 1) {
        throw new BadRequestException('Cannot delete the only remaining owner account');
      }
    }

    const customerId = user.customer?.id;

    await this.prisma.$transaction(async (tx) => {
      if (customerId) {
        // Find orders
        const orders = await tx.order.findMany({
          where: { customer_id: customerId },
          select: { id: true },
        });

        const orderIds = orders.map((o) => o.id);

        if (orderIds.length > 0) {
          await tx.orderHistory.deleteMany({
            where: { order_id: { in: orderIds } },
          });
          await tx.orderItem.deleteMany({
            where: { order_id: { in: orderIds } },
          });
          await tx.order.deleteMany({
            where: { customer_id: customerId },
          });
        }

        await tx.rating.deleteMany({ where: { customer_id: customerId } });
        await tx.cart.deleteMany({ where: { customer_id: customerId } });
        await tx.wishlist.deleteMany({ where: { customer_id: customerId } });
        await tx.address.deleteMany({ where: { customer_id: customerId } });
        await tx.customer.delete({ where: { id: customerId } });
      }

      await tx.user.delete({ where: { id } });
    });

    return {
      message: `Customer ${user.username} (${user.email}) has been permanently deleted.`,
    };
  }
}
