import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { UpdateAdminRoleDto } from './dto/update-admin-role.dto';

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * LIST ADMIN USERS
   * @returns Object
   */
  // region GET ADMIN
  async getAdminUsers() {
    const users = await this.prisma.user.findMany({
      where: {
        role: {
          in: [Role.owner, Role.admin],
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            fname: true,
            lname: true,
            phone: true,
            gender: true,
          },
        },
      },
      orderBy: [
        { role: 'desc' }, // owner before admin
        { created_at: 'asc' },
      ],
    });

    return users.map((u) => ({
      id: u.id,
      username: u.username,
      email: u.email,
      role: u.role,
      created_at: u.created_at,
      updated_at: u.updated_at,
      customer: u.customer,
      fullName: u.customer ? `${u.customer.fname} ${u.customer.lname}`.trim() : u.username,
    }));
  }

  /**
   * SEARCH CUSTOMERS
   * @param query string
   * @returns Object
   */
  // region SEARCH CUSTOMER
  async searchCustomers(query: string) {
    const cleanQuery = (query || '').trim();
    if (!cleanQuery) {
      return [];
    }

    const users = await this.prisma.user.findMany({
      where: {
        role: Role.customer,
        OR: [
          { email: { contains: cleanQuery, mode: 'insensitive' } },
          { username: { contains: cleanQuery, mode: 'insensitive' } },
          {
            customer: {
              OR: [
                { fname: { contains: cleanQuery, mode: 'insensitive' } },
                { lname: { contains: cleanQuery, mode: 'insensitive' } },
                { phone: { contains: cleanQuery, mode: 'insensitive' } },
              ],
            },
          },
        ],
      },
      take: 10,
      include: {
        customer: {
          select: {
            id: true,
            fname: true,
            lname: true,
            phone: true,
            gender: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return users.map((u) => ({
      id: u.id,
      username: u.username,
      email: u.email,
      role: u.role,
      created_at: u.created_at,
      customer: u.customer,
      fullName: u.customer ? `${u.customer.fname} ${u.customer.lname}`.trim() : u.username,
    }));
  }

  /**
   * CREATE ADMIN USER
   * @param dto CreateAdminUserDto
   * @returns Object
   */
  // region CREATE ADMIN
  async createAdminUser(dto: CreateAdminUserDto) {
    const normalizedEmail = dto.email.trim().toLowerCase();

    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new BadRequestException('A user with this email already exists');
    }

    if (dto.role !== Role.admin && dto.role !== Role.owner) {
      throw new BadRequestException('Role must be either admin or owner');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const sanitizedName = dto.fullName.trim().replace(/\s+/g, '-').toLowerCase().replace(/[^a-z0-9-]/g, '');
    const username = `${sanitizedName || 'admin'}-${Date.now()}`;

    const names = dto.fullName.trim().split(/\s+/);
    const fname = names[0] || 'Admin';
    const lname = names.slice(1).join(' ') || fname;

    const user = await this.prisma.user.create({
      data: {
        username,
        email: normalizedEmail,
        password: hashedPassword,
        role: dto.role,
        customer: {
          create: {
            fname,
            lname,
            phone: dto.phone ?? null,
            gender: dto.gender ?? 'other',
          },
        },
      },
      include: {
        customer: true,
      },
    });

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
      customer: user.customer,
      fullName: user.customer
        ? `${user.customer.fname} ${user.customer.lname}`.trim()
        : user.username,
    };
  }

  /**
   * UPDATE ADMIN ROLE
   * @param targetUserId admin_user_id
   * @param dto UpdateAdminRoleDto
   * @param currentUserId current_user_id
   * @returns Object
   */
  // region UPDATE ROLE
  async updateUserRole(targetUserId: number, dto: UpdateAdminRoleDto, currentUserId: number) {
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    // Safeguard: If target user is an owner and their role is being changed to non-owner
    if (targetUser.role === Role.owner && dto.role !== Role.owner) {
      const ownerCount = await this.prisma.user.count({
        where: { role: Role.owner },
      });

      if (ownerCount <= 1) {
        throw new BadRequestException(
          'Cannot demote or change the role of the only remaining owner in the system',
        );
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { role: dto.role },
      include: {
        customer: true,
      },
    });

    return {
      id: updated.id,
      username: updated.username,
      email: updated.email,
      role: updated.role,
      updated_at: updated.updated_at,
      customer: updated.customer,
      fullName: updated.customer ? `${updated.customer.fname} ${updated.customer.lname}`.trim() : updated.username,
    };
  }

  /**
   * REMOVE ADMIN
   * @param targetUserId admin_user_id
   * @param currentUserId current_user_id
   * @param action 'revoke' | 'delete'
   * @returns Object
   */
  // region REMOVE ADMIN
  async removeAdmin(targetUserId: number, currentUserId: number, action: 'revoke' | 'delete' = 'revoke') {
    if (targetUserId === currentUserId) {
      throw new BadRequestException('You cannot remove or revoke your own admin account');
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        customer: {
          include: {
            orders: { select: { id: true }, take: 1 },
          },
        },
      },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    if (targetUser.role === Role.owner) {
      const ownerCount = await this.prisma.user.count({
        where: { role: Role.owner },
      });

      if (ownerCount <= 1) {
        throw new BadRequestException(
          'Cannot remove or revoke the only remaining owner account',
        );
      }
    }

    if (action === 'delete') {
      const hasOrders = (targetUser.customer?.orders?.length ?? 0) > 0;
      if (hasOrders) {
        // Demote instead of hard deleting to prevent foreign key issues with orders
        await this.prisma.user.update({
          where: { id: targetUserId },
          data: { role: Role.customer },
        });

        return {
          message:
            'User has existing order history so their account was preserved, but their Admin access has been revoked and set to Customer.',
          actionTaken: 'revoked',
        };
      }

      // If no orders, delete customer child records and user
      if (targetUser.customer) {
        const customerId = targetUser.customer.id;
        await this.prisma.$transaction([
          this.prisma.cart.deleteMany({ where: { customer_id: customerId } }),
          this.prisma.wishlist.deleteMany({ where: { customer_id: customerId } }),
          this.prisma.address.deleteMany({ where: { customer_id: customerId } }),
          this.prisma.rating.deleteMany({ where: { customer_id: customerId } }),
          this.prisma.customer.delete({ where: { id: customerId } }),
          this.prisma.user.delete({ where: { id: targetUserId } }),
        ]);
      } else {
        await this.prisma.user.delete({ where: { id: targetUserId } });
      }

      return {
        message: 'Admin account has been permanently removed successfully.',
        actionTaken: 'deleted',
      };
    }

    // Default action: Revoke admin/owner role back to customer
    await this.prisma.user.update({
      where: { id: targetUserId },
      data: { role: Role.customer },
    });

    return {
      message: 'Admin access successfully revoked. User role set to Customer.',
      actionTaken: 'revoked',
    };
  }
}
